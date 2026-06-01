import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Maps folder names to student-friendly subject names
const SUBJECT_MAP = {
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

export async function GET() {
    try {
        const pyqsDir = path.join(process.cwd(), 'public', 'pyqs');

        if (!fs.existsSync(pyqsDir)) {
            return NextResponse.json({ papers: [], total: 0 });
        }

        const subjectFolders = fs.readdirSync(pyqsDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);

        const papers = [];

        for (const folder of subjectFolders) {
            const folderPath = path.join(pyqsDir, folder);
            const files = fs.readdirSync(folderPath)
                .filter(f => f.toLowerCase().endsWith('.pdf'));

            for (const file of files) {
                const cleanSession = file
                    .replace('.pdf', '')
                    .replace(/_/g, ' ')
                    .replace(/ - /g, ' ')
                    .trim();

                papers.push({
                    folder,
                    file,
                    subject: SUBJECT_MAP[folder] || folder,
                    session: cleanSession,
                    label: `${SUBJECT_MAP[folder] || folder} — ${cleanSession}`,
                    // URL path relative to /public so the frontend can fetch it
                    pdfUrl: `/pyqs/${encodeURIComponent(folder)}/${encodeURIComponent(file)}`
                });
            }
        }

        // Sort: by subject name, then by session descending (newest first)
        papers.sort((a, b) => {
            if (a.subject !== b.subject) return a.subject.localeCompare(b.subject);
            return b.session.localeCompare(a.session);
        });

        return NextResponse.json({ papers, total: papers.length });
    } catch (err) {
        console.error('[API] Error scanning PYQ directory:', err);
        return NextResponse.json({ papers: [], total: 0, error: err.message }, { status: 500 });
    }
}
