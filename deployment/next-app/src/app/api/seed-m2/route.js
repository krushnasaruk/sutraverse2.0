import { NextResponse } from 'next/server';
import { copyFile, mkdir, stat } from 'fs/promises';
import { join } from 'path';

export async function GET() {
    try {
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const filesToProcess = [
            'Unit 2 notes SG m2.pdf',
            'Unit 2 notes m2.pdf',
            'Unit 3 notes m2.pdf',
            'Unit 5 (M-II).pdf',
            'Unit-iv (M-II).pdf',
            'Unit1 Notes m2.pdf'
        ];

        let metadataList = [];

        for (const file of filesToProcess) {
            const safeName = file.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const uniqueName = `${Date.now()}_${safeName}`;
            
            const sourcePath = join(process.cwd(), file);
            const destPath = join(uploadDir, uniqueName);
            
            try {
                await copyFile(sourcePath, destPath);
            } catch (e) {
                console.warn(`Could not copy ${file}:`, e.message);
                continue;
            }
            
            const stats = await stat(sourcePath);

            const metadata = {
                title: file.replace('.pdf', ''),
                subject: 'Engineering Mathematics II',
                type: 'Notes',
                branch: 'All', 
                year: '1st Year',
                description: `Auto-seeded M2 notes`,
                fileURL: `/uploads/${uniqueName}`,
                fileName: uniqueName,
                fileSize: stats.size,
                rating: 0,
                ratingCount: 0,
                downloads: 0,
                status: 'approved',
                createdAt: new Date().toISOString(),
            };

            metadataList.push(metadata);
        }
        
        return NextResponse.json({ success: true, metadataList });
    } catch (error) {
        console.error("Seed error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
