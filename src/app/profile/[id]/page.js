'use client';

import { useState, useEffect, use } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc } from 'firebase/firestore';
import { getUserLevelAndBadges } from '@/lib/points';
import { getBannerGradient } from '@/lib/bannerPresets';
import styles from './page.module.css';

export default function ProfilePage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const [profileUser, setProfileUser] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                // 1. Fetch User Profile
                const userRef = doc(db, 'users', params.id);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    setProfileUser({ id: userSnap.id, ...userSnap.data() });
                } else {
                    setError("User not found.");
                    setLoading(false);
                    return;
                }

                // 2. Fetch User's Posts
                const postsQ = query(
                    collection(db, 'posts'),
                    where('authorId', '==', params.id),
                    orderBy('timestamp', 'desc')
                );
                
                const postsSnap = await getDocs(postsQ);
                const postsData = postsSnap.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                setUserPosts(postsData);
            } catch (err) {
                console.error("Error fetching profile:", err);
                // Due to missing indexes on composite queries, it might fail initially. Handle gracefully.
                // If it fails on orderBy, just fetch without orderBy and sort locally for now.
                try {
                    const fallbackQ = query(collection(db, 'posts'), where('authorId', '==', params.id));
                    const fallbackSnap = await getDocs(fallbackQ);
                    const fallbackData = fallbackSnap.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    const getMillis = (ts) => ts?.toMillis ? ts.toMillis() : (new Date(ts).getTime() || 0);
                    fallbackData.sort((a,b) => getMillis(b.timestamp) - getMillis(a.timestamp));
                    setUserPosts(fallbackData);
                } catch(e) {
                     setError("Unable to load profile data.");
                }
            } finally {
                setLoading(false);
            }
        };

        if (params?.id) {
            fetchProfileData();
        }
    }, [params.id]);

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        if (typeof timestamp.toDate === 'function') {
            return timestamp.toDate().toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        }
        return new Date(timestamp).toLocaleDateString('en-US', {
            year: 'numeric', month: 'short', day: 'numeric'
        });
    };

    const getRoleClass = (role) => {
        if (role === 'teacher') return styles.roleTeacher;
        if (role === 'admin') return styles.roleAdmin;
        return '';
    };

    if (loading) return null;

    if (error) {
        return (
            <div className={styles.pageWrapper}>
                <div className={styles.container} style={{ textAlign: 'center', padding: '100px 0' }}>
                    <h1 style={{ color: 'var(--text-primary)' }}>{error}</h1>
                </div>
            </div>
        );
    }

    const gamification = profileUser ? getUserLevelAndBadges(profileUser.points || 0) : null;
    const bannerGradient = getBannerGradient(profileUser?.profileBanner || 'neon');
    const tagline = profileUser?.profileTagline || '';

    // Showcase badges: up to 3 pinned badges
    const showcaseIds = profileUser?.showcaseBadges || [];
    const showcaseBadges = gamification
        ? gamification.earnedBadges.filter(b => showcaseIds.includes(b.id))
        : [];
    // If no showcase set, use the top 3 earned badges
    const displayShowcase = showcaseBadges.length > 0
        ? showcaseBadges
        : (gamification?.earnedBadges || []).slice(0, 3);

    return (
        <div className={styles.pageWrapper}>
            {/* ═══ FLOATING ORBS ═══ */}
            <div className={styles.orb1}></div>
            <div className={styles.orb2}></div>

            {/* ═══ HERO BANNER ═══ */}
            <div className={styles.heroBanner} style={{ background: bannerGradient }}>
                <div className={styles.bannerOverlay}></div>
                <div className={styles.bannerParticles}>
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className={styles.bannerParticle}
                            style={{ left: `${10 + i * 15}%`, animationDelay: `${i * 0.6}s`, width: `${3 + (i % 3) * 2}px`, height: `${3 + (i % 3) * 2}px` }}
                        />
                    ))}
                </div>
            </div>

            {/* ═══ PROFILE HERO ═══ */}
            <div className={styles.container}>
                <div className={styles.heroCard}>
                    {/* Avatar with XP Ring */}
                    <div className={styles.avatarRingWrap}>
                        <svg className={styles.xpRingSvg} viewBox="0 0 130 130">
                            <circle cx="65" cy="65" r="58" className={styles.xpRingBg} />
                            <circle cx="65" cy="65" r="58" className={styles.xpRingFill}
                                style={{ strokeDasharray: `${((gamification?.progressToNextLevel || 0) / 100) * 364.4} 364.4` }}
                            />
                        </svg>
                        <div className={styles.avatarInner}>
                            {profileUser.photoURL ? (
                                <img src={profileUser.photoURL} alt={profileUser.name} className={styles.avatarImg} referrerPolicy="no-referrer" />
                            ) : (
                                <div className={styles.avatarFallback}>
                                    {profileUser.name ? profileUser.name.charAt(0).toUpperCase() : '?'}
                                </div>
                            )}
                        </div>
                        <div className={styles.levelPill}>
                            {gamification?.currentBadge?.icon || '🌱'} {gamification?.level || 1}
                        </div>
                    </div>

                    {/* Name & Meta */}
                    <h1 className={styles.heroName}>{profileUser.name || 'Anonymous Student'}</h1>
                    {tagline && <p className={styles.heroTagline}>{tagline}</p>}
                    <span className={`${styles.roleBadge} ${getRoleClass(profileUser.role)}`}>
                        {profileUser.role || 'Student'}
                    </span>

                    <p className={styles.heroBio}>
                        {profileUser.bio || "This user hasn't added a bio yet. They are quietly exploring the sutraverse!"}
                    </p>

                    {/* Showcase Badges */}
                    {displayShowcase.length > 0 && (
                        <div className={styles.showcaseRow}>
                            {displayShowcase.map(b => (
                                <div key={b.id} className={styles.showcaseItem} title={b.name}>
                                    <span className={styles.showcaseIcon}>{b.icon}</span>
                                    <span className={styles.showcaseName}>{b.name}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Stats Grid */}
                    <div className={styles.statsGrid}>
                        <div className={styles.statCard}>
                            <span className={styles.statNum}>{profileUser.points || 0}</span>
                            <span className={styles.statLbl}>XP</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNum}>{userPosts.length}</span>
                            <span className={styles.statLbl}>Posts</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNum}>{profileUser.classId || '—'}</span>
                            <span className={styles.statLbl}>Class</span>
                        </div>
                        <div className={styles.statCard}>
                            <span className={styles.statNum}>{profileUser.createdAt ? formatDate(profileUser.createdAt).split(',')[0] : '—'}</span>
                            <span className={styles.statLbl}>Joined</span>
                        </div>
                    </div>
                </div>

                {/* ═══ GAMIFICATION SECTION ═══ */}
                {gamification && (
                    <div className={styles.gamSection}>
                        <div className={styles.levelCard}>
                            <div className={styles.levelHeader}>
                                <div>
                                    <h3 className={styles.levelTitle}>Level {gamification.level}</h3>
                                    <div className={styles.levelSubtitle}>{gamification.currentBadge?.name || 'Novice'}</div>
                                </div>
                                <div className={styles.levelBadgeIcon}>{gamification.currentBadge?.icon || '🌱'}</div>
                            </div>
                            <div className={styles.xpBarContainer}>
                                <div className={styles.xpBarFill} style={{ width: `${gamification.progressToNextLevel}%` }}></div>
                            </div>
                            <div className={styles.xpText}>
                                {gamification.currentPoints} / {gamification.nextLevelPoints} XP to next level
                            </div>
                        </div>

                        {gamification.earnedBadges.length > 0 && (
                            <div className={styles.trophyCard}>
                                <h3 className={styles.sectionTitle}>🏅 Trophy Case</h3>
                                <div className={styles.trophyGrid}>
                                    {gamification.earnedBadges.map(b => (
                                        <div key={b.id} className={styles.trophyItem} title={b.name}>
                                            <span className={styles.trophyIcon}>{b.icon}</span>
                                            <span className={styles.trophyName}>{b.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ═══ RECENT POSTS ═══ */}
                <div className={styles.postsSection}>
                    <h2 className={styles.sectionTitle}>💬 Recent Posts</h2>
                    <div className={styles.feed}>
                        {userPosts.length === 0 ? (
                            <div className={styles.emptyFeed}>
                                <span>📭</span>
                                <p>This user hasn&apos;t posted anything yet.</p>
                            </div>
                        ) : (
                            userPosts.map((post, i) => (
                                <div key={post.id} className={styles.postCard} style={{ animationDelay: `${i * 60}ms` }}>
                                    <span className={styles.postTime}>{formatDate(post.timestamp)}</span>
                                    <div className={styles.postContent}>{post.content}</div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
