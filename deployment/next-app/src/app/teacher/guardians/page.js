'use client';

import { useState, useEffect } from 'react';
import { useTeacher } from '../layout';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import styles from './page.module.css';

export default function GuardiansPage() {
    const { selectedClass, user } = useTeacher();
    const [students, setStudents] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState({ text: '', type: '' });
    const [isSending, setIsSending] = useState(false);
    const [selectedStudents, setSelectedStudents] = useState(new Set());
    const [messageText, setMessageText] = useState('');
    const [messageType, setMessageType] = useState('general');

    useEffect(() => {
        if (!selectedClass) return;
        let cancelled = false;
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const q = query(collection(db, 'roster'), where('classId', '==', selectedClass.classId), where('role', '==', 'student'));
                const snap = await getDocs(q);
                const list = [];
                snap.forEach(d => list.push(d.data()));
                list.sort((a, b) => (a.name || a.email).localeCompare(b.name || b.email));

                // Enrich with attendance stats
                const attSnap = await getDocs(query(collection(db, 'attendance'), where('classId', '==', selectedClass.classId)));
                const totalClasses = attSnap.size;
                const presMap = {};
                attSnap.forEach(d => {
                    const data = d.data();
                    [...(data.presentStudents||[]), ...(data.excusedStudents||[]), ...(data.lateStudents||[])].forEach(e => { presMap[e] = (presMap[e]||0) + 1; });
                });

                const enriched = list.map(s => ({
                    ...s,
                    attendancePct: totalClasses > 0 ? Math.round(((presMap[s.email]||0) / totalClasses) * 100) : 100,
                    totalClasses
                }));

                if (!cancelled) setStudents(enriched);
            } catch(e) { console.error(e); }
            if (!cancelled) setLoading(false);
        };
        fetchStudents();
        return () => { cancelled = true; };
    }, [selectedClass]);

    const toggleSelect = (email) => {
        setSelectedStudents(prev => {
            const next = new Set(prev);
            if (next.has(email)) next.delete(email);
            else next.add(email);
            return next;
        });
    };

    const selectAll = () => {
        if (selectedStudents.size === filtered.length) setSelectedStudents(new Set());
        else setSelectedStudents(new Set(filtered.map(s => s.email)));
    };

    const sendBulkMessage = async () => {
        if (selectedStudents.size === 0 || !messageText.trim()) return;
        setIsSending(true);
        setStatus({ text: '', type: '' });
        let sent = 0;
        const targets = students.filter(s => selectedStudents.has(s.email));

        for (const s of targets) {
            try {
                await fetch('/api/whatsapp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        studentPhone: s.studentPhone || null,
                        parentPhone: s.parentPhone || null,
                        studentName: s.name || s.email,
                        assignmentTitle: `[${messageType.toUpperCase()}] ${messageText.substring(0, 50)}`,
                        marks: null
                    })
                });
                sent++;
            } catch(e) {}
        }
        setStatus({ text: `Sent to ${sent}/${targets.length} guardians!`, type: 'success' });
        setMessageText('');
        setSelectedStudents(new Set());
        setIsSending(false);
    };

    const filtered = students.filter(s => {
        const q = searchQuery.toLowerCase();
        return (s.name || '').toLowerCase().includes(q) || s.email.toLowerCase().includes(q) || (s.studentId || '').includes(q);
    });

    if (!selectedClass) return <div className={styles.emptyState}><p>Select a class from the sidebar</p></div>;

    return (
        <div className={styles.guardiansPage}>
            <header className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Guardian Management</h1>
                    <p className={styles.pageSubtitle}>{selectedClass.classId} — Parent/Guardian contacts & communication</p>
                </div>
            </header>

            {/* Bulk Message Card */}
            <div className={styles.messageCard}>
                <h3 className={styles.cardTitle}>Bulk Communication</h3>
                <p className={styles.cardSub}>Send messages to selected guardians via WhatsApp</p>
                <div className={styles.messageForm}>
                    <div className={styles.formRow}>
                        <select className={styles.select} value={messageType} onChange={e => setMessageType(e.target.value)}>
                            <option value="general">📢 General Notice</option>
                            <option value="urgent">🚨 Urgent Alert</option>
                            <option value="meeting">🤝 PTM Invite</option>
                            <option value="fees">💰 Fee Reminder</option>
                            <option value="academic">📚 Academic Update</option>
                        </select>
                        <span className={styles.selectedCount}>{selectedStudents.size} selected</span>
                    </div>
                    <textarea placeholder="Type your message to guardians..." className={styles.textarea} rows={3} value={messageText} onChange={e => setMessageText(e.target.value)} />
                    {status.text && <p className={`${styles.statusMsg} ${status.type === 'error' ? styles.err : styles.suc}`}>{status.text}</p>}
                    <button onClick={sendBulkMessage} disabled={isSending || selectedStudents.size === 0 || !messageText.trim()} className={styles.sendBtn}>
                        {isSending ? 'Sending...' : `Send to ${selectedStudents.size} Guardian(s)`}
                    </button>
                </div>
            </div>

            {/* Directory */}
            <div className={styles.directoryHeader}>
                <h3 className={styles.sectionTitle}>Student Directory</h3>
                <div className={styles.directoryActions}>
                    <input type="text" placeholder="Search by name, email, ID..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={styles.searchInput} />
                    <button onClick={selectAll} className={styles.selectAllBtn}>{selectedStudents.size === filtered.length ? 'Deselect All' : 'Select All'}</button>
                </div>
            </div>

            {loading ? <div className={styles.loader}>Loading directory...</div> : (
                <div className={styles.directoryGrid}>
                    {filtered.map(s => {
                        const isSelected = selectedStudents.has(s.email);
                        const pctColor = s.attendancePct >= 75 ? 'var(--success)' : s.attendancePct >= 60 ? 'var(--warning)' : 'var(--error)';
                        return (
                            <div key={s.email} className={`${styles.studentCard} ${isSelected ? styles.cardSelected : ''}`} onClick={() => toggleSelect(s.email)}>
                                <div className={styles.cardCheck}>
                                    <div className={`${styles.checkbox} ${isSelected ? styles.checkboxActive : ''}`}>{isSelected ? '✓' : ''}</div>
                                </div>
                                <div className={styles.cardBody}>
                                    <div className={styles.cardName}>{s.name || s.email.split('@')[0]}</div>
                                    <div className={styles.cardEmail}>{s.email}</div>
                                    <div className={styles.cardMeta}>
                                        <span className={styles.cardId}>{s.studentId || 'No ID'}</span>
                                        <span className={styles.cardPct} style={{color: pctColor}}>{s.attendancePct}% attendance</span>
                                    </div>
                                    <div className={styles.contactRow}>
                                        <div className={styles.contactItem}>
                                            <span className={styles.contactLabel}>Student</span>
                                            <span className={styles.contactValue}>{s.studentPhone || '—'}</span>
                                        </div>
                                        <div className={styles.contactItem}>
                                            <span className={styles.contactLabel}>Parent</span>
                                            <span className={styles.contactValue}>{s.parentPhone || '—'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
            {!loading && filtered.length === 0 && <p className={styles.noData}>No students match your search.</p>}
        </div>
    );
}
