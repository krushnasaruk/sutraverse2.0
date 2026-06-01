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
OUTPUT_FILE = os.path.join(WORKSPACE_DIR, "public", "data", "pyq_index.json")
SYLLABUS_FILE = os.path.join(WORKSPACE_DIR, "FE 2024 Pattern Syllabus - 16 July 2024 (1) copy.pdf")

SUBJECT_MAP = {
    'bee': {
        'subject': 'BEE',
        'fullName': 'Basic Electrical Engineering',
    },
    'chemistry': {
        'subject': 'Engineering Chemistry',
        'fullName': 'Engineering Chemistry',
    },
    'electronics': {
        'subject': 'Electronics',
        'fullName': 'Basic Electronics Engineering',
    },
    'engineering-graphics': {
        'subject': 'Engineering Graphics',
        'fullName': 'Engineering Graphics & Design',
    },
    'maths1': {
        'subject': 'Engineering Mathematics 1',
        'fullName': 'Engineering Mathematics - I',
    },
    'maths2': {
        'subject': 'Engineering Mathematics 2',
        'fullName': 'Engineering Mathematics - II',
    },
    'engineering-mechanics': {
        'subject': 'Engineering Mechanics',
        'fullName': 'Engineering Mechanics',
    },
    'physics': {
        'subject': 'Engineering Physics',
        'fullName': 'Engineering Physics',
    },
    'pps': {
        'subject': 'PPS',
        'fullName': 'Programming & Problem Solving',
    },
}

def extract_pdf_text(file_path):
    try:
        reader = PdfReader(file_path)
        text_content = []
        # Max 4 pages per question paper (which is standard for FE papers)
        for page in reader.pages[:4]:
            text = page.extract_text()
            if text:
                text_content.append(text)
        return "\n".join(text_content)
    except Exception as e:
        print(f"Error reading {file_path}: {e}")
        return ""

def extract_full_pdf_text(file_path):
    try:
        reader = PdfReader(file_path)
        text_content = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_content.append(text)
        return "\n".join(text_content)
    except Exception as e:
        print(f"Error reading full PDF {file_path}: {e}")
        return ""

def call_gemini_api(prompt):
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
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            with urllib.request.urlopen(req) as response:
                res_data = response.read().decode('utf-8')
                res_json = json.loads(res_data)
                
                candidate = res_json['candidates'][0]
                finish_reason = candidate.get('finishReason', 'UNKNOWN')
                
                if finish_reason != 'STOP' and finish_reason != 'MAX_TOKENS':
                    print(f"    [WARNING] Gemini finishReason is: {finish_reason}")
                    
                text = candidate['content']['parts'][0]['text']
                return text
        except Exception as e:
            print(f"API Call Error (Attempt {attempt+1}/{max_retries}): {e}")
            is_429 = False
            if hasattr(e, 'read'):
                try:
                    err_content = e.read().decode('utf-8')
                    print(err_content[:500])
                    if "429" in err_content or "RESOURCE_EXHAUSTED" in err_content:
                        is_429 = True
                except Exception:
                    pass
            
            if attempt < max_retries - 1:
                sleep_time = 65 if is_429 else 5
                print(f"Waiting {sleep_time} seconds before retrying...")
                time.sleep(sleep_time)
            else:
                return None

def build_subject_prompt(subject_name, full_name, papers_data, syllabus_text):
    # Formulate a structured prompt that passes the raw text of the question papers
    # and asks Gemini to identify high frequency questions, generate answers, etc.
    
    prompt = f"""
You are an expert university professor for First Year Engineering.
You are tasked with building a highly accurate, pre-computed Exam Study Prep Index for the subject: "{full_name}" ({subject_name}).
We have analyzed the historical exam papers of this subject.

Here is the official university Syllabus text for First Year Engineering. Use it strictly to accurately map the questions to their specific Syllabus Units (e.g. Unit 1, Unit 2, etc.) and identify the critical concepts.
--- SYLLABUS TEXT ---
{syllabus_text[:25000]}
--- END SYLLABUS ---

Here is a summary of the exam questions we found:
"""
    
    for filename, text in papers_data.items():
        paper_year = filename.replace('.pdf', '').replace('_', ' ').replace('-', ' ').strip()
        # Clean text slightly to keep it compact
        clean_text = "\n".join([line.strip() for line in text.split('\n') if line.strip() and not line.startswith("Total No.")])
        prompt += f"\n--- PAPER: {paper_year} ---\n{clean_text[:4000]}\n"
        
    prompt += f"""
Using the raw question paper text provided above, complete the following analysis:
1. **Cluster and Group Questions**: Identify identical or highly similar core questions that appear repeatedly across different years.
2. **Calculate Frequency**: For each unique question, determine exactly which past papers it appeared in, and sum the frequency.
3. **Syllabus Unit Assignment**: Group each question into its syllabus unit (Unit 1 to Unit 5).
4. **Ideal Exam Answer**: Write a concise, highly-structured textbook answer that would secure full marks in a university exam. Focus on key bullet points, essential definitions, and critical formulas. Keep the answer highly informative yet compact (around 150-250 words per question) to avoid wordiness.
   *CRITICAL: Paraphrase all explanations and write the answer in your own original academic words. Do NOT copy large sections verbatim from the source papers. This ensures high-quality synthesis and prevents recitation blocks.*
   *CRITICAL MATH FORMATTING INSTRUCTION FOR FORMULAS AND DERIVATIONS*:
   Do NOT use LaTeX, dollar signs ($ or $$), or LaTeX-style math operators (like \\frac, \\Phi, \\implies, \\left, \\right, \\theta, \\approx, etc.) under any circumstances.
   Instead, write all formulas, equations, and derivations in a clean, plain-text textbook format using standard keyboard characters and readable Unicode mathematical symbols:
   - Use Greek letters directly: e.g., Φ for flux, θ for angle, μ for permeability, Ω for Ohm, π for pi, Δ for delta, η for efficiency.
   - Use simple keyboard notation: e.g., use '/' for fractions (e.g., (N * Φ) / I or 1/2), '^' or superscript characters for exponents (e.g., I² or I^2, t² or t^2), '*' for multiplication, and normal parentheses '()' for grouping.
   - Use plain English arrow words: e.g., '=>' or 'leads to' or 'implies' instead of LaTeX arrows.
   Ensure every equation, step, and derivation is perfectly human-readable in plain standard Markdown.
5. **Sort by Frequency**: Return the questions sorted in descending order of frequency (most frequent first). Limit to the top 8 highest-frequency questions.
6. **Generate 5 Unit Summaries**: Provide a brief summary of the top critical concepts for each of the 5 Units.
7. **Generate 5 Rapid Flashcards**: Provide 5 key definitions and terms for rapid revision.

Return a strict JSON response. Do not enclose in markdown blocks.
Strict Schema:
{{
  "subject": "{subject_name}",
  "fullName": "{full_name}",
  "papersCount": {len(papers_data)},
  "questions": [
    {{
      "q": "The core question text (e.g. 'What is series resonance? Derive the expression for resonant frequency.')",
      "marks": "6 marks",
      "unit": "Unit 3",
      "frequency": 5,
      "years": ["Nov Dec 2019", "Oct 2022", "May Jun 2024"],
      "idealAnswer": "Perfect step-by-step textbook answer..."
    }}
  ],
  "summaries": [
    {{
      "unit": "Unit 1",
      "title": "Unit Title",
      "points": [
        "Key point 1 detailing critical exam topic.",
        "Key point 2 detailing critical exam topic."
      ]
    }}
  ],
  "flashcards": [
    {{
      "term": "Term Name",
      "definition": "Clear concise textbook definition."
    }}
  ]
}}
"""
    return prompt

def clean_json_string(s):
    # Escape single backslashes that are not followed by valid JSON escape characters
    result = []
    i = 0
    while i < len(s):
        if s[i] == '\\':
            if i + 1 < len(s):
                next_char = s[i+1]
                if next_char in ['"', '\\', '/', 'b', 'f', 'n', 'r', 't']:
                    result.append('\\')
                    result.append(next_char)
                    i += 2
                    continue
                elif next_char == 'u' and i + 5 < len(s) and all(c in '0123456789abcdefABCDEF' for c in s[i+2:i+6]):
                    result.append('\\')
                    result.append(s[i+1:i+6])
                    i += 6
                    continue
            result.append('\\\\')
            i += 1
        else:
            result.append(s[i])
            i += 1
    return "".join(result)

def repair_truncated_json(s):
    s = s.strip()
    try:
        return json.loads(s)
    except Exception:
        pass
        
    in_string = False
    escaped = False
    reconstructed = []
    brackets = []
    
    i = 0
    while i < len(s):
        c = s[i]
        if in_string:
            if escaped:
                escaped = False
                reconstructed.append(c)
            elif c == '\\':
                escaped = True
                reconstructed.append(c)
            elif c == '"':
                in_string = False
                reconstructed.append(c)
            else:
                reconstructed.append(c)
        else:
            if c == '"':
                in_string = True
                reconstructed.append(c)
            elif c == '{':
                brackets.append('{')
                reconstructed.append(c)
            elif c == '[':
                brackets.append('[')
                reconstructed.append(c)
            elif c == '}':
                if brackets and brackets[-1] == '{':
                    brackets.pop()
                reconstructed.append(c)
            elif c == ']':
                if brackets and brackets[-1] == '[':
                    brackets.pop()
                reconstructed.append(c)
            else:
                reconstructed.append(c)
        i += 1
        
    if in_string:
        if escaped:
            reconstructed.pop()
        reconstructed.append('"')
        
    while brackets:
        open_bracket = brackets.pop()
        if open_bracket == '{':
            reconstructed.append('}')
        elif open_bracket == '[':
            reconstructed.append(']')
            
    reconstructed_str = "".join(reconstructed)
    try:
        return json.loads(reconstructed_str)
    except Exception:
        # If it still fails, try to find the last complete question object
        # and truncate the questions list there.
        # This is a fallback to save whatever parsed successfully.
        return None

def main():
    print("=== STARTING PYQ PARSING AND CLUSTERING ===")
    
    if not os.path.exists(PYQS_DIR):
        print(f"Error: PYQs directory not found at {PYQS_DIR}")
        return
        
    os.makedirs(os.path.dirname(OUTPUT_FILE), exist_ok=True)
    
    # Load syllabus text
    syllabus_text = ""
    if os.path.exists(SYLLABUS_FILE):
        print(f"Loading official syllabus from {SYLLABUS_FILE}...")
        syllabus_text = extract_full_pdf_text(SYLLABUS_FILE)
    else:
        print(f"WARNING: Syllabus file not found at {SYLLABUS_FILE}")
    
    final_index = {}
    if os.path.exists(OUTPUT_FILE):
        try:
            with open(OUTPUT_FILE, 'r', encoding='utf-8') as f:
                final_index = json.load(f)
            print(f"Loaded existing index with {len(final_index)} subjects. Will securely update without wiping.")
        except Exception as e:
            print(f"Could not load existing index: {e}")
    
    # Process subject-by-subject
    for folder, meta in SUBJECT_MAP.items():
        # Check if subject is already in final_index and is fully processed and valid
        # (Must contain 'questions', 'summaries', 'flashcards' and at least 3 questions)
        if meta['subject'] in final_index:
            sub_data = final_index[meta['subject']]
            if isinstance(sub_data, dict) and len(sub_data.get('questions', [])) >= 3:
                print(f"\n>>> Subject {meta['fullName']} ({meta['subject']}) is ALREADY INDEXED successfully. Skipping.")
                continue

        subject_path = os.path.join(PYQS_DIR, folder)
        if not os.path.exists(subject_path):
            print(f"Skipping {folder} (directory not found)")
            continue
            
        print(f"\n>>> Processing Subject: {meta['fullName']} ({meta['subject']})...")
        
        # Read all PDF files
        pdf_files = [f for f in os.listdir(subject_path) if f.lower().endswith('.pdf')]
        pdf_files = list(set(pdf_files)) # Deduplicate
        
        # Helper to extract year from filename
        def get_year(filename):
            match = re.search(r'(20\d{2})', filename)
            return int(match.group(1)) if match else 0
            
        # Sort descending by year to get the most recent ones first
        pdf_files = sorted(pdf_files, key=get_year, reverse=True)
        
        # Limit to the top 6 most recent papers
        selected_files = pdf_files[:6]
        
        if not selected_files:
            print("No PDF files found.")
            continue
            
        print(f"  - Selected {len(selected_files)} most recent papers (out of {len(pdf_files)} total)")
        
        papers_data = {}
        # Parse each unique PDF
        for file in selected_files:
            file_path = os.path.join(subject_path, file)
            print(f"  - Parsing PDF: {file}")
            text = extract_pdf_text(file_path)
            if text:
                papers_data[file] = text
                
        if not papers_data:
            print("Failed to extract text from any paper.")
            continue
            
        # Build prompt and call Gemini
        print(f"  - Consolidation: Preparing prompt for {len(papers_data)} papers...")
        prompt = build_subject_prompt(meta['subject'], meta['fullName'], papers_data, syllabus_text)
        
        print("  - AI Request: Querying Gemini API for clustering and ideal answers...")
        ai_response = call_gemini_api(prompt)
        
        if not ai_response:
            print("  - Error: No response received from Gemini.")
            continue
            
        try:
            # Clean response text if there are wrapping backticks
            cleaned_response = ai_response.strip()
            if cleaned_response.startswith("```json"):
                cleaned_response = cleaned_response[7:]
            if cleaned_response.endswith("```"):
                cleaned_response = cleaned_response[:-3]
            if cleaned_response.startswith("```"):
                cleaned_response = cleaned_response[3:]
                
            cleaned_response = clean_json_string(cleaned_response.strip())
            parsed_data = repair_truncated_json(cleaned_response)
            
            if not parsed_data:
                raise ValueError("JSON repair returned None (completely unparseable truncated JSON)")
            
            # Save into final index
            final_index[meta['subject']] = parsed_data
            print(f"  - Success: Clustered {len(parsed_data.get('questions', []))} high-frequency questions!")
            
        except Exception as e:
            print(f"  - Error parsing Gemini JSON: {e}")
            print("Response preview:")
            print(ai_response[:500])
            
        # Avoid hitting API rate limits
        time.sleep(10)
        
    # Write full index
    print(f"\n>>> Saving final index to {OUTPUT_FILE}...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(final_index, f, indent=2, ensure_ascii=False)
        
    print("=== PYQ INDEXING COMPLETE! ===")

if __name__ == "__main__":
    main()
