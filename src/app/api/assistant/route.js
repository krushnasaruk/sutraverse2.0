import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            console.error('GEMINI_API_KEY is not defined in environment variables.');
            return NextResponse.json({ error: 'AI Assistant requires the GEMINI_API_KEY environment variable. Please configure it.' }, { status: 500 });
        }

        const body = await req.json();
        const { messages, context } = body;

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Missing or invalid "messages" array in request body.' }, { status: 400 });
        }

        const systemInstruction = `
You are Sutras AI, an elite academic study assistant and professor designed to help college students.
${context ? `
You are currently talking to ${context.name || 'a student'}.
They are studying in Branch: ${context.branch || 'Unknown'}, Year: ${context.year || 'Unknown'}.
Please tailor your examples and study plans to match their academic background.
` : ''}
Your personality is encouraging, knowledgeable, and concise. 
You must proactively suggest suitable study plans, recommend notes, and suggest relevant YouTube video topics based on the student's questions.
Solve their queries thoroughly while maintaining an academic tone.
Use modern formatting like markdown headers, lists, code blocks, and bold text for readability.
If a student asks you to explain a concept, explain it clearly with analogies if helpful.
Do not reply with extremely long essays unless deeply complex. Keep it structured.
        `;

        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction
        });

        // Format history
        const formattedHistory = [];
        for (let i = 0; i < messages.length - 1; i++) {
            const msg = messages[i];
            formattedHistory.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.content }]
            });
        }

        const chat = model.startChat({
            history: formattedHistory,
            generationConfig: {
                maxOutputTokens: 2000,
            },
        });

        const lastMessage = messages[messages.length - 1].content;
        
        // Use streaming API
        const resultStream = await chat.sendMessageStream(lastMessage);

        // Convert the async generator into a standard web ReadableStream
        const stream = new ReadableStream({
            async start(controller) {
                try {
                    for await (const chunk of resultStream.stream) {
                        const chunkText = chunk.text();
                        controller.enqueue(new TextEncoder().encode(chunkText));
                    }
                    controller.close();
                } catch (e) {
                    controller.error(e);
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/plain; charset=utf-8',
                'Transfer-Encoding': 'chunked',
                'Cache-Control': 'no-cache',
            }
        });

    } catch (error) {
        console.error('Gemini Chat Error:', error);
        
        // Return a safe error message if quota exceeded
        let errorMessage = 'Failed to generate response.';
        if (error.message?.includes('429')) {
             errorMessage = 'API rate limit exceeded. Please try again later.';
        }
        
        return NextResponse.json({ error: errorMessage }, { status: 500 });
    }
}
