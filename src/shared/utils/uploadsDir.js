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

    // Try finding the correct user-uploads folder in cPanel
    // If os.homedir() returns something like /home/username/webapp8, we should step back
    const defaultHome = os.homedir();
    const appDir = process.cwd();

    // Priority 1: Try the standard os.homedir() + user-uploads
    const path1 = path.join(defaultHome, 'user-uploads');
    if (require('fs').existsSync(path1)) {
        return path1;
    }

    // Second, if the app is inside webapp8, try stepping out one level
    // (from /home/username/webapp8 -> /home/username/user-uploads)
    const path2 = path.join(appDir, '..', 'user-uploads');
    if (require('fs').existsSync(path2)) {
        return path2;
    }

    // If we're inside .next/standalone, we might need to go back another level
    const path3 = path.join(__dirname, '..', '..', '..', '..', 'user-uploads');
    if (require('fs').existsSync(path3)) {
        return path3;
    }

    // Third, try finding it two levels up from current working directory just in case
    const path4 = path.join(appDir, '..', '..', 'user-uploads');
    if (require('fs').existsSync(path4)) {
        return path4;
    }

    // Default fallback
    return path1;
}
