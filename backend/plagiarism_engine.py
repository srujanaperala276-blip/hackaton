from backend.similarity import compute_batch_semantic_similarity, compute_exact_similarity
from backend.document_parser import segment_sentences, extract_sections
import json

class PlagiarismEngine:
    def __init__(self, semantic_threshold: float = 0.8, exact_threshold: float = 0.95):
        self.semantic_threshold = semantic_threshold
        self.exact_threshold = exact_threshold
        
    def analyze_document(self, text: str, source_texts: list) -> dict:
        """
        Analyze a document for plagiarism against a list of source texts.
        Returns a rich object describing exact and semantic matches.
        """
        target_sentences = segment_sentences(text)
        sections = extract_sections(text)
        
        # Flatten all source texts into a giant list of sentences
        # In a real database, you would query this efficiently rather than keeping it all in memory
        all_source_sentences = []
        for src in source_texts:
            all_source_sentences.extend(segment_sentences(src))
            
        if not all_source_sentences:
            return self._build_empty_report(target_sentences, sections)
            
        # Run Batch Semantic Similarity
        # This will compare all target sentences against all source sentences
        batch_results = compute_batch_semantic_similarity(target_sentences, all_source_sentences)
        
        flagged_sentences = []
        total_score = 0
        total_sentences = len(target_sentences)
        
        for i, sentence in enumerate(target_sentences):
            match = batch_results[i]
            sim_score = match['highest_sim']
            matched_source_sentence = all_source_sentences[match['matched_idx']]
            
            # Check exact similarity first
            # Since exact similarity is fast for pairs if we already suspect a semantic match, 
            # we can run EXACT similarity on the highest matching semantic sentence to verify if it's identical
            if sim_score > self.exact_threshold:
                # Let's double check with TF-IDF if it's REALLY an exact match
                exact_sim = compute_exact_similarity(sentence, matched_source_sentence)
                if exact_sim > self.exact_threshold:
                    flagged_sentences.append({
                        "sentence": sentence,
                        "matched_sentence": matched_source_sentence,
                        "similarity": exact_sim,
                        "type": "exact"
                    })
                    total_score += 1.0 # 100% plagiarized
                    continue
            
            if sim_score > self.semantic_threshold:
                 flagged_sentences.append({
                        "sentence": sentence,
                        "matched_sentence": matched_source_sentence,
                        "similarity": sim_score,
                        "type": "semantic"
                 })
                 total_score += sim_score # Weight it by similarity
                 
        overall_similarity = (total_score / total_sentences * 100) if total_sentences > 0 else 0
        
        # Analyze sections separately (basic approach)
        section_scores = self._analyze_sections(sections, all_source_sentences)
        
        return {
            "overall_similarity": round(overall_similarity, 2),
            "sections": section_scores,
            "flagged_sentences": flagged_sentences,
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
                
            # Quick batch analysis for the section
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
            "total_sentences": len(target_sentences),
            "plagiarized_sentences_count": 0
        }
