import os
import io
from typing import Optional, List

import pandas as pd
from dotenv import load_dotenv
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_core.documents import Document
from langchain_core.runnables import RunnablePassthrough
from langchain_classic.chains import create_retrieval_chain, create_history_aware_retriever
from langchain_classic.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables.history import RunnableWithMessageHistory
from langchain_core.chat_history import InMemoryChatMessageHistory

load_dotenv()

# ──────────────────────────────────────────────
# App Setup
# ──────────────────────────────────────────────
app = FastAPI(title="Excel RAG API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ──────────────────────────────────────────────
# Global State (In-Memory Session)
# ──────────────────────────────────────────────
class AppState:
    vector_store: Optional[FAISS] = None
    rag_chain = None
    chat_history_store: dict = {}
    filename: Optional[str] = None
    rows_processed: int = 0

state = AppState()

# ──────────────────────────────────────────────
# Request/Response Models
# ──────────────────────────────────────────────
class ChatRequest(BaseModel):
    query: str
    session_id: str = "default"

class ChatResponse(BaseModel):
    answer: str
    sources: List[str] = []

class UploadResponse(BaseModel):
    status: str
    filename: str
    rows_processed: int
    sheets: List[str]

class StatusResponse(BaseModel):
    ready: bool
    filename: Optional[str]
    rows_processed: int

# ──────────────────────────────────────────────
# Helper: Parse Excel to LangChain Documents
# ──────────────────────────────────────────────
def excel_to_documents(file_bytes: bytes, filename: str) -> tuple[List[Document], int, List[str]]:
    xl = pd.ExcelFile(io.BytesIO(file_bytes))
    sheets = xl.sheet_names
    all_docs = []

    for sheet_name in sheets:
        df = xl.parse(sheet_name)
        df = df.dropna(how="all")
        df.columns = [str(c).strip() for c in df.columns]

        for idx, row in df.iterrows():
            row_text = f"[Sheet: {sheet_name}] [Row {idx + 1}]\n"
            for col, val in row.items():
                if pd.notna(val):
                    row_text += f"  {col}: {val}\n"

            doc = Document(
                page_content=row_text,
                metadata={"source": filename, "sheet": sheet_name, "row": int(idx)},
            )
            all_docs.append(doc)

    return all_docs, len(all_docs), sheets

# ──────────────────────────────────────────────
# Helper: Build RAG Chain
# ──────────────────────────────────────────────
def build_rag_chain(vector_store: FAISS):
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        raise HTTPException(
            status_code=500,
            detail="GROQ_API_KEY is not configured. Please add it to backend/.env"
        )

    llm = ChatGroq(api_key=api_key, model_name="llama-3.3-70b-versatile", temperature=0.2)
    retriever = vector_store.as_retriever(search_type="similarity", search_kwargs={"k": 6})

    # Prompt for rephrasing standalone question considering history
    contextualize_q_prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "Given a chat history and the latest user question which might reference context "
            "in the chat history, formulate a standalone question which can be understood "
            "without the chat history. Do NOT answer the question, just reformulate if needed."
        )),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])

    history_aware_retriever = create_history_aware_retriever(
        llm, retriever, contextualize_q_prompt
    )

    # Answer generation prompt
    qa_prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are an expert data analyst AI assistant. Answer the user's question "
            "based *only* on the following Excel spreadsheet context. Be precise, concise, "
            "and structured. If you cannot find the answer in the context, say so explicitly.\n\n"
            "Context from Excel file:\n{context}"
        )),
        MessagesPlaceholder("chat_history"),
        ("human", "{input}"),
    ])

    question_answer_chain = create_stuff_documents_chain(llm, qa_prompt)
    rag_chain = create_retrieval_chain(history_aware_retriever, question_answer_chain)

    # Wrap with message history
    def get_session_history(session_id: str) -> InMemoryChatMessageHistory:
        if session_id not in state.chat_history_store:
            state.chat_history_store[session_id] = InMemoryChatMessageHistory()
        return state.chat_history_store[session_id]

    conversational_rag_chain = RunnableWithMessageHistory(
        rag_chain,
        get_session_history,
        input_messages_key="input",
        history_messages_key="chat_history",
        output_messages_key="answer",
    )

    return conversational_rag_chain

# ──────────────────────────────────────────────
# Endpoints
# ──────────────────────────────────────────────
@app.get("/", tags=["Health"])
async def health_check():
    return {"status": "ok", "message": "Excel RAG API is running."}

@app.get("/status", response_model=StatusResponse, tags=["Status"])
async def get_status():
    return StatusResponse(
        ready=state.vector_store is not None,
        filename=state.filename,
        rows_processed=state.rows_processed,
    )

@app.post("/upload", response_model=UploadResponse, tags=["Document"])
async def upload_excel(file: UploadFile = File(...)):
    if not file.filename.endswith((".xlsx", ".xls")):
        raise HTTPException(status_code=400, detail="Only Excel files (.xlsx, .xls) are supported.")

    file_bytes = await file.read()

    try:
        docs, row_count, sheets = excel_to_documents(file_bytes, file.filename)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse Excel file: {str(e)}")

    if not docs:
        raise HTTPException(status_code=400, detail="The Excel file appears to be empty.")

    splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
    split_docs = splitter.split_documents(docs)

    try:
        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2",
            model_kwargs={"device": "cpu"},
        )
        vector_store = FAISS.from_documents(split_docs, embeddings)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to build vector index: {str(e)}")

    state.vector_store = vector_store
    state.rag_chain = build_rag_chain(vector_store)
    state.filename = file.filename
    state.rows_processed = row_count
    state.chat_history_store = {}

    return UploadResponse(
        status="success",
        filename=file.filename,
        rows_processed=row_count,
        sheets=sheets,
    )

@app.post("/chat", response_model=ChatResponse, tags=["Chat"])
async def chat(request: ChatRequest):
    if state.rag_chain is None:
        raise HTTPException(status_code=400, detail="No Excel file uploaded yet.")

    if not request.query.strip():
        raise HTTPException(status_code=400, detail="Query cannot be empty.")

    try:
        result = state.rag_chain.invoke(
            {"input": request.query},
            config={"configurable": {"session_id": request.session_id}},
        )

        answer = result.get("answer", "I could not find an answer in the document.")
        source_docs = result.get("context", [])

        sources = list({
            f"Sheet: {doc.metadata.get('sheet', 'N/A')}, Row: {doc.metadata.get('row', 'N/A')}"
            for doc in source_docs
        })

        return ChatResponse(answer=answer, sources=sources)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating answer: {str(e)}")

@app.post("/reset", tags=["Document"])
async def reset_session():
    state.vector_store = None
    state.rag_chain = None
    state.filename = None
    state.rows_processed = 0
    state.chat_history_store = {}
    return {"status": "reset", "message": "Session cleared."}
