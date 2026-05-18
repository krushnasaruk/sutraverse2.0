import { NextResponse } from 'next/server';
import { copyFile, mkdir, stat } from 'fs/promises';
import { join } from 'path';

export async function GET() {
    try {
        const uploadDir = join(process.cwd(), 'public', 'uploads');
        await mkdir(uploadDir, { recursive: true });

        const filesToProcess = [
            { path: 'bee_temp_extract/notes/UNIT -I.pdf', type: 'Notes' },
            { path: 'bee_temp_extract/notes/Unit-I Question Bank -CO.pdf', type: 'Notes' },
            { path: 'bee_temp_extract/notes/Unit-I Question Bank.pdf', type: 'Notes' },
            { path: 'bee_temp_extract/notes/Unit-II Assignment co.pdf', type: 'Notes' },
            { path: 'bee_temp_extract/notes/Unit-II Question Bank co.pdf', type: 'Notes' },
            { path: 'bee_temp_extract/notes/BEE Unit 2 ppt.pptx', type: 'Notes' },
            { path: 'bee_temp_extract/unit_v/Unit-IV Assignment.docx', type: 'Notes' },
            { path: 'bee_temp_extract/unit_v/Unit-IV Question Bank.pdf', type: 'Notes' },
            { path: 'bee_temp_extract/unit_v/unit-4 BEE notes.pdf', type: 'Notes' },
            { path: 'bee_temp_extract/unit_v/Unit-V Assignment.docx', type: 'Notes' },
            { path: 'bee_temp_extract/unit_v/Unit-V QB.docx', type: 'Notes' },
            { path: 'bee_temp_extract/papers/BEE- CCE-I_PAPER .pdf', type: 'Notes' },
            { path: 'bee_temp_extract/papers/CCE-II_PAPER.pdf', type: 'Notes' }
        ];

        let metadataList = [];

        for (const fileObj of filesToProcess) {
            const fileName = fileObj.path.split('/').pop();
            const safeName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
            const uniqueName = `${Date.now()}_${safeName}`;
            
            const sourcePath = join(process.cwd(), fileObj.path);
            const destPath = join(uploadDir, uniqueName);
            
            try {
                await copyFile(sourcePath, destPath);
            } catch (e) {
                console.warn(`Could not copy ${fileObj.path}:`, e.message);
                continue;
            }
            
            const stats = await stat(sourcePath);

            const metadata = {
                title: fileName.replace(/\.[^/.]+$/, ""),
                subject: 'BEE',
                type: fileObj.type,
                branch: 'All', 
                year: '1st Year',
                description: `Auto-seeded BEE ${fileObj.type}`,
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
