'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useAuth } from '@/frontend/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import styles from './layout.module.css';

// ── Context: shares selected class across all teacher sub-pages ──
const TeacherContext = createContext(null);
export function useTeacher() { return useContext(TeacherContext); }

export default function TeacherLayout({ children }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const [selectedClass, setSelectedClass] = useState(null);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Auth gate
    useEffect(() => {
        if (!loading) {
            if (!user) router.push('/login');
            else if (user.role !== 'teacher') router.push('/dashboard');
        }
    }, [user, loading, router]);

    // Auto-select first class
    useEffect(() => {
        if (user?.assignments?.length > 0 && !selectedClass) {
            setSelectedClass(user.assignments[0]);
        }
    }, [user, selectedClass]);

    if (loading || !user || user.role !== 'teacher') {
        return <div className={styles.loadingState}>Loading workspace...</div>;
    }

    const handleClassChange = (e) => {
        const idx = parseInt(e.target.value);
        if (user.assignments?.[idx]) {
            setSelectedClass(user.assignments[idx]);
        }
    };

    const navItems = [
        { href: '/teacher', label: 'Overview', icon: '◻️' },
        { href: '/teacher/attendance', label: 'Attendance', icon: '📋' },
        { href: '/teacher/deadlines', label: 'Deadlines', icon: '📅' },
        { href: '/teacher/mcq-tests', label: 'MCQ Tests', icon: '📝' },
        { href: '/teacher/grades', label: 'SPPU Grades', icon: '🎓' },
        { href: '/teacher/materials', label: 'Materials', icon: '📁' },
        { href: '/teacher/scheduler', label: 'Scheduler', icon: '🏛️' },
        { href: '/teacher/workspace', label: 'Workspace', icon: '🧰' },
    ];

    const erpItems = [
        { href: '/teacher/guardians', label: 'Guardians', icon: '👨‍👩‍👧' },
        { href: '/teacher/analytics', label: 'Analytics', icon: '📊' },
        { href: '/teacher/diary', label: 'Class Diary', icon: '📝' },
        { href: '/teacher/feedback', label: 'Feedback', icon: '💬' },
    ];

    const isActive = (href) => {
        if (href === '/teacher') return pathname === '/teacher';
        return pathname.startsWith(href);
    };

    return (
        <TeacherContext.Provider value={{ selectedClass, setSelectedClass, user }}>
            <div className={styles.hubLayout}>
                {/* Mobile overlay */}
                <div 
                    className={`${styles.overlay} ${!sidebarOpen ? styles.overlayHidden : ''}`}
                    onClick={() => setSidebarOpen(false)}
                />

                {/* Sidebar */}
                <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
                    <div className={styles.sidebarHeader}>
                        <div className={styles.teacherInfo}>
                            <div className={styles.teacherAvatar}>
                                {user.photoURL ? (
                                    <img src={user.photoURL} alt={user.name} referrerPolicy="no-referrer" />
                                ) : (
                                    (user.name || 'T').charAt(0).toUpperCase()
                                )}
                            </div>
                            <div className={styles.teacherMeta}>
                                <span className={styles.teacherName}>{user.name || user.email.split('@')[0]}</span>
                                <span className={styles.teacherRole}>Instructor</span>
                            </div>
                        </div>

                        {/* Class Selector */}
                        {user.assignments && user.assignments.length > 0 && (
                            <select 
                                className={styles.classSelector}
                                value={user.assignments.indexOf(selectedClass)}
                                onChange={handleClassChange}
                            >
                                {user.assignments.map((a, idx) => (
                                    <option key={idx} value={idx}>
                                        {a.classId} — {a.subject}
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>

                    <nav className={styles.navSection}>
                        <span className={styles.navLabel}>Navigation</span>
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                        <span className={styles.navLabel} style={{marginTop: '8px'}}>ERP Modules</span>
                        {erpItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`${styles.navLink} ${isActive(item.href) ? styles.navLinkActive : ''}`}
                                onClick={() => setSidebarOpen(false)}
                            >
                                <span className={styles.navIcon}>{item.icon}</span>
                                {item.label}
                            </Link>
                        ))}
                    </nav>

                    <div className={styles.sidebarFooter}>
                        Sutras Teacher Hub v2.0
                    </div>
                </aside>

                {/* Mobile Toggle */}
                <button 
                    className={styles.mobileToggle}
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    {sidebarOpen ? '✕' : '☰'}
                </button>

                {/* Main Content — rendered by child pages */}
                <main className={styles.mainContent}>
                    {children}
                </main>
            </div>
        </TeacherContext.Provider>
    );
}
