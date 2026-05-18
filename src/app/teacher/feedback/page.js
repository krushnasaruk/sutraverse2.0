'use client';

import { useState, useEffect } from 'react';
import { useTeacher } from '../layout';
import { db } from '@/lib/firebase';
import { collection, query, where, addDoc, getDocs, doc, setDoc } from 'firebase/firestore';
import styles from './page.module.css';

export default function FeedbackPage() {
    const { selectedClass, user } = useTeacher();
    const [forms, setForms] = useState([]);
    const [responses, setResponses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState({ text: '', type: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [viewingForm, setViewingForm] = useState(null);

    // Create form state
    const [formTitle, setFormTitle] = useState('');
    const [formQuestions, setFormQuestions] = useState([
        { text: 'How would you rate the overall teaching quality?', type: 'rating' },
        { text: 'Was the pace of the lecture appropriate?', type: 'rating' },
        { text: 'Were the study materials helpful?', type: 'rating' },
    ]);
    const [newQuestion, setNewQuestion] = useState('');
    const [newQType, setNewQType] = useState('rating');
    const [isActive, setIsActive] = useState(true);

    useEffect(() => {
        if (!selectedClass) return;
        let cancelled = false;
        const fetchForms = async () => {
            setLoading(true);
            try {
                const snap = await getDocs(query(
                    collection(db, 'feedbackForms'),
                    where('classId', '==', selectedClass.classId),
                    where('subject', '==', selectedClass.subject)
                ));
                const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
                list.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
                if (!cancelled) setForms(list);
            } catch(e) { console.error(e); }
            if (!cancelled) setLoading(false);
        };
        fetchForms();
        return () => { cancelled = true; };
    }, [selectedClass]);

    const addQuestion = () => {
        if (!newQuestion.trim()) return;
        setFormQuestions(prev => [...prev, { text: newQuestion.trim(), type: newQType }]);
        setNewQuestion('');
    };

    const removeQuestion = (idx) => {
        setFormQuestions(prev => prev.filter((_, i) => i !== idx));
    };

    const publishForm = async () => {
        if (!formTitle.trim() || formQuestions.length === 0) return;
        setIsSaving(true);
        try {
            const form = {
                classId: selectedClass.classId,
                subject: selectedClass.subject,
                title: formTitle.trim(),
                questions: formQuestions,
                isActive,
                teacherEmail: user.email,
                teacherName: user.name || user.email,
                timestamp: new Date().toISOString(),
                responseCount: 0
            };
            const docRef = await addDoc(collection(db, 'feedbackForms'), form);
            setForms(prev => [{ id: docRef.id, ...form }, ...prev]);
            setStatus({ text: 'Form published!', type: 'success' });
            setFormTitle('');
            setFormQuestions([
                { text: 'How would you rate the overall teaching quality?', type: 'rating' },
                { text: 'Was the pace of the lecture appropriate?', type: 'rating' },
                { text: 'Were the study materials helpful?', type: 'rating' },
            ]);
        } catch(e) { setStatus({ text: 'Error: ' + e.message, type: 'error' }); }
        setIsSaving(false);
    };

    const viewResponses = async (form) => {
        setViewingForm(form);
        try {
            const snap = await getDocs(query(collection(db, 'feedbackResponses'), where('formId', '==', form.id)));
            const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            setResponses(list);
        } catch(e) { console.error(e); }
    };

    const toggleFormActive = async (form) => {
        try {
            await setDoc(doc(db, 'feedbackForms', form.id), { isActive: !form.isActive }, { merge: true });
            setForms(prev => prev.map(f => f.id === form.id ? { ...f, isActive: !f.isActive } : f));
        } catch(e) { console.error(e); }
    };

    // Aggregate ratings
    const getAggregates = () => {
        if (!viewingForm || responses.length === 0) return null;
        const agg = {};
        viewingForm.questions.forEach((q, qi) => {
            if (q.type === 'rating') {
                const vals = responses.map(r => r.answers?.[qi]).filter(v => typeof v === 'number');
                const avg = vals.length > 0 ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : 0;
                agg[qi] = { avg, count: vals.length, distribution: [1,2,3,4,5].map(star => vals.filter(v => v === star).length) };
            }
        });
        return agg;
    };
    const aggregates = viewingForm ? getAggregates() : null;

    if (!selectedClass) return <div className={styles.emptyState}><p>Select a class from the sidebar</p></div>;

    return (
        <div className={styles.feedbackPage}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Student Feedback</h1>
                <p className={styles.pageSubtitle}>{selectedClass.classId} — Collect anonymous feedback from students</p>
            </header>

            {/* Create Form */}
            <div className={styles.formCard}>
                <h3 className={styles.cardTitle}>Create Feedback Form</h3>
                <div className={styles.form}>
                    <div className={styles.formField}>
                        <label>Form Title</label>
                        <input type="text" placeholder="e.g., Mid-Semester Feedback" value={formTitle} onChange={e => setFormTitle(e.target.value)} className={styles.input} />
                    </div>

                    <div className={styles.questionsSection}>
                        <label className={styles.fieldLabel}>Questions ({formQuestions.length})</label>
                        {formQuestions.map((q, i) => (
                            <div key={i} className={styles.questionItem}>
                                <div className={styles.qInfo}>
                                    <span className={styles.qNum}>Q{i + 1}</span>
                                    <span className={styles.qText}>{q.text}</span>
                                    <span className={styles.qType}>{q.type === 'rating' ? '⭐ 1-5' : '✍️ Text'}</span>
                                </div>
                                <button onClick={() => removeQuestion(i)} className={styles.removeBtn}>✕</button>
                            </div>
                        ))}
                        <div className={styles.addRow}>
                            <input type="text" placeholder="Add a question..." value={newQuestion} onChange={e => setNewQuestion(e.target.value)} className={styles.addInput} onKeyDown={e => e.key === 'Enter' && addQuestion()} />
                            <select className={styles.typeSelect} value={newQType} onChange={e => setNewQType(e.target.value)}>
                                <option value="rating">⭐ Rating</option>
                                <option value="text">✍️ Text</option>
                            </select>
                            <button onClick={addQuestion} className={styles.addBtn}>+ Add</button>
                        </div>
                    </div>

                    <div className={styles.activeToggle}>
                        <label>
                            <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} />
                            <span>Accepting responses immediately</span>
                        </label>
                    </div>

                    {status.text && <p className={`${styles.statusMsg} ${status.type === 'error' ? styles.err : styles.suc}`}>{status.text}</p>}
                    <button onClick={publishForm} disabled={isSaving || !formTitle.trim() || formQuestions.length === 0} className={styles.publishBtn}>
                        {isSaving ? 'Publishing...' : 'Publish Form'}
                    </button>
                </div>
            </div>

            {/* Existing Forms */}
            <h3 className={styles.sectionTitle}>Published Forms</h3>
            {loading ? <div className={styles.loader}>Loading forms...</div> : forms.length === 0 ? <p className={styles.noData}>No feedback forms yet.</p> : (
                <div className={styles.formsGrid}>
                    {forms.map(f => (
                        <div key={f.id} className={styles.formCardSmall}>
                            <div className={styles.formCardHeader}>
                                <h4 className={styles.formCardTitle}>{f.title}</h4>
                                <span className={`${styles.statusTag} ${f.isActive ? styles.tagActive : styles.tagClosed}`}>
                                    {f.isActive ? 'Active' : 'Closed'}
                                </span>
                            </div>
                            <p className={styles.formCardSub}>{f.questions.length} questions • {f.responseCount || 0} responses</p>
                            <p className={styles.formCardDate}>{new Date(f.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                            <div className={styles.formCardActions}>
                                <button onClick={() => viewResponses(f)} className={styles.viewBtn}>View Results</button>
                                <button onClick={() => toggleFormActive(f)} className={styles.toggleBtn}>{f.isActive ? 'Close' : 'Reopen'}</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Results Modal */}
            {viewingForm && (
                <div className={styles.resultsPanel}>
                    <div className={styles.resultsHeader}>
                        <h3>Results: {viewingForm.title}</h3>
                        <button onClick={() => setViewingForm(null)} className={styles.closeBtn}>✕</button>
                    </div>
                    <p className={styles.responseCount}>{responses.length} total responses</p>

                    {responses.length === 0 ? <p className={styles.noData}>No responses yet.</p> : (
                        <div className={styles.resultsList}>
                            {viewingForm.questions.map((q, qi) => (
                                <div key={qi} className={styles.resultItem}>
                                    <h4 className={styles.resultQuestion}>Q{qi + 1}: {q.text}</h4>
                                    {q.type === 'rating' && aggregates?.[qi] ? (
                                        <div className={styles.ratingResult}>
                                            <span className={styles.avgScore}>{aggregates[qi].avg}</span>
                                            <span className={styles.avgLabel}>/ 5 avg ({aggregates[qi].count} votes)</span>
                                            <div className={styles.starDist}>
                                                {[5,4,3,2,1].map(star => (
                                                    <div key={star} className={styles.starRow}>
                                                        <span className={styles.starLabel}>{star}★</span>
                                                        <div className={styles.starBar}>
                                                            <div className={styles.starFill} style={{width: `${aggregates[qi].count > 0 ? (aggregates[qi].distribution[star-1]/aggregates[qi].count)*100 : 0}%`}}></div>
                                                        </div>
                                                        <span className={styles.starCount}>{aggregates[qi].distribution[star-1]}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={styles.textResponses}>
                                            {responses.map((r, ri) => r.answers?.[qi] && (
                                                <div key={ri} className={styles.textBubble}>"{r.answers[qi]}"</div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
