'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { ScrollReveal } from '@/components/Animations';
import styles from './page.module.css';
import { IconSparkles, IconLightbulb, IconClipboard, IconStar, IconLock } from '@/components/Icons';
import ReactMarkdown from 'react-markdown';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year'];
const BRANCHES = ['Computer', 'IT', 'Mechanical', 'Civil', 'Electrical', 'Electronics', 'Other'];

export default function ExamModePage() {
    const { user, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('study-guide'); // 'study-guide' or 'pdf-summarizer'
    const [year, setYear] = useState('');
    const [branch, setBranch] = useState('');
    const [subject, setSubject] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [plan, setPlan] = useState(null);
    const [error, setError] = useState('');
    const [expandedQuestions, setExpandedQuestions] = useState({});

    // PDF Upload States
    const [pdfFile, setPdfFile] = useState(null);
    const [isSummarizing, setIsSummarizing] = useState(false);
    const [pdfSummary, setPdfSummary] = useState('');
    const [pdfError, setPdfError] = useState('');

    const toggleQuestion = (index) => {
        setExpandedQuestions(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const handlePdfUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
            setPdfError('Please select a valid PDF question paper.');
            setPdfFile(null);
            return;
        }
        
        setPdfFile(file);
        setPdfError('');
        setPdfSummary('');
    };

    const runPdfSummarization = async () => {
        if (!pdfFile) {
            setPdfError('Please select a PDF file to analyze.');
            return;
        }

        setPdfError('');
        setIsSummarizing(true);
        setPdfSummary('');
        setPlan(null); // Clear active study guide to prevent overlap

        try {
            const formData = new FormData();
            formData.append('file', pdfFile);

            const response = await fetch('/api/summarize-pdf', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to analyze the PDF.');
            }

            const data = await response.json();
            setPdfSummary(data.summary);
        } catch (err) {
            console.error('PDF Analysis Error:', err);
            setPdfError(err.message || 'Something went wrong while processing the document.');
        } finally {
            setIsSummarizing(false);
        }
    };

    const renderFormattedAnswer = (text) => {
        if (!text) return null;
        const lines = text.split('\n');
        return lines.map((line, index) => {
            const trimmed = line.trim();
            if (!trimmed) return <div key={index} style={{ height: '12px' }} />;
            
            // Header ###
            if (trimmed.startsWith('###')) {
                return <h4 key={index} className={styles.answerH3}>{trimmed.replace(/^###\s*/, '')}</h4>;
            }
            // Header ####
            if (trimmed.startsWith('####')) {
                return <h5 key={index} className={styles.answerH4}>{trimmed.replace(/^####\s*/, '')}</h5>;
            }
            // Bullet points
            if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
                return (
                    <div key={index} className={styles.answerBullet}>
                        <span className={styles.bulletDot}>•</span>
                        <span className={styles.bulletText}>{trimmed.replace(/^[\*\-]\s*/, '')}</span>
                    </div>
                );
            }
            // Equation block $$
            if (trimmed.startsWith('$$') && trimmed.endsWith('$$')) {
                return (
                    <div key={index} className={styles.equationBlock}>
                        {trimmed.substring(2, trimmed.length - 2).trim()}
                    </div>
                );
            }
            
            return <p key={index} className={styles.answerParagraph}>{trimmed}</p>;
        });
    };

    const generateAIPlan = async () => {
        if (!year || !branch || !subject.trim()) {
            setError('Please select Year, Branch, and enter a Subject.');
            return;
        }

        setError('');
        setIsGenerating(true);
        setPlan(null); // Clear previous plan
        setExpandedQuestions({}); // Reset accordions
        setPdfSummary(''); // Clear PDF summaries

        try {
            const response = await fetch('/api/generate-study-guide', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ year, branch, subject })
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to generate study plan.');
            }

            const data = await response.json();
            setPlan(data);
        } catch (err) {
            console.error('Generation Error:', err);
            setError(err.message || 'Something went wrong while consulting the AI.');
        } finally {
            setIsGenerating(false);
        }
    };

    if (loading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Authenticating...</div>;
    }

    if (!user) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.pageInner}>
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', maxWidth: '440px', margin: 'var(--space-3xl) auto', backdropFilter: 'blur(20px)' }}>
                        <div style={{ color: 'var(--primary)', marginBottom: 'var(--space-lg)' }}><IconLock size={64} /></div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>Sign in to Access</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>You must be logged in to use Exam Mode and generate AI Study Plans.</p>
                        <Link href="/login" style={{ display: 'inline-block', padding: '12px 32px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-full)', fontWeight: 700, textDecoration: 'none', transition: 'all 0.3s ease' }}>
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Flashcard Component
    const Flashcard = ({ term, definition }) => {
        const [flipped, setFlipped] = useState(false);
        return (
            <div className={styles.flashcardContainer} onClick={() => setFlipped(!flipped)}>
                <div className={`${styles.flashcardInner} ${flipped ? styles.flipped : ''}`}>
                    <div className={styles.flashcardFront}>
                        <div className={styles.flashcardLabel}>Term</div>
                        <div className={styles.flashcardTerm}>{term}</div>
                        <div className={styles.flipHint}><IconSparkles size={14} /> Click to flip</div>
                    </div>
                    <div className={styles.flashcardBack}>
                        <div className={styles.flashcardLabel}>Definition</div>
                        <div className={styles.flashcardDef}>{definition}</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageInner}>
                {/* Header */}
                <ScrollReveal>
                    <div className={styles.examHeader}>
                        <span className={styles.examIcon}><IconSparkles size={48} /></span>
                        <h1 className={styles.examTitle}>
                            <span className={`${styles.examTitleAccent} text-shimmer`}>AI Last Night</span> Prep
                        </h1>
                        <p className={styles.examDesc}>
                            Configure your syllabus or upload a past question paper. Our intelligence engine will instantly analyze frequencies, generate unit-wise summaries, and predict perfect exam-ready answers.
                        </p>
                    </div>
                </ScrollReveal>

                {/* AI Configuration Engine */}
                <ScrollReveal delay={100}>
                    <div className={styles.aiConfigCard}>
                        {/* Tab Selector */}
                        <div className={styles.tabSelector}>
                            <button 
                                className={`${styles.tabBtn} ${activeTab === 'study-guide' ? styles.activeTab : ''}`}
                                onClick={() => { setActiveTab('study-guide'); setError(''); }}
                            >
                                📚 AI Study Guide
                            </button>
                            <button 
                                className={`${styles.tabBtn} ${activeTab === 'pdf-summarizer' ? styles.activeTab : ''}`}
                                onClick={() => { setActiveTab('pdf-summarizer'); setPdfError(''); }}
                            >
                                📄 AI PDF Summarizer
                            </button>
                        </div>

                        {activeTab === 'pdf-summarizer' ? (
                            <div className={styles.uploadContainer}>
                                <div className={styles.uploadZone}>
                                    <input 
                                        type="file" 
                                        id="pdf-upload-input" 
                                        accept=".pdf,application/pdf" 
                                        onChange={handlePdfUpload} 
                                        className={styles.fileInputHidden}
                                    />
                                    <label htmlFor="pdf-upload-input" className={styles.uploadLabel}>
                                        <span className={styles.uploadCloudIcon}>📤</span>
                                        <span className={styles.uploadMainText}>
                                            {pdfFile ? pdfFile.name : 'Drag & Drop or Click to Upload PDF'}
                                        </span>
                                        <span className={styles.uploadSubText}>
                                            {pdfFile ? `${(pdfFile.size / 1024 / 1024).toFixed(2)} MB` : 'Supports standard engineering question papers up to 10MB'}
                                        </span>
                                    </label>
                                </div>

                                {pdfError && <div className={styles.errorMessage}>{pdfError}</div>}

                                <button 
                                    onClick={runPdfSummarization} 
                                    disabled={isSummarizing || !pdfFile}
                                    className={`${styles.generateBtn} ${isSummarizing ? styles.generating : ''}`}
                                >
                                    <IconSparkles size={20} className={isSummarizing ? styles.spinIcon : ''} />
                                    {isSummarizing ? 'Analyzing & OCR Processing... Please Wait' : 'Analyze & Summarize Paper'}
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className={styles.configGrid}>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Academic Year</label>
                                        <select value={year} onChange={(e) => setYear(e.target.value)} className={styles.selectField}>
                                            <option value="">Select Year...</option>
                                            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Engineering Branch</label>
                                        <select value={branch} onChange={(e) => setBranch(e.target.value)} className={styles.selectField}>
                                            <option value="">Select Branch...</option>
                                            {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                                        </select>
                                    </div>
                                    <div className={styles.inputGroup}>
                                        <label className={styles.inputLabel}>Subject to Prepare</label>
                                        <input 
                                            type="text" 
                                            list="common-subjects"
                                            value={subject} 
                                            onChange={(e) => setSubject(e.target.value)} 
                                            placeholder="e.g. Distributed Database Systems"
                                            className={styles.inputField} 
                                        />
                                        <datalist id="common-subjects">
                                            <option value="Basic Electrical Engineering" />
                                            <option value="Engineering Physics" />
                                            <option value="Engineering Chemistry" />
                                            <option value="Engineering Mathematics I" />
                                            <option value="Engineering Mathematics II" />
                                            <option value="Engineering Mechanics" />
                                            <option value="Electronics" />
                                            <option value="PPS" />
                                            <option value="Engineering Graphics" />
                                        </datalist>
                                    </div>
                                </div>

                                {error && <div className={styles.errorMessage}>{error}</div>}

                                <button 
                                    onClick={generateAIPlan} 
                                    disabled={isGenerating}
                                    className={`${styles.generateBtn} ${isGenerating ? styles.generating : ''}`}
                                >
                                    <IconSparkles size={20} className={isGenerating ? styles.spinIcon : ''} />
                                    {isGenerating ? 'Synthesizing Knowledge... Please Wait (up to 15s)' : 'Generate AI Master Plan'}
                                </button>
                            </>
                        )}
                    </div>
                </ScrollReveal>

                {/* Loading State or Tip */}
                {!plan && !pdfSummary && !isGenerating && !isSummarizing && (
                    <ScrollReveal delay={200}>
                        <div className={styles.tipCard}>
                            <div className={styles.tipTitle}><IconLightbulb size={20} /> Pro Tip</div>
                            <div className={styles.tipText}>
                                {activeTab === 'study-guide' 
                                    ? 'Select your exact year and branch alongside the subject. The AI will cross-reference academic curriculums and Previous Year Question (PYQ) patterns to formulate precise summaries and predict high-value exam questions tailored for you.'
                                    : 'Upload a scan or digital PDF of a college exam paper. The AI will read the paper using advanced computer vision/OCR, mapping the topics to your syllabus and giving you a complete tactical breakdown.'
                                }
                            </div>
                        </div>
                    </ScrollReveal>
                )}

                {/* PDF Summary Display */}
                {pdfSummary && (
                    <ScrollReveal>
                        <div className={styles.summaryContainer}>
                            <ReactMarkdown>{pdfSummary}</ReactMarkdown>
                        </div>
                    </ScrollReveal>
                )}

                {/* Display Generated Plan */}
                {plan && (
                    <>
                        {/* Statistics Dashboard Bar */}
                        <ScrollReveal delay={50}>
                            <div className={styles.statBar}>
                                <div className={styles.statMetric}>
                                    <span className={styles.statNumber}>{plan.papersCount || 'AI'}</span>
                                    <span className={styles.statLabel}>{plan.papersCount ? 'Historical Papers Parsed' : 'Dynamic Analysis'}</span>
                                </div>
                                <div className={styles.statMetric}>
                                    <span className={styles.statNumber}>{plan.questions.length}</span>
                                    <span className={styles.statLabel}>High-Probability Questions</span>
                                </div>
                                <div className={styles.statMetric}>
                                    <span className={styles.statNumber}>{plan.papersCount ? '2019 Pattern' : 'Unified'}</span>
                                    <span className={styles.statLabel}>Curriculum Pattern</span>
                                </div>
                                <div className={styles.statMetric}>
                                    <span className={styles.statNumber}>{plan.papersCount ? '100%' : 'Online'}</span>
                                    <span className={styles.statLabel}>{plan.papersCount ? 'Verified Offline Source' : 'Generative Synthesis'}</span>
                                </div>
                            </div>
                        </ScrollReveal>

                        {/* Flashcards Section */}
                        {plan.flashcards && plan.flashcards.length > 0 && (
                            <div className={styles.sectionContainer}>
                                <ScrollReveal delay={100}>
                                    <h2 className={styles.sectionTitle}><IconSparkles size={28} /> Rapid Review Flashcards</h2>
                                </ScrollReveal>
                                <div className={styles.flashcardGrid}>
                                    {plan.flashcards.map((fc, i) => (
                                        <ScrollReveal key={i} delay={i * 50}>
                                            <Flashcard term={fc.term} definition={fc.definition} />
                                        </ScrollReveal>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className={styles.sectionContainer}>
                            <ScrollReveal delay={100}>
                                <h2 className={styles.sectionTitle}><IconClipboard size={28} /> AI Unit Summaries — {subject}</h2>
                            </ScrollReveal>
                            <div className={styles.summaryGrid}>
                                {plan.summaries.map((s, i) => (
                                    <ScrollReveal key={i} delay={i * 100}>
                                        <div className={`${styles.summaryCard} ${styles.hoverLift}`}>
                                            <span className={styles.unitLabel}>{s.unit}</span>
                                            <h3 className={styles.summaryTitle}>{s.title}</h3>
                                            <div className={styles.summaryPoints}>
                                                {s.points.map((p, j) => (
                                                    <div key={j} className={styles.summaryPoint}>{p}</div>
                                                ))}
                                            </div>
                                        </div>
                                    </ScrollReveal>
                                ))}
                            </div>
                        </div>

                        <div className={styles.sectionContainer}>
                            <ScrollReveal>
                                <h2 className={styles.sectionTitle}><IconStar size={28} /> High-Probability PYQ Questions</h2>
                            </ScrollReveal>
                            <div className={styles.questionsGrid}>
                                {plan.questions.map((q, i) => (
                                    <ScrollReveal key={i} delay={i * 80}>
                                        <div className={`${styles.questionCard} ${styles.hoverLift}`}>
                                            <div className={styles.questionNum}>{i + 1}</div>
                                            <div className={styles.questionContent}>
                                                <div className={styles.questionHeader}>
                                                    <div className={styles.questionText}>{q.q}</div>
                                                    <div className={styles.questionMarks}>{q.marks}</div>
                                                </div>

                                                {/* Glowing Frequency Badge */}
                                                {q.frequency && (
                                                    <div className={styles.frequencyBadge}>
                                                        <span className={styles.fireIcon}>🔥</span>
                                                        <span className={styles.badgeLabel}>Appeared {q.frequency} times in last years:</span>
                                                        <span className={styles.badgeYears}>{q.years?.join(', ')}</span>
                                                    </div>
                                                )}

                                                {/* Expandable Ideal Textbook Answer Accordion */}
                                                {q.idealAnswer && (
                                                    <div className={styles.answerSection}>
                                                        <button 
                                                            onClick={() => toggleQuestion(i)} 
                                                            className={`${styles.accordionHeader} ${expandedQuestions[i] ? styles.openAccordion : ''}`}
                                                        >
                                                            <span>{expandedQuestions[i] ? '👇 Hide Ideal Exam Answer' : '👉 View Ideal Exam Answer'}</span>
                                                            <span className={styles.badgeText}>{expandedQuestions[i] ? 'COLLAPSE' : 'EXPAND'}</span>
                                                        </button>
                                                        
                                                        <div className={`${styles.accordionContent} ${expandedQuestions[i] ? styles.openContent : ''}`}>
                                                            <div className={styles.idealAnswerBody}>
                                                                {renderFormattedAnswer(q.idealAnswer)}
                                                            </div>
                                                            <button 
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    navigator.clipboard.writeText(q.idealAnswer);
                                                                    alert('Perfect answer copied to clipboard!');
                                                                }}
                                                                className={styles.copyBtn}
                                                            >
                                                                <IconClipboard size={14} /> Copy Ideal Answer to Clipboard
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </ScrollReveal>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
