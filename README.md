# ExcelMind — RAG Application

An advanced AI-powered web application for querying Excel spreadsheets using natural language. Built with **Next.js** (frontend), **FastAPI** (backend), **FAISS** (vector search), and **Groq LLaMA 3** (LLM).

## ✨ Features

- **Interactive Chat Interface**: Premium UI/UX featuring a glassmorphism-inspired design system, dark mode first, and smooth Framer Motion animations.
- **RAG-Powered LLM**: Uses Groq's blazing fast `llama-3.3-70b-versatile` model for intelligent, context-aware responses.
- **Excel Data Ingestion**: Seamlessly upload `.xlsx` files which are processed, chunked, and parsed.
- **In-Memory Vector Search**: Lightning fast semantic retrieval using HuggingFace embeddings (`all-MiniLM-L6-v2`) and FAISS.

## 📋 Prerequisites

- **Node.js**: v18 or newer
- **Python**: 3.9 or newer
- **Groq API Key**: Get a free API key at [console.groq.com](https://console.groq.com/)

## 🚀 Getting Started

### Step 1 — Configure Your Groq API Key

Create a `.env` file in the `backend` directory (if not exists) and paste your Groq API key:

```env
GROQ_API_KEY=your_actual_key_here
```

### Step 2 — Start the Backend (Terminal 1)

```powershell
cd backend
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Step 3 — Start the Frontend (Terminal 2)

```powershell
cd frontend
npm install
npm run dev
```

Then open your browser at: **http://localhost:3000**

## 🧠 Tech Stack Structure

### Frontend
- **Framework**: Next.js 15 (App Router) + TypeScript
- **Styling**: Tailwind CSS v4 + Framer Motion (Glassmorphism & premium animations)
- **Icons**: Lucide React

### Backend
- **Framework**: FastAPI (Python)
- **LLM Framework**: LangChain (v1.2.x compatible)
- **LLM**: Groq `llama-3.3-70b-versatile`
- **Embeddings**: HuggingFace `all-MiniLM-L6-v2`
- **Vector DB**: FAISS (in-memory CPU search)
- **Data Processing**: pandas

## 🏗️ Architecture

1. **Upload Phase**: Users upload `.xlsx` files to the FastAPI backend. The files are parsed by `pandas`, embedded using HuggingFace models, and indexed in FAISS memory.
2. **Query Phase**: Users converse through the Next.js chat interface. LangChain processes the query, retrieves the most relevant spreadsheet rows from FAISS, and constructs a context prompt.
3. **Response**: The context is passed to the Groq model, which yields a highly relevant answer back to the frontend.
