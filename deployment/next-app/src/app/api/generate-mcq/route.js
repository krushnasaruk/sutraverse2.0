import { NextResponse } from 'next/server';
import { GoogleGenerativeAI, SchemaType } from '@google/generative-ai';

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(req) {
    try {
        if (!process.env.GEMINI_API_KEY) {
            return NextResponse.json({ error: 'GEMINI_API_KEY not configured' }, { status: 500 });
        }

        const body = await req.json();
        const { topic, subject, difficulty, count } = body;

        if (!topic || !count) {
            return NextResponse.json({ error: 'Missing topic or count' }, { status: 400 });
        }

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
