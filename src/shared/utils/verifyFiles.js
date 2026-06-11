/**
 * Verifies which files from a list actually exist on the server.
 * Calls /api/verify-files with the file URLs and returns only available ones.
 * 
 * @param {Array} files - Array of file objects from Firestore (must have fileURL or fileUrl)
 * @returns {Promise<Array>} - Filtered array containing only files that exist on disk
 */
export async function filterAvailableFiles(files) {
    if (!files || files.length === 0) return [];

    // Extract URLs from file objects
    const urls = files.map(f => f.fileURL || f.fileUrl || '').filter(Boolean);

    // Firebase Storage URLs are always available — skip verification for those
    const firebaseFiles = files.filter(f => {
        const url = f.fileURL || f.fileUrl || '';
        return url.includes('firebasestorage.googleapis.com');
    });

    const localFiles = files.filter(f => {
        const url = f.fileURL || f.fileUrl || '';
        return url && !url.includes('firebasestorage.googleapis.com');
    });

    if (localFiles.length === 0) return files; // All Firebase, all available

    const localUrls = localFiles.map(f => f.fileURL || f.fileUrl);

    try {
        const res = await fetch('/api/verify-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ urls: localUrls }),
        });

        if (!res.ok) return files; // On error, show all files (don't hide anything)

        const { available } = await res.json();
        const availableSet = new Set(available);

        const verifiedLocalFiles = localFiles.filter(f => {
            const url = f.fileURL || f.fileUrl || '';
            return availableSet.has(url);
        });

        return [...firebaseFiles, ...verifiedLocalFiles];
    } catch (err) {
        console.warn('File verification failed, showing all files:', err.message);
        return files; // On network error, show all rather than hiding everything
    }
}
