from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def compute_exact_similarity(sentence1: str, sentence2: str) -> float:
    """Compute exact text similarity using TF-IDF."""
    if not sentence1.strip() or not sentence2.strip():
        return 0.0
         
    vectorizer = TfidfVectorizer(stop_words='english')
    try:
        tfidf_matrix = vectorizer.fit_transform([sentence1, sentence2])
        sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(sim)
    except ValueError:
        return 0.0

def compute_batch_semantic_similarity(target_sentences: list, source_sentences: list) -> list:
    """
    Compute semantic similarities using local exact matching for a batch of target sentences against all source sentences.
    Returns a list of dicts with the highest match for each target sentence.
    """
    if not target_sentences or not source_sentences:
        return [{'highest_sim': 0.0, 'matched_idx': -1} for _ in target_sentences]
        
    results = []
    
    for i, target in enumerate(target_sentences):
        try:
            max_score = 0.0
            max_idx = -1
            for j, source in enumerate(source_sentences):
                sim = compute_exact_similarity(target, source)
                if sim > max_score:
                    max_score = sim
                    max_idx = j
            
            results.append({
                'highest_sim': max_score,
                'matched_idx': max_idx
            })
        except Exception:
            results.append({'highest_sim': 0.0, 'matched_idx': -1})
            
    return results
