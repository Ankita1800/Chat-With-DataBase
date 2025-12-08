import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.utilities import SQLDatabase
from langchain.chains import create_sql_query_chain

# 1. Load Environment Variables
load_dotenv()
api_key = os.getenv("api_key")

# 2. Setup the App
app = FastAPI()

# --- CORS SETTINGS (NEW) ---
# This block tells the backend to allow connections from your frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows any website to talk to this API
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods (POST, GET, etc.)
    allow_headers=["*"],  # Allows all headers
)
# ---------------------------

# 3. Connect to Database
db = SQLDatabase.from_uri("sqlite:///sales.db")

# 4. Setup the AI (LLM)
llm = ChatGroq(model="llama3-8b-8192", groq_api_key=api_key)

# 5. Create the Chain (The logic that converts Text -> SQL)
chain = create_sql_query_chain(llm, db)

# 6. Define the Input Format
class QueryRequest(BaseModel):
    question: str

# 7. Create the API Endpoint
@app.post("/ask")
async def ask_database(request: QueryRequest):
    # This generates the SQL query from the question
    generated_sql = chain.invoke({"question": request.question})
    
    # This executes the SQL query on the database
    # We use a try/except block just in case the AI writes bad SQL
    try:
        result = db.run(generated_sql)
    except Exception as e:
        result = f"Error executing SQL: {e}"
    
    return {
        "question": request.question,
        "generated_sql": generated_sql,
        "answer": result
    }

# 8. Root endpoint (Just to check if it's alive)
@app.get("/")
def read_root():
    return {"message": "AI SQL Assistant is running!"}