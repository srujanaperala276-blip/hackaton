import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def get_paraphrase_explanation(original: str, suspect: str) -> str:
    """Uses Groq to explain how a suspect sentence was paraphrased from an original."""
    if not original or not suspect:
        return ""
        
    prompt = f"""
    Compare these two sentences and explain how the suspect sentence was paraphrased or modified from the original.
    Be concise (1-2 sentences). Focus on specific changes like word choice, sentence structure, or active/passive voice.
    
    Original: "{original}"
    Suspect: "{suspect}"
    
    AI Explanation:"""
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert academic integrity assistant. You analyze text for plagiarism and explain paraphrasing techniques."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.5,
            max_tokens=150
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error calling Groq for explanation: {e}")
        return "Deep AI analysis unavailable for this match."

def generate_report_summary(flagged_sentences: list, overall_similarity: float) -> str:
    """Generates a high-level AI summary of the plagiarism report."""
    if not flagged_sentences:
        return "No significant plagiarism detected. The document appears to be original."
        
    # Take a sample of top matches
    sample = flagged_sentences[:5]
    matches_str = "\n".join([f"- Original: {m['matched_sentence']}\n  Suspect: {m['sentence']}" for m in sample])
    
    prompt = f"""
    The plagiarism detection system found an overall similarity of {overall_similarity}%.
    Here are some of the top flagged matches:
    {matches_str}
    
    Provide a professional, concise summary (3-4 sentences) of the plagiarism findings. 
    Mention the overall risk level and the nature of the paraphrasing observed.
    
    AI Summary:"""
    
    try:
        completion = client.chat.completions.create(
            model="llama-3.1-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are an expert academic integrity officer summarizing a plagiarism report."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.7,
            max_tokens=250
        )
        return completion.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error calling Groq for summary: {e}")
        return f"The document has an overall similarity of {overall_similarity}%. Several matches were found requiring manual review."
