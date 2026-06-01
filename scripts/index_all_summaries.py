import os
import json
import urllib.request
import time
import ssl
import re
from pypdf import PdfReader

# Bypass macOS SSL certificate verification
ssl._create_default_https_context = ssl._create_unverified_context

# Configuration
API_KEY = "AIzaSyC6HneAB2u2aj5ayvkMilH-otqTo542SQU"
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={API_KEY}"
WORKSPACE_DIR = "/Users/shrikantsaruk/Documents/college project"
PYQS_DIR = os.path.join(WORKSPACE_DIR, "public", "pyqs")
OUTPUT_FILE = os.path.join(WORKSPACE_DIR, "public", "data", "paper_summaries.json")

SUBJECT_MAP = {
    'bee': 'Basic Electrical Engineering',
    'physics': 'Engineering Physics',
    'chemistry': 'Engineering Chemistry',
    'maths1': 'Engineering Mathematics I',
    'maths2': 'Engineering Mathematics II',
    'engineering-mechanics': 'Engineering Mechanics',
    'electronics': 'Basic Electronics Engineering',
    'pps': 'Programming & Problem Solving',
    'engineering-graphics': 'Engineering Graphics'
}

def extract_pdf_text(file_path):
    try:
        reader = PdfReader(file_path)
        text_content = []
        # Extract first 4 pages of the question paper
        for page in reader.pages[:4]:
            text = page.extract_text()
            if text:
                text_content.append(text)
        return "\n".join(text_content)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return ""

def call_gemini_api(prompt):
    payload = {
        "contents": [{
            "parts": [{
                "text": prompt
            }]
        }],
        "generationConfig": {
            "maxOutputTokens": 8192
        }
    }
    
    req_data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(
        API_URL,
        data=req_data,
        headers={'Content-Type': 'application/json'}
    )
    
    max_retries = 8
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req) as response:
                res_data = response.read().decode('utf-8')
                res_json = json.loads(res_data)
                text = res_json['candidates'][0]['content']['parts'][0]['text']
                return text
        except Exception as e:
            print(f"API Call Error (Attempt {attempt+1}/{max_retries}): {e}")
            is_429 = False
            if hasattr(e, 'read'):
                try:
                    err_content = e.read().decode('utf-8')
                    print(err_content[:400])
                    if "429" in err_content or "RESOURCE_EXHAUSTED" in err_content:
                        is_429 = True
                except Exception:
                    pass
            
            # Quota or rate limit: wait 45 seconds to let the project bucket clear
            sleep_time = 45 if is_429 else 10
            print(f"  - Waiting {sleep_time} seconds before retrying...")
            time.sleep(sleep_time)
            
    return None

def build_summary_prompt(subject_name, session, paper_text):
    prompt = f"""
You are an elite academic professor analyzing an engineering question paper PDF.
Extract and generate a highly detailed, professional, and visually stunning academic summary of this paper.

Subject: {subject_name}
Session: {session}

--- RAW TEXT OF THE PAPER ---
{paper_text[:8000]}
--- END OF PAPER TEXT ---

Your response must be in clean, beautiful Markdown. Organize the response exactly as follows:

# 📋 Question Paper Summary: {subject_name}

### 📊 Key Details
*   **Subject Name:** {subject_name}
*   **Exam Pattern/Pattern Year:** SPPU 2019 Syllabus Pattern
*   **Total Marks:** [Extract Total Marks, e.g. 70 Marks]
*   **Duration:** [Extract Duration, e.g. 2.5 Hours]

---

### 🎯 Syllabus & Weightage Distribution
Create a markdown table showing the core topics/units covered in the questions and their estimated percentage weightage of the total paper.

| Unit/Topic | Estimated Weightage (%) | Types of Questions Asked |
|---|---|---|
| Example Topic | 25% | Derivations, numericals... |

---

### 🔍 Detailed Question Breakdown
Briefly list each main question (e.g. Q1, Q2) and summarize what is being asked (equations, derivations, or numerical calculations) along with their allotted marks. Bold important terms!

---

### ⚡ Professor's Strategic Advice
*   **Overall Difficulty:** [Easy / Medium / Hard]
*   **High-Value Focus Areas:** [What topics must a student revise first based on this paper?]
*   **Common Pitfalls:** [What math steps or assumptions do students usually get wrong here?]
*   **Time Management Strategy:** [How should they divide their time to solve this paper?]

*CRITICAL MATH FORMATTING INSTRUCTION FOR FORMULAS AND DERIVATIONS*:
Do NOT use LaTeX, dollar signs ($ or $$), or LaTeX-style math operators (like \\frac, \\Phi, \\implies, \\left, \\right, \\theta, \\approx, etc.) under any circumstances.
Instead, write all formulas, equations, and derivations in a clean, plain-text textbook format using standard keyboard characters and readable Unicode mathematical symbols:
- Use Greek letters directly: e.g., Φ for flux, θ for angle, μ for permeability, Ω for Ohm, π for pi, Δ for delta, η for efficiency.
- Use simple keyboard notation: e.g., use '/' for fractions (e.g., (N * Φ) / I or 1/2), '^' or superscript characters for exponents (e.g., I² or I^2, t² or t^2), '*' for multiplication, and normal parentheses '()' for grouping.
- Use plain English arrow words: e.g., '=>' or 'leads to' or 'implies' instead of LaTeX arrows.
Ensure every equation, step, and derivation is perfectly human-readable in plain standard Markdown.

Make the markdown output absolutely immaculate, clear, and encouraging. Return ONLY the markdown.
"""
    return prompt

def main():
    print("=== STARTING BATCH PAPER SUMMARIZATION ===")
    
    if not os.path.exists(PYQS_DIR):
        print(f"Error: PYQs directory not found at {PYQS_DIR}")
        return
        
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    # Load existing summaries cache
    summaries = {}
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                summaries = json.load(f)
            print(f"Loaded existing index with {len(summaries)} pre-computed summaries.")
        except Exception as e:
            print(f"Could not load existing summaries: {e}")
            
    # Gather all PDF papers to index
    all_papers_to_process = []
    
    subject_folders = [d for d in os.listdir(PYQS_DIR) if os.path.isdir(os.path.join(PYQS_DIR, d))]
    
    for folder in sorted(subject_folders):
        folder_path = os.path.join(PYQS_DIR, folder)
        files = [f for f in os.listdir(folder_path) if f.lower().endswith('.pdf')]
        
        for file in sorted(files):
            clean_session = file.replace('.pdf', '').replace('_', ' ').replace(' - ', ' ').strip()
            key = f"{folder}/{clean_session}"
            
            all_papers_to_process.append({
                'folder': folder,
                'file': file,
                'subject_name': SUBJECT_MAP.get(folder, folder),
                'session': clean_session,
                'key': key,
                'path': os.path.join(folder_path, file)
            })
            
    print(f"Discovered a total of {len(all_papers_to_process)} question papers in the directory.")
    
    # Filter out already indexed papers
    papers_to_index = [p for p in all_papers_to_process if p['key'] not in summaries]
    print(f"{len(all_papers_to_process) - len(papers_to_index)} papers are already indexed.")
    print(f"{len(papers_to_index)} papers are pending indexing.")
    
    if not papers_to_index:
        print("All papers are already 100% indexed and summarized!")
        return

    # Process pending papers
    success_count = 0
    start_time = time.time()
    
    for idx, paper in enumerate(papers_to_index):
        print(f"\n[{idx+1}/{len(papers_to_index)}] Processing: {paper['subject_name']} — {paper['session']} ({paper['key']})...")
        
        # 1. Extract text
        text = extract_pdf_text(paper['path'])
        if not text:
            print("  - Skipped: Could not extract text from PDF.")
            continue
            
        # 2. Build prompt
        prompt = build_summary_prompt(paper['subject_name'], paper['session'], text)
        
        # 3. Query Gemini
        print("  - Querying Gemini API for textbook summary...")
        ai_response = call_gemini_api(prompt)
        
        if not ai_response:
            print("  - Error: No response received from Gemini.")
            continue
            
        # 4. Parse and clean response
        cleaned_response = ai_response.strip()
        if cleaned_response.startswith("```markdown"):
            cleaned_response = cleaned_response[11:]
        elif cleaned_response.startswith("```"):
            cleaned_response = cleaned_response[3:]
        if cleaned_response.endswith("```"):
            cleaned_response = cleaned_response[:-3]
            
        cleaned_response = cleaned_response.strip()
        
        # 5. Save securely to summaries dict
        summaries[paper['key']] = cleaned_response
        
        # 6. Progressively write to disk
        try:
            with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
                json.dump(summaries, f, indent=2, ensure_ascii=False)
            success_count += 1
            print("  - Success: Saved pre-computed summary to cache!")
        except Exception as write_err:
            print(f"  - Error saving to cache file: {write_err}")
            
        # baseline spacing delay to prevent hitting 15 RPM
        time.sleep(18)
        
    print(f"\n=== BATCH SUMMARIZATION COMPLETE ===")
    print(f"Successfully processed {success_count} new papers!")
    print(f"Total pre-computed summaries: {len(summaries)} papers are now 100% offline-immune!")

if __name__ == "__main__":
    main()
