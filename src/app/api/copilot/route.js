import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import fs from 'fs';
import path from 'path';


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ── Tool Declarations ──

const searchPyqDatabaseDeclaration = {
  name: "search_pyq_database",
  description: "Search the local pre-computed PYQ exam prep database for high-probability questions, exact past exam appearance frequencies, syllabus unit summaries, and perfect step-by-step textbook answers. Use this whenever the student asks about PYQ frequencies, predicted questions, what to study for exams, or requests ideal textbook answers for First Year engineering subjects.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      subject: {
        type: SchemaType.STRING,
        description: "The name of the engineering subject. Must be one of: 'BEE', 'Engineering Physics', 'Engineering Chemistry', 'Engineering Mathematics 1', 'Engineering Mathematics 2', 'Engineering Mechanics', 'Electronics', 'PPS', 'Engineering Graphics'."
      }
    },
    required: ["subject"],
  },
};

const summarizeQuestionPaperDeclaration = {
  name: "summarize_question_paper",
  description: "Locate and summarize a specific previous year question paper PDF file stored in the local college database. Use this when the student asks to summarize, analyze, list the questions of, or explain what was asked in a specific past exam paper (e.g. 'Summarize November 2025 BEE paper', 'What was asked in Nov 2024 Physics exam?').",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      subject: {
        type: SchemaType.STRING,
        description: "The name of the engineering subject. Must be one of: 'BEE', 'Engineering Physics', 'Engineering Chemistry', 'Engineering Mathematics 1', 'Engineering Mathematics 2', 'Engineering Mechanics', 'Electronics', 'PPS', 'Engineering Graphics'."
      },
      yearOrSession: {
        type: SchemaType.STRING,
        description: "The year or exam session name requested by the student (e.g., 'Nov Dec 2025', 'May Jun 2025', 'Nov Dec 2024', 'May Jun 2024', 'Oct 2022', 'March 2026')."
      }
    },
    required: ["subject", "yearOrSession"],
  },
};

const searchFilesDeclaration = {
  name: "search_files",
  description: "Search the college database for study materials like notes, previous year questions (PYQs), and assignments. Use this when the student asks for lecture notes, study material, PYQs, assignments, or any downloadable content.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      keyword: {
        type: SchemaType.STRING,
        description: "The main keyword to search for (e.g., 'Superconductor', 'Mathematics', 'Chemistry', 'Physics')."
      },
      fileType: {
        type: SchemaType.STRING,
        description: "The specific type of file requested. Options: 'Notes', 'PYQ', 'Assignment'. Leave empty if unknown."
      }
    },
    required: ["keyword"],
  },
};

const searchNewsDeclaration = {
  name: "search_news",
  description: "Search the latest news and announcements on the college platform. Use this when the student asks about recent news, announcements, events, or what's happening on campus.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      keyword: {
        type: SchemaType.STRING,
        description: "Optional keyword to filter news (e.g., 'exam', 'holiday', 'hackathon'). Leave empty to get the latest news."
      }
    },
    required: [],
  },
};

const searchClubsDeclaration = {
  name: "search_clubs",
  description: "Search for student clubs and organizations on the platform. Use this when the student asks about clubs, societies, extracurriculars, or campus life.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      keyword: {
        type: SchemaType.STRING,
        description: "Optional keyword to filter clubs (e.g., 'coding', 'robotics', 'music'). Leave empty to list all clubs."
      }
    },
    required: [],
  },
};

const searchYoutubeDeclaration = {
  name: "search_youtube",
  description: "Search for curated YouTube video lectures. Use this SPECIFICALLY when the student asks for video lectures, tutorials, or YouTube links for a topic or subject.",
  parameters: {
    type: SchemaType.OBJECT,
    properties: {
      keyword: {
        type: SchemaType.STRING,
        description: "The main keyword or subject to search for (e.g., 'Distributed Systems', 'Physics', 'Mathematics')."
      }
    },
    required: ["keyword"],
  },
};

// ── Tool Executors ──

async function executeSearchPyqDatabase(args) {
    const subject = args.subject;
    const indexPath = path.join(process.cwd(), 'public', 'data', 'pyq_index.json');
    if (!fs.existsSync(indexPath)) {
        return { error: "Local PYQ database is not populated yet." };
    }
    
    try {
        const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
        let matchedKey = null;
        const queryVal = subject.toLowerCase().replace(/[^a-z0-9]/g, '');
        
        if (queryVal.includes('electrical') || queryVal === 'bee') matchedKey = 'BEE';
        else if (queryVal.includes('physics')) matchedKey = 'Engineering Physics';
        else if (queryVal.includes('chemistry')) matchedKey = 'Engineering Chemistry';
        else if (queryVal.includes('math1') || queryVal.includes('maths1') || queryVal.includes('mathematics1')) matchedKey = 'Engineering Mathematics 1';
        else if (queryVal.includes('math2') || queryVal.includes('maths2') || queryVal.includes('mathematics2')) matchedKey = 'Engineering Mathematics 2';
        else if (queryVal.includes('mechanics')) matchedKey = 'Engineering Mechanics';
        else if (queryVal.includes('electronics')) matchedKey = 'Electronics';
        else if (queryVal.includes('pps') || queryVal.includes('programming')) matchedKey = 'PPS';
        else if (queryVal.includes('graphics') || queryVal.includes('drawing')) matchedKey = 'Engineering Graphics';
        
        if (matchedKey && indexData[matchedKey]) {
            console.log(`[Copilot Tool] Retrieved local PYQ data for: ${matchedKey}`);
            return indexData[matchedKey];
        }
        
        return { error: `Subject '${subject}' was not found in the local PYQ database.` };
    } catch (err) {
        console.error('Error reading local PYQ index inside Copilot:', err);
        return { error: 'Failed to read local database.' };
    }
}

async function executeSummarizeQuestionPaper(args) {
    const subject = args.subject;
    const yearOrSession = args.yearOrSession;
    
    // Normalize subject to match folder name
    let subjectDir = 'bee';
    const queryVal = subject.toLowerCase().replace(/[^a-z0-9]/g, '');
    
    if (queryVal.includes('electrical') || queryVal === 'bee') subjectDir = 'bee';
    else if (queryVal.includes('physics')) subjectDir = 'physics';
    else if (queryVal.includes('chemistry')) subjectDir = 'chemistry';
    else if (queryVal.includes('math1') || queryVal.includes('maths1') || queryVal.includes('mathematics1')) subjectDir = 'maths1';
    else if (queryVal.includes('math2') || queryVal.includes('maths2') || queryVal.includes('mathematics2')) subjectDir = 'maths2';
    else if (queryVal.includes('mechanics')) subjectDir = 'engineering-mechanics';
    else if (queryVal.includes('electronics')) subjectDir = 'electronics';
    else if (queryVal.includes('pps') || queryVal.includes('programming')) subjectDir = 'pps';
    else if (queryVal.includes('graphics') || queryVal.includes('drawing')) subjectDir = 'engineering-graphics';
    
    const subjectPath = path.join(process.cwd(), 'public', 'pyqs', subjectDir);
    
    if (!fs.existsSync(subjectPath)) {
        return { error: `Database folder for subject ${subject} does not exist.` };
    }

    // --- STATIC CACHE LOOKUP ---
    try {
        const summariesPath = path.join(process.cwd(), 'public', 'data', 'paper_summaries.json');
        if (fs.existsSync(summariesPath)) {
            const cachedSummaries = JSON.parse(fs.readFileSync(summariesPath, 'utf-8'));
            let bestCacheKey = null;
            const searchStr = yearOrSession.toLowerCase().replace(/[^a-z0-9]/g, '');

            for (const key of Object.keys(cachedSummaries)) {
                const [subj, session] = key.split('/');
                const cleanSubj = subj.toLowerCase();
                const cleanSession = session.toLowerCase().replace(/[^a-z0-9]/g, '');

                if (cleanSubj === subjectDir && (searchStr.includes(cleanSession) || cleanSession.includes(searchStr))) {
                    bestCacheKey = key;
                    break;
                }
            }

            if (bestCacheKey) {
                console.log(`[Copilot Tool] Cache Hit! Serving pre-computed summary for: ${bestCacheKey}`);
                return {
                    paperName: bestCacheKey.replace('_', ' '),
                    summary: cachedSummaries[bestCacheKey]
                };
            }
        }
    } catch (cacheErr) {
        console.warn('[Copilot Tool] Warning checking static summaries cache:', cacheErr.message);
    }
    // ---------------------------
    
    try {
        // List all files in the subject directory
        const files = fs.readdirSync(subjectPath);
        
        // Clean search query to extract terms (e.g. ['nov', 'dec', '2025'])
        const searchTerms = yearOrSession.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).filter(Boolean);
        let bestMatch = null;
        let maxMatchCount = 0;
        
        for (const file of files) {
            if (!file.endsWith('.pdf')) continue;
            const normalizedFile = file.toLowerCase().replace(/[^a-z0-9]/g, '');
            let matchCount = 0;
            
            for (const term of searchTerms) {
                if (normalizedFile.includes(term)) {
                    matchCount++;
                }
            }
            
            if (matchCount > maxMatchCount) {
                maxMatchCount = matchCount;
                bestMatch = file;
            }
        }
        
        // We require at least one match term to prevent random papers
        if (!bestMatch || maxMatchCount === 0) {
            const available = files
                .filter(f => f.endsWith('.pdf'))
                .map(f => f.replace('.pdf', '').replace(/_/g, ' '))
                .slice(0, 8);
            return { 
                error: `Could not find a specific question paper matching '${yearOrSession}' for ${subject}.`,
                suggestion: `You can ask me to summarize one of the available papers in the database: ${available.join(', ')}`
            };
        }
        
        const filePath = path.join(subjectPath, bestMatch);
        console.log(`[Copilot Tool] Found matching exam paper PDF: ${filePath} (matching terms: ${maxMatchCount})`);
        
        const fileBuffer = fs.readFileSync(filePath);
        const base64Data = fileBuffer.toString('base64');
        
        // Use Gemini native Multimodal document understanding
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        
        const prompt = `
        You are an academic college advisor. Summarize the provided engineering question paper PDF file.
        Produce a high-value, organized, and beautifully formatted summary.
        
        Structure your answer as follows:
        - 📄 **Question Paper**: [Clean Subject Name] - [Clean Exam Session/Year, e.g. Nov/Dec 2025]
        - 📊 **Exam Key Metrics**: Total Marks, Duration, and syllabus pattern type.
        - 🔍 **Section-by-Section Summary**: Group by main questions and summarize what they ask (derivations, numericals, definitions).
        - ⚡ **Professor's Focus Advice**: Identify the high-value concepts that appeared here and are likely to repeat.
        
        Return the result in clean markdown.
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
        
        return {
            paperName: bestMatch.replace('.pdf', '').replace(/_/g, ' '),
            summary: result.response.text()
        };
        
    } catch (err) {
        console.error('Error analyzing specific PDF inside Copilot:', err);

        // Graceful fallback for rate limit
        if (err.message && (err.message.includes('429') || err.message.includes('quota'))) {
            return {
                error: "Gemini API rate limit exceeded.",
                summary: `⚠️ **Rate Limit Reached**: The server is experiencing high student traffic. However, I have all the predicted high-probability questions and ideal textbook answers for **${subject}** saved locally in our offline database!\n\nAsk me something like: *"What are the predicted questions for BEE?"* or *"Show me the ideal answer for the EMF Equation"* to study right now without any quota restrictions!`
            };
        }

        return { error: 'Failed to read and analyze the requested question paper PDF.' };
    }
}

async function executeSearchFiles(args) {
    const keyword = args.keyword ? args.keyword.toLowerCase() : '';
    const fileType = args.fileType;
    
    const filesRef = collection(db, 'files');
    let q = query(filesRef, where('status', '==', 'approved'), orderBy('createdAt', 'desc'), limit(50));
    
    if (fileType) {
        q = query(filesRef, where('status', '==', 'approved'), where('type', '==', fileType), orderBy('createdAt', 'desc'), limit(50));
    }

    const snapshot = await getDocs(q);
    let results = [];
    
    snapshot.forEach(doc => {
        const data = doc.data();
        const titleMatch = data.title && data.title.toLowerCase().includes(keyword);
        const subjectMatch = data.subject && data.subject.toLowerCase().includes(keyword);
        
        if (!keyword || titleMatch || subjectMatch) {
            let url = data.fileURL || data.fileUrl;
            let relativePath = '';
            if (url) {
                if (url.includes('/api/downloads/')) relativePath = url.split('/api/downloads/')[1];
                else if (url.includes('/uploads/')) relativePath = url.split('/uploads/')[1];
                else relativePath = url.split('/').pop();
                relativePath = relativePath.split('?')[0];
            }
            
            results.push({
                title: data.title,
                subject: data.subject,
                type: data.type,
                downloadLink: `/api/downloads/${relativePath}`
            });
        }
    });

    return results.slice(0, 5);
}

async function executeSearchNews(args) {
    const keyword = args.keyword ? args.keyword.toLowerCase() : '';
    
    const newsRef = collection(db, 'news');
    const q = query(newsRef, orderBy('timestamp', 'desc'), limit(10));
    const snapshot = await getDocs(q);
    let results = [];
    
    snapshot.forEach(doc => {
        const data = doc.data();
        const titleMatch = data.title && data.title.toLowerCase().includes(keyword);
        const contentMatch = data.content && data.content.toLowerCase().includes(keyword);
        
        if (!keyword || titleMatch || contentMatch) {
            results.push({
                title: data.title,
                content: data.content ? data.content.substring(0, 200) + '...' : '',
                author: data.authorName || 'Admin',
                date: data.timestamp?.toDate?.()?.toLocaleDateString?.() || 'Recent',
                link: '/news'
            });
        }
    });

    return results.slice(0, 5);
}

async function executeSearchClubs(args) {
    const keyword = args.keyword ? args.keyword.toLowerCase() : '';
    
    const clubsRef = collection(db, 'clubs');
    const snapshot = await getDocs(clubsRef);
    let results = [];
    
    snapshot.forEach(doc => {
        const data = doc.data();
        const nameMatch = data.name && data.name.toLowerCase().includes(keyword);
        const descMatch = data.description && data.description.toLowerCase().includes(keyword);
        const categoryMatch = data.category && data.category.toLowerCase().includes(keyword);
        
        if (!keyword || nameMatch || descMatch || categoryMatch) {
            results.push({
                name: data.name,
                description: data.description ? data.description.substring(0, 150) + '...' : '',
                category: data.category || 'General',
                members: data.members?.length || 0,
                link: `/clubs/${doc.id}`
            });
        }
    });

    return results.slice(0, 5);
}

async function executeSearchYoutube(args) {
    const keyword = args.keyword ? args.keyword.toLowerCase() : '';
    
    const ytRef = collection(db, 'youtube_lectures');
    const snapshot = await getDocs(ytRef);
    let results = [];
    
    snapshot.forEach(doc => {
        const data = doc.data();
        const titleMatch = data.title && data.title.toLowerCase().includes(keyword);
        const subjectMatch = data.subject && data.subject.toLowerCase().includes(keyword);
        const unitMatch = data.unit && data.unit.toLowerCase().includes(keyword);
        
        if (!keyword || titleMatch || subjectMatch || unitMatch) {
            results.push({
                title: data.title,
                subject: data.subject,
                unit: data.unit,
                url: data.url
            });
        }
    });

    return results.slice(0, 5);
}

const toolExecutors = {
    search_files: executeSearchFiles,
    search_news: executeSearchNews,
    search_clubs: executeSearchClubs,
    search_youtube: executeSearchYoutube,
    search_pyq_database: executeSearchPyqDatabase,
    summarize_question_paper: executeSummarizeQuestionPaper,
};

// ── Main Route Handler ──

export async function POST(req) {
    let systemInstruction = '';
    let messages = [];
    let context = {};
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }

        const body = await req.json();
        messages = body.messages || [];
        context = body.context || {};

        systemInstruction = `
You are **Sutras Copilot** — a brilliant, witty, and slightly nerdy AI study buddy built into the Sutras college platform.

Your vibe: Think of yourself as the cool senior who aced every exam and loves helping juniors. You use casual language, sprinkle in emojis occasionally (but don't overdo it), crack light study-related jokes, and always hype the student up. You're like a mix between a genius tutor and a supportive best friend.

**IMPORTANT — You Are a General-Purpose AI Too:**
You are NOT limited to only platform-related questions. You can and SHOULD answer:
- General knowledge questions (science, history, math, geography, tech, etc.)
- Academic concept explanations ("What is polymorphism?", "Explain quantum mechanics", etc.)
- Coding help and debugging
- Career advice, interview prep, and resume tips
- Casual conversation, jokes, and chitchat
- Math problems, logic puzzles, and brain teasers
- Current affairs and general awareness
- Any other question a student might ask

Only use your platform tools when the question specifically relates to searching for files, news, clubs, or videos on the platform. For everything else, answer directly from your own knowledge like any helpful AI assistant would.

**Platform Features You Know About:**
The Sutras platform has these features that students can use:
- 📚 **Subjects/Notes** — Browse and download lecture notes by subject (/subjects)
- 📝 **PYQs** — Previous Year Question Papers organized by subject (/pyqs)
- 📋 **Assignments** — Download assignment PDFs (/assignments)
- 🧠 **AI Assistant** — A dedicated full-screen AI chat for deep study help (/assistant)
- 🎯 **Exam Mode** — AI-powered last-night study prep with unit summaries and predicted questions (/exam-mode)
- 📰 **News** — Campus news and announcements (/news)
- 🏢 **Clubs** — Student clubs and organizations to join (/clubs)
- 💬 **Community** — Discussion forum where students post questions and share ideas (/community)
- 🏆 **Leaderboard** — Top contributors ranked by uploads and engagement (/leaderboard)
- 📊 **Dashboard** — Personal dashboard with profile, stats, and MCQ quizzes (/dashboard)
- 🎓 **YouTube** — Curated educational YouTube videos (/youtube)
- 📤 **Upload** — Upload your own notes, PYQs, or assignments to help others (/upload)

**Your Tools:**
You have 5 tools to search the live database and college question paper archives. ONLY use them when the student is specifically asking for platform content:
1. \`search_files\` — Use when asked for PDF notes, PYQs, assignments, or document files.
2. \`search_news\` — Use when asked about recent news, announcements, or campus events.
3. \`search_clubs\` — Use when asked about clubs, organizations, or extracurricular activities.
4. \`search_youtube\` — Use when asked for video lectures, tutorials, or YouTube links.
5. \`search_pyq_database\` — Use when asked for predicted questions, general syllabus unit summaries, and textbook exam answers.
6. \`summarize_question_paper\` — Use when a student specifically asks you to analyze or summarize a specific year/session's physical past exam paper from the college archives (e.g. 'Summarize November 2025 BEE paper').

Do NOT use tools for general knowledge questions like "What is gravity?" or "Who is the president of India?". Just answer those directly.

**Rules:**
- Keep answers concise and punchy. No walls of text.
- Use markdown formatting (bold, lists, headers) for readability.
- When you get file results from search_files, present download links as: [📄 Title](/api/downloads/filename)
- When you get video results from search_youtube, present links as: [▶️ Title](url)
- When you get news results, present them with the title and a brief summary.
- When you get club results, present them with the name, category, and a link like: [🏢 Club Name](/clubs/clubId)
- If asked about a platform feature, explain it briefly and link to the relevant page.
- NEVER make up file links or data. Only use what the tools return.
- If no results are found, be honest and suggest alternatives.
- Current page context: ${context?.currentPath || 'Unknown'}. Use this to infer context.
- The student's name is ${context?.name || 'buddy'}. Use it occasionally.
- Be reassuring when students are stressed about exams.
        `;

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction,
            tools: [{ functionDeclarations: [searchFilesDeclaration, searchNewsDeclaration, searchClubsDeclaration, searchYoutubeDeclaration, searchPyqDatabaseDeclaration, summarizeQuestionPaperDeclaration] }]
        });

        // Format history — skip leading 'model' messages (e.g. the pre-loaded greeting)
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
            generationConfig: { maxOutputTokens: 2000 },
        });

        const lastMessage = messages[messages.length - 1].content;
        
        // Send message and check for function calls
        let result = await chat.sendMessage(lastMessage);
        let response = result.response;
        let functionCalls = response.functionCalls();
        
        // Handle function calls (could be multiple rounds)
        while (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            const executor = toolExecutors[call.name];
            
            if (executor) {
                const toolResult = await executor(call.args || {});
                
                // Package the tool response payload cleanly to support objects or arrays
                const responsePayload = (Array.isArray(toolResult) || typeof toolResult === 'string')
                    ? { results: toolResult.length > 0 ? toolResult : 'No results found matching the criteria.' }
                    : toolResult;

                // Send function response back
                result = await chat.sendMessage([{
                    functionResponse: {
                        name: call.name,
                        response: responsePayload
                    }
                }]);
                
                response = result.response;
                functionCalls = response.functionCalls();
            } else {
                break;
            }
        }


        // Stream the final text response
        const text = response.text();
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
        console.error('Copilot Chat Error:', error);

        // --- GROK FALLBACK CHAT ---
        if (process.env.GROK_API_KEY) {
            console.log('[Copilot] Attempting Grok Fallback for Chatbot...');
            try {
                const grokMessages = [
                    { 
                        role: 'system', 
                        content: `${systemInstruction}\n\nNOTE: You are currently running on a Grok fallback engine because the primary Gemini API has temporarily hit a quota limit. Inform the student playfully in your introduction (e.g. "Phew! My main brain was hit by an exam-season traffic jam, so I booted up my Grok backup reactor! 🚀") and answer their request fully!` 
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
                    
                    console.log('✅ Grok Fallback Chat Successful!');
                    
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
                } else {
                    console.error('[Copilot] Grok completions response not ok:', grokResponse.statusText);
                }
            } catch (grokErr) {
                console.error('[Copilot] Error inside Grok fallback route:', grokErr);
            }
        }
        // -------------------------

        // Elegant rate-limit chat fallback (Local Database instructions if Grok is offline)
        if (error.message && (error.message.includes('429') || error.message.includes('quota') || error.message.includes('Too Many Requests'))) {
            const fallbackResponse = `👋 Hey buddy! It looks like our live AI connection is super busy right now (Gemini API limit exceeded).

But don't panic! I'm fully equipped with our **Offline Exam Preparation Engine**! I have pre-cached textbook-standard answers, predicted questions, and syllabus summaries for core subjects like **Basic Electrical Engineering (BEE)**, **Physics**, **Maths**, and **PPS**!

I can help you study these topics right now without any quota restrictions! Try asking me:
* *"What are the predicted questions for BEE?"*
* *"Show me the ideal answer for the EMF Equation"*
* *"Give me the summary of Unit 3 in BEE"*

How can I help you ace your exams today? ⚡`;

            const stream = new ReadableStream({
                start(controller) {
                    controller.enqueue(new TextEncoder().encode(fallbackResponse));
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

        return NextResponse.json({ error: 'Failed to generate response.' }, { status: 500 });
    }
}
