# AI-Powered Semantic Plagiarism Detection System

This full-stack application detects both direct exact-match plagiarism and semantic paraphrasing in student assignments using NLP models. Built specifically for Render deployment to run efficiently on free/lightweight instances.

## 🚀 Features
- **Multi-format Support:** PDF, DOCX, TXT.
- **Micro-Services Architecture:** React single-page frontend with FastAPI backend.
- **Dual Engine:** TF-IDF for lightning-fast exact copying detection + `SentenceTransformers` (`all-MiniLM-L6-v2`) for deep semantic paraphrasing detection.
- **Section Analysis:** Heuristically detects standard academic sections (Introduction, Methodology, Conclusion) to grade separately.
- **Visual Dashboard:** Beautiful, responsive React+Tailwind UI showing an overall score risk and granular side-by-side sentence matching.

## 📁 Project Structure
```text
plagiarism-detector/
│
├── backend/               # FastAPI Application
│   ├── app.py             # Main API entrypoint
│   ├── document_parser.py # Text extraction & sectioning
│   ├── similarity.py      # TF-IDF and Semantic embeddings
│   ├── plagiarism_engine.py # Core orchestration
│   └── report_generator.py  # Output formatting
│
├── frontend/              # Vite + React + Tailwind
│   ├── src/
│   │   ├── components/
│   │   │   ├── Upload.jsx 
│   │   │   └── ResultsDashboard.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│
├── database/              # SQLite Schema
│   └── schema.sql
│
├── deployment/            # Render confs
│   ├── render.yaml
│   └── requirements.txt
│
└── example_dataset/       # Test files
```

## 🛠️ How to Run Locally

### 1. Backend Setup
Make sure you have Python 3.9+ installed.
```bash
# Navigate to project root
cd plagiarism-detector

# Create virtual environment (optional but recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r deployment/requirements.txt

# Run the backend
python backend/app.py
```
*Note: The first run will take ~30 seconds as it downloads the `all-MiniLM-L6-v2` HuggingFace model.*

### 2. Frontend Setup
Open a new terminal.
```bash
# Navigate to frontend folder
cd plagiarism-detector/frontend

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The application will be available at `http://localhost:5173`.

## ☁️ Deployment on Render

This repository uses Infrastructure as Code (`render.yaml`) for zero-touch deployments.

1. Push this code to a GitHub repository.
2. Log into Render.com dashboard.
3. Go to **Blueprints** -> **New Blueprint Instance**.
4. Connect the repository.
5. Render will automaticallly read `deployment/render.yaml` and provision:
   - A Web Service for the Python FastAPI backend
   - A Static Site for the React Frontend

### Memory Considerations (Free Tier)
`all-MiniLM-L6-v2` is extremely lightweight (under 100MB), making it perfect for Render's 512MB free tier RAM limits compared to heavier BERT models.

## 🧪 Testing the Application
Check the `example_dataset/` directory. Upload `original_source.txt` first to populate the database (simulated), or upload `copied_assignment.txt` to trigger a high plagiarism score against the default seeded dataset.
