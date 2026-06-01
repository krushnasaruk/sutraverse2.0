const fetch = require('node-fetch');

async function test() {
    const res = await fetch('http://localhost:3000/api/paper-analysis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [{ role: 'user', content: 'solve the first question' }],
            paperSummary: 'Test summary',
            subjectName: 'BEE',
            pdfPath: 'bee/Oct 2022.pdf'
        })
    });
    
    if (!res.ok) {
        const text = await res.text();
        console.log('Error status:', res.status);
        console.log('Error body:', text);
    } else {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            console.log(decoder.decode(value));
        }
    }
}
test();
