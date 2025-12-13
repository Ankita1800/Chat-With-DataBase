import os
import re
import shutil
import pandas as pd
import sqlite3
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.utilities import SQLDatabase
from langchain_classic.chains import create_sql_query_chain
from datetime import timedelta
from auth import (
    UserCreate, UserLogin, Token, get_password_hash, verify_password,
    create_access_token, get_user_by_email, create_user, update_last_login,
    get_current_user, exchange_google_code, exchange_github_code,
    get_user_by_provider, ACCESS_TOKEN_EXPIRE_MINUTES
)

# 1. Load Environment Variables
load_dotenv()
api_key = os.getenv("GROQ_API_KEY")

# 2. Setup the App
app = FastAPI()

# Enable CORS (Frontend <-> Backend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variable to store the current database connection
DB_PATH = "dynamic.db"

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Chat with Database API is running!",
        "endpoints": {
            "upload": "POST /upload - Upload a CSV file",
            "ask": "POST /ask - Ask questions about your data",
            "auth": "POST /auth/* - Authentication endpoints",
            "docs": "GET /docs - API documentation"
        }
    }

# ============ AUTHENTICATION ENDPOINTS ============

@app.post("/auth/signup", response_model=Token)
async def signup(user_data: UserCreate):
    """Register a new user with email and password"""
    # Check if user exists
    existing_user = get_user_by_email(user_data.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password and create user
    hashed_password = get_password_hash(user_data.password)
    user = create_user(
        email=user_data.email,
        password_hash=hashed_password,
        full_name=user_data.full_name,
        provider="email"
    )
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user["email"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    update_last_login(user["id"])
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"]
        }
    }

@app.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    """Login with email and password"""
    user = get_user_by_email(user_data.email)
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not user.get("password_hash"):
        raise HTTPException(
            status_code=400,
            detail=f"This account uses {user.get('provider')} login. Please use that method."
        )
    
    if not verify_password(user_data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create access token
    access_token = create_access_token(
        data={"sub": user["email"]},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    
    update_last_login(user["id"])
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "email": user["email"],
            "full_name": user["full_name"]
        }
    }

@app.post("/auth/google/callback", response_model=Token)
async def google_callback(code: str, redirect_uri: str):
    """Handle Google OAuth callback"""
    try:
        user_info = await exchange_google_code(code, redirect_uri)
        
        email = user_info.get("email")
        provider_id = user_info.get("id")
        full_name = user_info.get("name")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by Google")
        
        # Check if user exists with this provider
        user = get_user_by_provider("google", provider_id)
        
        if not user:
            # Check if email exists with different provider
            existing_user = get_user_by_email(email)
            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail=f"Email already registered with {existing_user['provider']} provider"
                )
            
            # Create new user
            user = create_user(
                email=email,
                password_hash=None,
                full_name=full_name,
                provider="google",
                provider_id=provider_id
            )
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user["email"]},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        update_last_login(user["id"])
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "full_name": user["full_name"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/github/callback", response_model=Token)
async def github_callback(code: str):
    """Handle GitHub OAuth callback"""
    try:
        user_info = await exchange_github_code(code)
        
        email = user_info.get("email")
        provider_id = str(user_info.get("id"))
        full_name = user_info.get("name") or user_info.get("login")
        
        if not email:
            raise HTTPException(status_code=400, detail="Email not provided by GitHub")
        
        # Check if user exists with this provider
        user = get_user_by_provider("github", provider_id)
        
        if not user:
            # Check if email exists with different provider
            existing_user = get_user_by_email(email)
            if existing_user:
                raise HTTPException(
                    status_code=400,
                    detail=f"Email already registered with {existing_user['provider']} provider"
                )
            
            # Create new user
            user = create_user(
                email=email,
                password_hash=None,
                full_name=full_name,
                provider="github",
                provider_id=provider_id
            )
        
        # Create access token
        access_token = create_access_token(
            data={"sub": user["email"]},
            expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        update_last_login(user["id"])
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user["id"],
                "email": user["email"],
                "full_name": user["full_name"]
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current authenticated user"""
    return {
        "id": current_user["id"],
        "email": current_user["email"],
        "full_name": current_user["full_name"],
        "provider": current_user["provider"]
    }

# ============ END AUTHENTICATION ENDPOINTS ============

# 3. HELPER: Function to get the current DB
def get_db_chain():
    if not os.path.exists(DB_PATH):
        raise Exception("No database uploaded yet!")
    
    db = SQLDatabase.from_uri(f"sqlite:///{DB_PATH}")
    llm = ChatGroq(model="llama-3.3-70b-versatile", groq_api_key=api_key)
    chain = create_sql_query_chain(llm, db)
    return chain, db

# 4. API: Upload CSV and convert to SQL
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        # Save the uploaded file temporarily
        file_location = f"temp_{file.filename}"
        with open(file_location, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        # Read CSV using Pandas
        # (Assuming it's a CSV. If you want Excel, use pd.read_excel)
        df = pd.read_csv(file_location)

        # Connect to a new SQLite DB (Overwriting old one)
        conn = sqlite3.connect(DB_PATH)
        
        # Write the data to a table named 'uploaded_data'
        df.to_sql("uploaded_data", conn, if_exists="replace", index=False)
        conn.close()

        # Clean up temp file
        os.remove(file_location)

        return {"message": "Database created successfully!", "columns": list(df.columns)}
    except Exception as e:
        return {"error": str(e)}

# 5. Define Input for Chat
class QueryRequest(BaseModel):
    question: str

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

# 6. API: Chat with the uploaded DB
@app.post("/ask")
async def ask_database(request: QueryRequest):
    try:
        chain, db = get_db_chain()
        
        # Get available columns for validation
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("PRAGMA table_info(uploaded_data)")
        columns_info = cursor.fetchall()
        available_columns = [col[1].lower() for col in columns_info]  # Get column names
        conn.close()
        
        # Check if the question contains column names that don't exist
        question_lower = request.question.lower()
        question_words = re.findall(r'\b\w+\b', question_lower)
        
        # Common words to ignore in validation
        common_words = {'what', 'is', 'are', 'the', 'a', 'an', 'in', 'of', 'for', 'to', 'from', 'show', 'me', 'get', 'find', 'all', 'list', 'how', 'many', 'much', 'total', 'sum', 'count', 'average', 'max', 'min', 'give'}
        
        # Generate SQL
        query_input = {"question": f"Table name is uploaded_data. Available columns: {', '.join(available_columns)}. {request.question}"}
        generated_sql = chain.invoke(query_input)
        
        # Extract only the SQL query from the response
        sql_pattern = r'(SELECT.*?(?:;|$)|INSERT.*?(?:;|$)|UPDATE.*?(?:;|$)|DELETE.*?(?:;|$))'
        match = re.search(sql_pattern, generated_sql, re.IGNORECASE | re.DOTALL)
        
        if match:
            clean_sql = match.group(1).strip()
            if clean_sql.endswith(';'):
                clean_sql = clean_sql[:-1]
        else:
            clean_sql = generated_sql.strip()
        
        # Execute SQL
        result = db.run(clean_sql)
        
        # Calculate confidence score
        confidence_data = calculate_confidence(request.question, available_columns, result)
        
        # Check if result is empty or None
        if not result or result.strip() == "" or result == "[]":
            return {
                "status": "no_data",
                "message": "No matching records found for your query.",
                "question": request.question,
                "generated_sql": clean_sql,
                "answer": f"No data found. The query returned no results.",
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
    except Exception as e:
        error_message = str(e)
        
        # Get available columns for error messages
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()
            cursor.execute("PRAGMA table_info(uploaded_data)")
            columns_info = cursor.fetchall()
            available_columns = [col[1] for col in columns_info]
            conn.close()
            columns_hint = f" Available columns: {', '.join(available_columns)}."
        except:
            columns_hint = ""
        
        # Handle specific SQL errors with user-friendly messages
        if "no such column" in error_message.lower():
            return {
                "answer": f"Error: Column not found in the database.{columns_hint} Please check the column names.",
                "generated_sql": clean_sql if 'clean_sql' in locals() else "N/A",
                "data_found": False,
                "confidence": 0.0
            }
        elif "no such table" in error_message.lower():
            return {
                "answer": "Error: Table not found. Please upload a CSV file first.",
                "generated_sql": "N/A",
                "data_found": False,
                "confidence": 0.0
            }
        elif "syntax error" in error_message.lower():
            return {
                "answer": f"Error: Invalid SQL query generated.{columns_hint} Please try rephrasing your question.",
                "generated_sql": clean_sql if 'clean_sql' in locals() else "N/A",
                "data_found": False,
                "confidence": 0.0
            }
        else:
            return {
                "answer": f"Error: Unable to process your query. {error_message}{columns_hint}",
                "generated_sql": clean_sql if 'clean_sql' in locals() else "N/A",
                "data_found": False,
                "confidence": 0.0
            }

# Run the server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)