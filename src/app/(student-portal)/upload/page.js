'use client';

import { useState, useRef, useMemo } from 'react';
import Link from 'next/link';
import { collection, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '@/database/config/firebase';
import { useAuth } from '@/frontend/context/AuthContext';
import { awardUploadPoints } from '@/database/queries/points';
import { BRANCHES, YEARS, getSubjects, getAllSubjects } from '@/shared/constants/subjectMap';
import { ScrollReveal } from '@/frontend/components/ui/Animations';
import { IconLock, IconUpload } from '@/frontend/components/ui/Icons';
import styles from './page.module.css';

const UPLOAD_TYPES = [
    { key: 'Notes', emoji: '📝', label: 'Notes', desc: 'Lecture notes, handwritten or typed' },
    { key: 'PYQ', emoji: '📄', label: 'PYQ', desc: 'Past Year Question Papers' },
    { key: 'Assignment', emoji: '📋', label: 'Assignment', desc: 'Solved assignments & lab work' },
];

const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const ALLOWED_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'image/jpeg',
    'image/png',
    'video/mp4',
    'video/x-matroska'
];

function formatFileSize(bytes) {
    if (!bytes) return '—';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
}

function getFileIcon(name) {
    if (!name) return '📁';
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return '📕';
    if (['doc', 'docx'].includes(ext)) return '📘';
    if (['ppt', 'pptx'].includes(ext)) return '📙';
    if (['zip'].includes(ext)) return '📦';
    if (['jpg', 'jpeg', 'png'].includes(ext)) return '🖼️';
    return '📁';
}

export default function UploadPage() {
    const { user, loading: authLoading } = useAuth();

    // Step: 1 = type, 2 = metadata, 3 = file, 4 = uploading/success
    const [step, setStep] = useState(1);

    // Form state
    const [fileType, setFileType] = useState('');
    const [title, setTitle] = useState('');
    const [subject, setSubject] = useState('');
    const [branch, setBranch] = useState('');
    const [year, setYear] = useState('');

    // File state
    const [file, setFile] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef(null);

    // Upload state
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Get subjects based on user's profile or manual selection
    const subjectOptions = useMemo(() => {
        if (user?.branch && user?.semester) {
            const profileSubjects = getSubjects(user.branch, user.semester);
            if (profileSubjects.length > 0) return profileSubjects;
        }
        return getAllSubjects();
    }, [user]);

    // ── Auth Gate ────────────────────────────────────────────────────────────
    if (authLoading) {
        return (
            <div style={{ paddingTop: '200px', textAlign: 'center', color: 'var(--text-muted)' }}>
                Authenticating...
            </div>
        );
    }

    if (!user) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.lockState}>
                    <div className={styles.lockIcon}><IconLock size={56} /></div>
                    <h2 className={styles.lockTitle}>Sign In Required</h2>
                    <p className={styles.lockDesc}>You need to be signed in to upload materials.</p>
                    <Link href="/login" className={styles.lockBtn}>Sign In</Link>
                </div>
            </div>
        );
    }

    // ── File Handlers ────────────────────────────────────────────────────────
    const handleFileSelect = (selectedFile) => {
        setError('');
        if (!selectedFile) return;

        if (selectedFile.size > MAX_FILE_SIZE) {
            setError(`File too large. Maximum size is ${formatFileSize(MAX_FILE_SIZE)}.`);
            return;
        }

        if (!ALLOWED_TYPES.includes(selectedFile.type)) {
            setError('Unsupported file type. Please upload PDF, DOC, PPT, ZIP, JPG, or PNG.');
            return;
        }

        setFile(selectedFile);
    };

    const handleDragOver = (e) => { e.preventDefault(); setDragActive(true); };
    const handleDragLeave = (e) => { e.preventDefault(); setDragActive(false); };
    const handleDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        if (e.dataTransfer.files?.[0]) {
            handleFileSelect(e.dataTransfer.files[0]);
        }
    };

    // ── Step Validation ──────────────────────────────────────────────────────
    const canProceedStep2 = fileType !== '';
    const canProceedStep3 = title.trim() !== '' && subject !== '';
    const canSubmit = file !== null;

    // ── Upload via Server API to cPanel Disk ─────────────────────────────────
    const handleSubmit = async () => {
        if (!file || !user || uploading) return;
        setUploading(true);
        setError('');
        setProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('context', fileType); // Use Notes, PYQ, or Assignment

            const xhr = new XMLHttpRequest();

            // Track upload progress
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const pct = Math.round((event.loaded / event.total) * 100);
                    // Cap at 99% until server finishes processing
                    setProgress(pct === 100 ? 99 : pct);
                }
            };

            xhr.onload = async () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const response = JSON.parse(xhr.responseText);
                        const downloadURL = response.fileURL;

                        // Save file metadata to Firestore (making it accessible to mobile/admin)
                        await setDoc(doc(collection(db, 'files')), {
                            title: title.trim(),
                            type: fileType,
                            subject: subject,
                            branch: branch || user.branch || 'Computer',
                            year: year || user.year || '1st Year',
                            uploaderUID: user.uid,
                            uploaderName: user.name || 'Anonymous',
                            uploaderEmail: user.email || '',
                            fileUrl: downloadURL, // Hosted on cPanel Disk
                            fileName: file.name,
                            fileSize: file.size,
                            downloads: 0,
                            rating: "0",
                            status: 'pending',
                            createdAt: new Date().toISOString(),
                        });

                        // Award XP for uploading
                        try {
                            await awardUploadPoints(user.uid);
                        } catch (e) {
                            console.warn('XP award failed:', e.message);
                        }

                        setProgress(100);
                        setSuccess(true);
                        setUploading(false);
                    } catch (err) {
                        console.error('Firestore save error:', err);
                        setError('Failed to register file: ' + err.message);
                        setUploading(false);
                    }
                } else {
                    try {
                        const errRes = JSON.parse(xhr.responseText);
                        setError('Upload failed: ' + (errRes.error || xhr.statusText));
                    } catch(e) {
                        setError('Upload failed with status ' + xhr.status);
                    }
                    setUploading(false);
                }
            };

            xhr.onerror = () => {
                setError('Network error occurred during upload. Check connection or file size limit.');
                setUploading(false);
            };

            // Retrieve Firebase Auth ID Token for security validation
            const idToken = await auth.currentUser?.getIdToken(true);
            if (!idToken) {
                setError('Authentication error. Please sign in again.');
                setUploading(false);
                return;
            }

            xhr.open('POST', '/api/upload');
            xhr.setRequestHeader('Authorization', `Bearer ${idToken}`);
            xhr.send(formData);
        } catch (err) {
            console.error('Initiation error:', err);
            setError('Upload initiation failed: ' + (err.message || 'Unknown error'));
            setUploading(false);
        }
    };

    // ── Reset form for another upload ────────────────────────────────────────
    const resetForm = () => {
        setStep(1);
        setFileType('');
        setTitle('');
        setSubject('');
        setBranch('');
        setYear('');
        setFile(null);
        setUploading(false);
        setProgress(0);
        setError('');
        setSuccess(false);
    };

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className={styles.pageWrapper}>
            {/* ── Hero ── */}
            <div className={styles.hero}>
                <div className="container">
                    <ScrollReveal>
                        <h1 className={styles.heroTitle}>
                            <span className={styles.heroEmoji}>📤</span> Upload
                        </h1>

                    </ScrollReveal>
                </div>
            </div>

            <div className="container">
                <ScrollReveal delay={100}>
                    <div className={styles.uploadCard}>

                        {/* ── Success State ── */}
                        {success ? (
                            <div className={styles.successState}>
                                <div className={styles.successIcon}>🎉</div>
                                <h2 className={styles.successTitle}>Upload Successful!</h2>
                                <p className={styles.successSub}>
                                    Your <strong>{fileType}</strong> has been submitted for review.<br />
                                    It will appear on the platform once approved by an admin.
                                </p>
                                <div className={styles.successXP}>⭐ +50 XP Earned</div>
                                <div className={styles.successActions}>
                                    <button onClick={resetForm} className={styles.btnSecondary}>
                                        Upload Another
                                    </button>
                                    <Link href="/dashboard" className={styles.btnPrimary}>
                                        Go to Dashboard
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <>
                                {/* ── Step Indicators ── */}
                                <div className={styles.stepIndicator}>
                                    {[1, 2, 3].map((s, i) => (
                                        <span key={s}>
                                            <span className={`${styles.stepDot} ${step === s ? styles.stepDotActive : ''} ${step > s ? styles.stepDotDone : ''}`} />
                                            {i < 2 && <span className={`${styles.stepLine} ${step > s ? styles.stepLineDone : ''}`} />}
                                        </span>
                                    ))}
                                </div>

                                {/* ── STEP 1: Choose Type ── */}
                                {step === 1 && (
                                    <>
                                        <h3 className={styles.sectionTitle}>What are you uploading?</h3>
                                        <div className={styles.typeGrid}>
                                            {UPLOAD_TYPES.map(t => (
                                                <button
                                                    key={t.key}
                                                    className={`${styles.typeCard} ${fileType === t.key ? styles.typeCardActive : ''}`}
                                                    onClick={() => setFileType(t.key)}
                                                >
                                                    <span className={styles.typeEmoji}>{t.emoji}</span>
                                                    <span className={styles.typeLabel}>{t.label}</span>
                                                    <span className={styles.typeDesc}>{t.desc}</span>
                                                </button>
                                            ))}
                                        </div>
                                        <div className={styles.actions}>
                                            <button
                                                className={styles.btnNext}
                                                disabled={!canProceedStep2}
                                                onClick={() => setStep(2)}
                                            >
                                                Continue →
                                            </button>
                                        </div>
                                    </>
                                )}

                                {/* ── STEP 2: Metadata ── */}
                                {step === 2 && (
                                    <>
                                        <h3 className={styles.sectionTitle}>Fill in the details</h3>
                                        <div className={styles.formGrid}>
                                            <div className={`${styles.formField} ${styles.formFieldFull}`}>
                                                <label className={styles.formLabel}>Title *</label>
                                                <input
                                                    type="text"
                                                    className={styles.formInput}
                                                    placeholder={
                                                        fileType === 'PYQ'
                                                            ? 'e.g. Engineering Mathematics I — Nov/Dec 2023'
                                                            : fileType === 'Assignment'
                                                            ? 'e.g. Data Structures Lab Assignment 5'
                                                            : 'e.g. Engineering Physics Unit 3 Notes'
                                                    }
                                                    value={title}
                                                    onChange={(e) => setTitle(e.target.value)}
                                                    maxLength={120}
                                                />
                                            </div>

                                            <div className={styles.formField}>
                                                <label className={styles.formLabel}>Subject *</label>
                                                <select
                                                    className={styles.formSelect}
                                                    value={subject}
                                                    onChange={(e) => setSubject(e.target.value)}
                                                >
                                                    <option value="">Select Subject</option>
                                                    {subjectOptions.map(s => (
                                                        <option key={s} value={s}>{s}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className={styles.formField}>
                                                <label className={styles.formLabel}>Branch</label>
                                                <select
                                                    className={styles.formSelect}
                                                    value={branch || user.branch || ''}
                                                    onChange={(e) => setBranch(e.target.value)}
                                                >
                                                    <option value="">Select Branch</option>
                                                    {BRANCHES.map(b => (
                                                        <option key={b} value={b}>{b}</option>
                                                    ))}
                                                </select>
                                            </div>

                                            <div className={styles.formField}>
                                                <label className={styles.formLabel}>Year</label>
                                                <select
                                                    className={styles.formSelect}
                                                    value={year || user.year || ''}
                                                    onChange={(e) => setYear(e.target.value)}
                                                >
                                                    <option value="">Select Year</option>
                                                    {YEARS.map(y => (
                                                        <option key={y} value={y}>{y}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {error && <div className={styles.errorMsg}>⚠️ {error}</div>}

                                        <div className={styles.actions}>
                                            <button className={styles.btnBack} onClick={() => setStep(1)}>← Back</button>
                                            <button
                                                className={styles.btnNext}
                                                disabled={!canProceedStep3}
                                                onClick={() => { setError(''); setStep(3); }}
                                            >
                                                Continue →
                                            </button>
                                        </div>
                                    </>
                                )}

                                {/* ── STEP 3: File Upload ── */}
                                {step === 3 && (
                                    <>
                                        <h3 className={styles.sectionTitle}>Upload your file</h3>

                                        {/* Drop zone */}
                                        <div
                                            className={`${styles.dropZone} ${dragActive ? styles.dropZoneActive : ''} ${file ? styles.dropZoneHasFile : ''}`}
                                            onClick={() => fileInputRef.current?.click()}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                        >
                                            <input
                                                ref={fileInputRef}
                                                type="file"
                                                accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.jpg,.jpeg,.png"
                                                style={{ display: 'none' }}
                                                onChange={(e) => handleFileSelect(e.target.files?.[0])}
                                            />
                                            {!file ? (
                                                <>
                                                    <span className={styles.dropIcon}>📁</span>
                                                    <div className={styles.dropTitle}>
                                                        {dragActive ? 'Drop it here!' : 'Drag & drop your file here'}
                                                    </div>
                                                    <div className={styles.dropSubtext}>
                                                        or <span className={styles.dropBrowse}>browse files</span>
                                                        <br />
                                                        PDF, DOC, PPT, ZIP, JPG, PNG, MP4 · Max 100 MB
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <span className={styles.dropIcon}>{getFileIcon(file.name)}</span>
                                                    <div className={styles.dropTitle}>File selected!</div>
                                                    <div className={styles.dropSubtext}>Click to change file</div>
                                                </>
                                            )}
                                        </div>

                                        {/* File preview */}
                                        {file && (
                                            <div className={styles.filePreview}>
                                                <div className={styles.filePreviewIcon}>{getFileIcon(file.name)}</div>
                                                <div className={styles.filePreviewInfo}>
                                                    <div className={styles.filePreviewName}>{file.name}</div>
                                                    <div className={styles.filePreviewSize}>{formatFileSize(file.size)}</div>
                                                </div>
                                                <button
                                                    className={styles.fileRemoveBtn}
                                                    onClick={(e) => { e.stopPropagation(); setFile(null); }}
                                                    title="Remove file"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}

                                        {/* Upload progress */}
                                        {uploading && (
                                            <div className={styles.progressWrap}>
                                                <div className={styles.progressLabel}>
                                                    <span>Uploading...</span>
                                                    <span>{progress}%</span>
                                                </div>
                                                <div className={styles.progressTrack}>
                                                    <div className={styles.progressFill} style={{ width: `${progress}%` }} />
                                                </div>
                                            </div>
                                        )}

                                        {error && <div className={styles.errorMsg}>⚠️ {error}</div>}

                                        <div className={styles.actions}>
                                            <button className={styles.btnBack} onClick={() => setStep(2)} disabled={uploading}>
                                                ← Back
                                            </button>
                                            <button
                                                className={styles.btnSubmit}
                                                disabled={!canSubmit || uploading}
                                                onClick={handleSubmit}
                                            >
                                                {uploading ? `Uploading ${progress}%...` : '🚀 Submit for Review'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </>
                        )}
                    </div>
                </ScrollReveal>
            </div>
        </div>
    );
}
