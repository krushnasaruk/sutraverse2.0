'use client';

import { useState, useEffect } from 'react';
import { useTeacher } from '../layout';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, addDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import styles from './page.module.css';

export default function MCQTestsPage() {
    const { selectedClass, user } = useTeacher();
    const [tests, setTests] = useState([]);
    
    // Creation State
    const [mode, setMode] = useState('manual'); // 'manual' or 'ai'
    const [title, setTitle] = useState('');
    const [dueDate, setDueDate] = useState('');
    
    // AI Form State
    const [aiTopic, setAiTopic] = useState('');
    const [aiCount, setAiCount] = useState(5);
    const [aiDifficulty, setAiDifficulty] = useState('medium');
    const [isGenerating, setIsGenerating] = useState(false);

    // Questions Builder State
    const [questions, setQuestions] = useState([]);
    const [status, setStatus] = useState({ text: '', type: '' });
    const [isSaving, setIsSaving] = useState(false);

    // Submissions State
    const [viewingTest, setViewingTest] = useState(null);
    const [submissions, setSubmissions] = useState([]);

    useEffect(() => {
        if (!selectedClass) return;
        const unsub = onSnapshot(query(collection(db, 'mcqTests'), where('classId', '==', selectedClass.classId)), (snap) => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
            setTests(data);
        });
        return () => unsub();
    }, [selectedClass]);

    const addEmptyQuestion = () => {
        setQuestions([...questions, { question: '', options: ['', '', '', ''], correctIndex: 0 }]);
    };

    const removeQuestion = (idx) => {
        setQuestions(questions.filter((_, i) => i !== idx));
    };

    const updateQuestion = (idx, field, value, optionIdx = null) => {
        const updated = [...questions];
        if (field === 'question') {
            updated[idx].question = value;
        } else if (field === 'option') {
            updated[idx].options[optionIdx] = value;
        } else if (field === 'correctIndex') {
            updated[idx].correctIndex = Number(value);
        }
        setQuestions(updated);
    };

    const handleGenerateAI = async () => {
        if (!aiTopic || !aiCount) return;
        setIsGenerating(true);
        setStatus({ text: 'Generating questions via AI...', type: 'info' });
        try {
            const res = await fetch('/api/generate-mcq', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    topic: aiTopic,
                    subject: selectedClass.subject,
                    difficulty: aiDifficulty,
                    count: Number(aiCount)
                })
            });
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            setQuestions(data.questions);
            setStatus({ text: 'AI Generation complete! You can edit them below.', type: 'success' });
        } catch (e) {
            setStatus({ text: 'Error generating: ' + e.message, type: 'error' });
        }
        setIsGenerating(false);
    };

    const publishTest = async () => {
        if (!title || !dueDate || questions.length === 0 || !selectedClass) {
            setStatus({ text: 'Please fill title, due date, and add at least one question.', type: 'error' });
            return;
        }

        // Validation
        for (let q of questions) {
            if (!q.question.trim() || q.options.some(opt => !opt.trim())) {
                setStatus({ text: 'Please fill all question texts and options.', type: 'error' });
                return;
            }
        }

        setIsSaving(true);
        try {
            await addDoc(collection(db, 'mcqTests'), {
                classId: selectedClass.classId,
                title,
                dueDate,
                questions,
                teacherId: user.uid,
                createdAt: new Date().toISOString()
            });
            setStatus({ text: 'MCQ Test Published Successfully!', type: 'success' });
            setTitle('');
            setDueDate('');
            setQuestions([]);
        } catch(e) {
            setStatus({ text: 'Error saving test: ' + e.message, type: 'error' });
        }
        setIsSaving(false);
    };

    const deleteTest = async (id) => {
        if (!window.confirm('Delete this MCQ Test?')) return;
        try { await deleteDoc(doc(db, 'mcqTests', id)); } catch(e) { console.error(e); }
    };

    const viewSubmissions = async (test) => {
        setViewingTest(test);
        setSubmissions([]);
        try {
            const snap = await getDocs(query(collection(db, 'mcqSubmissions'), where('testId', '==', test.id)));
            setSubmissions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) { console.error(e); }
    };

    if (!selectedClass) return <div className={styles.emptyState}><p>Select a class from the sidebar</p></div>;

    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1 className={styles.title}>MCQ Test Generator</h1>
                <p className={styles.subtitle}>{selectedClass.classId} — {selectedClass.subject}</p>
            </header>

            <div className={styles.card}>
                <div className={styles.cardTitle}>
                    <span>Create New Test</span>
                    <div className={styles.modeToggle}>
                        <button className={`${styles.modeBtn} ${mode === 'manual' ? styles.modeBtnActive : ''}`} onClick={() => setMode('manual')}>Manual</button>
                        <button className={`${styles.modeBtn} ${mode === 'ai' ? styles.modeBtnActive : ''}`} onClick={() => setMode('ai')}>✨ AI Generate</button>
                    </div>
                </div>

                <div className={styles.formRow}>
                    <input type="text" placeholder="Test Title (e.g. Unit 1 Quiz)" className={styles.input} value={title} onChange={e => setTitle(e.target.value)} />
                    <input type="datetime-local" className={styles.input} value={dueDate} onChange={e => setDueDate(e.target.value)} />
                </div>

                {mode === 'ai' && (
                    <div className={styles.formGrid} style={{ marginTop: '1rem', background: 'rgba(37, 99, 235, 0.1)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(37, 99, 235, 0.2)' }}>
                        <div className={styles.formRow}>
                            <input type="text" placeholder="Topic (e.g. Thermodynamics, Arrays)" className={styles.input} value={aiTopic} onChange={e => setAiTopic(e.target.value)} />
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <select className={styles.input} value={aiCount} onChange={e => setAiCount(e.target.value)}>
                                    <option value="5">5 Questions</option>
                                    <option value="10">10 Questions</option>
                                    <option value="15">15 Questions</option>
                                </select>
                                <select className={styles.input} value={aiDifficulty} onChange={e => setAiDifficulty(e.target.value)}>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                        </div>
                        <button className={styles.aiGenerateBtn} onClick={handleGenerateAI} disabled={isGenerating || !aiTopic}>
                            {isGenerating ? 'Generating...' : '✨ Generate Questions'}
                        </button>
                    </div>
                )}

                <div className={styles.questionBuilder}>
                    <h3 style={{ marginBottom: '1rem' }}>Questions ({questions.length})</h3>
                    {questions.map((q, idx) => (
                        <div key={idx} className={styles.questionItem}>
                            <button className={styles.removeQuestionBtn} onClick={() => removeQuestion(idx)}>✕ Remove</button>
                            <input 
                                type="text" 
                                placeholder={`Question ${idx + 1}`} 
                                className={styles.input} 
                                value={q.question}
                                onChange={(e) => updateQuestion(idx, 'question', e.target.value)}
                                style={{ marginBottom: '1rem', fontWeight: 'bold' }}
                            />
                            
                            <div className={styles.optionsGrid}>
                                {q.options.map((opt, optIdx) => (
                                    <div key={optIdx} className={styles.optionWrapper}>
                                        <input 
                                            type="radio" 
                                            name={`correct-${idx}`} 
                                            className={styles.optionRadio}
                                            checked={q.correctIndex === optIdx}
                                            onChange={() => updateQuestion(idx, 'correctIndex', optIdx)}
                                            title="Mark as correct answer"
                                        />
                                        <input 
                                            type="text" 
                                            placeholder={`Option ${optIdx + 1}`} 
                                            className={styles.input}
                                            value={opt}
                                            onChange={(e) => updateQuestion(idx, 'option', e.target.value, optIdx)}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                    
                    <button className={styles.btnSecondary} onClick={addEmptyQuestion} style={{ marginTop: '1rem', width: '100%' }}>
                        + Add Manual Question
                    </button>
                </div>

                {status.text && <p className={`${styles.statusMsg} ${status.type === 'error' ? styles.statusError : styles.statusSuccess}`}>{status.text}</p>}
                
                <div className={styles.publishActions}>
                    <button className={styles.btnPrimary} onClick={publishTest} disabled={isSaving || questions.length === 0}>
                        {isSaving ? 'Publishing...' : `Publish Test (${questions.length} Qs)`}
                    </button>
                </div>
            </div>

            <h3 style={{ marginBottom: '1rem' }}>Active Tests</h3>
            <div className={styles.testsList}>
                {tests.map(test => (
                    <div key={test.id} className={styles.testItem}>
                        <div className={styles.testInfo}>
                            <h4>{test.title}</h4>
                            <p className={styles.testMeta}>{test.questions?.length} Questions • Due: {new Date(test.dueDate).toLocaleString()}</p>
                        </div>
                        <div className={styles.testActions}>
                            <button className={styles.viewBtn} onClick={() => viewSubmissions(test)}>View Scores</button>
                            <button className={styles.deleteBtn} onClick={() => deleteTest(test.id)}>Delete</button>
                        </div>
                    </div>
                ))}
                {tests.length === 0 && <p style={{color: '#94a3b8'}}>No MCQ tests created yet.</p>}
            </div>

            {/* Submissions Panel */}
            {viewingTest && (
                <div className={styles.gradingPanel}>
                    <div className={styles.gradingHeader}>
                        <h3>Scores: {viewingTest.title}</h3>
                        <button className={styles.closeBtn} onClick={() => setViewingTest(null)}>✕</button>
                    </div>
                    {submissions.length === 0 ? <p style={{color: '#94a3b8'}}>No submissions yet.</p> : (
                        <div>
                            {submissions.map(sub => (
                                <div key={sub.id} className={styles.submissionCard}>
                                    <div className={styles.subInfo}>
                                        <strong>{sub.studentName}</strong>
                                        <div className={styles.subScore}>Score: {sub.score} / {sub.totalQuestions}</div>
                                        <span className={styles.subDate}>Submitted: {new Date(sub.submittedAt).toLocaleString()}</span>
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
