import { Expo } from "expo-server-sdk";

import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';
import { db } from '@/database/config/firebase';
import { adminDb } from '@/database/config/firebaseAdmin';
import { collection, getDocs } from 'firebase/firestore';





// genAI is initialized lazily inside each route handler

export const handlePost_generatemcq = async (req) => {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }

        const body = await req.json();
        const { topic, subject, difficulty, count } = body;

        if (!topic || !count) {
            return NextResponse.json({ error: 'Missing topic or count' }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        // We use gemini-1.5-pro or flash with responseSchema to guarantee JSON output
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.ARRAY,
                    description: "A list of multiple choice questions",
                    items: {
                        type: SchemaType.OBJECT,
                        properties: {
                            question: {
                                type: SchemaType.STRING,
                                description: "The multiple choice question text",
                            },
                            options: {
                                type: SchemaType.ARRAY,
                                items: { type: SchemaType.STRING },
                                description: "Exactly 4 options for the answer",
                            },
                            correctIndex: {
                                type: SchemaType.INTEGER,
                                description: "The index (0-3) of the correct option in the options array",
                            },
                        },
                        required: ["question", "options", "correctIndex"],
                    },
                },
            }
        });

        const prompt = `Generate exactly ${count} multiple-choice questions for the subject "${subject}" specifically on the topic of "${topic}". The difficulty level should be ${difficulty || 'medium'}. Ensure each question has exactly 4 options.`;

        const result = await model.generateContent(prompt);
        const responseText = result.response.text();
        const questions = JSON.parse(responseText);

        return NextResponse.json({ questions });

    } catch (error) {
        console.error('Gemini MCQ Gen Error:', error);
        return NextResponse.json({ error: 'Failed to generate MCQs: ' + error.message }, { status: 500 });
    }
}






// (genAI initialized lazily in handlers)

function findLocalSubject(requestedSubject) {
    const query = requestedSubject.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (query.includes('electrical') || query === 'bee' || query === 'basicelectricalengineering') return 'BEE';
    if (query.includes('physics') || query === 'ep' || query === 'engineeringphysics') return 'Engineering Physics';
    if (query.includes('chemistry') || query === 'ec' || query === 'engineeringchemistry') return 'Engineering Chemistry';
    if (
        query.includes('math1') || 
        query.includes('maths1') || 
        query.includes('mathematics1') || 
        query === 'm1' || 
        query === 'mathi' || 
        query === 'mathsi' || 
        query === 'mathematicsi'
    ) return 'Engineering Mathematics 1';
    if (
        query.includes('math2') || 
        query.includes('maths2') || 
        query.includes('mathematics2') || 
        query === 'm2' || 
        query === 'mathii' || 
        query === 'mathsii' || 
        query === 'mathematicsii'
    ) return 'Engineering Mathematics 2';
    if (query.includes('mechanics') || query === 'em' || query === 'engineeringmechanics') return 'Engineering Mechanics';
    if (query.includes('electronics') || query === 'bxe' || query === 'bx' || query === 'basicelectronicsengineering') return 'Electronics';
    if (query.includes('pps') || query.includes('programming') || query.includes('python')) return 'PPS';
    if (query.includes('graphics') || query.includes('drawing') || query === 'eg' || query === 'engineeringgraphics') return 'Engineering Graphics';
    
    return null;
}

export const handlePost_generatestudyguide = async (req) => {
    let year, branch, subject;
    try {
        const body = await req.json();
        ({ year, branch, subject } = body);

        if (!subject || !branch || !year) {
            return NextResponse.json({ error: 'Missing required fields: year, branch, or subject.' }, { status: 400 });
        }

        // 1. Check local offline index first
        const localSubjectKey = findLocalSubject(subject);
        if (localSubjectKey) {
            const indexPath = path.join(process.cwd(), 'public', 'data', 'pyq_index.json');
            if (fs.existsSync(indexPath)) {
                try {
                    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
                    if (indexData[localSubjectKey]) {
                        console.log(`[API] Serving pre-computed PYQ data for: ${localSubjectKey}`);
                        return NextResponse.json(indexData[localSubjectKey]);
                    }
                } catch (jsonErr) {
                    console.error('Error reading/parsing local PYQ index:', jsonErr);
                }
            }
        }

        // 2. Fallback to live Gemini API if not available in the local offline database
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not defined in environment variables.');
            return NextResponse.json({ error: 'AI integration is not configured correctly on the server.' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
        });

        const prompt = `
        You are an elite academic professor building a study guide for computer science and engineering students.
        The target demographic is a ${year} student studying ${branch} engineering.
        The subject they need to prepare for is: ${subject}.

        Generate a strict JSON structure containing "summaries", "questions", and "flashcards".
        
        Requirements:
        1. "summaries" must be an array of exactly 5 items (Unit 1 through Unit 5).
        2. Each unit must have a "unit" string (e.g., "Unit 1"), a concise "title" string, and an array of 4 to 6 "points" (bullet points mapping out the most critical sub-topics).
        3. "questions" must be an array of 8 to 10 highly frequent, important exam questions across the units. You MUST consider common Previous Year Question (PYQ) patterns for this subject to predict what will be asked.
        4. Each question must have a "q" string (the actual question) and a "marks" string (e.g., "5 marks" or "10 marks").
        5. "flashcards" must be an array of 10 key terms and definitions for rapid review. Each must have a "term" string and a "definition" string.

        Return ONLY raw JSON. Do not include markdown blocks like \`\`\`json.
        Example Format:
        {
            "summaries": [
                { "unit": "Unit 1", "title": "Introduction", "points": ["Concept A", "Concept B"] }
            ],
            "questions": [
                { "q": "Explain Concept A?", "marks": "10 marks" }
            ],
            "flashcards": [
                { "term": "Concept A", "definition": "A foundational theory..." }
            ]
        }
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        let text = response.text();
        
        // Strip markdown backticks if Gemini includes them
        if (text.startsWith('\`\`\`json')) {
            text = text.substring(7);
        }
        if (text.endsWith('\`\`\`')) {
            text = text.substring(0, text.length - 3);
        }
        if (text.startsWith('\`\`\`')) {
            text = text.substring(3);
        }

        const parsedJson = JSON.parse(text.trim());

        // Validate structure safely
        if (!parsedJson.summaries || !parsedJson.questions) {
            throw new Error('AI returned an invalid JSON schema structure.');
        }

        return NextResponse.json(parsedJson);

    } catch (error) {
        console.error('Gemini Generation Error:', error);

        // --- GROK FALLBACK ---
        if (process.env.GROK_API_KEY) {
            console.log('[API] Attempting Grok Fallback for Study Guide Generation...');
            try {
                const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${process.env.GROK_API_KEY}`
                    },
                    body: JSON.stringify({
                        model: 'grok-beta',
                        messages: [
                            { 
                                role: 'system', 
                                content: 'You are an elite academic professor building a study guide for computer science and engineering students. Return ONLY raw JSON matching the requested structure.' 
                            },
                            { 
                                role: 'user', 
                                content: `The target demographic is a ${year} student studying ${branch} engineering.
                                The subject they need to prepare for is: ${subject}.
                        
                                Generate a strict JSON structure containing "summaries", "questions", and "flashcards".
                                
                                Requirements:
                                1. "summaries" must be an array of exactly 5 items (Unit 1 through Unit 5).
                                2. Each unit must have a "unit" string (e.g., "Unit 1"), a concise "title" string, and an array of 4 to 6 "points" (bullet points mapping out the most critical sub-topics).
                                3. "questions" must be an array of 8 to 10 highly frequent, important exam questions across the units. You MUST consider common Previous Year Question (PYQ) patterns for this subject to predict what will be asked.
                                4. Each question must have a "q" string (the actual question) and a "marks" string (e.g., "5 marks" or "10 marks").
                                5. "flashcards" must be an array of 10 key terms and definitions for rapid review. Each must have a "term" string and a "definition" string.
                        
                                Return ONLY raw JSON. Do not include markdown blocks like \`\`\`json.
                                Example Format:
                                {
                                    "summaries": [
                                        { "unit": "Unit 1", "title": "Introduction", "points": ["Concept A", "Concept B"] }
                                    ],
                                    "questions": [
                                        { "q": "Explain Concept A?", "marks": "10 marks" }
                                    ],
                                    "flashcards": [
                                        { "term": "Concept A", "definition": "A foundational theory..." }
                                    ]
                                }` 
                            }
                        ],
                        temperature: 0.1
                    })
                });

                if (grokResponse.ok) {
                    const grokData = await grokResponse.json();
                    let grokText = grokData.choices[0].message.content;
                    
                    // Strip markdown backticks if Grok includes them
                    if (grokText.startsWith('```json')) {
                        grokText = grokText.substring(7);
                    }
                    if (grokText.endsWith('```')) {
                        grokText = grokText.substring(0, grokText.length - 3);
                    }
                    if (grokText.startsWith('```')) {
                        grokText = grokText.substring(3);
                    }
                    
                    const parsedGrokJson = JSON.parse(grokText.trim());
                    if (parsedGrokJson.summaries && parsedGrokJson.questions) {
                        console.log('✅ Grok Fallback Successful for Study Guide!');
                        return NextResponse.json(parsedGrokJson);
                    }
                } else {
                    console.error('[API] Grok Fallback response not ok:', grokResponse.statusText);
                }
            } catch (grokErr) {
                console.error('[API] Error in Grok Fallback:', grokErr);
            }
        }
        // ---------------------

        return NextResponse.json({ error: 'Failed to generate plan. Please try again or check the AI key limits.' }, { status: 500 });
    }
}







var expo = new Expo();

export const handlePost_notificationsgenerateandsend = async (req) => {
  try {
    const { contentType, contentTitle, contentDetails, contentId } = await req.json();

    if (!contentType || !contentTitle) {
      return NextResponse.json({ error: 'Missing content information' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
        console.error("Gemini API key is not configured");
        return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    // 1. Generate Notification using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = `
      You are an expert mobile app marketing copywriter. We just approved a new piece of content on our college platform.
      Write a short, extremely engaging push notification title and body to alert students.
      
      Content Type: ${contentType}
      Title: ${contentTitle}
      Details: ${contentDetails || 'None'}
      
      Rules:
      - Title must be under 40 characters and include an emoji.
      - Body must be under 80 characters.
      - Make it sound exciting, helpful, or urgent depending on the context.
      - Do not include hashtags.
      - Output ONLY a valid JSON object in this format, nothing else (no markdown blocks):
      {
        "title": "...",
        "body": "..."
      }
    `;

    const result = await model.generateContent(prompt);
    let responseText = result.response.text().trim();
    
    // Clean up potential markdown formatting
    if (responseText.startsWith('```json')) {
        responseText = responseText.substring(7);
        if (responseText.endsWith('```')) {
            responseText = responseText.substring(0, responseText.length - 3);
        }
    } else if (responseText.startsWith('```')) {
        responseText = responseText.substring(3);
        if (responseText.endsWith('```')) {
            responseText = responseText.substring(0, responseText.length - 3);
        }
    }
    
    let generatedPush;
    try {
        generatedPush = JSON.parse(responseText.trim());
    } catch (e) {
        console.error("Failed to parse Gemini output:", responseText);
        // Fallback
        generatedPush = {
            title: `📢 New ${contentType} Added`,
            body: contentTitle.substring(0, 80)
        };
    }

    // 2. Fetch all users from Firestore using Admin SDK for high performance
    const usersSnap = await adminDb.collection('users').get();
    const pushTokens = [];
    
    usersSnap.forEach((doc) => {
      const userData = doc.data();
      if (userData.expoPushToken && Expo.isExpoPushToken(userData.expoPushToken)) {
        pushTokens.push(userData.expoPushToken);
      }
    });

    if (pushTokens.length === 0) {
      return NextResponse.json({ message: 'No devices registered for push notifications.', generatedPush });
    }

    const targetRoute = contentType === 'Campus Notice'
        ? '/news'
        : (contentType === 'PYQ' ? '/pyqs' : `/file-detail/${contentId || ''}`);

    // 3. Construct the messages
    const messages = [];
    for (let pushToken of pushTokens) {
      messages.push({
        to: pushToken,
        sound: 'default',
        title: generatedPush.title,
        body: generatedPush.body,
        data: { contentType, contentTitle, contentId: contentId || '', targetRoute },
      });
    }

    // 4. Chunk and send the messages in parallel to avoid blocking
    const chunks = expo.chunkPushNotifications(messages);
    const results = await Promise.all(
      chunks.map(async (chunk) => {
        try {
          return await expo.sendPushNotificationsAsync(chunk);
        } catch (error) {
          console.error('Error sending push chunk:', error);
          return [];
        }
      })
    );
    const tickets = results.flat();

    // Save to Firestore notifications collection
    try {
        await adminDb.collection('notifications').add({
            title: generatedPush.title,
            body: generatedPush.body,
            type: contentType === 'Campus Notice' ? 'news' : 'update',
            targetRoute,
            contentId: contentId || '',
            recipientId: 'global',
            timestamp: new Date()
        });
    } catch (dbErr) {
        console.error('Failed to save notification to Firestore:', dbErr);
    }

    return NextResponse.json({ 
        success: true, 
        sentCount: messages.length, 
        generatedNotification: generatedPush,
        tickets 
    });
  } catch (error) {
    console.error('AI Push notification error:', error);
    return NextResponse.json({ error: 'Failed to generate and send notifications' }, { status: 500 });
  }
}







// (genAI initialized lazily in handlers)

var SUBJECT_MAP = {
    'bee': 'Basic Electrical Engineering',
    'physics': 'Engineering Physics',
    'chemistry': 'Engineering Chemistry',
    'maths1': 'Engineering Mathematics I',
    'maths2': 'Engineering Mathematics II',
    'engineering-mechanics': 'Engineering Mechanics',
    'electronics': 'Basic Electronics Engineering',
    'pps': 'Programming & Problem Solving',
    'engineering-graphics': 'Engineering Graphics'
};

export const handlePost_summarizepdf = async (req) => {
    let pdfPath = null;
    try {
        let base64Data;
        let fileName = 'unknown.pdf';
        let cacheSearchName = '';
        let pdfPathForResponse = null;

        // Determine the input source: JSON body (library path) or FormData (file upload)
        const contentType = req.headers.get('content-type') || '';
        
        if (contentType.includes('application/json')) {
            // ── Library Selection Mode: Read PDF from local filesystem ──
            const body = await req.json();
            pdfPath = body.pdfPath;
            
            if (!pdfPath) {
                return NextResponse.json({ error: 'No pdfPath provided.' }, { status: 400 });
            }

            const cleanPdfPath = pdfPath.replace(/\.\./g, '');
            const uploadsDir = getUploadsDir();

            let safePath = path.join(uploadsDir, cleanPdfPath);
            if (!fs.existsSync(safePath)) {
                safePath = path.join(process.cwd(), 'public', cleanPdfPath);
            }
            if (!fs.existsSync(safePath)) {
                safePath = path.join(process.cwd(), cleanPdfPath);
            }

            // Security: only allow paths inside pyqs or uploadsDir
            let pyqsRoot = path.join(process.cwd(), 'public', 'pyqs');
            if (!fs.existsSync(pyqsRoot)) pyqsRoot = path.join(process.cwd(), 'pyqs');

            if (!safePath.startsWith(pyqsRoot) && !safePath.startsWith(uploadsDir)) {
                return NextResponse.json({ error: 'Invalid file path.' }, { status: 400 });
            }

            if (!fs.existsSync(safePath)) {
                return NextResponse.json({ error: `Paper not found at path: ${pdfPath}` }, { status: 404 });
            }

            const buffer = fs.readFileSync(safePath);
            base64Data = buffer.toString('base64');
            fileName = path.basename(safePath);
            cacheSearchName = pdfPath.replace('pyqs/', '').replace('.pdf', '').replace(/\//g, '/');
            pdfPathForResponse = pdfPath.replace('pyqs/', '');
            
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
            
            // Save the uploaded PDF to uploads so the chat API can access it
            let uploadsDir = path.join(process.cwd(), 'public', 'pyqs', 'uploads');
            if (!fs.existsSync(path.join(process.cwd(), 'public', 'pyqs')) && fs.existsSync(path.join(process.cwd(), 'pyqs'))) {
                uploadsDir = path.join(process.cwd(), 'pyqs', 'uploads');
            }
            if (!fs.existsSync(uploadsDir)) {
                fs.mkdirSync(uploadsDir, { recursive: true });
            }
            const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const tempFileName = `temp-${Date.now()}-${cleanName}`;
            const tempFilePath = path.join(uploadsDir, tempFileName);
            fs.writeFileSync(tempFilePath, buffer);
            
            pdfPathForResponse = `uploads/${tempFileName}`;
            base64Data = buffer.toString('base64');
            fileName = file.name;
            cacheSearchName = file.name.toLowerCase();

            console.log(`[API] Processing uploaded PDF: ${file.name} (${buffer.length} bytes), saved to ${pdfPathForResponse}`);
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
                    return NextResponse.json({ summary: cachedSummaries[bestCacheKey], pdfPath: bestCacheKey });
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

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
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
        return NextResponse.json({ summary, pdfPath: pdfPathForResponse });

    } catch (error) {
        console.error('PDF Summarization Error:', error);

        // Graceful handling of Gemini API 429 Quota Exceeded error
        if (error.message && (error.message.includes('429') || error.message.includes('quota'))) {
            let subjectName = "Basic Electrical Engineering";
            let subjectFolder = "bee";
            if (pdfPath) {
                const parts = pdfPath.split('/');
                // pdfPath is e.g. "pyqs/engineering-mechanics/Oct_2022.pdf"
                // Or "bee/Nov_Dec_2025"
                const folder = parts.find(p => SUBJECT_MAP[p.toLowerCase()]);
                if (folder && SUBJECT_MAP[folder.toLowerCase()]) {
                    subjectName = SUBJECT_MAP[folder.toLowerCase()];
                    subjectFolder = folder.toLowerCase();
                }
            }
            
            return NextResponse.json({ 
                summary: `# 📋 Question Paper Analysis: AI Limits Active\n\n### ⚠️ Live AI Connection Rate-Limited\nThe server is experiencing very high academic traffic, and the **Gemini AI Free-Tier daily limit** has been temporarily exceeded.\n\n### 💡 Smart Offline Solution\nWe pre-computed and cached verified, high-quality question paper summaries for this course in the local database to save the day!\n\n*   **To study predicted high-frequency questions:** Go to the **📚 AI Study Guide** tab, select **1st Year** -> **Computer** -> **${subjectName}**, and click **Generate AI Master Plan** to instantly view 100% pre-computed questions and complete textbook derivations without requiring live AI connections!\n*   **Alternative:** Please try uploading this paper again in a few minutes once the API rate limits reset.` 
            });
        }

        return NextResponse.json({ error: 'Failed to process and analyze the PDF. Make sure it is a valid document and does not exceed file size limits.' }, { status: 500 });
    }
}
