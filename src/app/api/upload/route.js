import { NextResponse } from 'next/server';
import { mkdir } from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import path from 'path';
import { getUploadsDir } from '@/lib/uploadsDir';
import { adminAuth } from '@/lib/firebaseAdmin';

/**
 * POST /api/upload
 * 
 * Saves uploaded file to a persistent directory OUTSIDE the app folder.
 * This ensures files survive app redeployments on cPanel/VPS.
 */

// Allow longer execution times for large file uploads on Vercel/VPS
export const maxDuration = 300; 

export async function POST(request) {
    try {
        // Enforce Authentication Check via Firebase Admin SDK
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        try {
            await adminAuth.verifyIdToken(idToken);
        } catch (authErr) {
            console.error('Upload verification failed:', authErr.message);
            return NextResponse.json({ error: 'Unauthorized: Invalid authentication token' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || typeof file === 'string') {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const context = formData.get('context') || 'general';

        // Validate file size (100 MB max for general, 5 MB for avatars)
        const MAX_SIZE = context === 'avatar' ? 5 * 1024 * 1024 : 100 * 1024 * 1024;

        if (file.size > MAX_SIZE) {
            const limit = context === 'avatar' ? '5 MB' : '100 MB';
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
            const allowedExts = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'zip', 'jpg', 'jpeg', 'png', 'mp4', 'mkv'];
            if (!ext || !allowedExts.includes(ext)) {
                return NextResponse.json({ error: 'Unsupported file type.' }, { status: 400 });
            }
        }

        // Build a unique filename: timestamp_originalname
        const timestamp = Date.now();
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

        let subDir = '';
        if (context === 'avatar') {
            subDir = 'avatars';
        } else if (context === 'submission') {
            subDir = 'submissions';
        } else if (context === 'teacher-material') {
            subDir = 'materials';
        }

        const fileName = `${timestamp}_${safeName}`;

        const baseUploadsDir = getUploadsDir();
        const uploadsDir = subDir ? path.join(baseUploadsDir, subDir) : baseUploadsDir;
        await mkdir(uploadsDir, { recursive: true });

        // Stream the file directly to disk to prevent Memory bloat / Out Of Memory errors
        // This is significantly faster for cPanel environments
        const filePath = path.join(uploadsDir, fileName);
        const readStream = Readable.fromWeb(file.stream());
        const writeStream = createWriteStream(filePath);
        await pipeline(readStream, writeStream);

        const relativePath = subDir ? `${subDir}/${fileName}` : fileName;
        const fileURL = `/api/downloads/${relativePath}`;

        return NextResponse.json({
            success: true,
            fileURL,
            fileName: file.name,
            fileSize: file.size,
        });
    } catch (err) {
        console.error('Upload API error:', err);
        return NextResponse.json({
            error: 'Server error: ' + err.message,
        }, { status: 500 });
    }
}
