import os
from groq import Groq
import asyncio
from dotenv import load_dotenv

load_dotenv()

def get_groq_client():
    api_key = os.environ.get("GROQ_API_KEY")
    if not api_key:
        return None
    return Groq(api_key=api_key)

async def generate_rewrite_suggestion_async(sentence: str) -> str:
    """Uses Groq to suggest a non-plagiarized rewrite of a sentence."""
    client = get_groq_client()
    if not client:
        return "AI rewriting is currently unavailable (API Key missing)."
        
    prompt = f"""You are an expert academic writing assistant. 
The following sentence has been flagged for potential plagiarism.
Please rewrite this sentence so that it retains the exact same original meaning, but uses entirely different vocabulary and sentence structure to ensure it is 100% unique and original. Do not provide any commentary, only output the rewritten sentence.

Original Sentence: "{sentence}"
Rewrite:"""

    try:
        # Run synchronous Groq API call in a thread pool to not block asyncio event loop
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model="llama-3.1-8b-instant",
                temperature=0.7,
                max_tokens=200
            )
        )
        return response.choices[0].message.content.strip().replace('"', '')
    except Exception as e:
        print(f"Groq API Error: {e}")
        return "Failed to generate rewrite suggestion due to an API error."

async def get_chatbot_response_async(message: str, history: list, context: str = "") -> str:
    """Uses Groq for the conversational AI chatbot."""
    client = get_groq_client()
    if not client:
        return "I'm sorry, I am currently offline because the GROQ_API_KEY is missing."
        
    system_prompt = f"""You are 'Srujana', a highly intelligent, academic AI writing assistant and plagiarism expert. 
You help students understand their plagiarism reports, rewrite sentences to be highly original, and answer questions about academic writing styles (APA, MLA, etc), grammar, and paper structure. 
Be concise, friendly, and strictly academic.

{f'Current Plagiarism Context: {context}' if context else ''}"""

    messages = [{"role": "system", "content": system_prompt}]
    
    # Format history: [{'role': 'user'|'assistant', 'content': '...'}]
    for msg in history:
        messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
        
    messages.append({"role": "user", "content": message})

    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: client.chat.completions.create(
                messages=messages,
                model="llama-3.1-8b-instant",
                temperature=0.5,
                max_tokens=500
            )
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Chatbot Groq Error: {e}")
        return "I'm having trouble connecting to my brain right now. Please try again later."
