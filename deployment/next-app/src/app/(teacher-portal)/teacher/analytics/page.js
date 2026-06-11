'use client';

import { useState, useEffect, useRef } from 'react';
import { useTeacher } from '../layout';
import { db } from '@/database/config/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import styles from './page.module.css';

export default function AnalyticsPage() {
    const { selectedClass, user } = useTeacher();
    const [loading, setLoading] = useState(true);
    const [classStats, setClassStats] = useState(null);
    const [studentData, setStudentData] = useState([]);
    const [sortBy, setSortBy] = useState('name');
    const canvasRef = useRef(null);

    useEffect(() => {
        if (!selectedClass) return;
        let cancelled = false;

        const analyze = async () => {
            setLoading(true);
            try {
                // Fetch all attendance
                const attSnap = await getDocs(query(collection(db, 'attendance'), where('classId', '==', selectedClass.classId)));
                const totalClasses = attSnap.size;

                // Fetch roster
                const rosterSnap = await getDocs(query(collection(db, 'roster'), where('classId', '==', selectedClass.classId), where('role', '==', 'student')));
                const totalStudents = rosterSnap.size;

                if (totalClasses === 0 || totalStudents === 0) {
                    if (!cancelled) { setClassStats({ totalClasses: 0, totalStudents, avgAttendance: 0, above75: 0, below75: 0, perfectAttendance: 0 }); setStudentData([]); }
                    if (!cancelled) setLoading(false);
                    return;
                }

                // Build per-student stats
                const presMap = {};
                const absentMap = {};
                const lateMap = {};
                let dailyPresentCounts = [];

                attSnap.forEach(d => {
                    const data = d.data();
                    const dayPresent = (data.presentStudents?.length || 0) + (data.lateStudents?.length || 0) + (data.excusedStudents?.length || 0);
                    dailyPresentCounts.push({ date: data.date, count: dayPresent, total: totalStudents });

                    (data.presentStudents||[]).forEach(e => { presMap[e] = (presMap[e]||0) + 1; });
                    (data.excusedStudents||[]).forEach(e => { presMap[e] = (presMap[e]||0) + 1; });
                    (data.lateStudents||[]).forEach(e => { presMap[e] = (presMap[e]||0) + 1; lateMap[e] = (lateMap[e]||0) + 1; });
                    (data.absentStudents||[]).forEach(e => { absentMap[e] = (absentMap[e]||0) + 1; });
                });

                // Per-student
                const perStudent = [];
                let sumPcts = 0;
                let above75 = 0, below75 = 0, perfect = 0;
                rosterSnap.forEach(sDoc => {
                    const s = sDoc.data();
                    const present = presMap[s.email] || 0;
                    const absent = absentMap[s.email] || 0;
                    const late = lateMap[s.email] || 0;
                    const pct = Math.round((present / totalClasses) * 100);
                    sumPcts += pct;
                    if (pct >= 75) above75++;
                    else below75++;
                    if (pct === 100) perfect++;
                    perStudent.push({ name: s.name || s.email.split('@')[0], email: s.email, present, absent, late, pct });
                });

                // Fetch deadlines + submissions
                const dlSnap = await getDocs(query(collection(db, 'deadlines'), where('classId', '==', selectedClass.classId)));
                const totalDeadlines = dlSnap.size;
                const subSnap = await getDocs(query(collection(db, 'submissions')));
                const allSubs = subSnap.docs.map(d => ({ id: d.id, ...d.data() }));
                const deadlineIds = new Set(dlSnap.docs.map(d => d.id));
                const classSubs = allSubs.filter(s => deadlineIds.has(s.deadlineId));

                // Avg marks
                let totalMarks = 0, gradeCount = 0;
                classSubs.forEach(s => { if (s.marks !== undefined) { totalMarks += Number(s.marks); gradeCount++; } });

                if (!cancelled) {
                    setClassStats({
                        totalClasses,
                        totalStudents,
                        avgAttendance: Math.round(sumPcts / totalStudents),
                        above75,
                        below75,
                        perfectAttendance: perfect,
                        totalDeadlines,
                        totalSubmissions: classSubs.length,
                        avgGrade: gradeCount > 0 ? Math.round(totalMarks / gradeCount) : null,
                        dailyPresentCounts: dailyPresentCounts.sort((a,b) => a.date?.localeCompare(b.date)),
                    });
                    setStudentData(perStudent);
                }
            } catch(e) { console.error('Analytics error:', e); }
            if (!cancelled) setLoading(false);
        };
        analyze();
        return () => { cancelled = true; };
    }, [selectedClass]);

    // Draw attendance trend chart
    useEffect(() => {
        if (!canvasRef.current || !classStats?.dailyPresentCounts?.length) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const dpr = window.devicePixelRatio || 1;
        const w = canvas.offsetWidth;
        const h = canvas.offsetHeight;
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);

        const data = classStats.dailyPresentCounts.slice(-14); // Last 14 days
        const padding = { top: 20, right: 20, bottom: 40, left: 44 };
        const chartW = w - padding.left - padding.right;
        const chartH = h - padding.top - padding.bottom;

        ctx.clearRect(0, 0, w, h);

        // Grid lines
        ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 0.5;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartH / 4) * i;
            ctx.beginPath(); ctx.moveTo(padding.left, y); ctx.lineTo(w - padding.right, y); ctx.stroke();
        }

        if (data.length < 2) return;

        const maxVal = classStats.totalStudents;
        const xStep = chartW / (data.length - 1);

        // Filled area
        ctx.beginPath();
        data.forEach((d, i) => {
            const x = padding.left + i * xStep;
            const y = padding.top + chartH - (d.count / maxVal) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.lineTo(padding.left + (data.length - 1) * xStep, padding.top + chartH);
        ctx.lineTo(padding.left, padding.top + chartH);
        ctx.closePath();
        const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
        gradient.addColorStop(0, 'rgba(59, 130, 246, 0.25)');
        gradient.addColorStop(1, 'rgba(59, 130, 246, 0.02)');
        ctx.fillStyle = gradient;
        ctx.fill();

        // Line
        ctx.beginPath();
        data.forEach((d, i) => {
            const x = padding.left + i * xStep;
            const y = padding.top + chartH - (d.count / maxVal) * chartH;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = '#dc2626';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Dots
        data.forEach((d, i) => {
            const x = padding.left + i * xStep;
            const y = padding.top + chartH - (d.count / maxVal) * chartH;
            ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fillStyle = '#dc2626'; ctx.fill();
        });

        // X labels
        ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--text-muted').trim() || '#888';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        data.forEach((d, i) => {
            if (data.length > 10 && i % 2 !== 0 && i !== data.length -1) return;
            const x = padding.left + i * xStep;
            const label = d.date ? d.date.substring(5) : '';
            ctx.fillText(label, x, h - 10);
        });

        // Y labels
        ctx.textAlign = 'right';
        for (let i = 0; i <= 4; i++) {
            const val = Math.round(maxVal * (1 - i/4));
            const y = padding.top + (chartH / 4) * i + 3;
            ctx.fillText(String(val), padding.left - 8, y);
        }
    }, [classStats]);

    const sorted = [...studentData].sort((a, b) => {
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'pct_asc') return a.pct - b.pct;
        if (sortBy === 'pct_desc') return b.pct - a.pct;
        if (sortBy === 'absent') return b.absent - a.absent;
        return 0;
    });

    if (!selectedClass) return <div className={styles.emptyState}><p>Select a class from the sidebar</p></div>;

    return (
        <div className={styles.analyticsPage}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Class Analytics</h1>
                <p className={styles.pageSubtitle}>{selectedClass.classId} — {selectedClass.subject}</p>
            </header>

            {loading ? <div className={styles.loader}>Crunching data...</div> : classStats && (
                <>
                    {/* KPI Cards */}
                    <div className={styles.kpiGrid}>
                        <div className={styles.kpiCard}><span className={styles.kpiIcon}>📊</span><span className={styles.kpiVal}>{classStats.avgAttendance}%</span><span className={styles.kpiLabel}>Avg Attendance</span></div>
                        <div className={styles.kpiCard}><span className={styles.kpiIcon}>✅</span><span className={styles.kpiVal}>{classStats.above75}</span><span className={styles.kpiLabel}>Above 75%</span></div>
                        <div className={`${styles.kpiCard} ${classStats.below75 > 0 ? styles.kpiDanger : ''}`}><span className={styles.kpiIcon}>⚠️</span><span className={styles.kpiVal}>{classStats.below75}</span><span className={styles.kpiLabel}>Below 75%</span></div>
                        <div className={styles.kpiCard}><span className={styles.kpiIcon}>⭐</span><span className={styles.kpiVal}>{classStats.perfectAttendance}</span><span className={styles.kpiLabel}>100% Attendance</span></div>
                        <div className={styles.kpiCard}><span className={styles.kpiIcon}>📅</span><span className={styles.kpiVal}>{classStats.totalDeadlines}</span><span className={styles.kpiLabel}>Deadlines</span></div>
                        <div className={styles.kpiCard}><span className={styles.kpiIcon}>📝</span><span className={styles.kpiVal}>{classStats.totalSubmissions}</span><span className={styles.kpiLabel}>Submissions</span></div>
                    </div>

                    {/* Attendance Trend Chart */}
                    {classStats.dailyPresentCounts?.length >= 2 && (
                        <div className={styles.chartCard}>
                            <h3 className={styles.cardTitle}>Attendance Trend (Last 14 Classes)</h3>
                            <canvas ref={canvasRef} className={styles.chart}></canvas>
                        </div>
                    )}

                    {/* Distribution Bar */}
                    <div className={styles.distributionCard}>
                        <h3 className={styles.cardTitle}>Attendance Distribution</h3>
                        <div className={styles.distBar}>
                            <div className={styles.distAbove} style={{width: `${classStats.totalStudents > 0 ? (classStats.above75/classStats.totalStudents)*100 : 0}%`}}>
                                {classStats.above75 > 0 && <span>≥75% ({classStats.above75})</span>}
                            </div>
                            <div className={styles.distBelow} style={{width: `${classStats.totalStudents > 0 ? (classStats.below75/classStats.totalStudents)*100 : 0}%`}}>
                                {classStats.below75 > 0 && <span>&lt;75% ({classStats.below75})</span>}
                            </div>
                        </div>
                    </div>

                    {/* Student Ranking Table */}
                    <div className={styles.tableCard}>
                        <div className={styles.tableHeader}>
                            <h3 className={styles.cardTitle}>Student-wise Breakdown</h3>
                            <select className={styles.sortSelect} value={sortBy} onChange={e => setSortBy(e.target.value)}>
                                <option value="name">Sort by Name</option>
                                <option value="pct_asc">Attendance ↑</option>
                                <option value="pct_desc">Attendance ↓</option>
                                <option value="absent">Most Absences</option>
                            </select>
                        </div>
                        <div className={styles.tableWrapper}>
                            <table className={styles.table}>
                                <thead>
                                    <tr><th>#</th><th>Student</th><th>Present</th><th>Absent</th><th>Late</th><th>Attendance</th></tr>
                                </thead>
                                <tbody>
                                    {sorted.map((s, i) => (
                                        <tr key={s.email} className={s.pct < 75 ? styles.rowDanger : ''}>
                                            <td className={styles.rank}>{i + 1}</td>
                                            <td><span className={styles.nameCell}>{s.name}</span><span className={styles.emailCell}>{s.email}</span></td>
                                            <td>{s.present}</td>
                                            <td>{s.absent}</td>
                                            <td>{s.late}</td>
                                            <td>
                                                <div className={styles.pctBar}>
                                                    <div className={styles.pctFill} style={{width: `${s.pct}%`, background: s.pct >= 75 ? 'var(--success)' : s.pct >= 60 ? 'var(--warning)' : 'var(--error)'}}></div>
                                                </div>
                                                <span className={styles.pctText} style={{color: s.pct >= 75 ? 'var(--success)' : s.pct >= 60 ? 'var(--warning)' : 'var(--error)'}}>{s.pct}%</span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
