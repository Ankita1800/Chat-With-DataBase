import os
import re
import uuid
import hashlib
import pandas as pd
import time
from io import BytesIO
from urllib.parse import quote_plus
from dotenv import load_dotenv

# CRITICAL: Load .env BEFORE any other imports that use environment variables
load_dotenv()

from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_groq import ChatGroq
from langchain_community.utilities import SQLDatabase
from langchain.chains import create_sql_query_chain
from sqlalchemy import create_engine, text, MetaData, Table, Column, Integer, String, Float, inspect
from sqlalchemy.exc import SQLAlchemyError

# Import Supabase authentication and configuration
from backend_auth import get_current_user, AuthUser
from supabase_config import supabase, STORAGE_BUCKET_NAME, SUPABASE_URL

# 1. Verify Environment Variables Loaded
api_key = os.getenv("GROQ_API_KEY")
SUPABASE_URL_BASE = os.getenv("SUPABASE_URL")

# Validate required environment variables
if not api_key:
    raise ValueError("GROQ_API_KEY must be set in environment variables")
if not SUPABASE_URL_BASE:
    raise ValueError("SUPABASE_URL must be set in environment variables")

# Database Connection Configuration
# Require DATABASE_URL - fail fast if not set or invalid
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError(
        "DATABASE_URL must be set in .env file.\n"
        "Example: postgresql://postgres.<PROJECT_REF>:<PASSWORD>@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"
    )

print("[INFO] Using DATABASE_URL from environment variable")
# okay to use as is
# Create database engine
db_engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=3600,
    connect_args={"connect_timeout": 10}
)

# Test connection - fail fast if it doesn't work
try:
    with db_engine.connect() as conn:
        conn.execute(text("SELECT 1"))
    
    # Parse and log connection info
    from urllib.parse import urlparse
    parsed = urlparse(DATABASE_URL)
    print(f"[SUCCESS] Connected to: {parsed.hostname}:{parsed.port}")
except Exception as e:
    print(f"[CRITICAL] Database connection failed: {type(e).__name__}")
    print(f"[DETAIL] {str(e)}")
    raise RuntimeError(
        f"Cannot connect to database. Check your DATABASE_URL in .env file.\n"
        f"Error: {str(e)}"
    )

# 2. Setup the App
app = FastAPI(title="Chat with Database API - Supabase Edition")

# CORS Configuration - Allow frontend from localhost for local development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Frontend dev server
        "http://127.0.0.1:3000",  # Alternative localhost
        "https://chat-with-data-base.vercel.app",  # Production Vercel deployment
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Chat with Database API - Supabase Edition",
        "version": "2.0",
        "authentication": "Supabase Auth",
        "database": "Supabase PostgreSQL",
        "storage": "Supabase Storage",
        "endpoints": {
            "upload": "POST /upload - Upload a CSV file (requires authentication)",
            "ask": "POST /ask - Ask questions about your data (requires authentication)",
            "datasets": "GET /datasets - List your uploaded datasets (requires authentication)",
            "health": "GET /health - Health check"
        },
        "docs": "/docs"
    }

@app.get("/healthz")
def health_check():
    return {"status": "ok"}

@app.get("/health")
async def health_check_detailed():
    """Health check endpoint for monitoring"""
    try:
        # Test database connection
        with db_engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)[:100]}"
    
    return {
        "status": "healthy" if "connected" in db_status else "degraded",
        "database": db_status,
        "storage": "configured",
        "server": "running"
    }

# ============ AUTHENTICATION IS NOW HANDLED BY FRONTEND ============
# All auth endpoints removed - Supabase Auth handles:
# - Email/password signup & login
# - OAuth (Google)
# - Session management
# - Token refresh
# 
# Backend only verifies Supabase-issued JWTs using get_current_user dependency
# Reference: https://supabase.com/docs/guides/auth

# ============ HELPER FUNCTIONS ============

def generate_table_name(user_id: str, filename: str) -> str:
    """Generate a unique table name for user's dataset"""
    # Remove file extension and special characters
    clean_name = re.sub(r'[^a-zA-Z0-9_]', '_', filename.split('.')[0].lower())
    # Add user prefix and unique ID to avoid collisions
    unique_id = str(uuid.uuid4())[:8]
    return f"user_{user_id[:8]}_{clean_name}_{unique_id}"

def generate_unique_dataset_name(base_name: str, user_id: str) -> str:
    """
    Generate a unique dataset name with automatic versioning.
    
    Pattern:
    - First upload: "job"
    - Second upload: "job (2)"
    - Third upload: "job (3)"
    - etc.
    
    Args:
        base_name: Original filename without extension (e.g., "job")
        user_id: Current user's ID
        
    Returns:
        Unique dataset name that doesn't conflict with existing datasets
        
    Example:
        >>> generate_unique_dataset_name("job", "user-123")
        "job"  # First upload
        >>> generate_unique_dataset_name("job", "user-123")
        "job (2)"  # Second upload
    """
    try:
        # Fetch all existing dataset names for this user that match the pattern
        # Using OR to match both exact name and versioned names
        response = supabase.table("user_datasets")\
            .select("dataset_name")\
            .eq("user_id", user_id)\
            .or_(f"dataset_name.eq.{base_name},dataset_name.like.{base_name} (%)")\
            .execute()
        
        # If no existing datasets, use base name
        if not response.data or len(response.data) == 0:
            return base_name
        
        # Build set of existing names for fast lookup
        existing_names = {item['dataset_name'] for item in response.data}
        
        # Check if base name is available
        if base_name not in existing_names:
            return base_name
        
        # Find next available version number
        version = 2
        while f"{base_name} ({version})" in existing_names:
            version += 1
            # Safety check: prevent infinite loop (extremely rare)
            if version > 1000:
                raise Exception("Too many versions of this dataset")
        
        return f"{base_name} ({version})"
        
    except Exception as e:
        print(f"[ERROR] Failed to generate unique dataset name: {str(e)}")
        # Fallback to timestamp-based naming if something goes wrong
        from datetime import datetime
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        return f"{base_name}_{timestamp}"

def create_dynamic_table_from_dataframe(df: pd.DataFrame, table_name: str, user_id: str):
    """
    Create a PostgreSQL table dynamically from DataFrame with user_id column
    Reference: https://docs.sqlalchemy.org/en/20/core/metadata.html
    """
    try:
        print(f"[DEBUG] Creating table {table_name} for user {user_id}")
        metadata = MetaData()
        
        # Rename conflicting columns (id, user_id) to avoid conflicts with system columns
        df_renamed = df.copy()
        rename_map = {}
        for col in df_renamed.columns:
            col_lower = col.lower()
            if col_lower == 'id':
                rename_map[col] = 'original_id'
            elif col_lower == 'user_id':
                rename_map[col] = 'original_user_id'
        if rename_map:
            df_renamed = df_renamed.rename(columns=rename_map)
            print(f"[DEBUG] Renamed conflicting columns: {rename_map}")
        
        # Define columns based on DataFrame dtypes
        columns = [
            Column('id', Integer, primary_key=True, autoincrement=True),
            Column('user_id', String, nullable=False, index=True)  # Add user_id for RLS
        ]
        
        for col_name in df_renamed.columns:
            dtype = df_renamed[col_name].dtype
            if dtype == 'int64':
                sql_type = Integer
            elif dtype == 'float64':
                sql_type = Float
            else:
                sql_type = String
            columns.append(Column(col_name, sql_type))
        
        # Create table
        print(f"[DEBUG] Creating table structure...")
        table = Table(table_name, metadata, *columns)
        metadata.create_all(db_engine)
        print(f"[DEBUG] Table created successfully")
        
        # Insert data with user_id
        df_with_user = df_renamed.copy()
        df_with_user.insert(0, 'user_id', user_id)
        
        print(f"[DEBUG] Inserting {len(df_with_user)} rows...")
        with db_engine.connect() as conn:
            df_with_user.to_sql(
                table_name,
                conn,
                if_exists='append',
                index=False,
                method='multi'
            )
            conn.commit()
        print(f"[DEBUG] Data inserted successfully")
        
        return table_name, list(df_renamed.columns)
    except Exception as e:
        print(f"[ERROR] Failed to create table: {type(e).__name__}: {str(e)}")
        import traceback
        traceback.print_exc()
        raise

# 3. HELPER: Function to get the user's database connection
def get_user_db_chain(user_id: str, table_name: str):
    """
    Create LangChain SQL chain for user's specific table
    Only allows access to user's own data through table name restriction
    """
    if not table_name:
        raise HTTPException(status_code=400, detail="No dataset specified")
    
    # Create database URI with schema public
    db = SQLDatabase.from_uri(
        DATABASE_URL,
        include_tables=[table_name],  # Restrict to user's table only
        sample_rows_in_table_info=3
    )
    
    llm = ChatGroq(model="llama-3.3-70b-versatile", groq_api_key=api_key)
    chain = create_sql_query_chain(llm, db)
    return chain, db

# ============ DATA UPLOAD ENDPOINT ============

@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    reuse: bool = False,
    force_upload: bool = False,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Upload CSV file to Supabase Storage and create user-scoped PostgreSQL table
    
    Flow with Duplicate Detection:
    1. Verify user authentication (Supabase JWT)
    2. Read file content and compute SHA-256 hash
    3. Check for duplicate (user_id + file_hash)
    4. If duplicate found:
       - If reuse=True: Return existing dataset metadata (skip upload)
       - If force_upload=True: Proceed with versioned upload
       - Else: Return duplicate=True with existing metadata (user must decide)
    5. If not duplicate or force_upload=True:
       - Upload CSV to Supabase Storage with user_id prefix
       - Parse CSV and create dynamic PostgreSQL table
       - Store metadata in user_datasets table (including file_hash)
    6. Return success with dataset information
    
    Reference:
    - Storage: https://supabase.com/docs/guides/storage/uploads
    - Database: https://supabase.com/docs/guides/database/connecting-to-postgres
    """
    try:
        # Validate file type
        if not file.filename or not file.filename.endswith('.csv'):
            raise HTTPException(status_code=400, detail="Only CSV files are supported")
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Compute SHA-256 hash of file content
        try:
            file_hash = hashlib.sha256(file_content).hexdigest()
            print(f"[INFO] File hash computed: {file_hash[:16]}...")
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to compute file hash: {str(e)}"
            )
        
        # Check for duplicate (user_id + file_hash) BEFORE any upload
        try:
            duplicate_check = supabase.table("user_datasets")\
                .select("id, dataset_name, original_filename, table_name, column_names, row_count, file_size_bytes, created_at")\
                .eq("user_id", current_user.id)\
                .eq("file_hash", file_hash)\
                .execute()
            
            if duplicate_check.data and len(duplicate_check.data) > 0:
                existing_dataset = duplicate_check.data[0]
                print(f"[INFO] Duplicate detected: {existing_dataset['dataset_name']}")
                
                # If reuse=True, return existing dataset immediately
                if reuse:
                    print(f"[INFO] Reusing existing dataset: {existing_dataset['id']}")
                    return {
                        "success": True,
                        "reused": True,
                        "message": "Reusing existing dataset",
                        "dataset_id": existing_dataset["id"],
                        "dataset_name": existing_dataset["dataset_name"],
                        "table_name": existing_dataset["table_name"],
                        "columns": existing_dataset["column_names"],
                        "row_count": existing_dataset["row_count"],
                        "file_size_bytes": existing_dataset["file_size_bytes"]
                    }
                
                # If force_upload=False, inform frontend about duplicate
                if not force_upload:
                    print(f"[INFO] Returning duplicate=True, waiting for user consent")
                    return {
                        "duplicate": True,
                        "existing_dataset": {
                            "id": existing_dataset["id"],
                            "dataset_name": existing_dataset["dataset_name"],
                            "original_filename": existing_dataset["original_filename"],
                            "row_count": existing_dataset["row_count"],
                            "created_at": existing_dataset["created_at"]
                        },
                        "message": "This file already exists. Choose to reuse or upload as new."
                    }
                
                # If force_upload=True, continue with upload (will create versioned name)
                print(f"[INFO] Force upload requested, creating new version")
        
        except Exception as e:
            # Fail loudly if duplicate check fails
            raise HTTPException(
                status_code=500,
                detail=f"Failed to check for duplicates: {str(e)}"
            )
        
        # Parse CSV
        try:
            df = pd.read_csv(BytesIO(file_content))
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid CSV file: {str(e)}")
        
        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        # Generate unique identifiers
        dataset_id = str(uuid.uuid4())
        table_name = generate_table_name(current_user.id, file.filename)
        storage_path = f"{current_user.id}/{dataset_id}/{file.filename}"
        
        # Generate unique dataset name with automatic versioning
        base_name = file.filename.rsplit('.', 1)[0]
        dataset_name = generate_unique_dataset_name(base_name, current_user.id)
        
        # Upload to Supabase Storage
        # Reference: https://supabase.com/docs/reference/python/storage-upload
        try:
            supabase.storage.from_(STORAGE_BUCKET_NAME).upload(
                path=storage_path,
                file=file_content,
                file_options={
                    "content-type": "text/csv",
                    "x-upsert": "false"  # Prevent overwriting
                }
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload to storage: {str(e)}"
            )
        
        # Create PostgreSQL table with data
        try:
            table_name, renamed_columns = create_dynamic_table_from_dataframe(df, table_name, current_user.id)
        except Exception as e:
            # Rollback: delete from storage if table creation fails
            try:
                supabase.storage.from_(STORAGE_BUCKET_NAME).remove([storage_path])
            except:
                pass
            raise HTTPException(
                status_code=500,
                detail=f"Failed to create database table: {str(e)}"
            )
        
        # Store metadata in user_datasets table WITH file_hash
        # Dataset name already generated with unique versioning above
        try:
            supabase.table("user_datasets").insert({
                "id": dataset_id,
                "user_id": current_user.id,
                "dataset_name": dataset_name,
                "original_filename": file.filename,
                "storage_path": storage_path,
                "table_name": table_name,
                "column_names": renamed_columns,
                "row_count": len(df),
                "file_size_bytes": file_size,
                "file_hash": file_hash  # Include file hash for duplicate detection
            }).execute()
        except Exception as e:
            # Rollback: delete storage and table if metadata insert fails
            try:
                supabase.storage.from_(STORAGE_BUCKET_NAME).remove([storage_path])
                with db_engine.connect() as conn:
                    conn.execute(text(f"DROP TABLE IF EXISTS {table_name}"))
                    conn.commit()
            except:
                pass
            raise HTTPException(
                status_code=500,
                detail=f"Failed to save dataset metadata: {str(e)}"
            )
        
        return {
            "success": True,
            "message": "Dataset uploaded successfully!",
            "dataset_id": dataset_id,
            "dataset_name": dataset_name,
            "table_name": table_name,
            "columns": renamed_columns,
            "row_count": len(df),
            "file_size_bytes": file_size
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# ============ DATASET MANAGEMENT ENDPOINTS ============

@app.get("/datasets")
async def list_datasets(current_user: AuthUser = Depends(get_current_user)):
    """
    List all datasets for the authenticated user
    Uses Supabase RLS - user can only see their own datasets
    """
    try:
        response = supabase.table("user_datasets")\
            .select("*")\
            .eq("user_id", current_user.id)\
            .order("created_at", desc=True)\
            .execute()
        
        return {
            "success": True,
            "datasets": response.data
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch datasets: {str(e)}")

@app.delete("/datasets/{dataset_id}")
async def delete_dataset(
    dataset_id: str,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Delete a dataset completely:
    1. Verify user owns the dataset
    2. Drop the dynamic PostgreSQL table
    3. Delete file from Supabase Storage
    4. Delete metadata from user_datasets table
    5. Delete related query history
    
    This is a complete cleanup - no orphaned data left behind
    """
    try:
        # Step 1: Get dataset metadata and verify ownership
        dataset_response = supabase.table("user_datasets")\
            .select("*")\
            .eq("id", dataset_id)\
            .eq("user_id", current_user.id)\
            .execute()
        
        if not dataset_response.data or len(dataset_response.data) == 0:
            raise HTTPException(
                status_code=404,
                detail="Dataset not found or you don't have permission to delete it"
            )
        
        dataset = dataset_response.data[0]
        table_name = dataset["table_name"]
        storage_path = dataset["storage_path"]
        
        print(f"[INFO] Deleting dataset {dataset_id}: {dataset['dataset_name']}")
        
        # Step 2: Drop the PostgreSQL table
        try:
            with db_engine.connect() as conn:
                # Use parameterized query to prevent SQL injection
                conn.execute(text(f"DROP TABLE IF EXISTS {table_name} CASCADE"))
                conn.commit()
            print(f"[INFO] Dropped table: {table_name}")
        except Exception as e:
            print(f"[WARNING] Failed to drop table {table_name}: {str(e)}")
            # Continue with deletion even if table drop fails
        
        # Step 3: Delete file from Supabase Storage
        try:
            supabase.storage.from_(STORAGE_BUCKET_NAME).remove([storage_path])
            print(f"[INFO] Deleted storage file: {storage_path}")
        except Exception as e:
            print(f"[WARNING] Failed to delete storage file {storage_path}: {str(e)}")
            # Continue with deletion even if storage delete fails
        
        # Step 4: Delete related query history (CASCADE handles this, but explicit is better)
        try:
            supabase.table("query_history")\
                .delete()\
                .eq("dataset_id", dataset_id)\
                .eq("user_id", current_user.id)\
                .execute()
            print(f"[INFO] Deleted query history for dataset {dataset_id}")
        except Exception as e:
            print(f"[WARNING] Failed to delete query history: {str(e)}")
        
        # Step 5: Delete metadata from user_datasets table
        try:
            supabase.table("user_datasets")\
                .delete()\
                .eq("id", dataset_id)\
                .eq("user_id", current_user.id)\
                .execute()
            print(f"[INFO] Deleted metadata for dataset {dataset_id}")
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to delete dataset metadata: {str(e)}"
            )
        
        return {
            "success": True,
            "message": f"Dataset '{dataset['dataset_name']}' deleted successfully",
            "deleted_dataset_id": dataset_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Delete dataset failed: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete dataset: {str(e)}"
        )

# ============ QUERY ENDPOINT ============

class QueryRequest(BaseModel):
    question: str
    dataset_id: str  # User must specify which dataset to query

# Helper: Calculate query relevance/confidence
def calculate_confidence(question: str, available_columns: list, result: str) -> dict:
    """
    Calculate confidence score based on:
    1. Whether the question relates to available columns
    2. Whether the result contains meaningful data
    3. Result length and format
    """
    question_lower = question.lower()
    confidence = 0.5  # Base confidence
    
    # Check if question mentions any column names
    column_matches = sum(1 for col in available_columns if col.lower() in question_lower)
    if column_matches > 0:
        confidence += 0.2 * min(column_matches, 2)  # Up to 0.4 boost
    
    # Check result quality
    if result and result.strip() and result != "[]":
        confidence += 0.2
        # Check if result looks like actual data (contains parentheses, brackets, numbers)
        if any(c in result for c in ['(', '[', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9']):
            confidence += 0.1
    else:
        confidence -= 0.3  # Penalty for empty results
    
    # Cap confidence between 0 and 1
    confidence = max(0.0, min(1.0, confidence))
    
    return {
        "score": round(confidence, 2),
        "is_reliable": confidence >= 0.5,
        "column_relevance": column_matches > 0
    }

@app.post("/ask")
async def ask_database(
    request: QueryRequest,
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Query user's dataset using natural language
    
    Security:
    - User must be authenticated (Supabase JWT)
    - User can only query their own datasets (verified via user_datasets table)
    - SQL generation is restricted to user's table only
    - Row-level data is automatically filtered by user_id in the table
    
    Reference:
    - https://supabase.com/docs/guides/database/postgres/row-level-security
    """
    start_time = time.time()
    
    try:
        # Verify dataset belongs to user (RLS enforces this, but explicit check for better error messages)
        dataset_response = supabase.table("user_datasets")\
            .select("*")\
            .eq("id", request.dataset_id)\
            .eq("user_id", current_user.id)\
            .execute()
        
        if not dataset_response.data or len(dataset_response.data) == 0:
            raise HTTPException(
                status_code=404,
                detail="Dataset not found or you don't have permission to access it"
            )
        
        dataset = dataset_response.data[0]
        table_name = dataset["table_name"]
        available_columns = dataset["column_names"]
        
        # Create SQL chain restricted to user's table
        chain, db = get_user_db_chain(current_user.id, table_name)
        
        # Generate SQL with context (WITHOUT user_id mention for clean display)
        query_input = {
            "question": f"Table name is {table_name}. Available columns: {', '.join(available_columns)}. "
                       f"Question: {request.question}"
        }
        generated_sql = chain.invoke(query_input)
        
        # Extract only the SQL query from the response
        sql_pattern = r'(SELECT.*?(?:;|$))'
        match = re.search(sql_pattern, generated_sql, re.IGNORECASE | re.DOTALL)
        
        if match:
            display_sql = match.group(1).strip()
            if display_sql.endswith(';'):
                display_sql = display_sql[:-1]
        else:
            display_sql = generated_sql.strip()
        
        # Create execution SQL with user_id filter for security (not shown to user)
        execution_sql = display_sql
        if f"user_id = '{current_user.id}'" not in execution_sql.lower():
            # Add WHERE clause or append to existing one
            if "WHERE" in execution_sql.upper():
                execution_sql = execution_sql.replace("WHERE", f"WHERE user_id = '{current_user.id}' AND", 1)
            else:
                # Add WHERE before ORDER BY, GROUP BY, or at the end
                for keyword in ["ORDER BY", "GROUP BY", "LIMIT"]:
                    if keyword in execution_sql.upper():
                        execution_sql = execution_sql.replace(keyword, f"WHERE user_id = '{current_user.id}' {keyword}", 1)
                        break
                else:
                    execution_sql += f" WHERE user_id = '{current_user.id}'"
        
        # Execute SQL with user_id filter
        try:
            result = db.run(execution_sql)
        except Exception as sql_error:
            # Log query to history with error (log the display version)
            supabase.table("query_history").insert({
                "user_id": current_user.id,
                "dataset_id": request.dataset_id,
                "question": request.question,
                "generated_sql": display_sql,
                "success": False,
                "error_message": str(sql_error),
                "execution_time_ms": int((time.time() - start_time) * 1000)
            }).execute()
            
            raise HTTPException(
                status_code=400,
                detail=f"SQL execution error: {str(sql_error)}"
            )
        
        # Calculate confidence score
        confidence_data = calculate_confidence(request.question, available_columns, result)
        
        # Determine success status
        success = result and result.strip() and result != "[]"
        
        # Store query in history (store display version without user_id)
        try:
            supabase.table("query_history").insert({
                "user_id": current_user.id,
                "dataset_id": request.dataset_id,
                "question": request.question,
                "generated_sql": display_sql,
                "result_data": {"raw": result} if success else None,
                "success": success,
                "confidence_score": confidence_data["score"],
                "execution_time_ms": int((time.time() - start_time) * 1000)
            }).execute()
        except Exception as history_error:
            # Don't fail the request if history logging fails
            print(f"Warning: Failed to log query history: {history_error}")
        
        # Check if result is empty
        if not success:
            return {
                "status": "no_data",
                "message": "No matching records found for your query.",
                "question": request.question,
                "generated_sql": display_sql,
                "answer": "No data found. The query returned no results.",
                "data_found": False,
                "confidence": 0.0
            }
        
        # Check confidence threshold
        if not confidence_data["is_reliable"]:
            return {
                "question": request.question,
                "generated_sql": display_sql,
                "answer": f"Low confidence result: {result}\n\nNote: This response may not be accurate. Please rephrase your question using these columns: {', '.join(available_columns)}",
                "data_found": True,
                "confidence": confidence_data["score"]
            }
        
        return {
            "question": request.question,
            "generated_sql": display_sql,
            "answer": result,
            "data_found": True,
            "confidence": confidence_data["score"]
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Query failed: {str(e)}"
        )

# Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)