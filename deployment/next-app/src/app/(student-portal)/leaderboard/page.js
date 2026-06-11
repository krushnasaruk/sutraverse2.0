'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/database/config/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { ScrollReveal } from '@/frontend/components/ui/Animations';
import { getUserLevelAndBadges } from '@/database/queries/points';
import styles from './page.module.css';

export default function LeaderboardPage() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, orderBy('points', 'desc'), limit(50));
                const snapshot = await getDocs(q);
                
                const usersData = snapshot.docs.map(doc => {
                    const data = doc.data();
                    const gamification = getUserLevelAndBadges(data.points || 0);
                    return {
                        id: doc.id,
                        ...data,
                        ...gamification
                    };
                });
                
                setUsers(usersData);
            } catch (error) {
                console.error("Error fetching leaderboard:", error);
                try {
                    const allUsersSnap = await getDocs(collection(db, 'users'));
                    let allUsers = allUsersSnap.docs.map(doc => {
                        const data = doc.data();
                        const gamification = getUserLevelAndBadges(data.points || 0);
                        return { id: doc.id, ...data, ...gamification };
                    });
                    allUsers.sort((a, b) => (b.points || 0) - (a.points || 0));
                    setUsers(allUsers.slice(0, 50));
                } catch(e) {
                     console.error("Fallback failed:", e);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchLeaderboard();
    }, []);

    if (loading) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.loadingState}>Loading rankings...</div>
            </div>
        );
    }

    const topThree = users.slice(0, 3);
    const rest = users.slice(3);
    const totalXP = users.reduce((sum, u) => sum + (u.currentPoints || 0), 0);

    const renderPodiumCard = (user, rank) => {
        if (!user) return null;
        const rankClass = rank === 1 ? styles.gold : rank === 2 ? styles.silver : styles.bronze;
        const medals = ['', '🥇', '🥈', '🥉'];
        
        return (
            <Link href={`/profile/${user.id}`} className={`${styles.podiumCard} ${rankClass}`}>
                {rank === 1 && <div className={styles.crown}>👑</div>}
                <div className={styles.rankBadge}>{medals[rank]}</div>
                
                {user.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className={styles.podiumAvatar} />
                ) : (
                    <div className={styles.avatarFallback}>{user.name?.charAt(0) || '?'}</div>
                )}
                
                <div className={styles.podiumName}>{user.name || 'Anonymous'}</div>
                <div className={styles.podiumMeta}>
                    <span>{user.currentBadge?.icon}</span>
                    <span>Level {user.level}</span>
                </div>
                <div className={styles.podiumXP}>{user.currentPoints.toLocaleString()} XP</div>
                
                <div className={styles.miniProgress}>
                    <div className={styles.miniProgressFill} style={{ width: `${user.progressToNextLevel}%` }}></div>
                </div>
            </Link>
        );
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.bgOrb1}></div>
            <div className={styles.bgOrb2}></div>
            <div className={styles.bgOrb3}></div>

            <div className={styles.container}>
                <ScrollReveal>
                    <div className={styles.header}>
                        <div className={styles.heroBadge}>
                            <span className={styles.heroBadgeDot}></span>
                            Global Rankings
                        </div>
                        <h1 className={styles.title}>
                            Hall of <span className={styles.titleAccent}>Fame.</span>
                        </h1>
                        <p className={styles.subtitle}>
                            The most active and helpful students on campus. Earn XP by contributing to the community, helping peers, and sharing knowledge.
                        </p>

                        <div className={styles.statsStrip}>
                            <div className={styles.statItem}>
                                <span className={styles.statNum}>{users.length}</span>
                                <span className={styles.statLabel}>Ranked</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statNum}>{totalXP.toLocaleString()}</span>
                                <span className={styles.statLabel}>Total XP</span>
                            </div>
                            <div className={styles.statItem}>
                                <span className={styles.statNum}>{topThree[0]?.level || 1}</span>
                                <span className={styles.statLabel}>Top Level</span>
                            </div>
                        </div>
                    </div>
                </ScrollReveal>

                {users.length === 0 ? (
                    <div className={styles.emptyState}>
                        No users ranked yet. Be the first to earn points!
                    </div>
                ) : (
                    <>
                        {/* ── TOP 3 PODIUM ── */}
                        {topThree.length > 0 && (
                            <ScrollReveal delay={100}>
                                <div className={styles.podium}>
                                    {renderPodiumCard(topThree[1], 2)}
                                    {renderPodiumCard(topThree[0], 1)}
                                    {renderPodiumCard(topThree[2], 3)}
                                </div>
                            </ScrollReveal>
                        )}

                        {/* ── LEADERBOARD LIST ── */}
                        {rest.length > 0 && (
                            <ScrollReveal delay={200}>
                                <div className={styles.leaderboardList}>
                                    <div className={styles.listHeader}>
                                        <div>Rank</div>
                                        <div>Student</div>
                                        <div className={styles.levelCol}>Level</div>
                                        <div className={styles.xpCol}>XP</div>
                                    </div>
                                    
                                    {rest.map((user, index) => (
                                        <Link href={`/profile/${user.id}`} key={user.id} className={styles.listItem}>
                                            <div className={styles.rankCol}>{index + 4}</div>
                                            <div className={styles.userCol}>
                                                {user.photoURL ? (
                                                    <img src={user.photoURL} alt={user.name} className={styles.listAvatar} />
                                                ) : (
                                                    <div className={styles.listAvatarFallback}>{user.name?.charAt(0) || '?'}</div>
                                                )}
                                                <div className={styles.listName}>{user.name || 'Anonymous'}</div>
                                            </div>
                                            <div className={styles.levelCol}>
                                                <span>{user.currentBadge?.icon}</span>
                                                Lvl {user.level}
                                            </div>
                                            <div className={styles.xpCol}>{user.currentPoints.toLocaleString()}</div>
                                        </Link>
                                    ))}
                                </div>
                            </ScrollReveal>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
