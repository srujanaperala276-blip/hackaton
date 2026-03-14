import os
import sqlite3
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import shutil
from dotenv import load_dotenv

load_dotenv()

from backend.document_parser import extract_text
from backend.plagiarism_engine import PlagiarismEngine
from backend.report_generator import generate_json_report, generate_docx_report
from backend.ai_features import get_chatbot_response_async

app = FastAPI(title="AI Plagiarism Detector API")

# Mount exports directory
EXPORTS_DIR = os.path.join(os.path.dirname(__file__), '..', 'exports')
os.makedirs(EXPORTS_DIR, exist_ok=True)
app.mount("/exports", StaticFiles(directory=EXPORTS_DIR), name="exports")

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = PlagiarismEngine()

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'plagiarism_db.sqlite')

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    schema_path = os.path.join(os.path.dirname(__file__), '..', 'database', 'schema.sql')
    if os.path.exists(schema_path):
        with open(schema_path, 'r') as f:
            schema_script = f.read()
        conn = get_db()
        conn.executescript(schema_script)
        conn.commit()
        conn.close()

init_db()

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), '..', 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

class AnalyzeRequest(BaseModel):
    document_id: int
    enable_web_search: bool = False

class ChatRequest(BaseModel):
    message: str
    history: list = []
    context: str = ""

class ExportRequest(BaseModel):
    report_data: dict
    size: str = "A4"

@app.post("/upload")
async def upload_document(file: UploadFile = File(...)):
    """Upload a document for later analysis."""
    allowed_extensions = ["pdf", "docx", "txt"]
    ext = file.filename.split('.')[-1].lower()
    
    if ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Unsupported file type")
        
    file_path = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        text = extract_text(file_path, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract text: {str(e)}")
        
    # Save to DB
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO assignments (filename, status) VALUES (?, ?)", (file.filename, 'uploaded'))
    assignment_id = cursor.lastrowid
    conn.commit()
    conn.close()
    
    return {"message": "File uploaded successfully", "assignment_id": assignment_id, "filename": file.filename}

@app.post("/source")
async def add_source_document(file: UploadFile = File(...)):
    """Add a document to the reference library for comparison."""
    ext = file.filename.split('.')[-1].lower()
    if ext not in ["pdf", "docx", "txt"]:
        raise HTTPException(status_code=400, detail="Unsupported file type")
        
    file_path = os.path.join(UPLOAD_DIR, f"source_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        text = extract_text(file_path, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract text: {str(e)}")
        
    # Save to DB
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO source_documents (filename, content) VALUES (?, ?)", (file.filename, text))
    conn.commit()
    conn.close()
    
    return {"message": "Reference document added to library", "filename": file.filename}

@app.post("/analyze")
async def analyze_document(request: AnalyzeRequest):
    """Run plagiarism analysis on an uploaded document."""
    conn = get_db()
    cursor = conn.cursor()
    
    cursor.execute("SELECT * FROM assignments WHERE id = ?", (request.document_id,))
    assignment = cursor.fetchone()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    file_path = os.path.join(UPLOAD_DIR, assignment['filename'])
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
        
    text = extract_text(file_path, assignment['filename'])
    
    cursor.execute("SELECT content FROM source_documents")
    source_rows = cursor.fetchall()
    source_texts = [row['content'] for row in source_rows]
    
    if not source_texts and not request.enable_web_search:
        raise HTTPException(status_code=400, detail="Reference library is empty and web search is disabled. Please upload an 'Original' document or enable web search.")

    # 4. Run Analysis
    try:
        cursor.execute("UPDATE assignments SET status = 'processing' WHERE id = ?", (request.document_id,))
        conn.commit()
        
        analysis_result = await engine.analyze_document(text, source_texts, request.enable_web_search)
        
        report = generate_json_report(analysis_result, assignment['filename'])
        
        cursor.execute("""
            INSERT INTO reports (assignment_id, overall_similarity, intro_similarity, methodology_similarity, conclusion_similarity)
            VALUES (?, ?, ?, ?, ?)
        """, (
            request.document_id,
            report['overall_similarity'],
            report['sections'].get('introduction', 0),
            report['sections'].get('methodology', 0),
            report['sections'].get('conclusion', 0)
        ))
        conn.commit()
        
        cursor.execute("UPDATE assignments SET status = 'completed' WHERE id = ?", (request.document_id,))
        conn.commit()
        
    except Exception as e:
        cursor.execute("UPDATE assignments SET status = 'failed' WHERE id = ?", (request.document_id,))
        conn.commit()
        import traceback
        print(f"ERROR: Analysis failed for document {request.document_id}")
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
    finally:
         conn.close()
        
    return report

@app.get("/report/{assignment_id}")
async def get_report(assignment_id: int):
    """Retrieve an existing report from the DB."""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM reports WHERE assignment_id = ?", (assignment_id,))
    report_row = cursor.fetchone()
    
    if not report_row:
        raise HTTPException(status_code=404, detail="Report not found")
        
    return dict(report_row)

@app.post("/chat")
async def chat_with_ai(request: ChatRequest):
    """Chat with the Srujana AI assistant."""
    try:
        response = await get_chatbot_response_async(request.message, request.history, request.context)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/export")
async def export_report(request: ExportRequest):
    """Generate a downloadable DOCX report."""
    try:
        file_path = generate_docx_report(request.report_data, request.size)
        filename = os.path.basename(file_path)
        return {"download_url": f"http://localhost:8000/exports/{filename}", "filename": filename}
    except Exception as e:
        print(f"Export failed: {e}")
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
