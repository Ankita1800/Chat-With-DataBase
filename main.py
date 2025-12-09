import os
import re
import shutil
import pandas as pd
import sqlite3
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.utilities import SQLDatabase
from langchain_classic.chains import create_sql_query_chain

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
        
        # Check if result is empty or None
        if not result or result.strip() == "" or result == "[]":
            return {
                "question": request.question,
                "generated_sql": clean_sql,
                "answer": f"No data found. The query returned no results. Available columns in your database are: {', '.join(available_columns)}. Please check your question and try again."
            }
        
        return {
            "question": request.question,
            "generated_sql": clean_sql,
            "answer": result
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
                "generated_sql": clean_sql if 'clean_sql' in locals() else "N/A"
            }
        elif "no such table" in error_message.lower():
            return {
                "answer": "Error: Table not found. Please upload a CSV file first.",
                "generated_sql": "N/A"
            }
        elif "syntax error" in error_message.lower():
            return {
                "answer": f"Error: Invalid SQL query generated.{columns_hint} Please try rephrasing your question.",
                "generated_sql": clean_sql if 'clean_sql' in locals() else "N/A"
            }
        else:
            return {
                "answer": f"Error: Unable to process your query. {error_message}{columns_hint}",
                "generated_sql": clean_sql if 'clean_sql' in locals() else "N/A"
            }