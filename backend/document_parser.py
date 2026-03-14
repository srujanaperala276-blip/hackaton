import os
import fitz  # PyMuPDF
import docx
import re
import spacy

# Load spaCy model for sentence segmentation
# Ensure python -m spacy download en_core_web_sm is run
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    # Fallback to simple split if not installed (useful for test environments)
    import subprocess
    subprocess.run(["python", "-m", "spacy", "download", "en_core_web_sm"])
    nlp = spacy.load("en_core_web_sm")

def extract_text(file_path: str, filename: str) -> str:
    """Extract full text from supported document types."""
    ext = filename.lower().split('.')[-1]
    
    if ext == 'pdf':
        return extract_from_pdf(file_path)
    elif ext == 'docx':
        return extract_from_docx(file_path)
    elif ext == 'txt':
        return extract_from_txt(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")

def extract_from_pdf(file_path: str) -> str:
    text = ""
    try:
        doc = fitz.open(file_path)
        for page in doc:
            text += page.get_text() + "\n"
        doc.close()
    except Exception as e:
        print(f"Error extracting PDF: {e}")
    return text

def extract_from_docx(file_path: str) -> str:
    doc = docx.Document(file_path)
    return "\n".join([para.text for para in doc.paragraphs])

def extract_from_txt(file_path: str) -> str:
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as file:
        return file.read()

def segment_sentences(text: str) -> list:
    """Split text into a cleaner list of sentences."""
    # Remove excessive newlines/spaces
    clean_text = re.sub(r'\s+', ' ', text).strip()
    
    # Process text through NLP model to get sentences
    doc = nlp(clean_text)
    
    # Filter out empty or very short 'sentences'
    sentences = [sent.text.strip() for sent in doc.sents if len(sent.text.strip()) > 3]
    return sentences

def extract_sections(text: str) -> dict:
    """
    Heuristic section detection to split document into Introduction, Methodology, Conclusion etc.
    Returns a dictionary of sections mapped to their text slices.
    """
    sections = {
        "introduction": "",
        "methodology": "",
        "conclusion": "",
        "body": "" # Everything else
    }
    
    lines = text.split('\n')
    current_section = "body"
    
    for line in lines:
        stripped_lower_line = line.strip().lower()
        if not stripped_lower_line:
            continue
            
        # Basic Heuristic Title Matching (must be short like a title)
        if len(stripped_lower_line.split()) <= 4:
            if "introduction" in stripped_lower_line or "background" in stripped_lower_line:
                current_section = "introduction"
            elif "methodology" in stripped_lower_line or "methods" in stripped_lower_line or "approach" in stripped_lower_line:
                current_section = "methodology"
            elif "conclusion" in stripped_lower_line or "summary" in stripped_lower_line:
                current_section = "conclusion"
                
        sections[current_section] += line + " "
        
    for k in sections:
        sections[k] = sections[k].strip()
        
    return sections
