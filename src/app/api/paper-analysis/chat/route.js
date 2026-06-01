import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req) {
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

            // --- INJECT OFFLINE PYQ DATABASE CONTEXT ---
            let dbContext = '';
            try {
                const fs = require('fs');
                const path = require('path');
                const dbPath = path.join(process.cwd(), 'public', 'data', 'pyq_index.json');
                if (fs.existsSync(dbPath)) {
                    const pyqDb = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
                    let matchedSubjectData = null;
                    const searchName = subjectName.toLowerCase();
                    
                    for (const [dbSubj, data] of Object.entries(pyqDb)) {
                        const cleanDb = dbSubj.toLowerCase();
                        if (searchName.includes(cleanDb) || cleanDb.includes(searchName) ||
                            (cleanDb === 'bee' && searchName.includes('electrical')) ||
                            (cleanDb === 'maths 1' && searchName.includes('mathematics i')) ||
                            (cleanDb === 'maths 2' && searchName.includes('mathematics ii')) ||
                            (cleanDb === 'engineering mechanics' && searchName.includes('mechanics')) ||
                            (cleanDb === 'engineering physics' && searchName.includes('physics'))) {
                            matchedSubjectData = data;
                            break;
                        }
                    }

                    if (matchedSubjectData && matchedSubjectData.questions) {
                        dbContext = `\n---
🎓 **OFFLINE DATABASE CONTEXT (CRITICAL PRIORITY)** 🎓
You have direct access to the university's offline PYQ database for this subject!
When the user asks for "predicted questions", "important derivations", or "frequency of questions", you MUST pull from this list below! Provide the full question, its frequency, and the official answer derivation.
Here are the highest-yield recurring questions for this subject:\n`;
                        
                        matchedSubjectData.questions.forEach((q, idx) => {
                            dbContext += `\n**Q${idx+1} (Frequency: ${q.frequency} times, Unit: ${q.unit}):** ${q.q}\n**Official Answer/Derivation:**\n${q.idealAnswer}\n`;
                            
                            offlineUserContent += `\n### 📌 Question ${idx+1} (Repeated ${q.frequency} times, ${q.unit})\n**${q.q}**\n\n**Official Solution:**\n${q.idealAnswer}\n\n---\n`;
                        });
                        dbContext += `---\n`;
                    }
                }
            } catch (dbErr) {
                console.warn('[Paper Analysis Chat] Could not inject offline database:', dbErr.message);
            }
            // ------------------------------------------

            systemInstruction = `
You are an elite academic professor analyzing a specific question paper for the subject: ${subjectName || 'Engineering'}.
The user will ask you questions about the paper, or ask you to solve specific questions from it.

Below is the strategic summary of the paper and important offline predicted context you must use:
---
${paperSummary}
${dbContext}
---

Your response MUST be extremely accurate, beautifully formatted in Markdown, and use step-by-step logic for any numericals. Do NOT hallucinate equations. If the question requires a diagram, use bold text to describe what the diagram should look like.
`;

            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
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

            const pdfPath = body.pdfPath || null;
            if (pdfPath) {
                try {
                    const fs = require('fs');
                    const path = require('path');
                    const safePath = path.join(process.cwd(), 'public', 'pyqs', pdfPath.replace(/\.\./g, ''));
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
