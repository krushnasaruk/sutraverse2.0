import { NextResponse } from 'next/server';
import { mkdir } from 'fs/promises';
import { createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import path from 'path';
import { getUploadsDir } from '@/shared/utils/uploadsDir';
import { adminAuth } from '@/database/config/firebaseAdmin';

export const maxDuration = 300;










/**
 * POST /api/upload
 * 
 * Saves uploaded file to a persistent directory OUTSIDE the app folder.
 * This ensures files survive app redeployments on cPanel/VPS.
 */

// Allow longer execution times for large file uploads on Vercel/VPS
 

export const handlePost_upload = async (request) => {
    console.log('[Upload API] Request received');
    try {
        // Enforce Authentication Check via Firebase Admin SDK
        const authHeader = request.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.error('[Upload API] Missing or invalid Authorization header');
            return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
        }

        const idToken = authHeader.split('Bearer ')[1];
        try {
            const decodedToken = await adminAuth.verifyIdToken(idToken);
            console.log(`[Upload API] Authenticated user: ${decodedToken.email}`);
            if (!decodedToken.email_verified) {
                console.warn(`[Upload API] Email not verified for ${decodedToken.email}`);
                return NextResponse.json({ error: 'Forbidden: Email verification required' }, { status: 403 });
            }
        } catch (authErr) {
            console.error('[Upload API] Auth verification failed:', authErr.message);
            return NextResponse.json({ error: 'Unauthorized: Invalid authentication token' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file');

        if (!file || typeof file === 'string') {
            console.error('[Upload API] No file provided in form data');
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        const context = formData.get('context') || 'general';
        console.log(`[Upload API] Context: ${context}, File: ${file.name}, Size: ${file.size}`);

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

        const subject = formData.get('subject') || 'Unsorted';
        let year = formData.get('year') || 'First Year';
        const collegeId = formData.get('collegeId') || 'DPCOE';

        // Normalize year to match physical folder structure
        if (year === '1st Year') year = 'First Year';
        else if (year === '2nd Year') year = 'Second Year';
        else if (year === '3rd Year') year = 'Third Year';
        else if (year === '4th Year') year = 'Fourth Year';

        // Ensure subject and collegeId don't have slashes that break the path
        const safeSubject = String(subject).replace(/[\/\\\?%*:|"<>]/g, '-').trim();
        const safeCollege = String(collegeId).replace(/[\/\\\?%*:|"<>]/g, '-').trim();

        let subDir = '';
        if (context === 'avatar') {
            subDir = 'avatars';
        } else if (context === 'teacher-material') {
            subDir = 'materials';
        } else if (context === 'submission') {
            subDir = 'submissions';
        } else if (['Notes', 'PYQ', 'Assignment'].includes(context)) {
            // Map context exactly to our standard folder names: Assignments, PYQ, Notes
            const typeFolder = context === 'Assignment' ? 'Assignments' : context;
            // E.g., DPCOE/First Year/Notes/Chemistry
            subDir = path.join(safeCollege, year, typeFolder, safeSubject);
        } else {
            subDir = 'others';
        }

        const fileName = `${timestamp}_${safeName}`;

        const baseUploadsDir = getUploadsDir();
        const uploadsDir = subDir ? path.join(baseUploadsDir, subDir) : baseUploadsDir;

        console.log(`[Upload API] Target path: ${path.join(uploadsDir, fileName)}`);

        try {
            await mkdir(uploadsDir, { recursive: true });
        } catch (mkdirErr) {
            console.error(`[Upload API] mkdir failed:`, mkdirErr);
            throw new Error('Failed to create destination directory.');
        }

        const filePath = path.join(uploadsDir, fileName);
        const readStream = Readable.fromWeb(file.stream());
        const writeStream = createWriteStream(filePath);
        await pipeline(readStream, writeStream);

        console.log(`[Upload API] Successfully saved: ${fileName}`);

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
