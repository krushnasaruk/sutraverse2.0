'use client';

import { useState, useEffect } from 'react';
import { useTeacher } from '../layout';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, getDoc, onSnapshot, addDoc } from 'firebase/firestore';
import { QRCodeCanvas } from 'qrcode.react';
import styles from './page.module.css';

export default function AttendancePage() {
    const { selectedClass, user } = useTeacher();
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({});
    const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [fetchingData, setFetchingData] = useState(false);
    const [status, setStatus] = useState({ text: '', type: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [activeView, setActiveView] = useState('roster'); // 'roster', 'leaves'

    // Live Radar
    const [liveSessionActive, setLiveSessionActive] = useState(false);
    const [radarSearching, setRadarSearching] = useState(false);
    const [geoVerifiedStudents, setGeoVerifiedStudents] = useState([]);
    const [qrToken, setQrToken] = useState('');

    // Red List
    const [defaulters, setDefaulters] = useState([]);

    // Monthly Reports
    const [reportMonth, setReportMonth] = useState(new Date().toISOString().substring(0, 7));
    const [generatingReport, setGeneratingReport] = useState(false);

    // Load class data when selected class or date changes
    useEffect(() => {
        if (!selectedClass) return;
        const loadClassData = async () => {
            setFetchingData(true);
            setStatus({ text: '', type: '' });
            setAttendance({});
            setStudents([]);
            try {
                const q = query(collection(db, 'roster'), where('classId', '==', selectedClass.classId), where('role', '==', 'student'));
                const snap = await getDocs(q);
                const studentList = [];
                snap.forEach(d => studentList.push(d.data()));
                studentList.sort((a, b) => a.email.localeCompare(b.email));

                const recordId = `${attendanceDate}_${selectedClass.classId}_${selectedClass.subject}`.replace(/[^a-zA-Z0-9_-]/g, '_');
                const pastSnap = await getDoc(doc(db, 'attendance', recordId));
                let initial = {};
                if (pastSnap.exists()) {
                    const data = pastSnap.data();
                    data.presentStudents?.forEach(e => initial[e] = 'present');
                    data.absentStudents?.forEach(e => initial[e] = 'absent');
                    data.lateStudents?.forEach(e => initial[e] = 'late');
                    data.excusedStudents?.forEach(e => initial[e] = 'excused');
                    setStatus({ text: `Loaded record for ${attendanceDate}`, type: 'success' });
                } else {
                    studentList.forEach(s => initial[s.email] = 'present');
                }
                setStudents(studentList);
                setAttendance(initial);

                // Leave requests
                const lrSnap = await getDocs(query(collection(db, 'leaveRequests'), where('classId', '==', selectedClass.classId)));
                const lrList = [];
                lrSnap.forEach(d => lrList.push({ id: d.id, ...d.data() }));
                lrList.sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
                setLeaveRequests(lrList);

                if (studentList.length === 0) setStatus({ text: 'No students in roster.', type: 'error' });
            } catch(e) {
                setStatus({ text: 'Error: ' + e.message, type: 'error' });
            }
            setFetchingData(false);
        };
        loadClassData();
    }, [selectedClass, attendanceDate]);

    // Live session + check-ins + deadlines + defaulters
    useEffect(() => {
        if (!selectedClass) return;
        const sessionRef = doc(db, 'liveSessions', selectedClass.classId);
        const unsubSession = onSnapshot(sessionRef, (snap) => {
            if (snap.exists() && snap.data().active && snap.data().date === attendanceDate) setLiveSessionActive(true);
            else setLiveSessionActive(false);
        });
        const checkinQ = query(collection(db, 'liveCheckins'), where('classId', '==', selectedClass.classId), where('date', '==', attendanceDate));
        const unsubCheckins = onSnapshot(checkinQ, (snap) => {
            const list = [];
            snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            setGeoVerifiedStudents(list);
            if (list.length > 0) {
                setAttendance(prev => {
                    const n = { ...prev };
                    list.forEach(c => { n[c.studentEmail] = 'present'; });
                    return n;
                });
            }
        });

        // Defaulters
        const scanDefaulters = async () => {
            const attSnap = await getDocs(query(collection(db, 'attendance'), where('classId', '==', selectedClass.classId)));
            const total = attSnap.size;
            if (total < 3) { setDefaulters([]); return; }
            const s = {};
            attSnap.forEach(d => {
                const data = d.data();
                [...(data.presentStudents||[]), ...(data.excusedStudents||[]), ...(data.lateStudents||[])].forEach(e => { s[e] = (s[e]||0) + 1; });
            });
            const stuSnap = await getDocs(query(collection(db, 'roster'), where('classId', '==', selectedClass.classId), where('role', '==', 'student')));
            const dList = [];
            stuSnap.forEach(sDoc => {
                const st = sDoc.data();
                const pct = Math.round(((s[st.email]||0) / total) * 100);
                if (pct < 75) dList.push({ ...st, percentage: pct });
            });
            setDefaulters(dList.sort((a,b) => a.percentage - b.percentage));
        };
        scanDefaulters();

        return () => { unsubSession(); unsubCheckins(); };
    }, [selectedClass, attendanceDate]);

    // QR rotation
    useEffect(() => {
        if (!liveSessionActive || !selectedClass) { setQrToken(''); return; }
        const gen = () => JSON.stringify({ classId: selectedClass.classId, date: attendanceDate, timestamp: Date.now() });
        setQrToken(gen());
        const iv = setInterval(() => setQrToken(gen()), 15000);
        return () => clearInterval(iv);
    }, [liveSessionActive, selectedClass, attendanceDate]);

    const toggleAttendance = (email) => {
        setAttendance(prev => {
            const c = prev[email];
            const next = c === 'present' ? 'absent' : c === 'absent' ? 'late' : c === 'late' ? 'excused' : 'present';
            return { ...prev, [email]: next };
        });
    };

    const markAll = (state) => {
        const n = {};
        students.forEach(s => n[s.email] = state);
        setAttendance(n);
    };

    const saveAttendance = async () => {
        if (!selectedClass || students.length === 0) return;
        setIsSaving(true);
        try {
            const recordId = `${attendanceDate}_${selectedClass.classId}_${selectedClass.subject}`.replace(/[^a-zA-Z0-9_-]/g, '_');
            await setDoc(doc(db, 'attendance', recordId), {
                date: attendanceDate, timestamp: new Date().toISOString(),
                classId: selectedClass.classId, subject: selectedClass.subject,
                teacherEmail: user.email, totalEnrolled: students.length,
                presentStudents: Object.keys(attendance).filter(e => attendance[e] === 'present'),
                absentStudents: Object.keys(attendance).filter(e => attendance[e] === 'absent'),
                lateStudents: Object.keys(attendance).filter(e => attendance[e] === 'late'),
                excusedStudents: Object.keys(attendance).filter(e => attendance[e] === 'excused'),
            });
            setStatus({ text: `Saved for ${attendanceDate}`, type: 'success' });
        } catch(e) { setStatus({ text: 'Failed: ' + e.message, type: 'error' }); }
        setIsSaving(false);
    };

    const toggleLiveRadar = async () => {
        if (liveSessionActive) {
            try {
                await setDoc(doc(db, 'liveSessions', selectedClass.classId), { active: false }, { merge: true });
                setAttendance(prev => { const n = { ...prev }; students.forEach(s => { if (!n[s.email]) n[s.email] = 'absent'; }); return n; });
                setLiveSessionActive(false);
                setRadarSearching(false);
            } catch(e) { setStatus({ text: 'Error: ' + e.message, type: 'error' }); }
            return;
        }
        setRadarSearching(true);
        if (!navigator.geolocation) { setStatus({ text: 'Geolocation not supported', type: 'error' }); setRadarSearching(false); return; }
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude, accuracy } = pos.coords;
                if (accuracy > 40) { setStatus({ text: `GPS weak (${Math.round(accuracy)}m)`, type: 'error' }); setRadarSearching(false); return; }
                try {
                    await setDoc(doc(db, 'liveSessions', selectedClass.classId), { active: true, teacherLat: latitude, teacherLng: longitude, accuracy, classId: selectedClass.classId, date: attendanceDate, timestamp: new Date().toISOString() });
                    setLiveSessionActive(true);
                    setRadarSearching(false);
                    setStatus({ text: 'Radar Active. Radius: ~15m.', type: 'success' });
                } catch(e) { setStatus({ text: 'Error: ' + e.message, type: 'error' }); setRadarSearching(false); }
            },
            (err) => { setStatus({ text: 'GPS Error: ' + err.message, type: 'error' }); setRadarSearching(false); },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    const handleLeaveAction = async (id, action) => {
        setIsSaving(true);
        try {
            await setDoc(doc(db, 'leaveRequests', id), { status: action, reviewedAt: new Date().toISOString() }, { merge: true });
            setLeaveRequests(prev => prev.map(r => r.id === id ? { ...r, status: action } : r));
            setStatus({ text: `Request ${action}`, type: 'success' });
        } catch(e) { setStatus({ text: 'Error: ' + e.message, type: 'error' }); }
        setIsSaving(false);
    };

    const downloadCSV = () => {
        if (!selectedClass || students.length === 0) return;
        let csv = "data:text/csv;charset=utf-8,Email,Student ID,Status\n";
        students.forEach(s => { csv += `${s.email},${s.studentId || 'Pending'},${attendance[s.email] || 'absent'}\n`; });
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csv));
        link.setAttribute("download", `attendance_${selectedClass.classId}_${attendanceDate}.csv`);
        document.body.appendChild(link); link.click(); document.body.removeChild(link);
    };

    const sendRedListWarning = async () => {
        if (defaulters.length === 0) return;
        setIsSaving(true);
        let sent = 0;
        for (const s of defaulters) {
            try {
                await fetch('/api/whatsapp', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ studentPhone: s.studentPhone||null, parentPhone: s.parentPhone||null, studentName: s.name||s.email, assignmentTitle: "ATTENDANCE WARNING", marks: { obtained: s.percentage, max: 100 }})
                });
                sent++;
            } catch(e) {}
        }
        setStatus({ text: `Sent ${sent} warnings!`, type: 'success' });
        setIsSaving(false);
    };

    const publishMonthlyReport = async () => {
        setGeneratingReport(true);
        try {
            const snap = await getDocs(query(collection(db, 'attendance'), where('classId', '==', selectedClass.classId)));
            const monthRecords = [];
            snap.forEach(d => { const data = d.data(); if (data.date?.startsWith(reportMonth)) monthRecords.push(data); });
            if (monthRecords.length === 0) { setStatus({ text: `No records for ${reportMonth}`, type: 'error' }); setGeneratingReport(false); return; }
            const stats = {};
            students.forEach(s => { stats[s.email] = { present: 0, late: 0, excused: 0, absent: 0, totalClasses: monthRecords.length }; });
            monthRecords.forEach(rec => {
                (rec.presentStudents||[]).forEach(e => { if(stats[e]) stats[e].present++; });
                (rec.lateStudents||[]).forEach(e => { if(stats[e]) stats[e].late++; });
                (rec.excusedStudents||[]).forEach(e => { if(stats[e]) stats[e].excused++; });
                (rec.absentStudents||[]).forEach(e => { if(stats[e]) stats[e].absent++; });
            });
            Object.keys(stats).forEach(e => {
                const s = stats[e];
                const active = s.present + (s.late * 0.5) + s.excused;
                s.percentage = s.totalClasses > 0 ? Math.round((active / s.totalClasses) * 100) : 0;
            });
            await addDoc(collection(db, 'monthlyReports'), { classId: selectedClass.classId, month: reportMonth, publishedBy: user.email, teacherName: user.name || 'Instructor', timestamp: new Date().toISOString(), studentStats: stats });
            setStatus({ text: `${reportMonth} Report Published!`, type: 'success' });
        } catch(e) { setStatus({ text: 'Error: ' + e.message, type: 'error' }); }
        setGeneratingReport(false);
    };

    if (!selectedClass) return <div className={styles.emptyState}><p>Select a class from the sidebar</p></div>;

    const presentCount = Object.values(attendance).filter(s => s === 'present').length;
    const absentCount = Object.values(attendance).filter(s => s === 'absent').length;
    const lateCount = Object.values(attendance).filter(s => s === 'late').length;
    const excusedCount = Object.values(attendance).filter(s => s === 'excused').length;
    const pendingLeaves = leaveRequests.filter(r => r.status === 'pending');

    const getBtnClass = (state) => {
        const map = { present: styles.btnPresent, absent: styles.btnAbsent, late: styles.btnLate, excused: styles.btnExcused };
        return `${styles.statusBtn} ${map[state] || ''}`;
    };

    return (
        <div className={styles.attendancePage}>
            <header className={styles.pageHeader}>
                <div>
                    <h1 className={styles.pageTitle}>Attendance</h1>
                    <p className={styles.pageSubtitle}>{selectedClass.classId} — {selectedClass.subject}</p>
                </div>
                <div className={styles.headerActions}>
                    <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className={styles.datePicker} />
                    <button onClick={toggleLiveRadar} className={`${styles.actionBtn} ${liveSessionActive ? styles.radarActive : ''}`}>
                        {radarSearching ? 'Connecting...' : liveSessionActive ? '● End Session' : '◉ Start Live'}
                    </button>
                </div>
            </header>

            {/* Sub-nav */}
            <div className={styles.subNav}>
                <button className={`${styles.subTab} ${activeView === 'roster' ? styles.subTabActive : ''}`} onClick={() => setActiveView('roster')}>Roster</button>
                <button className={`${styles.subTab} ${activeView === 'leaves' ? styles.subTabActive : ''}`} onClick={() => setActiveView('leaves')}>
                    Leave Requests {pendingLeaves.length > 0 && <span className={styles.badge}>{pendingLeaves.length}</span>}
                </button>
            </div>

            {/* Monthly Analytics */}
            <div className={styles.analyticsStrip}>
                <div className={styles.analyticsLeft}>
                    <input type="month" value={reportMonth} onChange={e => setReportMonth(e.target.value)} className={styles.datePicker} />
                    <button className={styles.outlineBtn} onClick={downloadCSV}>Export CSV</button>
                    <button className={styles.brandBtn} onClick={publishMonthlyReport} disabled={generatingReport}>{generatingReport ? 'Generating...' : 'Publish Report'}</button>
                </div>
                <div className={styles.batchActions}>
                    <button onClick={() => markAll('present')} className={styles.batchPresent}>All Present</button>
                    <button onClick={() => markAll('absent')} className={styles.batchAbsent}>All Absent</button>
                </div>
            </div>

            {/* Red List */}
            {defaulters.length > 0 && (
                <div className={styles.redList}>
                    <div className={styles.redListHeader}>
                        <h3 className={styles.redListTitle}><span className={styles.redDot}></span> Requires Attention ({defaulters.length})</h3>
                        <button onClick={sendRedListWarning} disabled={isSaving} className={styles.warningBtn}>Send Warnings</button>
                    </div>
                    <div className={styles.redListCards}>
                        {defaulters.map(d => (
                            <div key={d.email} className={styles.defCard}>
                                <span className={styles.defName}>{d.name || d.email.split('@')[0]}</span>
                                <span className={styles.defPct}>{d.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Live Session QR */}
            {liveSessionActive && (
                <div className={styles.liveZone}>
                    <div className={styles.liveInfo}>
                        <h4>Live Check-in Session</h4>
                        <p>Geofence 15m radius. {geoVerifiedStudents.length} checked in.</p>
                        <div className={styles.checkinCards}>
                            {geoVerifiedStudents.map(s => (
                                <div key={s.id} className={styles.checkinCard}>
                                    <span>{s.studentEmail.split('@')[0]}</span>
                                    <span className={styles.verifiedTag}>{s.verifiedMath ? 'Bio ✓' : '✓'}</span>
                                </div>
                            ))}
                            {geoVerifiedStudents.length === 0 && <p className={styles.waitingText}>Waiting for check-ins...</p>}
                        </div>
                    </div>
                    <div className={styles.qrBox}>
                        <h4>QR Check-in</h4>
                        {qrToken && <QRCodeCanvas value={qrToken} size={180} level="H" includeMargin={true} />}
                        <p className={styles.qrNote}>Auto-refreshes every 15s</p>
                    </div>
                </div>
            )}

            {activeView === 'roster' && (
                <>
                    {/* Stats Bar */}
                    <div className={styles.statsBar}>
                        <div className={`${styles.statPill} ${styles.pillTotal}`}><span className={styles.pillVal}>{students.length}</span><span className={styles.pillLabel}>Total</span></div>
                        <div className={`${styles.statPill} ${styles.pillPresent}`}><span className={styles.pillVal}>{presentCount}</span><span className={styles.pillLabel}>Present</span></div>
                        <div className={`${styles.statPill} ${styles.pillAbsent}`}><span className={styles.pillVal}>{absentCount}</span><span className={styles.pillLabel}>Absent</span></div>
                        <div className={`${styles.statPill} ${styles.pillLate}`}><span className={styles.pillVal}>{lateCount}</span><span className={styles.pillLabel}>Late</span></div>
                        <div className={`${styles.statPill} ${styles.pillExcused}`}><span className={styles.pillVal}>{excusedCount}</span><span className={styles.pillLabel}>Excused</span></div>
                    </div>

                    {/* Student List */}
                    {fetchingData ? <div className={styles.loader}>Loading students...</div> : students.length > 0 ? (
                        <div className={styles.rosterTable}>
                            <div className={styles.rosterHeader}><span>Student</span><span style={{textAlign:'right'}}>Status</span></div>
                            <div className={styles.rosterBody}>
                                {students.map(s => {
                                    const state = attendance[s.email] || 'present';
                                    return (
                                        <div key={s.email} className={styles.rosterRow}>
                                            <div className={styles.studentInfo}>
                                                <span className={styles.studentName}>{s.email}</span>
                                                <span className={styles.studentId}>{s.studentId || 'ID Pending'}</span>
                                            </div>
                                            <button onClick={() => toggleAttendance(s.email)} className={getBtnClass(state)}>
                                                {state.charAt(0).toUpperCase() + state.slice(1)}
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ) : <div className={styles.emptyState}><p>{status.text || 'Select a class'}</p></div>}

                    {/* Save Footer */}
                    <div className={styles.saveFooter}>
                        {status.text && <p className={`${styles.statusMsg} ${status.type === 'error' ? styles.statusError : styles.statusSuccess}`}>{status.text}</p>}
                        <button onClick={saveAttendance} disabled={isSaving || students.length === 0} className={styles.saveBtn}>{isSaving ? 'Saving...' : 'Save Attendance'}</button>
                    </div>
                </>
            )}

            {activeView === 'leaves' && (
                <div className={styles.leavesSection}>
                    {leaveRequests.length === 0 ? <div className={styles.emptyState}><p>No leave requests</p></div> : (
                        leaveRequests.map(req => (
                            <div key={req.id} className={`${styles.leaveCard} ${req.status === 'pending' ? styles.leavePending : ''}`}>
                                <div className={styles.leaveInfo}>
                                    <span className={styles.leaveName}>{req.studentName} <span className={styles.leaveEmail}>({req.studentEmail})</span></span>
                                    <span className={styles.leaveDate}>Date: <strong>{req.date}</strong></span>
                                    <p className={styles.leaveReason}>"{req.reason}"</p>
                                </div>
                                <div className={styles.leaveActions}>
                                    {req.status === 'pending' ? (
                                        <>
                                            <button onClick={() => handleLeaveAction(req.id, 'approved')} className={styles.approveBtn}>Approve</button>
                                            <button onClick={() => handleLeaveAction(req.id, 'rejected')} className={styles.rejectBtn}>Reject</button>
                                        </>
                                    ) : (
                                        <span className={`${styles.leaveBadge} ${req.status === 'approved' ? styles.badgeApproved : styles.badgeRejected}`}>
                                            {req.status.toUpperCase()}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
