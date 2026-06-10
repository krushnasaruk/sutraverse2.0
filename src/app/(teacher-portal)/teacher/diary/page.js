'use client';

import { useState, useEffect } from 'react';
import { useTeacher } from '../layout';
import { db } from '@/database/config/firebase';
import { collection, query, where, addDoc, getDocs, orderBy } from 'firebase/firestore';
import styles from './page.module.css';

export default function DiaryPage() {
    const { selectedClass, user } = useTeacher();
    const [entries, setEntries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState({ text: '', type: '' });
    const [isSaving, setIsSaving] = useState(false);

    // New entry form
    const [entryDate, setEntryDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [topicsCovered, setTopicsCovered] = useState('');
    const [chapterRef, setChapterRef] = useState('');
    const [teachingMode, setTeachingMode] = useState('lecture');
    const [homeAssignment, setHomeAssignment] = useState('');
    const [remarks, setRemarks] = useState('');

    useEffect(() => {
        if (!selectedClass) return;
        let cancelled = false;
        const fetchEntries = async () => {
            setLoading(true);
            try {
                const q = query(
                    collection(db, 'classDiary'),
                    where('classId', '==', selectedClass.classId),
                    where('subject', '==', selectedClass.subject)
                );
                const snap = await getDocs(q);
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
                if (!cancelled) setEntries(list);
            } catch(e) { console.error(e); }
            if (!cancelled) setLoading(false);
        };
        fetchEntries();
        return () => { cancelled = true; };
    }, [selectedClass]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!topicsCovered.trim()) return;
        setIsSaving(true);
        try {
            const entry = {
                classId: selectedClass.classId,
                subject: selectedClass.subject,
                date: entryDate,
                topicsCovered: topicsCovered.trim(),
                chapterRef: chapterRef.trim(),
                teachingMode,
                homeAssignment: homeAssignment.trim(),
                remarks: remarks.trim(),
                teacherEmail: user.email,
                teacherName: user.name || user.email,
                timestamp: new Date().toISOString()
            };
            const docRef = await addDoc(collection(db, 'classDiary'), entry);
            setEntries(prev => [{ id: docRef.id, ...entry }, ...prev]);
            setStatus({ text: 'Entry saved!', type: 'success' });
            setTopicsCovered(''); setChapterRef(''); setHomeAssignment(''); setRemarks('');
        } catch(e) { setStatus({ text: 'Error: ' + e.message, type: 'error' }); }
        setIsSaving(false);
    };

    const modeLabels = { lecture: '🎤 Lecture', lab: '🧪 Lab/Practical', tutorial: '📖 Tutorial', seminar: '🗣 Seminar', test: '📝 Class Test', revision: '🔄 Revision' };

    if (!selectedClass) return <div className={styles.emptyState}><p>Select a class from the sidebar</p></div>;

    return (
        <div className={styles.diaryPage}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Class Diary</h1>
                <p className={styles.pageSubtitle}>{selectedClass.classId} — {selectedClass.subject} — Daily teaching log</p>
            </header>

            {/* New Entry Form */}
            <div className={styles.formCard}>
                <h3 className={styles.cardTitle}>Log Today's Class</h3>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formRow}>
                        <div className={styles.formField}>
                            <label>Date</label>
                            <input type="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} className={styles.input} />
                        </div>
                        <div className={styles.formField}>
                            <label>Teaching Mode</label>
                            <select className={styles.select} value={teachingMode} onChange={e => setTeachingMode(e.target.value)}>
                                <option value="lecture">🎤 Lecture</option>
                                <option value="lab">🧪 Lab/Practical</option>
                                <option value="tutorial">📖 Tutorial</option>
                                <option value="seminar">🗣 Seminar</option>
                                <option value="test">📝 Class Test</option>
                                <option value="revision">🔄 Revision</option>
                            </select>
                        </div>
                        <div className={styles.formField}>
                            <label>Chapter / Unit Ref</label>
                            <input type="text" placeholder="e.g., Unit 2 - Thermodynamics" value={chapterRef} onChange={e => setChapterRef(e.target.value)} className={styles.input} />
                        </div>
                    </div>
                    <div className={styles.formField}>
                        <label>Topics Covered *</label>
                        <textarea placeholder="What was taught today? Separate multiple topics with commas..." rows={3} value={topicsCovered} onChange={e => setTopicsCovered(e.target.value)} className={styles.textarea} required />
                    </div>
                    <div className={styles.formField}>
                        <label>Home Assignment / Homework</label>
                        <input type="text" placeholder="e.g., Solve exercises 3.1 to 3.5" value={homeAssignment} onChange={e => setHomeAssignment(e.target.value)} className={styles.input} />
                    </div>
                    <div className={styles.formField}>
                        <label>Remarks</label>
                        <input type="text" placeholder="e.g., Students were attentive, lab equipment issues" value={remarks} onChange={e => setRemarks(e.target.value)} className={styles.input} />
                    </div>
                    {status.text && <p className={`${styles.statusMsg} ${status.type === 'error' ? styles.err : styles.suc}`}>{status.text}</p>}
                    <button type="submit" disabled={isSaving || !topicsCovered.trim()} className={styles.saveBtn}>{isSaving ? 'Saving...' : 'Save Entry'}</button>
                </form>
            </div>

            {/* Entries Timeline */}
            <h3 className={styles.sectionTitle}>Teaching Log ({entries.length} entries)</h3>
            {loading ? <div className={styles.loader}>Loading diary...</div> : entries.length === 0 ? <p className={styles.noData}>No diary entries yet. Start recording!</p> : (
                <div className={styles.timeline}>
                    {entries.map((entry, idx) => (
                        <div key={entry.id} className={styles.timelineItem}>
                            <div className={styles.timelineDot}></div>
                            <div className={styles.timelineCard}>
                                <div className={styles.timelineHeader}>
                                    <span className={styles.timelineDate}>{new Date(entry.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                    <span className={styles.modeBadge}>{modeLabels[entry.teachingMode] || entry.teachingMode}</span>
                                </div>
                                {entry.chapterRef && <span className={styles.chapterTag}>{entry.chapterRef}</span>}
                                <p className={styles.topicText}>{entry.topicsCovered}</p>
                                {entry.homeAssignment && (
                                    <div className={styles.hwBadge}>
                                        <span className={styles.hwIcon}>📚</span> {entry.homeAssignment}
                                    </div>
                                )}
                                {entry.remarks && <p className={styles.remarksText}>💬 {entry.remarks}</p>}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
