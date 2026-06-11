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

    const appDir = process.cwd();
    
    // Use true system home directory (os.userInfo().homedir) as it is unaffected by Passenger's HOME override
    let homeDir;
    try {
        homeDir = require('os').userInfo().homedir;
    } catch (e) {
        homeDir = require('os').homedir();
    }

    const possibleNames = ['user-uploads', 'user uploads', 'user_uploads', 'uploads'];

    for (const name of possibleNames) {
        // 1. In home dir (Primary persistent location)
        const p3 = path.join(homeDir, name);
        if (require('fs').existsSync(p3)) return p3;

        // 2. Adjacent to app dir (Secondary persistent location)
        const p2 = path.join(appDir, '..', name);
        if (require('fs').existsSync(p2)) return p2;

        // 3. Inside app dir
        const p1 = path.join(appDir, name);
        if (require('fs').existsSync(p1)) return p1;

        // 4. In public/
        const p4 = path.join(appDir, 'public', name);
        if (require('fs').existsSync(p4)) return p4;

        // 5. Standalone public/
        const p5 = path.join(appDir, '..', '..', 'public', name);
        if (require('fs').existsSync(p5)) return p5;
    }

    // Default fallback
    return path.join(appDir, 'public', 'uploads');
}
