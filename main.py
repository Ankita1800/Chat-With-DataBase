import os
import re
import uuid
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
from langchain_classic.chains import create_sql_query_chain
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

# Enable CORS with specific origins for production security
# Reference: https://fastapi.tiangolo.com/tutorial/cors/
# TODO: Replace with your actual frontend domain in production
ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    # Add your production domain here: "https://yourdomain.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,  # Specific origins only, no wildcards in production
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
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

@app.get("/health")
async def health_check():
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
# - OAuth (Google, GitHub, etc.)
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

def create_dynamic_table_from_dataframe(df: pd.DataFrame, table_name: str, user_id: str):
    """
    Create a PostgreSQL table dynamically from DataFrame with user_id column
    Reference: https://docs.sqlalchemy.org/en/20/core/metadata.html
    """
    try:
        print(f"[DEBUG] Creating table {table_name} for user {user_id}")
        metadata = MetaData()
        
        # Define columns based on DataFrame dtypes
        columns = [
            Column('id', Integer, primary_key=True, autoincrement=True),
            Column('user_id', String, nullable=False, index=True)  # Add user_id for RLS
        ]
        
        for col_name in df.columns:
            dtype = df[col_name].dtype
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
        df_with_user = df.copy()
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
        
        return table_name
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
    current_user: AuthUser = Depends(get_current_user)
):
    """
    Upload CSV file to Supabase Storage and create user-scoped PostgreSQL table
    
    Flow:
    1. Verify user authentication (Supabase JWT)
    2. Upload CSV to Supabase Storage with user_id prefix
    3. Parse CSV and create dynamic PostgreSQL table
    4. Store metadata in user_datasets table
    5. Return success with dataset information
    
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
            create_dynamic_table_from_dataframe(df, table_name, current_user.id)
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
        
        # Store metadata in user_datasets table
        try:
            supabase.table("user_datasets").insert({
                "id": dataset_id,
                "user_id": current_user.id,
                "dataset_name": file.filename.rsplit('.', 1)[0],
                "original_filename": file.filename,
                "storage_path": storage_path,
                "table_name": table_name,
                "column_names": list(df.columns),
                "row_count": len(df),
                "file_size_bytes": file_size
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
            "dataset_name": file.filename.rsplit('.', 1)[0],
            "table_name": table_name,
            "columns": list(df.columns),
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
        
        # Generate SQL with context
        query_input = {
            "question": f"Table name is {table_name}. Available columns: {', '.join(available_columns)}. "
                       f"IMPORTANT: Add WHERE user_id = '{current_user.id}' to all queries to filter by user. "
                       f"Question: {request.question}"
        }
        generated_sql = chain.invoke(query_input)
        
        # Extract only the SQL query from the response
        sql_pattern = r'(SELECT.*?(?:;|$))'
        match = re.search(sql_pattern, generated_sql, re.IGNORECASE | re.DOTALL)
        
        if match:
            clean_sql = match.group(1).strip()
            if clean_sql.endswith(';'):
                clean_sql = clean_sql[:-1]
        else:
            clean_sql = generated_sql.strip()
        
        # Enforce user_id filter in SQL if not present (safety check)
        if f"user_id = '{current_user.id}'" not in clean_sql.lower():
            # Add WHERE clause or append to existing one
            if "WHERE" in clean_sql.upper():
                clean_sql = clean_sql.replace("WHERE", f"WHERE user_id = '{current_user.id}' AND", 1)
            else:
                # Add WHERE before ORDER BY, GROUP BY, or at the end
                for keyword in ["ORDER BY", "GROUP BY", "LIMIT"]:
                    if keyword in clean_sql.upper():
                        clean_sql = clean_sql.replace(keyword, f"WHERE user_id = '{current_user.id}' {keyword}", 1)
                        break
                else:
                    clean_sql += f" WHERE user_id = '{current_user.id}'"
        
        # Execute SQL
        try:
            result = db.run(clean_sql)
        except Exception as sql_error:
            # Log query to history with error
            supabase.table("query_history").insert({
                "user_id": current_user.id,
                "dataset_id": request.dataset_id,
                "question": request.question,
                "generated_sql": clean_sql,
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
        
        # Store query in history
        try:
            supabase.table("query_history").insert({
                "user_id": current_user.id,
                "dataset_id": request.dataset_id,
                "question": request.question,
                "generated_sql": clean_sql,
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
                "generated_sql": clean_sql,
                "answer": "No data found. The query returned no results.",
                "data_found": False,
                "confidence": 0.0
            }
        
        # Check confidence threshold
        if not confidence_data["is_reliable"]:
            return {
                "question": request.question,
                "generated_sql": clean_sql,
                "answer": f"Low confidence result: {result}\n\nNote: This response may not be accurate. Please rephrase your question using these columns: {', '.join(available_columns)}",
                "data_found": True,
                "confidence": confidence_data["score"]
            }
        
        return {
            "question": request.question,
            "generated_sql": clean_sql,
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