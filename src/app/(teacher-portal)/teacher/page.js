'use client';

import { useState, useEffect } from 'react';
import { useTeacher } from './layout';
import { db } from '@/database/config/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import Link from 'next/link';
import styles from './page.module.css';

export default function TeacherOverview() {
    const { selectedClass, user } = useTeacher();
    const [stats, setStats] = useState({ totalStudents: 0, todayPresent: 0, pendingLeaves: 0, upcomingDeadlines: 0 });
    const [defaulters, setDefaulters] = useState([]);
    const [announcementText, setAnnouncementText] = useState('');
    const [status, setStatus] = useState({ text: '', type: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        if (!selectedClass) return;
        let cancelled = false;

        const fetchOverview = async () => {
            setLoadingStats(true);
            try {
                // 1. Total students
                const rosterQ = query(collection(db, 'roster'), where('classId', '==', selectedClass.classId), where('role', '==', 'student'));
                const attQ = query(collection(db, 'attendance'), where('classId', '==', selectedClass.classId));
                const lrQ = query(collection(db, 'leaveRequests'), where('classId', '==', selectedClass.classId));
                const dlQ = query(collection(db, 'deadlines'), where('classId', '==', selectedClass.classId));

                const [rosterSnap, attSnap, lrSnap, dlSnap] = await Promise.all([
                    getDocs(rosterQ),
                    getDocs(attQ),
                    getDocs(lrQ),
                    getDocs(dlQ)
                ]);

                const totalStudents = rosterSnap.size;

                // 2. Today's attendance
                const today = new Date().toISOString().split('T')[0];
                let todayPresent = 0;
                const totalClasses = attSnap.size;
                attSnap.forEach(d => {
                    const data = d.data();
                    if (data.date === today) {
                        todayPresent = (data.presentStudents?.length || 0) + (data.lateStudents?.length || 0);
                    }
                });

                // 3. Pending leave requests
                let pendingLeaves = 0;
                lrSnap.forEach(d => { if (d.data().status === 'pending') pendingLeaves++; });

                // 4. Upcoming deadlines
                let upcomingDeadlines = 0;
                dlSnap.forEach(d => { if (new Date(d.data().dueDate) > new Date()) upcomingDeadlines++; });

                // 5. Defaulters
                if (totalClasses >= 3) {
                    const statMap = {};
                    attSnap.forEach(d => {
                        const data = d.data();
                        [...(data.presentStudents||[]), ...(data.excusedStudents||[]), ...(data.lateStudents||[])].forEach(email => {
                            statMap[email] = (statMap[email] || 0) + 1;
                        });
                    });
                    const dList = [];
                    rosterSnap.forEach(sDoc => {
                        const s = sDoc.data();
                        const presentDays = statMap[s.email] || 0;
                        const percentage = Math.round((presentDays / totalClasses) * 100);
                        if (percentage < 75) dList.push({ ...s, percentage });
                    });
                    if (!cancelled) setDefaulters(dList.sort((a,b) => a.percentage - b.percentage));
                }

                if (!cancelled) {
                    setStats({ totalStudents, todayPresent, pendingLeaves, upcomingDeadlines });
                }
            } catch(e) {
                console.error('Overview fetch error:', e);
            }
            if (!cancelled) setLoadingStats(false);
        };

        fetchOverview();
        return () => { cancelled = true; };
    }, [selectedClass]);

    const handlePostAnnouncement = async (e) => {
        e.preventDefault();
        if (!announcementText.trim() || !selectedClass) return;
        setIsSaving(true);
        try {
            await addDoc(collection(db, 'announcements'), {
                message: announcementText.trim(),
                classId: selectedClass.classId,
                subject: selectedClass.subject,
                teacherName: user.name || user.email,
                teacherEmail: user.email,
                timestamp: new Date().toISOString(),
                createdAt: new Date()
            });
            setStatus({ text: 'Announcement posted!', type: 'success' });
            setAnnouncementText('');
        } catch(err) {
            setStatus({ text: 'Error: ' + err.message, type: 'error' });
        }
        setIsSaving(false);
    };

    if (!selectedClass) {
        return (
            <div className={styles.emptyState}>
                <h2>No Classes Assigned</h2>
                <p>Contact admin to get your class roster configured.</p>
            </div>
        );
    }

    return (
        <div className={styles.overviewPage}>
            <header className={styles.pageHeader}>
                <div className={styles.headerInfo}>
                    <div className={styles.greetingRow}>
                        <h1 className={styles.pageTitle}>Welcome back, {user.name?.split(' ')[0] || 'Professor'}</h1>
                        <div className={styles.liveBadge}><span className={styles.pulseDot}></span> System Live</div>
                    </div>
                    <p className={styles.pageSubtitle}>Managing <strong>{selectedClass.classId}</strong> for <strong>{selectedClass.subject}</strong></p>
                </div>
                <div className={styles.quickAccessRow}>
                    <Link href="/teacher/attendance" className={styles.quickActionBtn}>Start Lecture</Link>
                    <Link href="/teacher/materials" className={styles.quickActionBtnSecondary}>Upload Notes</Link>
                </div>
            </header>

            {/* Stats Bento Grid */}
            <div className={styles.statsGrid}>
                <Link href="/teacher/attendance" className={styles.statCard}>
                    <div className={styles.statIconWrap} style={{background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6'}}>👥</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{loadingStats ? '...' : stats.totalStudents}</span>
                        <span className={styles.statLabel}>Enrolled Students</span>
                    </div>
                </Link>
                <Link href="/teacher/attendance" className={`${styles.statCard} ${styles.statHighlight}`}>
                    <div className={styles.statIconWrap} style={{background: 'rgba(16, 185, 129, 0.1)', color: '#10b981'}}>✅</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{loadingStats ? '...' : stats.todayPresent}</span>
                        <span className={styles.statLabel}>Attended Today</span>
                    </div>
                </Link>
                <Link href="/teacher/attendance" className={styles.statCard}>
                    <div className={styles.statIconWrap} style={{background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b'}}>📩</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{loadingStats ? '...' : stats.pendingLeaves}</span>
                        <span className={styles.statLabel}>Leave Requests</span>
                    </div>
                </Link>
                <Link href="/teacher/deadlines" className={styles.statCard}>
                    <div className={styles.statIconWrap} style={{background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444'}}>📅</div>
                    <div className={styles.statContent}>
                        <span className={styles.statValue}>{loadingStats ? '...' : stats.upcomingDeadlines}</span>
                        <span className={styles.statLabel}>Active Deadlines</span>
                    </div>
                </Link>
            </div>

            <div className={styles.mainDashboardGrid}>
                {/* Red List */}
                <div className={styles.dashboardColumn}>
                    <div className={styles.cardHeaderRow}>
                        <h3>⚠️ Defaulter Watch</h3>
                        <Link href="/teacher/attendance" className={styles.textLink}>Full Roster →</Link>
                    </div>
                    {defaulters.length > 0 ? (
                        <div className={styles.defaulterList}>
                            {defaulters.slice(0, 5).map(d => (
                                <div key={d.email} className={styles.defaulterRow}>
                                    <div className={styles.defInfo}>
                                        <span className={styles.defName}>{d.name || d.email.split('@')[0]}</span>
                                        <span className={styles.defEmail}>{d.email}</span>
                                    </div>
                                    <div className={`${styles.defStatus} ${d.percentage < 50 ? styles.statusCritical : styles.statusWarning}`}>
                                        {d.percentage}%
                                    </div>
                                </div>
                            ))}
                            {defaulters.length > 5 && <p className={styles.moreCount}>+ {defaulters.length - 5} more students below 75%</p>}
                        </div>
                    ) : (
                        <div className={styles.emptyCardState}>
                            <span className={styles.emptyIcon}>🎉</span>
                            <p>No students below 75% attendance!</p>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className={styles.dashboardColumn}>
                    <div className={styles.cardHeaderRow}>
                        <h3>📢 Class Broadcast</h3>
                    </div>
                    <div className={styles.announcementCard}>
                        <p className={styles.actionSub}>Send push notification to {selectedClass.classId} members</p>
                        <form onSubmit={handlePostAnnouncement} className={styles.announcementForm}>
                            <textarea
                                placeholder="Example: Tomorrow's lecture will be held in Lab 4 instead of Room 202..."
                                value={announcementText}
                                onChange={e => setAnnouncementText(e.target.value)}
                                rows={4}
                                className={styles.announcementInput}
                                required
                            />
                            {status.text && (
                                <p className={`${styles.statusMsg} ${status.type === 'error' ? styles.statusError : styles.statusSuccess}`}>
                                    {status.text}
                                </p>
                            )}
                            <button type="submit" disabled={isSaving || !announcementText.trim()} className={styles.sendBtn}>
                                {isSaving ? 'Broadcasting...' : '✨ Send to Class'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Quick Links */}
                <div className={styles.actionCard}>
                    <h3 className={styles.actionTitle}>Quick Actions</h3>
                    <p className={styles.actionSub}>Jump to commonly used tools</p>
                    <div className={styles.quickLinks}>
                        <Link href="/teacher/attendance" className={styles.quickLink}>📋 Take Attendance</Link>
                        <Link href="/teacher/deadlines" className={styles.quickLink}>📅 Create Deadline</Link>
                        <Link href="/teacher/materials" className={styles.quickLink}>📁 Upload Material</Link>
                        <Link href="/teacher/scheduler" className={styles.quickLink}>🏛️ Book a Room</Link>
                        <Link href="/teacher/workspace" className={styles.quickLink}>🧰 Request Equipment</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
