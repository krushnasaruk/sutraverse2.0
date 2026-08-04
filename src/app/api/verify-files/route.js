import { NextResponse } from 'next/server';
import { join, resolve } from 'path';
import { existsSync, statSync, readdirSync } from 'fs';
import os from 'os';
import { getUploadsDir } from '@/shared/utils/uploadsDir';
import { requireUser } from '@/backend/middlewares/requireUser';

/**
 * Build an index of ALL filenames on disk (Set for O(1) lookups).
 * Also stores full paths for exact path matching.
 */
function buildFileIndex(dir, maxDepth = 6, currentDepth = 0, index = { names: new Set(), paths: new Set() }) {
    if (currentDepth > maxDepth) return index;
    try {
        if (!existsSync(dir) || !statSync(dir).isDirectory()) return index;
        const entries = readdirSync(dir);
        const skip = new Set(['node_modules', '.next', '.git', 'cache', 'tmp', '.cache', '.npm']);
        
        for (const entry of entries) {
            if (skip.has(entry)) continue;
            const fullPath = join(dir, entry);
            try {
                const st = statSync(fullPath);
                if (st.isFile()) {
                    index.names.add(entry);              // Just the filename
                    index.paths.add(fullPath);            // Full absolute path
                } else if (st.isDirectory()) {
                    buildFileIndex(fullPath, maxDepth, currentDepth + 1, index);
                }
            } catch {}
        }
    } catch {}
    return index;
}

// Module-level cache to avoid rebuilding the index on every request
let cachedIndex = null;
let cacheTime = 0;
const CACHE_TTL = 36000000; // 10 hours cache

function getFileIndex(uploadsBase, appDir) {
    const now = Date.now();
    if (cachedIndex && (now - cacheTime) < CACHE_TTL) {
        return cachedIndex;
    }

    const index = { names: new Set(), paths: new Set() };

    // Index the uploads directory (includes user_uploads/)
    buildFileIndex(uploadsBase, 6, 0, index);

    // Index public directory (for pyqs etc)
    const publicDir = join(appDir, 'public');
    buildFileIndex(publicDir, 4, 0, index);

    cachedIndex = index;
    cacheTime = now;
    return index;
}

/**
 * Check if a relative path corresponds to a real file on disk.
 */
function fileExists(relativePath, index, uploadsBase, nestedUnderscore, nestedDash, appDir) {
    const filenameOnly = relativePath.split('/').pop();

    // Strategy 1: Check explicit paths (fast)
    const candidates = [
        join(uploadsBase, relativePath),
        join(nestedUnderscore, relativePath),
        join(nestedDash, relativePath),
        join(appDir, 'public', relativePath),
    ];

    if (relativePath.startsWith('pyqs/')) {
        const pyqRel = relativePath.replace(/^pyqs\//, '');
        candidates.push(
            join(appDir, 'public', 'pyqs', pyqRel),
            join(uploadsBase, 'pyqs', pyqRel),
            join(nestedUnderscore, 'pyqs', pyqRel),
        );
    }

    for (const p of candidates) {
        if (existsSync(p)) return true;
    }

    // Strategy 2: Check if the filename exists anywhere (via the index)
    if (filenameOnly && index.names.has(filenameOnly)) {
        return true;
    }

    return false;
}

/**
 * POST /api/verify-files
 * 
 * Accepts { urls: ["/api/downloads/path1", ...] }
 * Returns { available: ["/api/downloads/path1", ...] }
 * 
 * Builds a full file index once, then checks all URLs against it.
 */
export async function POST(request) {
    try {
        const { user, error: authError } = await requireUser(request, { admin: true });
        if (authError) return authError;

        const { urls } = await request.json();

        if (!Array.isArray(urls) || urls.length === 0) {
            return NextResponse.json({ available: [] });
        }

        const urlsToCheck = urls;

        const uploadsBase = resolve(getUploadsDir());
        const nestedUnderscore = join(uploadsBase, 'user_uploads');
        const nestedDash = join(uploadsBase, 'user-uploads');
        const appDir = process.cwd();

        // Build the file index ONCE (cached for 1 minute)
        const index = getFileIndex(uploadsBase, appDir);

        const available = [];

        for (const url of urlsToCheck) {
            if (!url) continue;

            // Firebase Storage URLs are always available
            if (url.includes('firebasestorage.googleapis.com')) {
                available.push(url);
                continue;
            }

            // Extract relative path from URL
            let relativePath = url;
            if (relativePath.startsWith('/')) relativePath = relativePath.substring(1);
            if (relativePath.includes('api/downloads/')) {
                relativePath = relativePath.split('api/downloads/')[1];
            }
            relativePath = relativePath.split('?')[0];

            try {
                relativePath = decodeURIComponent(relativePath);
            } catch {}

            if (!relativePath) continue;

            if (fileExists(relativePath, index, uploadsBase, nestedUnderscore, nestedDash, appDir)) {
                available.push(url);
            }
        }

        return NextResponse.json({ available, total: urlsToCheck.length, checked: index.names.size });
    } catch (err) {
        console.error('verify-files error:', err);
        return NextResponse.json({ available: urls || [], total: 0, checked: 0 });
    }
}
