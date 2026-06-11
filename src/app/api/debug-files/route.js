import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { getUploadsDir } from '@/shared/utils/uploadsDir';

function scanDir(dir, maxDepth = 4, currentDepth = 0) {
    const results = [];
    if (currentDepth > maxDepth) return results;
    try {
        if (!fs.existsSync(dir)) return results;
        const stats = fs.statSync(dir);
        if (!stats.isDirectory()) return results;

        const files = fs.readdirSync(dir);
        for (const file of files) {
            const fullPath = path.join(dir, file);
            if (['node_modules', '.next', '.git', 'cache', '.npm', '.cache'].includes(file)) continue;
            
            try {
                const fStats = fs.statSync(fullPath);
                
                if (fStats.isDirectory()) {
                    results.push({ path: fullPath, type: 'directory', depth: currentDepth });
                    results.push(...scanDir(fullPath, maxDepth, currentDepth + 1));
                } else {
                    results.push({ path: fullPath, type: 'file', size: fStats.size, depth: currentDepth });
                }
            } catch (e) {}
        }
    } catch (e) {}
    return results;
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (token !== 'sutraverse_debug_123') {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const appDir = process.cwd();
    let homeDir = '/home/jhdexjiu';
    try {
        homeDir = os.userInfo().homedir || os.homedir();
    } catch (e) {
        homeDir = os.homedir();
    }

    const uploadsDir = getUploadsDir();
    const resolvedUploads = path.resolve(uploadsDir);

    // Scan the uploads directory deeply to see what's actually there
    const uploadsScan = scanDir(resolvedUploads, 5);

    // Also check for common subdirectories
    const nestedUnderscore = path.join(resolvedUploads, 'user_uploads');
    const nestedDash = path.join(resolvedUploads, 'user-uploads');

    return NextResponse.json({
        cwd: appDir,
        homeDir,
        env: {
            UPLOADS_DIR: process.env.UPLOADS_DIR || 'not set',
            NODE_ENV: process.env.NODE_ENV || 'not set'
        },
        uploadsDir: resolvedUploads,
        exists: {
            uploadsDir: fs.existsSync(resolvedUploads),
            nestedUnderscore: fs.existsSync(nestedUnderscore),
            nestedDash: fs.existsSync(nestedDash),
            submissions: fs.existsSync(path.join(resolvedUploads, 'submissions')),
            submissions_nested: fs.existsSync(path.join(nestedUnderscore, 'submissions')),
            publicPyqs: fs.existsSync(path.join(appDir, 'public', 'pyqs')),
        },
        uploadsScan: uploadsScan.slice(0, 200), // Limit to first 200 entries
    });
}
