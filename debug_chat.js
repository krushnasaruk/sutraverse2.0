const fetch = require('node-fetch');

async function debug() {
    const res = await fetch('http://localhost:3000/api/paper-analysis/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            messages: [{ role: 'user', content: 'solve the first question' }],
            paperSummary: 'Summary',
            subjectName: 'BEE',
            pdfPath: 'bee/Oct 2022.pdf'
        })
    });
    
    console.log('Status:', res.status);
    const text = await res.text();
    console.log('Body:', text.substring(0, 500));
}
debug();
