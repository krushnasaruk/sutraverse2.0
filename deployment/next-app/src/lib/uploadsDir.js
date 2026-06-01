import path from 'path';
import os from 'os';

/**
 * Returns the persistent uploads directory path.
 * 
 * In production (cPanel/VPS), files are stored OUTSIDE the app directory
 * so they survive code redeployments. Set the UPLOADS_DIR environment
 * variable to control the location.
 * 
 * Priority:
 *   1. UPLOADS_DIR env var  →  e.g. /home/username/user-uploads
 *   2. Fallback             →  ~/user-uploads (home directory)
 * 
 * In development (when UPLOADS_DIR is not set), uses ~/user-uploads
 * which is also outside the project, keeping behavior consistent.
 */
export function getUploadsDir() {
    if (process.env.UPLOADS_DIR) {
        return process.env.UPLOADS_DIR;
    }

    // Default: store in home directory, safe from app redeployments
    return path.join(os.homedir(), 'user-uploads');
}
