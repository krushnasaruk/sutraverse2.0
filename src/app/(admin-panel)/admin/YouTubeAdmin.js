'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { db } from '@/database/config/firebase';
import styles from './page.module.css';
import { IconCheck, IconX, IconCalendar } from '@/frontend/components/ui/Icons';
import { BRANCHES, YEARS, getSubjectsByYear } from '@/shared/constants/subjectMap';

function getYouTubeID(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

export default function YouTubeAdmin() {
    const [lectures, setLectures] = useState([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);
    
    // Form state
    const [title, setTitle] = useState('');
    const [url, setUrl] = useState('');
    const [branch, setBranch] = useState('Computer');
    const [year, setYear] = useState('1st Year');
    const [subject, setSubject] = useState('');
    const [unit, setUnit] = useState('Unit 1');
    
    useEffect(() => {
        fetchLectures();
    }, []);

    const fetchLectures = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, 'youtube_lectures'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            setLectures(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
            console.error('Error fetching lectures:', e);
        }
        setLoading(false);
    };

    const handleAdd = async (e) => {
        e.preventDefault();
        const videoId = getYouTubeID(url);
        if (!videoId) {
            alert('Invalid YouTube URL');
            return;
        }
        if (!title || !subject || !unit) {
            alert('Please fill all fields');
            return;
        }

        setAdding(true);
        try {
            const newDoc = {
                title,
                url,
                videoId,
                branch,
                year,
                subject,
                unit,
                createdAt: new Date().toISOString()
            };
            const docRef = await addDoc(collection(db, 'youtube_lectures'), newDoc);
            setLectures([{ id: docRef.id, ...newDoc }, ...lectures]);
            
            // Reset fields
            setTitle('');
            setUrl('');
            setUnit('Unit 1');
            alert('Lecture added successfully!');
        } catch (e) {
            console.error('Error adding lecture:', e);
            alert('Failed to add lecture');
        }
        setAdding(false);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this lecture?')) return;
        try {
            await deleteDoc(doc(db, 'youtube_lectures', id));
            setLectures(lectures.filter(l => l.id !== id));
        } catch (e) {
            console.error('Error deleting lecture:', e);
            alert('Failed to delete');
        }
    };

    const availableSubjects = getSubjectsByYear(branch, year) || [];

    // Set default subject when branch/year changes
    useEffect(() => {
        if (availableSubjects.length > 0 && !availableSubjects.includes(subject)) {
            setSubject(availableSubjects[0]);
        }
    }, [branch, year, availableSubjects, subject]);

    return (
        <div style={{ marginTop: '20px' }}>
            {/* Add Lecture Form */}
            <div className={styles.fileCard} style={{ marginBottom: '20px', padding: '24px' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '1.2rem' }}>▶️ Add YouTube Lecture</h3>
                <form onSubmit={handleAdd} style={{ display: 'grid', gap: '16px', gridTemplateColumns: '1fr 1fr' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Lecture Title</label>
                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. KVL and KCL Explained" style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)' }} required />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>YouTube URL</label>
                        <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=..." style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)' }} required />
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Branch</label>
                        <select value={branch} onChange={e => setBranch(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
                            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Year</label>
                        <select value={year} onChange={e => setYear(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Subject</label>
                        <select value={subject} onChange={e => setSubject(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)' }} required>
                            {availableSubjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Unit</label>
                        <select value={unit} onChange={e => setUnit(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-main)', color: 'var(--text-primary)' }}>
                            {[1,2,3,4,5,6].map(u => <option key={u} value={`Unit ${u}`}>Unit {u}</option>)}
                        </select>
                    </div>

                    <div style={{ gridColumn: '1 / -1', marginTop: '8px' }}>
                        <button type="submit" disabled={adding} className={styles.actionBtn} style={{ background: 'var(--primary)', color: 'white', padding: '12px 24px', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
                            {adding ? 'Adding...' : 'Add Lecture'}
                        </button>
                    </div>
                </form>
            </div>

            {/* List Lectures */}
            <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', padding: '0 8px' }}>Manage Lectures</h3>
            {loading ? (
                <div className={styles.loadingState}>Fetching lectures...</div>
            ) : lectures.length === 0 ? (
                <div className={styles.emptyState}>No lectures added yet.</div>
            ) : (
                <div className={styles.fileList}>
                    {lectures.map(l => (
                        <div key={l.id} className={styles.fileCard} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <img 
                                    src={`https://img.youtube.com/vi/${l.videoId}/mqdefault.jpg`} 
                                    alt={l.title} 
                                    style={{ width: '120px', height: '68px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border)' }} 
                                />
                                <div className={styles.fileInfo}>
                                    <div className={styles.fileTitle}>{l.title}</div>
                                    <div className={styles.fileMeta}>
                                        <span className={styles.metaTag}>{l.subject}</span>
                                        <span className={styles.metaTag}>{l.unit}</span>
                                        <span className={styles.metaTag}>{l.branch} • {l.year}</span>
                                    </div>
                                </div>
                            </div>
                            <button 
                                className={`${styles.actionBtn} ${styles.rejectBtn}`}
                                onClick={() => handleDelete(l.id)}
                            >
                                <IconX size={16} /> Delete
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
