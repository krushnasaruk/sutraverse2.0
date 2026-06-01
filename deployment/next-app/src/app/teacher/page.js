'use client';

import { useState, useEffect } from 'react';
import { useTeacher } from './layout';
import { db } from '@/lib/firebase';
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
                const rosterSnap = await getDocs(rosterQ);
                const totalStudents = rosterSnap.size;

                // 2. Today's attendance
                const today = new Date().toISOString().split('T')[0];
                const attQ = query(collection(db, 'attendance'), where('classId', '==', selectedClass.classId));
                const attSnap = await getDocs(attQ);
                let todayPresent = 0;
                const totalClasses = attSnap.size;
                attSnap.forEach(d => {
                    const data = d.data();
                    if (data.date === today) {
                        todayPresent = (data.presentStudents?.length || 0) + (data.lateStudents?.length || 0);
                    }
                });

                // 3. Pending leave requests
                const lrQ = query(collection(db, 'leaveRequests'), where('classId', '==', selectedClass.classId));
                const lrSnap = await getDocs(lrQ);
                let pendingLeaves = 0;
                lrSnap.forEach(d => { if (d.data().status === 'pending') pendingLeaves++; });

                // 4. Upcoming deadlines
                const dlQ = query(collection(db, 'deadlines'), where('classId', '==', selectedClass.classId));
                const dlSnap = await getDocs(dlQ);
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
                <div>
                    <h1 className={styles.pageTitle}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, {user.name?.split(' ')[0] || 'Professor'}</h1>
                    <p className={styles.pageSubtitle}>{selectedClass.classId} — {selectedClass.subject}</p>
                </div>
            </header>

            {/* Stats Bento Grid */}
            <div className={styles.statsGrid}>
                <Link href="/teacher/attendance" className={styles.statCard}>
                    <span className={styles.statIcon}>👥</span>
                    <span className={styles.statValue}>{loadingStats ? '—' : stats.totalStudents}</span>
                    <span className={styles.statLabel}>Total Students</span>
                </Link>
                <Link href="/teacher/attendance" className={`${styles.statCard} ${styles.statHighlight}`}>
                    <span className={styles.statIcon}>✅</span>
                    <span className={styles.statValue}>{loadingStats ? '—' : stats.todayPresent}</span>
                    <span className={styles.statLabel}>Present Today</span>
                </Link>
                <Link href="/teacher/attendance" className={styles.statCard}>
                    <span className={styles.statIcon}>📩</span>
                    <span className={styles.statValue}>{loadingStats ? '—' : stats.pendingLeaves}</span>
                    <span className={styles.statLabel}>Pending Leaves</span>
                </Link>
                <Link href="/teacher/deadlines" className={styles.statCard}>
                    <span className={styles.statIcon}>📅</span>
                    <span className={styles.statValue}>{loadingStats ? '—' : stats.upcomingDeadlines}</span>
                    <span className={styles.statLabel}>Active Deadlines</span>
                </Link>
            </div>

            {/* Red List */}
            {defaulters.length > 0 && (
                <div className={styles.redListCard}>
                    <div className={styles.redListHeader}>
                        <div>
                            <h3 className={styles.redListTitle}>
                                <span className={styles.redDot}></span>
                                Requires Attention
                            </h3>
                            <p className={styles.redListSub}>Students below 75% cumulative attendance</p>
                        </div>
                        <Link href="/teacher/attendance" className={styles.viewAllLink}>View in Attendance →</Link>
                    </div>
                    <div className={styles.redListGrid}>
                        {defaulters.slice(0, 6).map(d => (
                            <div key={d.email} className={styles.defaulterCard}>
                                <span className={styles.defaulterName}>{d.name || d.email.split('@')[0]}</span>
                                <span className={styles.defaulterPct}>{d.percentage}%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className={styles.quickActionsGrid}>
                {/* Announcement quick-post */}
                <div className={styles.actionCard}>
                    <h3 className={styles.actionTitle}>Quick Announcement</h3>
                    <p className={styles.actionSub}>Post to all students in {selectedClass.classId}</p>
                    <form onSubmit={handlePostAnnouncement} className={styles.announcementForm}>
                        <textarea
                            placeholder="Type your announcement..."
                            value={announcementText}
                            onChange={e => setAnnouncementText(e.target.value)}
                            rows={3}
                            className={styles.announcementInput}
                            required
                        />
                        {status.text && (
                            <p className={`${styles.statusMsg} ${status.type === 'error' ? styles.statusError : styles.statusSuccess}`}>
                                {status.text}
                            </p>
                        )}
                        <button type="submit" disabled={isSaving || !announcementText.trim()} className={styles.sendBtn}>
                            {isSaving ? 'Sending...' : 'Send Announcement'}
                        </button>
                    </form>
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
