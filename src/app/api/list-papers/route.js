import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { getUploadsDir } from '@/shared/utils/uploadsDir';

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

function getPdfFilesRecursively(dir, fileList = []) {
    if (!fs.existsSync(dir)) return fileList;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getPdfFilesRecursively(filePath, fileList);
        } else if (file.toLowerCase().endsWith('.pdf')) {
            fileList.push(filePath);
        }
    }
    return fileList;
}

export async function GET() {
    try {
        const uploadsDir = getUploadsDir();
        
        // Try all possible locations for pyqs (local public, local root, or persistent uploads folder)
        const possiblePaths = [
            path.join(uploadsDir, 'pyqs'), // Check inside persistent user-uploads folder FIRST
            path.join(process.cwd(), 'public', 'pyqs'),
            path.join(process.cwd(), 'pyqs'),
            path.join(path.dirname(uploadsDir), 'pyqs'), // Check right next to user-uploads folder
        ];

        let pyqsDir = null;
        for (const p of possiblePaths) {
            if (fs.existsSync(p)) {
                pyqsDir = p;
                break;
            }
        }

        if (!pyqsDir) {
            return NextResponse.json({ papers: [], total: 0 });
        }

        const subjectFolders = fs.readdirSync(pyqsDir, { withFileTypes: true })
            .filter(d => d.isDirectory())
            .map(d => d.name);

        const papers = [];

        for (const folder of subjectFolders) {
            const folderPath = path.join(pyqsDir, folder);
            const allPdfPaths = getPdfFilesRecursively(folderPath);

            for (const absolutePath of allPdfPaths) {
                const file = path.basename(absolutePath);
                // Get relative path for the download URL (e.g. "engineering-mechanics/nested/file.pdf")
                const relativeToSubject = path.relative(folderPath, absolutePath);
                
                const subjectName = SUBJECT_MAP[folder] || folder;
                
                // Parse Exam Session from filename
                const match = file.match(/(\w+)_(\d+)\.pdf/);
                let session = 'Unknown';
                if (match) {
                    session = `${match[1].replace(/_/g, ' ')} ${match[2]}`;
                } else if (file.toLowerCase().includes('nov_dec')) {
                    const year = file.match(/\d{4}/);
                    session = `Nov Dec ${year ? year[0] : ''}`;
                } else if (file.toLowerCase().includes('may_jun')) {
                    const year = file.match(/\d{4}/);
                    session = `May Jun ${year ? year[0] : ''}`;
                } else if (file.toLowerCase().includes('oct')) {
                    const year = file.match(/\d{4}/);
                    session = `Oct ${year ? year[0] : ''}`;
                } else if (file.toLowerCase().includes('sep')) {
                    const year = file.match(/\d{4}/);
                    session = `Sep ${year ? year[0] : ''}`;
                } else if (file.toLowerCase().includes('march')) {
                    const year = file.match(/\d{4}/);
                    session = `March ${year ? year[0] : ''}`;
                } else if (file.match(/\d{4}/)) {
                    session = file.match(/\d{4}/)[0];
                }

                papers.push({
                    folder,
                    file, // Original basename for UI
                    relativePath: path.join(folder, relativeToSubject), // Need full relative path for downloads
                    subject: subjectName,
                    session: session.trim(),
                    label: `${subjectName} — ${session.trim()}`,
                    pdfUrl: `/api/downloads/pyqs/${encodeURIComponent(folder)}/${encodeURIComponent(relativeToSubject).replace(/%2F/g, '/')}`
                });
            }
        }

        // Sort globally (e.g. alphabetically by subject, then by latest session)
        papers.sort((a, b) => {
            if (a.subject < b.subject) return -1;
            if (a.subject > b.subject) return 1;
            const yearA = parseInt((a.session.match(/\d{4}/) || [0])[0]);
            const yearB = parseInt((b.session.match(/\d{4}/) || [0])[0]);
            return yearB - yearA; // Latest first
        });

        return NextResponse.json({ papers, total: papers.length });

    } catch (error) {
        console.error('List Papers API Error:', error);
        return NextResponse.json({ error: 'Failed to list papers' }, { status: 500 });
    }
}
