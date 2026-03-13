-- Plagiarism Detection System Database Schema

-- Stored documents that act as our source base for comparison
CREATE TABLE IF NOT EXISTS source_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sentences from source documents linked for exact match lookup
CREATE TABLE IF NOT EXISTS source_sentences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    document_id INTEGER NOT NULL,
    sentence_text TEXT NOT NULL,
    sentence_index INTEGER NOT NULL,
    FOREIGN KEY (document_id) REFERENCES source_documents (id) ON DELETE CASCADE
);

-- Records of uploaded assignments
CREATE TABLE IF NOT EXISTS assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    filename TEXT NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status TEXT DEFAULT 'pending' -- pending, processing, completed, failed
);

-- Plagiarism reports generated for assignments
CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    assignment_id INTEGER NOT NULL,
    overall_similarity FLOAT NOT NULL DEFAULT 0.0,
    intro_similarity FLOAT DEFAULT NULL,
    methodology_similarity FLOAT DEFAULT NULL,
    conclusion_similarity FLOAT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assignment_id) REFERENCES assignments (id) ON DELETE CASCADE
);

-- Specific flagged sentences within a report
CREATE TABLE IF NOT EXISTS flagged_sentences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id INTEGER NOT NULL,
    sentence_text TEXT NOT NULL,
    similarity_score FLOAT NOT NULL,
    match_type TEXT NOT NULL, -- 'exact' or 'semantic'
    matched_source_id INTEGER, -- references source_documents 
    FOREIGN KEY (report_id) REFERENCES reports (id) ON DELETE CASCADE
);
