import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import os from 'os';
import { getUploadsDir } from '@/lib/uploadsDir';

function findAppRoot() {
    let current = __dirname;
    for (let i = 0; i < 12; i++) {
        if (existsSync(join(current, 'package.json')) || existsSync(join(current, '.next')) || existsSync(join(current, 'public'))) {
            return current;
        }
        const parent = join(current, '..');
        if (parent === current) break;
        current = parent;
    }
    return process.cwd(); // Fallback
}

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

    const appRoot = findAppRoot();
    const uploadsDir = getUploadsDir();
    const filePath = join(uploadsDir, relativePath);

    // List of robust fallback paths to try
    const fallbackPaths = [
        // 1. Direct path inside standard uploadsDir (configured or home directory)
        filePath,
        join(uploadsDir, relativePath.replace(/^uploads\//, '')), // Strip uploads/ if nested
        join(uploadsDir, relativePath.replace(/^pyqs\//, '')), // Strip pyqs/ if nested
        
        // 2. Relative to dynamic appRoot (highly reliable Passenger & standalone fallback)
        join(appRoot, 'public', relativePath), 
        join(appRoot, 'public', relativePath.replace(/^uploads\//, 'uploads/')), // Ensure uploads/ nested
        join(appRoot, relativePath),
        
        // 3. process.cwd() fallback
        join(process.cwd(), 'public', relativePath),
        join(process.cwd(), '..', 'public', relativePath),
        
        // 4. cPanel home folder public_html fallbacks
        join(os.homedir(), 'public_html', 'public', relativePath),
        join(os.homedir(), 'public_html', 'public', relativePath.replace(/^uploads\//, 'uploads/')),
        join(os.homedir(), 'public_html', relativePath)
    ];

    let foundPath = null;
    for (const p of fallbackPaths) {
        if (existsSync(p)) {
            foundPath = p;
            break;
        }
    }

    if (!foundPath) {
        console.warn(`File not found across fallbacks for relativePath: ${relativePath}`);
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
