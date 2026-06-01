const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');

async function run() {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "AIzaSyDb_UPP8QRthZsJ583sRRwmhQv2x8btiaw");
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const chat = model.startChat({
        history: [{ role: 'user', parts: [{ text: 'Hello' }] }, { role: 'model', parts: [{ text: 'Hi' }] }]
    });

    const buffer = fs.readFileSync('public/pyqs/bee/Oct 2022.pdf');
    const base64Data = buffer.toString('base64');
    
    const parts = [
        { inlineData: { data: base64Data, mimeType: "application/pdf" } },
        { text: "Solve question 1(a)" }
    ];
    
    try {
        const result = await chat.sendMessage(parts);
        console.log("Success:", result.response.text().substring(0, 50));
    } catch (e) {
        console.error("Gemini Error:", e.message);
    }
}
run();
