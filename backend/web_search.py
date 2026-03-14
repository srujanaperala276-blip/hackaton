import os
import json
import urllib.request
from typing import List, Dict

from dotenv import load_dotenv
load_dotenv()

SERPER_API_KEY = os.getenv("SERPER_API_KEY")
FREE_TIER_LIMIT = 2500

class WebSearcher:
    def __init__(self):
        self.api_key = SERPER_API_KEY
        self.url = "https://google.serper.dev/search"
        self.warning_message = f"WARNING: Using Serper.dev free tier. Limit is {FREE_TIER_LIMIT} queries. Please monitor your usage to prevent overuse. We recommend caching or batching queries when possible."
        
    def search(self, query: str, num_results: int = 3) -> List[Dict]:
        """
        Executes a web search for the given query using Serper.dev.
        Returns a list of matching URLs and snippets.
        """
        if not self.api_key:
            print("Serper API key not found. Skipping web search.")
            return []
            
        print(self.warning_message)
        
        data = json.dumps({
            "q": query,
            "num": num_results
        }).encode('utf-8')
        
        req = urllib.request.Request(self.url, data=data)
        req.add_header('X-API-KEY', self.api_key)
        req.add_header('Content-Type', 'application/json')
        
        try:
            with urllib.request.urlopen(req) as response:
                result = json.loads(response.read().decode('utf-8'))
                
            matches = []
            if 'organic' in result:
                for item in result['organic']:
                    matches.append({
                        "title": item.get("title", ""),
                        "link": item.get("link", ""),
                        "snippet": item.get("snippet", "")
                    })
            return matches
        except Exception as e:
            print(f"Web search failed: {e}")
            return []

if __name__ == "__main__":
    searcher = WebSearcher()
    print("Testing WebSearcher:", searcher.search("What is Artificial Intelligence?"))
