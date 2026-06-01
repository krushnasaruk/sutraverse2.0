import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { getUploadsDir } from '@/lib/uploadsDir';

/**
 * POST /api/upload
 * 
 * Saves uploaded file to a persistent directory OUTSIDE the app folder.
 * This ensures files survive app redeployments on cPanel/VPS.
 * 
 * Storage location (in order of priority):
 *   1. UPLOADS_DIR env var (e.g. /home/username/user-uploads)
 *   2. Fallback: public/uploads/ (for local development)
 * 
 * Files are served back via /api/downloads/[...filepath] route.
 */
export async function POST(request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Determine upload context from optional 'context' field
        const context = formData.get('context') || 'general';

        // Validate file size (25 MB max for general, 5 MB for avatars)
        const MAX_SIZE = context === 'avatar' ? 5 * 1024 * 1024 : 25 * 1024 * 1024;
        const buffer = Buffer.from(await file.arrayBuffer());

        if (buffer.length > MAX_SIZE) {
            const limit = context === 'avatar' ? '5 MB' : '25 MB';
            return NextResponse.json({ error: `File too large. Maximum ${limit}.` }, { status: 413 });
        }

        // Validate file type based on context
        const ext = file.name.split('.').pop()?.toLowerCase();

        if (context === 'avatar') {
            const allowedImageExts = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
            if (!ext || !allowedImageExts.includes(ext)) {
                return NextResponse.json({ error: 'Unsupported image type. Use JPG, PNG, WebP, or GIF.' }, { status: 400 });
            }
        } else {
            const allowedExts = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip', 'jpg', 'jpeg', 'png'];
            if (!ext || !allowedExts.includes(ext)) {
                return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
            }
        }

        // Build a unique filename: timestamp_originalname
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

        // Organize into subdirectories based on context
        let subDir = '';
        if (context === 'avatar') {
            subDir = 'avatars';
        } else if (context === 'submission') {
            subDir = 'submissions';
        } else if (context === 'teacher-material') {
            subDir = 'materials';
        }

        const fileName = `${timestamp}_${safeName}`;

        // Use persistent uploads directory (outside app folder in production)
        const baseUploadsDir = getUploadsDir();
        const uploadsDir = subDir
            ? path.join(baseUploadsDir, subDir)
            : baseUploadsDir;
        await mkdir(uploadsDir, { recursive: true });

        // Write the file
        const filePath = path.join(uploadsDir, fileName);
        await writeFile(filePath, buffer);

        // Return URL that goes through the API download route (works everywhere)
        const relativePath = subDir ? `${subDir}/${fileName}` : fileName;
        const fileURL = `/api/downloads/${relativePath}`;

        return NextResponse.json({
            success: true,
            fileURL,
            fileName: file.name,
            fileSize: buffer.length,
        });
    } catch (err) {
        console.error('Upload API error:', err);
        return NextResponse.json({
            error: 'Server error: ' + err.message,
        }, { status: 500 });
    }
}
