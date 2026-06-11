import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';




// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export const handlePost_paperanalysischat = async (request) => {
    try {
        let systemInstruction = '';
        let messages = [];
        let paperSummary = '';
        let offlineUserContent = '';

        try {
            if (!process.env.GEMINI_API_KEY) {
                return NextResponse.json({ error: 'AI integration is not configured correctly on the server.' }, { status: 500 });
            }

            const body = await req.json();
            messages = body.messages || [];
            paperSummary = body.paperSummary || 'No paper summary context loaded.';
            const subjectName = body.subjectName || '';

            // --- INJECT OFFLINE PYQ DATABASE & SYLLABUS CONTEXT ---
            let dbContext = '';
            let syllabusContext = '';
            try {
                const fs = require('fs');
                const path = require('path');
                const dbPath = path.join(process.cwd(), 'public', 'data', 'pyq_index.json');
                const syllabusPath = path.join(process.cwd(), 'public', 'data', 'sppu_syllabus.json');
                
                let pyqDb = {};
                let syllabusDb = {};
                
                if (fs.existsSync(dbPath)) {
                    pyqDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
                }
                if (fs.existsSync(syllabusPath)) {
                    syllabusDb = JSON.parse(fs.readFileSync(syllabusPath, 'utf8'));
                }
                
                let matchedKey = null;
                const searchName = subjectName.toLowerCase().replace(/[^a-z0-9]/g, ' ');
                const checkKeys = Object.keys(pyqDb).length > 0 ? Object.keys(pyqDb) : Object.keys(syllabusDb);
                
                for (const dbSubj of checkKeys) {
                    const cleanDb = dbSubj.toLowerCase();
                    let isMatch = false;
                    
                    // Direct or containment matches
                    if (searchName.includes(cleanDb) || cleanDb.includes(searchName)) {
                        isMatch = true;
                    } 
                    // BEE (Basic Electrical Engineering) matches
                    else if (cleanDb === 'bee' && (
                        searchName.includes('bee') || 
                        searchName.includes('electrical') || 
                        searchName.includes('basic electrical') ||
                        searchName.includes('elec')
                    )) {
                        isMatch = true;
                    }
                    // Engineering Physics matches
                    else if (cleanDb === 'engineering physics' && (
                        searchName.includes('physics') || 
                        searchName.includes('phy') ||
                        searchName.includes('ep')
                    )) {
                        isMatch = true;
                    }
                    // Engineering Chemistry matches
                    else if (cleanDb === 'engineering chemistry' && (
                        searchName.includes('chemistry') || 
                        searchName.includes('chem') ||
                        searchName.includes('ec')
                    )) {
                        isMatch = true;
                    }
                    // Engineering Mathematics 1 matches
                    else if (cleanDb === 'engineering mathematics 1' && (
                        searchName.includes('math 1') || 
                        searchName.includes('maths 1') || 
                        searchName.includes('mathematics 1') ||
                        searchName.includes('math1') ||
                        searchName.includes('maths1') ||
                        searchName.includes('m1') ||
                        searchName.includes('m 1') ||
                        searchName.includes('mathematics i')
                    )) {
                        isMatch = true;
                    }
                    // Engineering Mathematics 2 matches
                    else if (cleanDb === 'engineering mathematics 2' && (
                        searchName.includes('math 2') || 
                        searchName.includes('maths 2') || 
                        searchName.includes('mathematics 2') ||
                        searchName.includes('math2') ||
                        searchName.includes('maths2') ||
                        searchName.includes('m2') ||
                        searchName.includes('m 2') ||
                        searchName.includes('mathematics ii')
                    )) {
                        isMatch = true;
                    }
                    // Engineering Mechanics matches
                    else if (cleanDb === 'engineering mechanics' && (
                        searchName.includes('mechanics') || 
                        searchName.includes('mech') ||
                        searchName.includes('em')
                    )) {
                        isMatch = true;
                    }
                    // Engineering Graphics matches
                    else if (cleanDb === 'engineering graphics' && (
                        searchName.includes('graphics') || 
                        searchName.includes('drawing') ||
                        searchName.includes('eg') ||
                        searchName.includes('graphics design')
                    )) {
                        isMatch = true;
                    }
                    // Electronics matches
                    else if (cleanDb === 'electronics' && (
                        searchName.includes('electronics') || 
                        searchName.includes('bxe') || 
                        searchName.includes('electronic')
                    )) {
                        isMatch = true;
                    }
                    // PPS matches
                    else if (cleanDb === 'pps' && (
                        searchName.includes('pps') || 
                        searchName.includes('programming') || 
                        searchName.includes('python') || 
                        searchName.includes('solving')
                    )) {
                        isMatch = true;
                    }

                    if (isMatch) {
                        matchedKey = dbSubj;
                        break;
                    }
                }

                if (matchedKey) {
                    const matchedSubjectData = pyqDb[matchedKey];
                    if (matchedSubjectData && matchedSubjectData.questions) {
                        dbContext = `\n---
🎓 **OFFLINE DATABASE CONTEXT (CRITICAL PRIORITY FOR GENERAL TOPIC/PREDICTION INQUIRIES)** 🎓
You have direct access to the university's offline PYQ database for this subject!
When the user asks for "predicted questions", "important derivations", or "frequency of questions", you MUST pull from this list below! Provide the full question, its frequency, and the official answer derivation.
Here are the highest-yield recurring questions for this subject:\n`;
                        
                        matchedSubjectData.questions.forEach((q, idx) => {
                            dbContext += `\n**Q${idx+1} (Frequency: ${q.frequency} times, Unit: ${q.unit}):** ${q.q}\n**Official Answer/Derivation:**\n${q.idealAnswer}\n`;
                            
                            offlineUserContent += `\n### 📌 Question ${idx+1} (Repeated ${q.frequency} times, ${q.unit})\n**${q.q}**\n\n**Official Solution:**\n${q.idealAnswer}\n\n---\n`;
                        });
                        dbContext += `---\n`;
                    }
                    
                    const matchedSyllabus = syllabusDb[matchedKey];
                    if (matchedSyllabus && matchedSyllabus.units) {
                        syllabusContext = `\n---
📚 **OFFICIAL UNIVERSITY SYLLABUS CONTEXT (STRICT AND ABSOLUTE SCOPE LIMITS)** 📚
This is the ONLY official university syllabus structure for the subject: ${matchedSyllabus.subject} (${matchedSyllabus.code}).
You MUST strictly confine your explanations, answers, and formulas to the topics listed within these units.
Do NOT mix in topics, formulas, or concepts from other First Year subjects (e.g. NEVER mix Basic Electrical Engineering (BEE) with Engineering Physics, or vice versa)! Keep their respective boundaries completely solid!

Here is the exact units and topics breakdown:\n`;
                        matchedSyllabus.units.forEach((u) => {
                            syllabusContext += `\n**${u.unit}: ${u.title}**\n*Topics included:* ${u.topics}\n`;
                        });
                        syllabusContext += `---\n`;
                    }
                }
            } catch (dbErr) {
                console.warn('[Paper Analysis Chat] Could not inject offline database & syllabus:', dbErr.message);
            }
            // ------------------------------------------

            systemInstruction = `
You are an elite academic professor analyzing a specific question paper for the subject: ${subjectName || 'Engineering'}.
The user will ask you questions about the paper, or ask you to solve specific questions from it.

CRITICAL INSTRUCTION FOR CONTEXT DIVISION:
There are THREE distinct sources of information and instructions in your context:
1. The **Actual Question Paper PDF** attached to the chat (also summarized below as "Strategic Summary"). This represents the specific exam paper currently active (e.g. October 2022).
2. The **Official University Syllabus** (labeled 'OFFICIAL UNIVERSITY SYLLABUS CONTEXT'). This dictates the exact academic boundaries of this course. You MUST strictly adhere to this subject's scope and never merge or confuse it with any other engineering subjects (e.g., NEVER include quantum mechanics, photonics, or optics in a Basic Electrical Engineering answer!). Keep the subject scope completely pure.
3. The **Offline predicted question database** (labeled 'OFFLINE DATABASE CONTEXT'). This is a pre-compiled list of historical high-frequency questions and their ideal derivations for this subject.

How to handle student queries:
- If the student asks to 'solve the first question', 'explain Q3', or any question referring to a specific item from the *active exam paper*, you MUST look strictly at the attached PDF/Strategic Summary of that specific paper and solve *that paper's* question. DO NOT solve the question with that index from the Offline Database.
- If the student asks for 'predicted questions', 'important derivations', 'recurring questions', or 'highly repeated questions', you MUST answer from the Offline Database (drawing from the frequencies and ideal derivations provided).

Below is the strategic summary of the active paper, the official syllabus boundaries, and the offline predicted context:
---
${paperSummary}
${syllabusContext}
${dbContext}
---

Your response MUST be extremely accurate, beautifully formatted in Markdown, and use step-by-step logic for any numericals. Do NOT hallucinate equations or solutions. If the question requires a diagram, use bold text to describe what the diagram should look like.

*CRITICAL MATH FORMATTING INSTRUCTION FOR FORMULAS AND DERIVATIONS*:
Do NOT use LaTeX, dollar signs ($ or $$), or LaTeX-style math operators (like \\frac, \\Phi, \\implies, \\left, \\right, \\theta, \\approx, etc.) under any circumstances.
Instead, write all formulas, equations, and derivations in a clean, plain-text textbook format using standard keyboard characters and readable Unicode mathematical symbols:
- Use Greek letters directly: e.g., Φ for flux, θ for angle, μ for permeability, Ω for Ohm, π for pi, Δ for delta, η for efficiency.
- Use simple keyboard notation: e.g., use '/' for fractions (e.g., (N * Φ) / I or 1/2), '^' or superscript characters for exponents (e.g., I² or I^2, t² or t^2), '*' for multiplication, and normal parentheses '()' for grouping.
- Use plain English arrow words: e.g., '=>' or 'leads to' or 'implies' instead of LaTeX arrows.
Ensure every equation, step, and derivation is perfectly human-readable in plain standard Markdown.
`;

            const model = genAI.getGenerativeModel({
                model: "gemini-2.5-flash",
                systemInstruction
            });

            const rawHistory = messages.slice(0, -1);
            const formattedHistory = [];
            let foundFirstUser = false;
            
            for (const msg of rawHistory) {
                const role = msg.role === 'user' ? 'user' : 'model';
                if (!foundFirstUser && role === 'model') continue;
                foundFirstUser = true;
                formattedHistory.push({ role, parts: [{ text: msg.content }] });
            }

            const chat = model.startChat({
                history: formattedHistory,
                generationConfig: { maxOutputTokens: 2500 }
            });

            const lastMessageText = messages[messages.length - 1].content;
            let lastMessageParts = [{ text: lastMessageText }];

            let pdfPath = body.pdfPath || null;
            if (pdfPath) {
                if (!pdfPath.toLowerCase().endsWith('.pdf')) {
                    pdfPath = pdfPath + '.pdf';
                }
                try {
                    const fs = require('fs');
                    const path = require('path');
                    let safePath = path.join(process.cwd(), 'public', 'pyqs', pdfPath.replace(/\.\./g, ''));
                    if (!fs.existsSync(safePath)) {
                        safePath = path.join(process.cwd(), 'pyqs', pdfPath.replace(/\.\./g, ''));
                    }
                    if (fs.existsSync(safePath)) {
                        const buffer = fs.readFileSync(safePath);
                        const base64Data = buffer.toString('base64');
                        lastMessageParts.unshift({
                            inlineData: {
                                data: base64Data,
                                mimeType: "application/pdf"
                            }
                        });
                    }
                } catch (err) {
                    console.warn('[API] Could not attach raw PDF to chat context:', err);
                }
            }

            const result = await chat.sendMessage(lastMessageParts);
            const text = result.response.text();

            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(text));
                    controller.close();
                }
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-cache',
                }
            });

        } catch (error) {
            console.error('Paper Analysis Chat Error:', error);

            // --- GROK FALLBACK CHAT ---
            if (process.env.GROK_API_KEY) {
                console.log('[Paper Analysis Chat] Attempting Grok Fallback...');
                try {
                    const grokMessages = [
                        { 
                            role: 'system', 
                            content: `${systemInstruction}\n\nNOTE: You are currently running on a Grok fallback engine because the primary Gemini API has hit its free-tier rate limits. Let the student know playfully in your response that you booted up your Grok backup reactor to answer them, and resolve their question perfectly!` 
                        }
                    ];
                    
                    for (const msg of messages) {
                        grokMessages.push({
                            role: msg.role === 'user' ? 'user' : 'assistant',
                            content: msg.content
                        });
                    }

                    const grokResponse = await fetch('https://api.x.ai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${process.env.GROK_API_KEY}`
                        },
                        body: JSON.stringify({
                            model: 'grok-beta',
                            messages: grokMessages,
                            temperature: 0.7
                        })
                    });

                    if (grokResponse.ok) {
                        const grokData = await grokResponse.json();
                        const grokText = grokData.choices[0].message.content;
                        
                        const stream = new ReadableStream({
                            start(controller) {
                                controller.enqueue(new TextEncoder().encode(grokText));
                                controller.close();
                            }
                        });

                        return new Response(stream, {
                            headers: {
                                'Content-Type': 'text/plain; charset=utf-8',
                                'Cache-Control': 'no-cache',
                            }
                        });
                    }
                } catch (grokErr) {
                    console.error('[Paper Analysis Chat] Error in Grok Fallback:', grokErr.message);
                }
            }

            // ULTIMATE FALLBACK
            let fallbackText = "### ⚠️ Live AI Connection Rate-Limited\n\nI apologize, but both our primary Gemini engine and backup Grok reactor are currently experiencing heavy traffic.\n\n";
            if (offlineUserContent) {
                fallbackText += "### 💡 Smart Offline Mode Activated!\nI have successfully loaded the **100% verified predicted questions** directly from our offline university database for you. Here is everything you need to study right now:\n\n" + offlineUserContent;
            } else {
                fallbackText += "However, you can still study the **Predicted Questions** from the offline database! Please try sending your message again in a few minutes.";
            }
            
            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(fallbackText));
                    controller.close();
                }
            });

            return new Response(stream, {
                headers: {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'Cache-Control': 'no-cache',
                }
            });
        }
    } catch (globalError) {
        console.error("FATAL UNHANDLED ERROR IN POST:", globalError);
        return NextResponse.json({ error: globalError.message || 'Unknown Server Error', stack: globalError.stack }, { status: 500 });
    }
}
