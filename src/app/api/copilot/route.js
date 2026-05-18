import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// ── Tool Declarations ──

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
};

// ── Main Route Handler ──

export async function POST(req) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }

        const body = await req.json();
        const { messages, context } = body;

        const systemInstruction = `
You are **Sutras Copilot** — a brilliant, witty, and slightly nerdy AI study buddy built into the Sutras college platform.

Your vibe: Think of yourself as the cool senior who aced every exam and loves helping juniors. You use casual language, sprinkle in emojis occasionally (but don't overdo it), crack light study-related jokes, and always hype the student up. You're like a mix between a genius tutor and a supportive best friend.

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
You have 4 tools to search the live database:
1. \`search_files\` — Use when asked for PDF notes, PYQs, assignments, or document files.
2. \`search_news\` — Use when asked about recent news, announcements, or campus events.
3. \`search_clubs\` — Use when asked about clubs, organizations, or extracurricular activities.
4. \`search_youtube\` — Use when asked for video lectures, tutorials, or YouTube links.

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
            tools: [{ functionDeclarations: [searchFilesDeclaration, searchNewsDeclaration, searchClubsDeclaration, searchYoutubeDeclaration] }]
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
                
                // Send function response back
                result = await chat.sendMessage([{
                    functionResponse: {
                        name: call.name,
                        response: {
                            results: toolResult.length > 0 ? toolResult : 'No results found matching the criteria.'
                        }
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
        return NextResponse.json({ error: 'Failed to generate response.' }, { status: 500 });
    }
}
