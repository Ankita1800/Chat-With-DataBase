# 🤖 Chat with your Database (Text-to-SQL RAG App)

A Full Stack AI application that allows users to query SQL databases using natural language. Built with **Next.js**, **FastAPI**, and **Llama 3** (via Groq).

![Project Status](https://img.shields.io/badge/Status-Completed-success)

## 🚀 Features
- **Natural Language Processing:** Converts English questions (e.g., "How many laptops were sold?") into executable SQL queries.
- **RAG Architecture:** Uses LangChain to bridge the gap between LLMs and structured data.
- **Real-Time Interface:** Fast, responsive UI built with Next.js and Tailwind CSS.
- **Transparent AI:** Displays the generated SQL code for user verification.

## 🛠️ Tech Stack
- **Frontend:** Next.js, React, Tailwind CSS
- **Backend:** Python, FastAPI
- **AI/ML:** LangChain, Groq API (Llama 3 Model)
- **Database:** SQLite (Scalable to PostgreSQL)

## 📸 Usage
1. User asks a question in the chat interface.
2. The backend generates a SQL query using Llama 3.
3. The query executes against the database.
4. The answer and the SQL logic are returned to the user.

## 💻 How to Run Locally

### Backend
```bash
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python setup_db.py
python -m uvicorn main:app --reload