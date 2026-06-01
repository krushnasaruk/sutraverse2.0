import os
import json
import urllib.request
import ssl
from pypdf import PdfReader

ssl._create_default_https_context = ssl._create_unverified_context

API_KEY = "AIzaSyAumR3u6AF49rTiaB7kqfk6HP6KQN-4m6I"
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={API_KEY}"
WORKSPACE_DIR = "/Users/shrikantsaruk/Documents/college project"
BEE_DIR = os.path.join(WORKSPACE_DIR, "public", "pyqs", "bee")

def extract_pdf_text(file_path):
    reader = PdfReader(file_path)
    text_content = []
    for page in reader.pages[:4]:
        text = page.extract_text()
        if text:
            text_content.append(text)
    return "\n".join(text_content)

def main():
    print("Running API test...")
    pdf_files = [f for f in os.listdir(BEE_DIR) if f.lower().endswith('.pdf')]
    pdf_files = sorted(list(set(pdf_files)))[:3] # Just take 3 papers to keep it small
    
    papers_data = {}
    for file in pdf_files:
        file_path = os.path.join(BEE_DIR, file)
        text = extract_pdf_text(file_path)
        papers_data[file] = text
        
    prompt = f"""
You are an expert university professor for First Year Engineering.
Analyze these BEE question papers:
"""
    for file, text in papers_data.items():
        prompt += f"\n--- PAPER: {file} ---\n{text[:2000]}\n"
        
    prompt += """
Identify the single highest frequency question. Return a JSON object with keys:
"question", "frequency", "idealAnswer" (perfect textbook answer, fully written out, 200+ words).

Return ONLY raw JSON. No markdown.
"""

    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "responseMimeType": "application/json",
            "maxOutputTokens": 8192
        }
    }
    
    req_data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        API_URL,
        data=req_data,
        headers={'Content-Type': 'application/json'}
    )
    
    try:
        with urllib.request.urlopen(req) as response:
            res_data = response.read().decode('utf-8')
            res_json = json.loads(res_data)
            print("\n=== RAW API RESPONSE FROM GEMINI ===")
            print(json.dumps(res_json, indent=2))
    except Exception as e:
        print(f"API Call Error: {e}")
        if hasattr(e, 'read'):
            print(e.read().decode('utf-8'))

if __name__ == "__main__":
    main()
