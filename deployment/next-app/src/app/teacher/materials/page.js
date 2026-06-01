'use client';

import { useState } from 'react';
import { useTeacher } from '../layout';
import { db } from '@/lib/firebase';
import { collection, doc, setDoc } from 'firebase/firestore';
import styles from './page.module.css';

export default function MaterialsPage() {
    const { selectedClass, user } = useTeacher();
    const [uploadFile, setUploadFile] = useState(null);
    const [uploadTitle, setUploadTitle] = useState('');
    const [uploadType, setUploadType] = useState('Notes');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [status, setStatus] = useState({ text: '', type: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!uploadFile) return setStatus({ text: 'Select a file', type: 'error' });
        if (!uploadTitle.trim()) return setStatus({ text: 'Title required', type: 'error' });
        if (!selectedClass) return;

        setIsSaving(true);
        setUploadProgress(10);
        setStatus({ text: 'Uploading...', type: '' });

        try {
            // Build FormData for local server upload
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('context', 'teacher-material');

            // Simulate progress while uploading
            let simulatedProgress = 10;
            const progressInterval = setInterval(() => {
                simulatedProgress = Math.min(simulatedProgress + Math.random() * 15, 85);
                setUploadProgress(Math.round(simulatedProgress));
            }, 400);

            // Upload via local API route (no Firebase Storage needed)
            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData,
            });

            clearInterval(progressInterval);
            setUploadProgress(90);

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.error || 'Upload failed');
            }

            // Save metadata to Firestore
            await setDoc(doc(collection(db, 'files')), {
                title: uploadTitle.trim(), type: uploadType,
                subject: selectedClass.subject, classId: selectedClass.classId,
                uploaderName: user.name || user.email, uploaderUID: user.uid,
                fileUrl: data.fileURL, downloads: 0, rating: "0",
                status: "approved", createdAt: new Date().toISOString()
            });

            setUploadProgress(100);
            setStatus({ text: `Uploaded to ${selectedClass.classId}!`, type: 'success' });
            setUploadFile(null); setUploadTitle(''); setUploadProgress(0); setIsSaving(false);
        } catch(err) { setStatus({ text: 'Error: ' + err.message, type: 'error' }); setIsSaving(false); }
    };

    if (!selectedClass) return <div className={styles.emptyState}><p>Select a class from the sidebar</p></div>;

    return (
        <div className={styles.materialsPage}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Upload Material</h1>
                <p className={styles.pageSubtitle}>Upload directly to <strong>{selectedClass.classId}</strong>. Materials are automatically approved.</p>
            </header>

            <div className={styles.uploadCard}>
                <form onSubmit={handleUpload} className={styles.uploadForm}>
                    <div className={styles.formField}>
                        <label>Title</label>
                        <input type="text" placeholder="e.g., Chapter 1 Dynamics Notes" value={uploadTitle} onChange={e => setUploadTitle(e.target.value)} required className={styles.input} />
                    </div>
                    <div className={styles.formField}>
                        <label>Material Type</label>
                        <select className={styles.select} value={uploadType} onChange={e => setUploadType(e.target.value)}>
                            <option value="Notes">Notes</option>
                            <option value="PYQ">PYQs</option>
                            <option value="Assignment">Assignment</option>
                        </select>
                    </div>
                    <div className={styles.formField}>
                        <label>File (.pdf)</label>
                        <div className={styles.dropZone} onClick={() => document.getElementById('materialFileInput').click()}>
                            <span className={styles.dropIcon}>📄</span>
                            <span className={styles.dropText}>{uploadFile ? uploadFile.name : 'Click to select or drag a PDF here'}</span>
                            {!uploadFile && <span className={styles.dropHint}>Max: 25MB</span>}
                            <input id="materialFileInput" type="file" accept=".pdf" onChange={e => setUploadFile(e.target.files[0])} required className={styles.hiddenInput} />
                        </div>
                    </div>

                    {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className={styles.progressTrack}>
                            <div className={styles.progressFill} style={{ width: `${uploadProgress}%` }}></div>
                        </div>
                    )}

                    {status.text && <p className={`${styles.statusMsg} ${status.type === 'error' ? styles.statusError : styles.statusSuccess}`}>{status.text}</p>}

                    <button type="submit" disabled={isSaving} className={styles.uploadBtn}>
                        {isSaving ? `Uploading ${Math.round(uploadProgress)}%...` : 'Upload Material'}
                    </button>
                </form>
            </div>
        </div>
    );
}
