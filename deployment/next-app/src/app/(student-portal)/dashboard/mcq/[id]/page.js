'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { db } from '@/database/config/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '@/frontend/context/AuthContext';
import styles from './page.module.css';

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export default function MCQTestPage() {
    const params = useParams();
    const testId = params.id;
    const { user } = useAuth();

    const [test, setTest] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Test State
    const [answers, setAnswers] = useState({}); // { questionIndex: selectedOptionIndex }
    const [submitted, setSubmitted] = useState(false);
    const [score, setScore] = useState(0);
    const [alreadySubmitted, setAlreadySubmitted] = useState(null);

    useEffect(() => {
        if (!testId || !user) return;

        const loadTest = async () => {
            setLoading(true);
            try {
                // Fetch the test document
                const testDoc = await getDoc(doc(db, 'mcqTests', testId));
                if (!testDoc.exists()) {
                    setError('Test not found.');
                    setLoading(false);
                    return;
                }
                setTest({ id: testDoc.id, ...testDoc.data() });

                // Check if already submitted
                const subSnap = await getDocs(
                    query(collection(db, 'mcqSubmissions'), 
                        where('testId', '==', testId), 
                        where('studentEmail', '==', user.email)
                    )
                );
                if (!subSnap.empty) {
                    const existingSub = { id: subSnap.docs[0].id, ...subSnap.docs[0].data() };
                    setAlreadySubmitted(existingSub);
                    setAnswers(existingSub.answers || {});
                    setScore(existingSub.score);
                    setSubmitted(true);
                }
            } catch (e) {
                console.error(e);
                setError('Failed to load test: ' + e.message);
            }
            setLoading(false);
        };

        loadTest();
    }, [testId, user]);

    const selectAnswer = (questionIdx, optionIdx) => {
        if (submitted) return;
        setAnswers(prev => ({ ...prev, [questionIdx]: optionIdx }));
    };

    const handleSubmit = async () => {
        if (!test || submitted) return;
        if (!window.confirm(`Submit your test? You answered ${Object.keys(answers).length} of ${test.questions.length} questions.`)) return;

        // Calculate score
        let correct = 0;
        test.questions.forEach((q, idx) => {
            if (answers[idx] === q.correctIndex) {
                correct++;
            }
        });

        setScore(correct);
        setSubmitted(true);

        // Save to Firestore
        try {
            await addDoc(collection(db, 'mcqSubmissions'), {
                testId: test.id,
                studentEmail: user.email,
                studentName: user.name || 'Anonymous',
                classId: test.classId,
                answers: answers,
                score: correct,
                totalQuestions: test.questions.length,
                submittedAt: new Date().toISOString()
            });
        } catch (e) {
            console.error('Failed to save submission:', e);
        }
    };

    const getOptionClass = (qIdx, optIdx) => {
        if (!submitted) {
            return answers[qIdx] === optIdx ? styles.optionSelected : '';
        }
        // After submission: show correct/wrong
        const isCorrect = test.questions[qIdx].correctIndex === optIdx;
        const wasSelected = answers[qIdx] === optIdx;

        if (isCorrect) return styles.optionCorrect;
        if (wasSelected && !isCorrect) return styles.optionWrong;
        return '';
    };

    if (loading) return <div className={styles.loadingState}>Loading test...</div>;
    if (error) return (
        <div className={styles.errorState}>
            <span>{error}</span>
            <Link href="/dashboard" className={styles.backBtn}>← Back to Dashboard</Link>
        </div>
    );
    if (!test) return null;

    const answeredCount = Object.keys(answers).length;
    const totalQuestions = test.questions.length;
    const progressPct = submitted ? 100 : Math.round((answeredCount / totalQuestions) * 100);
    const scorePct = totalQuestions > 0 ? Math.round((score / totalQuestions) * 100) : 0;

    return (
        <div className={styles.testPage}>
            <div className={styles.testInner}>
                <header className={styles.testHeader}>
                    <Link href="/dashboard" className={styles.backLink}>← Back to Dashboard</Link>
                    <h1 className={styles.testTitle}>{test.title}</h1>
                    <p className={styles.testMeta}>{totalQuestions} Questions • Due: {new Date(test.dueDate).toLocaleString()}</p>
                    <div className={styles.progressBar}>
                        <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
                    </div>
                </header>

                {/* Results Card (shown after submission) */}
                {submitted && (
                    <div className={styles.resultsCard}>
                        <div className={styles.scoreCircle} style={{
                            borderColor: scorePct >= 70 ? '#22c55e' : scorePct >= 40 ? '#f59e0b' : '#ef4444'
                        }}>
                            <div className={styles.scoreNum}>{score}</div>
                            <div className={styles.scoreLabel}>out of {totalQuestions}</div>
                        </div>
                        <div className={styles.scorePct}>{scorePct}%</div>
                        <div className={styles.scoreMsg}>
                            {scorePct >= 80 ? 'Excellent work! 🎉' :
                             scorePct >= 60 ? 'Good job! Keep going 👍' :
                             scorePct >= 40 ? 'Fair attempt. Review the answers below.' :
                             'Needs improvement. Study the correct answers below.'}
                        </div>
                    </div>
                )}

                {submitted && <h3 className={styles.reviewHeader}>Answer Review</h3>}

                {/* Questions */}
                {test.questions.map((q, qIdx) => (
                    <div key={qIdx} className={styles.questionCard}>
                        <div className={styles.questionNum}>Question {qIdx + 1} of {totalQuestions}</div>
                        <div className={styles.questionText}>{q.question}</div>
                        <div className={styles.optionsList}>
                            {q.options.map((opt, optIdx) => (
                                <button
                                    key={optIdx}
                                    className={`${styles.optionBtn} ${getOptionClass(qIdx, optIdx)}`}
                                    onClick={() => selectAnswer(qIdx, optIdx)}
                                    disabled={submitted}
                                >
                                    <span className={styles.optionLetter}>{OPTION_LETTERS[optIdx]}</span>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}

                {/* Submit Bar */}
                {!submitted && (
                    <div className={styles.submitBar}>
                        <span className={styles.answeredCount}>{answeredCount} / {totalQuestions} answered</span>
                        <button
                            className={styles.submitBtn}
                            onClick={handleSubmit}
                            disabled={answeredCount === 0}
                        >
                            Submit Test
                        </button>
                    </div>
                )}

                {submitted && (
                    <div style={{ textAlign: 'center', marginTop: '2rem' }}>
                        <Link href="/dashboard" className={styles.backBtn}>← Return to Dashboard</Link>
                    </div>
                )}
            </div>
        </div>
    );
}
