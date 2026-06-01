import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import os from 'os';
import { getUploadsDir } from '@/lib/uploadsDir';

/**
 * GET /api/downloads/[...filepath]
 * 
 * Serves uploaded files from the persistent uploads directory.
 * Supports subdirectories: /api/downloads/avatars/file.jpg
 */
export async function GET(request, { params }) {
    const { filepath } = await params;

    // filepath is an array of path segments
    let relativePath = Array.isArray(filepath) ? filepath.join('/') : filepath;
    try {
        relativePath = decodeURIComponent(relativePath);
    } catch (e) {
        console.error("Error decoding path:", e);
    }

    // Prevent directory traversal attacks
    if (relativePath.includes('..') || relativePath.includes('~')) {
        return new NextResponse("Invalid path", { status: 400 });
    }

    const uploadsDir = getUploadsDir();
    const filePath = join(uploadsDir, relativePath);

    // List of robust fallback paths to try
    const fallbackPaths = [
        filePath,
        join(process.cwd(), 'public', 'uploads', relativePath), // Local / inside standalone
        join(process.cwd(), '..', 'public', 'uploads', relativePath), // Root public/uploads
        join(process.cwd(), '..', 'public', 'public', 'uploads', relativePath), // Double public/ folder mistake
        join(process.cwd(), '..', 'uploads', relativePath), // Root uploads/ folder
        join(os.homedir(), 'public_html', 'public', 'uploads', relativePath), // Standard cPanel
        join(os.homedir(), 'public_html', 'user-uploads', relativePath) // Standard cPanel user-uploads
    ];

    let foundPath = null;
    for (const p of fallbackPaths) {
        if (existsSync(p)) {
            foundPath = p;
            break;
        }
    }

    if (!foundPath) {
        return new NextResponse("File not found", { status: 404 });
    }

    return serveFile(foundPath, relativePath);
}

async function serveFile(filePath, filename) {
    try {
        const fileBuffer = await readFile(filePath);

        const ext = filename.split('.').pop().toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === 'pdf') contentType = 'application/pdf';
        else if (['jpg', 'jpeg'].includes(ext)) contentType = 'image/jpeg';
        else if (ext === 'png') contentType = 'image/png';
        else if (ext === 'webp') contentType = 'image/webp';
        else if (ext === 'gif') contentType = 'image/gif';
        else if (ext === 'txt') contentType = 'text/plain';
        else if (['doc', 'docx'].includes(ext)) contentType = 'application/msword';
        else if (['ppt', 'pptx'].includes(ext)) contentType = 'application/vnd.ms-powerpoint';
        else if (ext === 'zip') contentType = 'application/zip';

        const response = new NextResponse(fileBuffer);
        response.headers.set('Content-Type', contentType);
        response.headers.set('Content-Disposition', `inline; filename="${filename.split('/').pop()}"`);

        return response;
    } catch (error) {
        console.error("Error reading file:", error);
        return new NextResponse("Error reading file", { status: 500 });
    }
}
