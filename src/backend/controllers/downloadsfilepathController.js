import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join, resolve, basename, sep } from 'path';
import { existsSync, readdirSync, statSync, createReadStream, realpathSync } from 'fs';
import { Readable } from 'stream';
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
        // 4. Public folder
        join(appDir, 'public', relativePath),
        join(appDir, 'public', 'uploads', relativePath),
    ];

    if (isPyq) {
        // PYQ-specific paths
        fallbackPaths.push(
            join(uploadsBase, 'pyqs', pyqsRelativePath),
            join(nestedUnderscore, 'pyqs', pyqsRelativePath),
            join(nestedDash, 'pyqs', pyqsRelativePath),
            join(appDir, 'public', 'pyqs', pyqsRelativePath),
            join(appDir, 'pyqs', pyqsRelativePath),
            join(homeDir, 'pyqs', pyqsRelativePath)
        );
    }

    // Strip prefix variants
    const stripped = relativePath.replace(/^(uploads|pyqs|submissions|materials|avatars)\//, '');
    if (stripped !== relativePath) {
        fallbackPaths.push(
            join(uploadsBase, stripped),
            join(nestedUnderscore, stripped),
            join(nestedDash, stripped),
            join(appDir, 'public', stripped),
            join(appDir, 'public', 'uploads', stripped)
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
        foundPath = findFileRecursive(uploadsBase, filenameOnly, 5); // Increased max depth to 5

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
            const searchParams = req.nextUrl?.searchParams?.toString() || '';
            const querySuffix = searchParams ? `?${searchParams}` : '';
            const proxyUrl = `${productionDomain}/api/downloads/${encodeURIComponent(relativePath).replace(/%2F/g, '/')}${querySuffix}`;
            console.log(`[downloads] Local file not found. Proxying from production: ${proxyUrl}`);
            
            try {
                const proxyRes = await fetch(proxyUrl, {
                    redirect: 'follow',
                    headers: {
                        'User-Agent': 'Sutraverse-Dev-Proxy/1.0',
                    },
                });
                
                if (!proxyRes.ok) {
                    console.warn(`[downloads] Production proxy returned ${proxyRes.status} for: ${relativePath}`);
                    return new NextResponse(`File not available (production returned ${proxyRes.status})`, { status: proxyRes.status });
                }
                
                const contentType = proxyRes.headers.get('content-type') || 'application/octet-stream';
                const contentDisposition = proxyRes.headers.get('content-disposition') || `attachment; filename="${filenameOnly}"`;
                const contentLength = proxyRes.headers.get('content-length');
                
                const response = new NextResponse(proxyRes.body);
                response.headers.set('Content-Type', contentType);
                response.headers.set('Content-Disposition', contentDisposition);
                if (contentLength) response.headers.set('Content-Length', contentLength);
                response.headers.set('X-Content-Type-Options', 'nosniff');
                response.headers.set('X-Served-By', 'dev-proxy');
                return response;
            } catch (proxyErr) {
                console.error(`[downloads] Production proxy failed:`, proxyErr.message);
                return new NextResponse(`File not found locally and production proxy failed: ${proxyErr.message}`, { status: 502 });
            }
        }

        // Collect debug info only in non-production environments
        if (process.env.NODE_ENV !== 'production') {
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

        return new NextResponse("File not found.", { status: 404 });
    }

    // ── Security boundary check ─────────────────────────────────────────
    let resolvedPath;
    try {
        resolvedPath = realpathSync(foundPath);
    } catch (e) {
        return new NextResponse("Forbidden: Invalid path resolution", { status: 403 });
    }

    const allowedRoots = [
        uploadsBase,
        join(appDir, 'public'),
        join(appDir, 'pyqs'),
    ].filter(existsSync).map(p => {
        try {
            const r = realpathSync(p);
            return r.endsWith(sep) ? r : r + sep;
        } catch (e) {
            return null;
        }
    }).filter(Boolean);

    const isAllowed = allowedRoots.some(root => resolvedPath.startsWith(root));

    if (!isAllowed) {
        return new NextResponse("Forbidden: Access denied", { status: 403 });
    }

    return serveFile(foundPath, relativePath);
}

async function serveFile(filePath, filename) {
    try {
        const stat = statSync(filePath);
        const stream = createReadStream(filePath);
        
        // Convert Node.js stream to Web ReadableStream with native backpressure
        const readableStream = Readable.toWeb(stream);

        const ext = filename.split('.').pop().toLowerCase();
        let contentType = 'application/octet-stream';
        let isSafeInline = false;
        if (ext === 'pdf') {
            contentType = 'application/pdf';
            isSafeInline = true;
        } else if (['jpg', 'jpeg'].includes(ext)) {
            contentType = 'image/jpeg';
            isSafeInline = true;
        } else if (ext === 'png') {
            contentType = 'image/png';
            isSafeInline = true;
        } else if (ext === 'webp') {
            contentType = 'image/webp';
            isSafeInline = true;
        } else if (ext === 'gif') {
            contentType = 'image/gif';
            isSafeInline = true;
        } else if (ext === 'txt') {
            contentType = 'text/plain';
            isSafeInline = true;
        } else if (['doc', 'docx'].includes(ext)) contentType = 'application/msword';
        else if (['ppt', 'pptx'].includes(ext)) contentType = 'application/vnd.ms-powerpoint';
        else if (ext === 'zip') contentType = 'application/zip';

        const response = new NextResponse(readableStream);
        response.headers.set('Content-Type', contentType);
        const disposition = isSafeInline ? 'inline' : 'attachment';
        response.headers.set('Content-Disposition', `${disposition}; filename="${filename.split('/').pop()}"`);
        response.headers.set('Content-Length', stat.size.toString());
        response.headers.set('X-Content-Type-Options', 'nosniff');

        return response;
    } catch (error) {
        console.error("Error reading file:", error);
        return new NextResponse("Error reading file", { status: 500 });
    }
}
