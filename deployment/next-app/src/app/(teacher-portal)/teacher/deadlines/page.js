'use client';

import { useState, useEffect } from 'react';
import { useTeacher } from '../layout';
import { db } from '@/database/config/firebase';
import { collection, query, where, getDocs, doc, addDoc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import styles from './page.module.css';

export default function DeadlinesPage() {
    const { selectedClass, user } = useTeacher();
    const [deadlines, setDeadlines] = useState([]);
    const [deadlineTitle, setDeadlineTitle] = useState('');
    const [deadlineDesc, setDeadlineDesc] = useState('');
    const [deadlineDate, setDeadlineDate] = useState('');
    const [deadlineMaxMarks, setDeadlineMaxMarks] = useState('');
    const [status, setStatus] = useState({ text: '', type: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Grading
    const [gradingDeadline, setGradingDeadline] = useState(null);
    const [submissions, setSubmissions] = useState([]);
    const [gradingMarks, setGradingMarks] = useState({});

    useEffect(() => {
        if (!selectedClass) return;
        const unsub = onSnapshot(query(collection(db, 'deadlines'), where('classId', '==', selectedClass.classId)), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
            setDeadlines(data);
        });
        return () => unsub();
    }, [selectedClass]);

    const publishDeadline = async () => {
        if (!deadlineTitle || !deadlineDate || !selectedClass) return;
        setIsSaving(true);
        try {
            await addDoc(collection(db, 'deadlines'), {
                classId: selectedClass.classId, title: deadlineTitle, description: deadlineDesc,
                dueDate: deadlineDate, maxMarks: deadlineMaxMarks ? Number(deadlineMaxMarks) : null,
                teacherId: user.uid, createdAt: new Date().toISOString()
            });
            setStatus({ text: 'Deadline published!', type: 'success' });
            setDeadlineTitle(''); setDeadlineDesc(''); setDeadlineDate(''); setDeadlineMaxMarks('');
        } catch(e) { setStatus({ text: 'Error: ' + e.message, type: 'error' }); }
        setIsSaving(false);
    };

    const deleteDeadline = async (id) => {
        if (!window.confirm('Delete this deadline?')) return;
        try { await deleteDoc(doc(db, 'deadlines', id)); } catch(e) { console.error(e); }
    };

    const loadSubmissions = async (deadline) => {
        setGradingDeadline(deadline);
        setSubmissions([]); setGradingMarks({});
        try {
            const snap = await getDocs(query(collection(db, 'submissions'), where('deadlineId', '==', deadline.id)));
            setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch(e) { console.error(e); }
    };

    const submitGrade = async (sub) => {
        const marks = gradingMarks[sub.id];
        if (marks === undefined || marks === '') return;
        setIsSaving(true);
        try {
            await updateDoc(doc(db, 'submissions', sub.id), { marks: Number(marks), gradedAt: new Date().toISOString() });
            await fetch('/api/whatsapp', { method: 'POST', headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ studentPhone: sub.studentPhone||null, parentPhone: sub.parentPhone||null, studentName: sub.studentName, assignmentTitle: gradingDeadline.title, marks: { obtained: marks, max: gradingDeadline.maxMarks }})
            });
            setSubmissions(prev => prev.map(s => s.id === sub.id ? {...s, marks} : s));
            setStatus({ text: 'Grade saved & WhatsApp sent!', type: 'success' });
        } catch(e) { setStatus({ text: 'Error grading', type: 'error' }); }
        setIsSaving(false);
    };

    if (!selectedClass) return <div className={styles.emptyState}><p>Select a class from the sidebar</p></div>;

    return (
        <div className={styles.deadlinesPage}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Deadlines & Grading</h1>
                <p className={styles.pageSubtitle}>{selectedClass.classId} — {selectedClass.subject}</p>
            </header>

            {/* Create Deadline */}
            <div className={styles.createCard}>
                <h3 className={styles.cardTitle}>New Deadline</h3>
                <div className={styles.formGrid}>
                    <input type="text" placeholder="Title (e.g., Midterm Paper II)" className={styles.input} value={deadlineTitle} onChange={e => setDeadlineTitle(e.target.value)} />
                    <textarea placeholder="Description or guidelines (optional)" className={styles.input} rows={2} value={deadlineDesc} onChange={e => setDeadlineDesc(e.target.value)} />
                    <div className={styles.formRow}>
                        <div className={styles.formField}>
                            <label>Due Date</label>
                            <input type="datetime-local" className={styles.input} value={deadlineDate} onChange={e => setDeadlineDate(e.target.value)} />
                        </div>
                        <div className={styles.formField}>
                            <label>Max Marks</label>
                            <input type="number" placeholder="100" className={styles.input} value={deadlineMaxMarks} onChange={e => setDeadlineMaxMarks(e.target.value)} />
                        </div>
                    </div>
                    {status.text && <p className={`${styles.statusMsg} ${status.type === 'error' ? styles.statusError : styles.statusSuccess}`}>{status.text}</p>}
                    <button className={styles.publishBtn} onClick={publishDeadline} disabled={isSaving || !deadlineTitle || !deadlineDate}>
                        {isSaving ? 'Publishing...' : 'Publish Deadline'}
                    </button>
                </div>
            </div>

            {/* Active Deadlines */}
            <h3 className={styles.sectionTitle}>Active Deadlines</h3>
            <div className={styles.deadlinesList}>
                {deadlines.length > 0 ? deadlines.map(d => {
                    const isPast = new Date(d.dueDate) < new Date();
                    return (
                        <div key={d.id} className={`${styles.deadlineCard} ${isPast ? styles.expired : ''}`}>
                            <div className={styles.deadlineInfo}>
                                <strong className={styles.deadlineTitle}>{d.title}</strong>
                                {d.description && <p className={styles.deadlineDesc}>{d.description}</p>}
                                <span className={styles.deadlineDue}>
                                    {isPast ? '⚠️ Expired' : '⏰'} {new Date(d.dueDate).toLocaleString()}
                                </span>
                                {d.maxMarks && <span className={styles.marksTag}>Max: {d.maxMarks}</span>}
                            </div>
                            <div className={styles.deadlineActions}>
                                <button className={styles.deleteBtn} onClick={() => deleteDeadline(d.id)}>Delete</button>
                                {d.maxMarks && <button className={styles.gradeBtn} onClick={() => loadSubmissions(d)}>Grade</button>}
                            </div>
                        </div>
                    );
                }) : <p className={styles.noData}>No deadlines published yet.</p>}
            </div>

            {/* Grading Panel */}
            {gradingDeadline && (
                <div className={styles.gradingPanel}>
                    <div className={styles.gradingHeader}>
                        <h3>Grading: {gradingDeadline.title}</h3>
                        <button className={styles.closeBtn} onClick={() => setGradingDeadline(null)}>✕</button>
                    </div>
                    {submissions.length === 0 ? <p className={styles.noData}>No submissions yet.</p> : (
                        <div className={styles.submissionsList}>
                            {submissions.map(sub => (
                                <div key={sub.id} className={styles.submissionCard}>
                                    <div className={styles.subInfo}>
                                        <strong>{sub.studentName}</strong>
                                        <span className={styles.subEmail}>{sub.studentEmail}</span>
                                        <span className={styles.subDate}>Submitted: {new Date(sub.submittedAt).toLocaleString()}</span>
                                        {sub.fileUrl && <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.viewLink}>View submission →</a>}
                                    </div>
                                    <div className={styles.gradeBox}>
                                        {sub.marks !== undefined ? (
                                            <span className={styles.gradedBadge}>Graded: {sub.marks}/{gradingDeadline.maxMarks}</span>
                                        ) : (
                                            <div className={styles.gradeInput}>
                                                <input type="number" placeholder={`/${gradingDeadline.maxMarks}`} className={styles.marksInput} value={gradingMarks[sub.id] || ''} onChange={e => setGradingMarks({...gradingMarks, [sub.id]: e.target.value})} />
                                                <button className={styles.saveGradeBtn} onClick={() => submitGrade(sub)}>Save</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
