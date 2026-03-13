import os
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import requests
from dotenv import load_dotenv

load_dotenv()

HF_TOKEN = os.getenv("HF_TOKEN", "").strip()
API_URL = "https://api-inference.huggingface.co/models/sentence-transformers/all-mpnet-base-v2"
headers = {"Authorization": f"Bearer {HF_TOKEN}"} if HF_TOKEN else {}

def query_huggingface_api(payload):
    if not HF_TOKEN or HF_TOKEN == "REPLACE_WITH_YOUR_HUGGINGFACE_TOKEN":
        print("WARNING: HF_TOKEN is not set or is the default value. HuggingFace Inference API will likely fail or use a heavily rate-limited free tier.")
    
    try:
        # Add wait_for_model to handle cold starts
        payload["options"] = {"wait_for_model": True}
        response = requests.post(API_URL, headers=headers, json=payload)
        
        if response.status_code == 503:
            print("Model is loading, retrying...")
            # The API usually handles wait_for_model, but just in case
            return query_huggingface_api(payload)
            
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error calling HuggingFace API: {e}")
        # If API fails, return None so we can fallback to exactly 0 similarity
        return None

def compute_exact_similarity(sentence1: str, sentence2: str) -> float:
    """Compute exact text similarity using TF-IDF."""
    if not sentence1.strip() or not sentence2.strip():
         return 0.0
         
    vectorizer = TfidfVectorizer(stop_words='english')
    try:
        tfidf_matrix = vectorizer.fit_transform([sentence1, sentence2])
        # Calculate cosine similarity between the two vectors
        sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0]
        return float(sim)
    except ValueError:
        return 0.0

def compute_semantic_similarity(sentence1: str, sentence2: str) -> float:
    """Compute paraphrased similarity using HuggingFace Inference API."""
    if not sentence1.strip() or not sentence2.strip():
        return 0.0

    payload = {
        "inputs": {
            "source_sentence": sentence1,
            "sentences": [sentence2]
        }
    }
    
    result = query_huggingface_api(payload)
    if result and isinstance(result, list) and len(result) > 0:
        return float(result[0])
    
    return 0.0

def compute_batch_semantic_similarity(target_sentences: list, source_sentences: list) -> list:
    """
    Compute semantic similarities for a batch of target sentences against all source sentences.
    Returns a list of dicts with the highest match for each target sentence.
    """
    if not target_sentences or not source_sentences:
        return [{'highest_sim': 0.0, 'matched_idx': -1} for _ in target_sentences]
        
    results = []
    
    # We will iterate through each target sentence and query against all source sentences
    # Warning: This can make many API calls. In a true production environment with external APIs,
    # you might want to batch these more efficiently or use a dedicated inference endpoint.
    for i, target in enumerate(target_sentences):
        payload = {
            "inputs": {
                "source_sentence": target,
                "sentences": source_sentences
            }
        }
        
        api_scores = query_huggingface_api(payload)
        
        if api_scores and isinstance(api_scores, list):
            # api_scores is a list of similarity scores corresponding to source_sentences
            try:
                max_idx = np.argmax(api_scores)
                max_score = float(api_scores[max_idx])
                
                results.append({
                    'highest_sim': max_score,
                    'matched_idx': int(max_idx)
                })
            except Exception:
                results.append({'highest_sim': 0.0, 'matched_idx': -1})
        else:
            # FALLBACK: Use TF-IDF for similarity if API fails
            # This ensures the system still works even without HF_TOKEN or if API is down
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
