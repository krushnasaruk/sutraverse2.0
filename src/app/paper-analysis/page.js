'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ScrollReveal } from '@/components/Animations';
import Link from 'next/link';
import styles from './page.module.css';
import ReactMarkdown from 'react-markdown';
import { IconSparkles, IconLock } from '@/components/Icons';

export default function PaperAnalysisPage() {
    const { user, loading: authLoading } = useAuth();
    
    // Library states
    const [allPapers, setAllPapers] = useState([]);
    const [totalCount, setTotalCount] = useState(0);
    const [subjectFilter, setSubjectFilter] = useState('');
    const [selectedPaper, setSelectedPaper] = useState(null);
    
    // Document Analysis States
    const [pdfFile, setPdfFile] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [pdfSummary, setPdfSummary] = useState('');
    const [analysisError, setAnalysisError] = useState('');
    const [activePdfPath, setActivePdfPath] = useState(null);
    
    // Chat Interface States
    const [chatMessages, setChatMessages] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isSendingChat, setIsSendingChat] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    
    const chatEndRef = useRef(null);

    // 1. Load all available papers from the API on mount
    useEffect(() => {
        async function loadPapers() {
            try {
                const res = await fetch('/api/list-papers');
                if (res.ok) {
                    const data = await res.json();
                    setAllPapers(data.papers || []);
                    setTotalCount(data.total || 0);
                }
            } catch (err) {
                console.error('Failed to load papers list:', err);
            }
        }
        loadPapers();
    }, []);

    // Scroll chat to bottom on new messages
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Get unique subject names for filter tabs
    const subjects = [...new Set(allPapers.map(p => p.subject))].sort();

    // Filtered papers based on active subject tab
    const filteredPapers = subjectFilter 
        ? allPapers.filter(p => p.subject === subjectFilter) 
        : allPapers;

    // Handle selecting a paper from the library grid
    const handleSelectPaper = async (paper) => {
        setSelectedPaper(paper);
        setPdfFile(null);
        setAnalysisError('');
        setPdfSummary('');
        setChatMessages([]);
        setIsAnalyzing(true);

        try {
            const res = await fetch('/api/summarize-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pdfPath: `pyqs/${paper.folder}/${paper.file}` })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to analyze question paper.');
            }

            setPdfSummary(data.summary);
            setActivePdfPath(data.pdfPath);
            setChatMessages([
                {
                    role: 'assistant',
                    content: `📊 I successfully analyzed **${paper.subject} — ${paper.session}**!\n\nI've mapped out the syllabus weightages, key units, and professor recommendations. Ask me anything about this paper!`
                }
            ]);
        } catch (err) {
            console.error('Error analyzing paper:', err);
            setAnalysisError(err.message || 'Failed to process document.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Drag & Drop File Handlers
    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processUploadedFile(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            processUploadedFile(e.target.files[0]);
        }
    };

    // Analyze an uploaded PDF via FormData
    const processUploadedFile = async (file) => {
        if (!file.name.endsWith('.pdf')) {
            setAnalysisError('Only PDF documents are supported.');
            return;
        }
        
        setPdfFile(file);
        setSelectedPaper(null);
        setAnalysisError('');
        setPdfSummary('');
        setChatMessages([]);
        setIsAnalyzing(true);
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            
            const res = await fetch('/api/summarize-pdf', {
                method: 'POST',
                body: formData
            });
            
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Failed to analyze question paper.');
            }
            
            setPdfSummary(data.summary);
            setActivePdfPath(data.pdfPath);
            setChatMessages([
                {
                    role: 'assistant',
                    content: `📊 I successfully analyzed **${file.name}**!\n\nI've mapped out the syllabus weightages, key units, and professor recommendations. What would you like to study first?`
                }
            ]);
        } catch (err) {
            console.error('Error analyzing paper:', err);
            setAnalysisError(err.message || 'Failed to process document.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Send chat message with streaming
    const handleSendChat = async (textToSend) => {
        const query = textToSend || chatInput;
        if (!query.trim() || isSendingChat || !pdfSummary) return;
        
        if (!textToSend) setChatInput('');
        
        const updatedMessages = [...chatMessages, { role: 'user', content: query }];
        setChatMessages(updatedMessages);
        setIsSendingChat(true);
        
        try {
            const res = await fetch('/api/paper-analysis/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    messages: updatedMessages,
                    paperSummary: pdfSummary,
                    subjectName: selectedPaper ? selectedPaper.subject : (pdfFile ? pdfFile.name : ''),
                    pdfPath: activePdfPath
                })
            });
            
            if (!res.ok) {
                const errorText = await res.text();
                throw new Error(`Server error: ${res.status} - ${errorText}`);
            }
            
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let done = false;
            let botText = '';
            
            setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);
            
            while (!done) {
                const { value, done: doneReading } = await reader.read();
                done = doneReading;
                const chunk = decoder.decode(value, { stream: !done });
                botText += chunk;
                
                setChatMessages(prev => {
                    const next = [...prev];
                    next[next.length - 1] = { ...next[next.length - 1], content: botText };
                    return next;
                });
            }
        } catch (err) {
            console.error('Tutor chat failed:', err);
            setChatMessages(prev => [
                ...prev,
                { role: 'assistant', content: '❌ Sorry, the AI connection is busy. Please try again!' }
            ]);
        } finally {
            setIsSendingChat(false);
        }
    };

    if (authLoading) {
        return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}>Loading...</div>;
    }

    if (!user) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.pageInner}>
                    <div style={{ textAlign: 'center', padding: 'var(--space-3xl)', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', maxWidth: '440px', margin: 'var(--space-3xl) auto', backdropFilter: 'blur(20px)' }}>
                        <div style={{ color: 'var(--primary)', marginBottom: 'var(--space-lg)' }}><IconLock size={64} /></div>
                        <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: 'var(--space-sm)' }}>Sign in to Access</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-xl)' }}>You must be logged in to use Paper Analysis.</p>
                        <Link href="/login" style={{ display: 'inline-block', padding: '12px 32px', background: 'var(--primary)', color: '#fff', borderRadius: 'var(--radius-full)', fontWeight: 700, textDecoration: 'none' }}>
                            Go to Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.pageInner}>
                {/* ── Hero Header ── */}
                <ScrollReveal>
                    <div className={styles.hero}>
                        <span className={styles.heroIcon}><IconSparkles size={48} /></span>
                        <h1 className={styles.heroTitle}>
                            {/* Force HMR */}
                            <span className={styles.heroTitleAccent}>Paper Analysis</span> Dashboard
                        </h1>


                        <div className={styles.statsBanner}>
                            <div className={styles.statBubble}>
                                <span className={styles.statValue}>{totalCount}</span>
                                <span className={styles.statLabel}>Question Papers</span>
                            </div>
                            <div className={styles.statDivider} />
                            <div className={styles.statBubble}>
                                <span className={styles.statValue}>{subjects.length}</span>
                                <span className={styles.statLabel}>Subjects</span>
                            </div>
                            <div className={styles.statDivider} />
                            <div className={styles.statBubble}>
                                <span className={styles.statValue}>AI</span>
                                <span className={styles.statLabel}>Streaming Chat</span>
                            </div>
                            <div className={styles.statDivider} />
                            <div className={styles.statBubble}>
                                <span className={styles.statValue}>2019</span>
                                <span className={styles.statLabel}>SPPU Pattern</span>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                {/* ── Subject Filter Chips ── */}
                <ScrollReveal delay={50}>
                    <div className={styles.filterBar}>
                        <div className={styles.filterChips}>
                            <button
                                className={`${styles.filterChip} ${!subjectFilter ? styles.filterChipActive : ''}`}
                                onClick={() => setSubjectFilter('')}
                            >
                                All ({totalCount})
                            </button>
                            {subjects.map(subj => (
                                <button
                                    key={subj}
                                    className={`${styles.filterChip} ${subjectFilter === subj ? styles.filterChipActive : ''}`}
                                    onClick={() => setSubjectFilter(subj)}
                                >
                                    {subj}
                                </button>
                            ))}
                        </div>
                        
                        {/* Upload button */}
                        <div>
                            <input type="file" id="pdf-upload" style={{ display: 'none' }} accept=".pdf" onChange={handleFileChange} />
                            <button className={styles.uploadBtn} onClick={() => document.getElementById('pdf-upload').click()}>
                                📤 Upload PDF
                            </button>
                        </div>
                    </div>
                </ScrollReveal>

                {/* ── Main Dashboard Grid ── */}
                <div className={styles.dashboardGrid}>
                    {/* LEFT: Paper Library + Analysis Results */}
                    <div className={styles.panel}>
                        <h2 className={styles.panelTitle}>
                            {pdfSummary 
                                ? `📊 Analysis: ${selectedPaper ? `${selectedPaper.subject} — ${selectedPaper.session}` : pdfFile?.name || 'Uploaded Paper'}`
                                : `📚 Paper Library (${filteredPapers.length} papers)`
                            }
                        </h2>
                        
                        <div className={styles.workspace}>
                            {/* Active Analysis View */}
                            {isAnalyzing && (
                                <div className={styles.loadingContainer}>
                                    <div className={styles.loaderSpinner} />
                                    <span className={styles.loadingText}>Analyzing Question Paper...</span>
                                    <span className={styles.loadingSubtext}>AI is reading the full PDF, parsing questions, mapping units, and drafting strategic advice.</span>
                                </div>
                            )}

                            {analysisError && (
                                <div className={styles.errorCard}>⚠️ {analysisError}</div>
                            )}

                            {pdfSummary && (
                                <>
                                    <div style={{ display: 'flex', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)' }}>
                                        <button className={styles.backToLibrary} style={{ margin: 0 }} onClick={() => { setPdfSummary(''); setSelectedPaper(null); setPdfFile(null); setChatMessages([]); }}>
                                            ← Back to Library
                                        </button>
                                        {(selectedPaper?.pdfUrl || pdfFile) && (
                                            <button 
                                                className={styles.backToLibrary} 
                                                style={{ margin: 0, background: 'var(--primary)', color: '#fff', borderColor: 'var(--primary)' }}
                                                onClick={() => {
                                                    const url = selectedPaper ? selectedPaper.pdfUrl : URL.createObjectURL(pdfFile);
                                                    window.open(url, '_blank');
                                                }}
                                            >
                                                📄 View Original PDF
                                            </button>
                                        )}
                                    </div>
                                    <ScrollReveal>
                                        <div className={styles.summaryScroll}>
                                            <ReactMarkdown>{pdfSummary}</ReactMarkdown>
                                        </div>
                                    </ScrollReveal>
                                </>
                            )}

                            {/* Library Grid (shown when no analysis is active) */}
                            {!pdfSummary && !isAnalyzing && (
                                <>
                                    {/* Drag and Drop Zone */}
                                    <div 
                                        className={`${styles.uploadZone} ${dragActive ? styles.uploadZoneActive : ''}`}
                                        onDragEnter={handleDrag}
                                        onDragOver={handleDrag}
                                        onDragLeave={handleDrag}
                                        onDrop={handleDrop}
                                        onClick={() => document.getElementById('pdf-upload').click()}
                                    >
                                        <div className={styles.uploadIconWrap}>
                                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                                <polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                                            </svg>
                                        </div>
                                        <span className={styles.uploadTitle}>Drag & Drop Your Own Paper</span>
                                        <span className={styles.uploadSubtitle}>Or click to browse. Supports PDF (Max 15MB)</span>
                                    </div>

                                    {/* Paper Dropdown Selector */}
                                    <div className={styles.selectGroup} style={{ marginTop: 'var(--space-xl)' }}>
                                        <label className={styles.selectLabel}>Select a past exam paper from the library</label>
                                        <select 
                                            className={styles.dropdown}
                                            value={selectedPaper ? `${selectedPaper.folder}-${selectedPaper.file}` : ''}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (val) {
                                                    const paper = filteredPapers.find(p => `${p.folder}-${p.file}` === val);
                                                    if (paper) handleSelectPaper(paper);
                                                }
                                            }}
                                        >
                                            <option value="">-- Choose an Exam Paper --</option>
                                            {filteredPapers.map(paper => (
                                                <option key={`${paper.folder}-${paper.file}`} value={`${paper.folder}-${paper.file}`}>
                                                    {paper.subject} — {paper.session}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {filteredPapers.length === 0 && (
                                        <div className={styles.emptyState}>
                                            <span className={styles.emptyIcon}>📂</span>
                                            <span className={styles.emptyTitle}>No papers found</span>
                                            <span className={styles.emptyText}>Try selecting a different subject filter or upload your own PDF.</span>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                    
                    {/* RIGHT: AI Chat Panel */}
                    <div className={styles.panel}>
                        <h2 className={styles.panelTitle}>🧠 AI Study Partner</h2>
                        
                        <div className={styles.chatHistory}>
                            {chatMessages.length === 0 ? (
                                <div className={styles.chatWelcome}>
                                    <span className={styles.chatWelcomeIcon}>💬</span>
                                    <span className={styles.chatWelcomeTitle}>Interactive Analysis Chat</span>
                                    <span className={styles.chatWelcomeText}>
                                        Select any paper from the library to activate your dedicated AI exam tutor.
                                    </span>
                                </div>
                            ) : (
                                chatMessages.map((msg, idx) => (
                                    <div 
                                        key={idx}
                                        className={`${styles.message} ${msg.role === 'user' ? styles.userMessage : styles.botMessage}`}
                                    >
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                ))
                            )}
                            <div ref={chatEndRef} />
                        </div>
                        
                        {pdfSummary && !isSendingChat && (
                            <div className={styles.chipsContainer}>
                                <button className={styles.chip} onClick={() => handleSendChat('What are the high-probability predicted questions?')}>
                                    ✨ Predicted Questions
                                </button>
                                <button className={styles.chip} onClick={() => handleSendChat('Draft a 1-night study plan based on this paper.')}>
                                    🎯 1-Night Plan
                                </button>
                                <button className={styles.chip} onClick={() => handleSendChat('Show me the derivation steps for the key formulas.')}>
                                    ⚡ Derivations
                                </button>
                                <button className={styles.chip} onClick={() => handleSendChat('Create 5 practice MCQs for this paper.')}>
                                    📝 MCQs
                                </button>
                            </div>
                        )}
                        
                        <form 
                            className={styles.inputForm}
                            onSubmit={(e) => { e.preventDefault(); handleSendChat(); }}
                        >
                            <input
                                type="text"
                                className={styles.chatInput}
                                placeholder={pdfSummary ? "Ask anything about this paper..." : "Select a paper to start..."}
                                value={chatInput}
                                onChange={(e) => setChatInput(e.target.value)}
                                disabled={!pdfSummary || isSendingChat}
                            />
                            <button 
                                type="submit"
                                className={styles.sendBtn}
                                disabled={!pdfSummary || isSendingChat || !chatInput.trim()}
                            >
                                {isSendingChat ? (
                                    <div className={styles.loaderSpinner} style={{ width: '20px', height: '20px', borderWidth: '2px' }} />
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                                    </svg>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
