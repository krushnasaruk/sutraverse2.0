import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join, resolve, basename } from 'path';
import { existsSync, readdirSync, statSync } from 'fs';
import os from 'os';
import { getUploadsDir } from '@/shared/utils/uploadsDir';

/**
 * Recursively search for a file by name under a root directory.
 * Returns the first match found, or null.
 * Skips node_modules, .next, .git, and cache folders.
 */
function findFileRecursive(dir, targetFilename, maxDepth = 6, currentDepth = 0) {
    if (currentDepth > maxDepth) return null;
    try {
        if (!existsSync(dir)) return null;
        const stat = statSync(dir);
        if (!stat.isDirectory()) return null;

        const entries = readdirSync(dir);
        // First check if the file is directly here
        for (const entry of entries) {
            // Try exact match, or match ignoring timestamp prefix
            if (entry === targetFilename || entry.endsWith('_' + targetFilename) || entry.endsWith(targetFilename)) {
                const fullPath = join(dir, entry);
                try {
                    if (statSync(fullPath).isFile()) return fullPath;
                } catch (e) { /* skip */ }
            }
        }
        // Then recurse into subdirectories
        const skipDirs = new Set(['node_modules', '.next', '.git', 'cache', 'tmp', '.cache']);
        for (const entry of entries) {
            if (skipDirs.has(entry)) continue;
            const fullPath = join(dir, entry);
            try {
                if (statSync(fullPath).isDirectory()) {
                    const found = findFileRecursive(fullPath, targetFilename, maxDepth, currentDepth + 1);
                    if (found) return found;
                }
            } catch (e) { /* skip permission errors */ }
        }
    } catch (e) { /* skip */ }
    return null;
}

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

export const handleGet_downloadsfilepath = async (req, ctx) => {
    const { filepath } = await ctx.params;

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
    const filenameOnly = relativePath.split('/').pop();

    // Check if path is a PYQ request
    const isPyq = relativePath.startsWith('pyqs/');
    const pyqsRelativePath = isPyq ? relativePath.replace(/^pyqs\//, '') : relativePath;

    // Get the home directory
    let homeDir;
    try {
        homeDir = os.userInfo().homedir;
    } catch (e) {
        homeDir = os.homedir();
    }

    // ── Build comprehensive fallback paths ──────────────────────────────
    // The key directories where files might live:
    //   /home/user/user-uploads/              (UPLOADS_DIR)
    //   /home/user/user-uploads/user_uploads/ (nested underscore variant)
    //   /home/user/user-uploads/user-uploads/ (nested dash variant)
    //   /home/user/webapp8/public/            (static assets)
    const uploadsBase = resolve(uploadsDir);           // e.g. /home/user/user-uploads
    const nestedUnderscore = join(uploadsBase, 'user_uploads');
    const nestedDash = join(uploadsBase, 'user-uploads');
    const appDir = process.cwd();

    const fallbackPaths = [
        // 1. Direct under uploadsDir
        join(uploadsBase, relativePath),
        // 2. Inside nested user_uploads (underscore)
        join(nestedUnderscore, relativePath),
        // 3. Inside nested user-uploads (dash)
        join(nestedDash, relativePath),
    ];

    if (isPyq) {
        // PYQ-specific paths
        fallbackPaths.push(
            join(uploadsBase, 'pyqs', pyqsRelativePath),
            join(nestedUnderscore, 'pyqs', pyqsRelativePath),
            join(nestedDash, 'pyqs', pyqsRelativePath),
            join(appDir, 'public', 'pyqs', pyqsRelativePath),
            join(appDir, 'pyqs', pyqsRelativePath),
            join(homeDir, 'pyqs', pyqsRelativePath),
            // Also try the subject folder directly under public/pyqs
            join(appDir, 'public', relativePath),
        );
    }

    // Strip prefix variants
    const stripped = relativePath.replace(/^(uploads|pyqs|submissions|materials|avatars)\//, '');
    if (stripped !== relativePath) {
        fallbackPaths.push(
            join(uploadsBase, stripped),
            join(nestedUnderscore, stripped),
            join(nestedDash, stripped),
        );
    }

    // Try just the filename in various subdirectories
    const subDirs = ['', 'submissions', 'materials', 'avatars', 'others', 'pyqs'];
    const roots = [uploadsBase, nestedUnderscore, nestedDash];
    for (const root of roots) {
        for (const sub of subDirs) {
            const p = sub ? join(root, sub, filenameOnly) : join(root, filenameOnly);
            if (!fallbackPaths.includes(p)) {
                fallbackPaths.push(p);
            }
        }
    }

    // Also try under the DPCOE structure (user_uploads/DPCOE/...)
    if (existsSync(nestedUnderscore)) {
        fallbackPaths.push(
            join(nestedUnderscore, 'DPCOE', relativePath),
        );
    }

    // ── Check each path ─────────────────────────────────────────────────
    let foundPath = null;
    for (const p of fallbackPaths) {
        if (existsSync(p)) {
            try {
                if (statSync(p).isFile()) {
                    foundPath = p;
                    break;
                }
            } catch (e) { /* skip */ }
        }
    }

    // ── Last resort: recursive file search ──────────────────────────────
    // If none of the explicit fallbacks worked, search the entire uploads
    // directory tree for a file matching the filename
    if (!foundPath && filenameOnly) {
        console.log(`[downloads] Fallback paths exhausted for "${relativePath}". Trying recursive search for "${filenameOnly}"...`);
        
        // Search in uploadsDir first (includes nested user_uploads)
        foundPath = findFileRecursive(uploadsBase, filenameOnly);
        
        // If still not found, try public directory
        if (!foundPath) {
            foundPath = findFileRecursive(join(appDir, 'public'), filenameOnly);
        }
        
        // Try home directory as absolute last resort (limited depth)
        if (!foundPath) {
            foundPath = findFileRecursive(homeDir, filenameOnly, 4);
        }

        if (foundPath) {
            console.log(`[downloads] Recursive search found file at: ${foundPath}`);
        }
    }

    if (!foundPath) {
        console.warn(`[downloads] File NOT found for relativePath: ${relativePath}`);
        
        // In development/local testing, redirect to production
        const host = req.headers.get('host') || '';
        const isDevOrLocal = process.env.NODE_ENV === 'development' || 
            host.includes('localhost') || 
            host.includes('127.0.0.1') || 
            host.includes('0.0.0.0') || 
            host.includes('192.168.') || 
            host.includes('172.20.') || 
            host.includes('10.');
        
        if (isDevOrLocal) {
            const productionDomain = process.env.PRODUCTION_URL || 'https://sutraverse.co.in';
            const redirectUrl = `${productionDomain}/api/downloads/${encodeURIComponent(relativePath).replace(/%2F/g, '/')}`;
            console.log(`Local file not found. Redirecting to production fallback: ${redirectUrl}`);
            return NextResponse.redirect(redirectUrl, 307);
        }

        // Collect debug info
        let debugInfo = '';
        try {
            const envInfo = `UPLOADS_DIR=${process.env.UPLOADS_DIR || 'not set'}, cwd=${process.cwd()}`;
            
            // List what actually exists in the uploads directory
            let dirListing = 'N/A';
            try {
                if (existsSync(uploadsBase)) {
                    const entries = readdirSync(uploadsBase).map(e => {
                        try { return `${e}(${statSync(join(uploadsBase, e)).isDirectory() ? 'd' : 'f'})`; }
                        catch { return e; }
                    });
                    dirListing = entries.join(', ');
                }
            } catch (e) { dirListing = `Error: ${e.message}`; }

            // List nested user_uploads if it exists
            let nestedListing = 'N/A';
            try {
                if (existsSync(nestedUnderscore)) {
                    const entries = readdirSync(nestedUnderscore).map(e => {
                        try { return `${e}(${statSync(join(nestedUnderscore, e)).isDirectory() ? 'd' : 'f'})`; }
                        catch { return e; }
                    });
                    nestedListing = entries.join(', ');
                }
            } catch (e) { nestedListing = `Error: ${e.message}`; }

            debugInfo = `${envInfo} | uploadsDir contents: [${dirListing}] | user_uploads contents: [${nestedListing}] | Searched ${fallbackPaths.length} paths + recursive`;
        } catch (e) {
            debugInfo = `Debug error: ${e.message}`;
        }

        return new NextResponse(`File not found. Debug: ${debugInfo}`, { status: 404 });
    }

    // ── Security boundary check ─────────────────────────────────────────
    const resolvedPath = resolve(foundPath);
    const allowedRoots = [
        resolve(uploadsBase),
        resolve(homeDir),
        resolve(appDir, 'public'),
        resolve(appDir, 'pyqs'),
    ];

    const isAllowed = allowedRoots.some(root => resolvedPath.startsWith(root));

    if (!isAllowed) {
        return new NextResponse("Forbidden: Access denied", { status: 403 });
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
