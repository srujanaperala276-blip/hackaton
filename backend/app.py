import os
import sqlite3
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import shutil

# Import our backend logic
from backend.document_parser import extract_text
from backend.plagiarism_engine import PlagiarismEngine
from backend.report_generator import generate_json_report

app = FastAPI(title="AI Plagiarism Detector API")

# Allow Frontend CORS
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

# Initialize Plagiarism Engine
# In production, this model takes time to load. Doing it on startup is good.
engine = PlagiarismEngine()

# SQLite Database connection setup
DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'plagiarism_db.sqlite')

def get_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

# Init DB tables
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
        
    # Extract text immediately for basic validation
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

@app.post("/analyze")
async def analyze_document(request: AnalyzeRequest):
    """Run plagiarism analysis on an uploaded document."""
    conn = get_db()
    cursor = conn.cursor()
    
    # 1. Fetch the document details
    cursor.execute("SELECT * FROM assignments WHERE id = ?", (request.document_id,))
    assignment = cursor.fetchone()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
        
    file_path = os.path.join(UPLOAD_DIR, assignment['filename'])
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found on server")
        
    # 2. Extract Document Text
    text = extract_text(file_path, assignment['filename'])
    
    # 3. Fetch Source Documents from Database (for comparison)
    cursor.execute("SELECT content FROM source_documents")
    source_rows = cursor.fetchall()
    source_texts = [row['content'] for row in source_rows]
    
    # To demonstrate, if we have NO source documents, let's inject a dummy source document
    # so we can actually test plagiarism detection
    if not source_texts:
        dummy_source = "Machine learning is a field of artificial intelligence. It uses statistical techniques to give computers the ability to learn from data. The methodology involves training models on large datasets. In conclusion, AI is transforming the world."
        source_texts.append(dummy_source)
        # Optionally insert to DB for future checks
        cursor.execute("INSERT INTO source_documents (filename, content) VALUES (?, ?)", ("dummy_source.txt", dummy_source))
        conn.commit()

    # 4. Run Analysis
    try:
        cursor.execute("UPDATE assignments SET status = 'processing' WHERE id = ?", (request.document_id,))
        conn.commit()
        
        analysis_result = engine.analyze_document(text, source_texts)
        
        # 5. Generate structured report
        report = generate_json_report(analysis_result, assignment['filename'])
        
        # 6. Save Report metadata to DB
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
