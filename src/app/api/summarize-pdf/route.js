import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req) {
    try {
        let base64Data;
        let fileName = 'unknown.pdf';
        let cacheSearchName = '';

        // Determine the input source: JSON body (library path) or FormData (file upload)
        const contentType = req.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
            // ── Library Selection Mode: Read PDF from local filesystem ──
            const body = await req.json();
            const pdfPath = body.pdfPath;
            
            if (!pdfPath) {
                return NextResponse.json({ error: 'No pdfPath provided.' }, { status: 400 });
            }

            // Security: only allow paths inside public/pyqs
            const safePath = path.join(process.cwd(), 'public', pdfPath.replace(/\.\./g, ''));
            if (!safePath.startsWith(path.join(process.cwd(), 'public', 'pyqs'))) {
                return NextResponse.json({ error: 'Invalid file path.' }, { status: 400 });
            }

            if (!fs.existsSync(safePath)) {
                return NextResponse.json({ error: `Paper not found at path: ${pdfPath}` }, { status: 404 });
            }

            const buffer = fs.readFileSync(safePath);
            base64Data = buffer.toString('base64');
            fileName = path.basename(safePath);
            cacheSearchName = pdfPath.replace('pyqs/', '').replace('.pdf', '').replace(/\//g, '/');
            
            console.log(`[API] Processing library PDF: ${pdfPath} (${buffer.length} bytes)`);
        } else {
            // ── Upload Mode: Read PDF from FormData ──
            const formData = await req.formData();
            const file = formData.get('file');

            if (!file) {
                return NextResponse.json({ error: 'No file uploaded.' }, { status: 400 });
            }

            if (!file.type || file.type !== 'application/pdf') {
                if (!file.name.endsWith('.pdf')) {
                    return NextResponse.json({ error: 'Only PDF documents are supported for exam paper analysis.' }, { status: 400 });
                }
            }

            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);
            base64Data = buffer.toString('base64');
            fileName = file.name;
            cacheSearchName = file.name.toLowerCase();

            console.log(`[API] Processing uploaded PDF: ${file.name} (${buffer.length} bytes)`);
        }

        // --- CACHE LOOKUP FALLBACK (Rate-limit immune) ---
        try {
            const summariesPath = path.join(process.cwd(), 'public', 'data', 'paper_summaries.json');
            if (fs.existsSync(summariesPath)) {
                const cachedSummaries = JSON.parse(fs.readFileSync(summariesPath, 'utf-8'));
                const nameLower = cacheSearchName.toLowerCase();
                let bestCacheKey = null;

                for (const key of Object.keys(cachedSummaries)) {
                    // Direct key match for library paths (e.g. "bee/Nov_Dec_2025")
                    if (nameLower === key.toLowerCase() || nameLower.replace(/_/g, ' ') === key.toLowerCase().replace(/_/g, ' ')) {
                        bestCacheKey = key;
                        break;
                    }

                    const [subj, session] = key.split('/');
                    const cleanSubj = subj.toLowerCase();
                    const cleanSession = session.toLowerCase().replace(/[^a-z0-9]/g, '');
                    const cleanUploadedName = nameLower.replace(/[^a-z0-9]/g, '');

                    const subjMatch = cleanUploadedName.includes(cleanSubj) || 
                                     (cleanSubj === 'bee' && cleanUploadedName.includes('electrical')) ||
                                     (cleanSubj === 'maths1' && cleanUploadedName.includes('math1')) ||
                                     (cleanSubj === 'maths2' && cleanUploadedName.includes('math2'));

                    if (subjMatch && cleanUploadedName.includes(cleanSession)) {
                        bestCacheKey = key;
                        break;
                    }
                }

                if (bestCacheKey) {
                    console.log(`[API] Cache Hit! Serving offline summary for: ${bestCacheKey}`);
                    return NextResponse.json({ summary: cachedSummaries[bestCacheKey] });
                }
            }
        } catch (cacheErr) {
            console.warn('[API] Warning looking up summaries cache:', cacheErr.message);
        }
        // -------------------------------------------------

        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not defined in environment variables.');
            return NextResponse.json({ error: 'AI integration is not configured. Please set the GEMINI_API_KEY.' }, { status: 500 });
        }

        console.log(`[API] Sending to Gemini: ${fileName}`);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });

        const prompt = `
        You are an elite academic professor analyzing an engineering question paper PDF.
        Extract and generate a highly detailed, professional, and visually stunning academic summary of the paper.
        
        Your response must be in clean, beautiful Markdown. Organize the response as follows:
        
        # 📋 Question Paper Summary: [Insert Subject Name here]
        
        ### 📊 Key Details
        *   **Subject Name:** [Extract Subject Name]
        *   **Exam Pattern/Pattern Year:** [e.g. SPPU 2019 Pattern, or Unknown]
        *   **Total Marks:** [Extract Total Marks]
        *   **Duration:** [Extract Duration, e.g. 2.5 hours]
        
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
        
        Make the markdown output absolutely immaculate, clear, and encouraging. Return ONLY the markdown.
        `;

        const result = await model.generateContent([
            {
                inlineData: {
                    data: base64Data,
                    mimeType: "application/pdf"
                }
            },
            prompt
        ]);

        const summary = result.response.text();
        return NextResponse.json({ summary });

    } catch (error) {
        console.error('PDF Summarization Error:', error);

        // Graceful handling of Gemini API 429 Quota Exceeded error
        if (error.message && (error.message.includes('429') || error.message.includes('quota'))) {
            return NextResponse.json({ 
                summary: `# 📋 Question Paper Analysis: AI Limits Active\n\n### ⚠️ Live AI Connection Rate-Limited\nThe server is experiencing very high academic traffic, and the **Gemini AI Free-Tier daily limit** has been temporarily exceeded.\n\n### 💡 Smart Offline Solution\nWe pre-computed and cached verified, high-quality question paper summaries for this course in the local database to save the day!\n\n*   **To study predicted high-frequency questions:** Go to the **📚 AI Study Guide** tab, select **1st Year** -> **Computer** -> **Basic Electrical Engineering**, and click **Generate AI Master Plan** to instantly view 100% pre-computed questions and complete textbook derivations without requiring live AI connections!\n*   **Alternative:** Please try uploading this paper again in a few minutes once the API rate limits reset.` 
            });
        }

        return NextResponse.json({ error: 'Failed to process and analyze the PDF. Make sure it is a valid document and does not exceed file size limits.' }, { status: 500 });
    }
}
