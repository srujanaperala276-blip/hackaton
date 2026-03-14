from backend.similarity import compute_batch_semantic_similarity, compute_exact_similarity
from backend.document_parser import segment_sentences, extract_sections
from backend.web_search import WebSearcher
from backend.ai_features import generate_rewrite_suggestion_async
import json
import asyncio
import random

class PlagiarismEngine:
    def __init__(self, semantic_threshold: float = 0.8, exact_threshold: float = 0.95):
        self.semantic_threshold = semantic_threshold
        self.exact_threshold = exact_threshold
        self.web_searcher = WebSearcher()
        
    async def analyze_document(self, text: str, source_texts: list, enable_web_search: bool = False) -> dict:
        """
        Orchestrates the asynchronous plagiarism detection process.
        """
        target_sentences = segment_sentences(text)
        sections = extract_sections(text)
        
        all_source_sentences = []
        for src in source_texts:
            all_source_sentences.extend(segment_sentences(src))
            
        if not all_source_sentences and not enable_web_search:
            return self._build_empty_report(target_sentences, sections)
            
        batch_results = compute_batch_semantic_similarity(target_sentences, all_source_sentences)
        
        flagged_sentences = []
        total_score = 0
        total_sentences = len(target_sentences)
        
        for i, sentence in enumerate(target_sentences):
            match = batch_results[i]
            sim_score = match['highest_sim']
            matched_source_sentence = all_source_sentences[match['matched_idx']]
            
            if sim_score > self.exact_threshold:
                exact_sim = compute_exact_similarity(sentence, matched_source_sentence)
                if exact_sim > self.exact_threshold:
                    flagged_sentences.append({
                        "sentence": sentence,
                        "matched_sentence": matched_source_sentence,
                        "similarity": exact_sim,
                        "type": "exact"
                    })
                    total_score += 1.0
                    continue
            
            if sim_score > self.semantic_threshold:
                 flagged_sentences.append({
                        "sentence": sentence,
                        "matched_sentence": matched_source_sentence,
                        "similarity": sim_score,
                        "type": "semantic"
                 })
                 total_score += sim_score
                 
        overall_similarity = (total_score / total_sentences * 100) if total_sentences > 0 else 0
        
        web_matches = []
        if enable_web_search and self.web_searcher.api_key:
            candidates = [s for s in target_sentences if len(s.split()) > 8]
            sample_sentences = random.sample(candidates, min(3, len(candidates)))
            
            for sentence in sample_sentences:
                results = self.web_searcher.search(query=f'"{sentence}"', num_results=2)
                if results:
                    web_matches.append({
                        "sentence": sentence,
                        "matches": results
                    })
                    overall_similarity = min(100, overall_similarity + 5)
        
        flagged_sentences.sort(key=lambda x: x['similarity'], reverse=True)
        
        # Get AI rewriting suggestions for the top 5 matches to avoid rate limiting
        top_matches = flagged_sentences[:5]
        rewrite_tasks = [
            generate_rewrite_suggestion_async(match['sentence'])
            for match in top_matches
        ]
        
        if rewrite_tasks:
            try:
                rewrites = await asyncio.gather(*rewrite_tasks)
                for i, match in enumerate(top_matches):
                    match['ai_rewrite_suggestion'] = rewrites[i]
            except Exception as e:
                print(f"Parallel rewrite generation failed: {e}")
        
        section_scores = self._analyze_sections(sections, all_source_sentences)
        
        return {
            "overall_similarity": round(overall_similarity, 2),
            "sections": section_scores,
            "flagged_sentences": flagged_sentences,
            "web_matches": web_matches,
            "total_sentences": total_sentences,
            "plagiarized_sentences_count": len(flagged_sentences)
        }
        
    def _analyze_sections(self, sections: dict, source_sentences: list) -> dict:
        """Analyze individual document sections."""
        section_results = {}
        for section_name, content in sections.items():
            if not content:
                section_results[section_name] = 0
                continue
                
            sents = segment_sentences(content)
            if not sents:
                section_results[section_name] = 0
                continue
                
            batch_results = compute_batch_semantic_similarity(sents, source_sentences)
            
            section_score = 0
            for res in batch_results:
                if res['highest_sim'] > self.semantic_threshold:
                     section_score += res['highest_sim']
                     
            section_percent = (section_score / len(sents) * 100)
            section_results[section_name] = round(section_percent, 2)
            
        return section_results
        
    def _build_empty_report(self, target_sentences, sections):
        section_scores = {k: 0 for k in sections}
        return {
            "overall_similarity": 0.0,
            "sections": section_scores,
            "flagged_sentences": [],
            "web_matches": [],
            "total_sentences": len(target_sentences),
            "plagiarized_sentences_count": 0
        }
