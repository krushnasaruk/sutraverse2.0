'use client';

import { useState, useEffect, use } from 'react';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getUserLevelAndBadges, BADGES } from '@/lib/points';
import { getBannerGradient, BANNER_PRESETS } from '@/lib/bannerPresets';
import { useAuth } from '@/context/AuthContext';
import { IconUser, IconSparkles, IconStar, IconNotes, IconFolder, IconHat, IconCheck, IconPen } from '@/components/Icons';
import styles from './page.module.css';

export default function ProfilePage({ params: paramsPromise }) {
    const params = use(paramsPromise);
    const { user: authUser } = useAuth();
    const [profileUser, setProfileUser] = useState(null);
    const [userPosts, setUserPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');

    // Customizer States
    const [editName, setEditName] = useState('');
    const [editTagline, setEditTagline] = useState('');
    const [editBio, setEditBio] = useState('');
    const [editBanner, setEditBanner] = useState('neon');
    const [editShowcase, setEditShowcase] = useState([]);
    const [saving, setSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                // 1. Fetch User Profile
                const userRef = doc(db, 'users', params.id);
                const userSnap = await getDoc(userRef);
                
                if (userSnap.exists()) {
                    const data = { id: userSnap.id, ...userSnap.data() };
                    setProfileUser(data);
                    
                    // Initialize edit states
                    setEditName(data.name || '');
                    setEditTagline(data.profileTagline || '');
                    setEditBio(data.bio || '');
                    setEditBanner(data.profileBanner || 'neon');
                    setEditShowcase(data.showcaseBadges || []);
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
                // Fallback local sort if missing composite index on query
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

    const handleSaveCustomization = async (e) => {
        e.preventDefault();
        setSaving(true);
        setSaveSuccess(false);
        try {
            const userRef = doc(db, 'users', profileUser.id);
            const updateData = {
                name: editName,
                profileTagline: editTagline,
                bio: editBio,
                profileBanner: editBanner,
                showcaseBadges: editShowcase
            };
            await updateDoc(userRef, updateData);
            setProfileUser(prev => ({ ...prev, ...updateData }));
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 4000);
        } catch (err) {
            console.error("Error updating profile:", err);
        } finally {
            setSaving(false);
        }
    };

    const toggleShowcaseBadge = (badgeId) => {
        setEditShowcase(prev => {
            if (prev.includes(badgeId)) {
                return prev.filter(id => id !== badgeId);
            }
            if (prev.length >= 3) {
                return prev; // Limit to max 3
            }
            return [...prev, badgeId];
        });
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

    const isOwner = authUser?.uid === profileUser?.id;
    const gamification = profileUser ? getUserLevelAndBadges(profileUser.points || 0) : null;
    const bannerGradient = getBannerGradient(profileUser?.profileBanner || 'neon');
    const tagline = profileUser?.profileTagline || '';

    // Showcase badges calculation
    const showcaseIds = profileUser?.showcaseBadges || [];
    const showcaseBadges = gamification
        ? gamification.earnedBadges.filter(b => showcaseIds.includes(b.id))
        : [];
    const displayShowcase = showcaseBadges.length > 0
        ? showcaseBadges
        : (gamification?.earnedBadges || []).slice(0, 3);

    return (
        <div className={styles.pageWrapper}>
            {/* ═══ FLOATING AMBIENT ORBS ═══ */}
            <div className={styles.orb1}></div>
            <div className={styles.orb2}></div>

            {/* ═══ PROFILE HEADER BANNER ═══ */}
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

            {/* ═══ PROFILE CARD OVERVIEW ═══ */}
            <div className={styles.container}>
                <div className={styles.heroCard}>
                    {/* Avatar Container with Animated Level Ring */}
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
                            {gamification?.currentBadge?.icon || '🌱'} Level {gamification?.level || 1}
                        </div>
                    </div>

                    {/* Metadata Header */}
                    <h1 className={styles.heroName}>{profileUser.name || 'Anonymous Student'}</h1>
                    {tagline && <p className={styles.heroTagline}>{tagline}</p>}
                    <span className={`${styles.roleBadge} ${getRoleClass(profileUser.role)}`}>
                        {profileUser.role || 'Student'}
                    </span>

                    {/* Showcase badges indicator */}
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
                </div>

                {/* ═══ TAB NAVIGATION ═══ */}
                <div className={styles.tabsContainer}>
                    <button 
                        className={`${styles.tabLink} ${activeTab === 'overview' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('overview')}
                    >
                        🏠 Home
                    </button>
                    <button 
                        className={`${styles.tabLink} ${activeTab === 'trophies' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('trophies')}
                    >
                        🏆 Achievements
                    </button>
                    <button 
                        className={`${styles.tabLink} ${activeTab === 'activity' ? styles.tabActive : ''}`}
                        onClick={() => setActiveTab('activity')}
                    >
                        💬 Activity
                    </button>
                    {isOwner && (
                        <button 
                            className={`${styles.tabLink} ${activeTab === 'customize' ? styles.tabActive : ''}`}
                            onClick={() => setActiveTab('customize')}
                        >
                            🎨 Customize
                        </button>
                    )}
                </div>

                {/* ═══ TAB CONTENT PANELS ═══ */}
                <div className={styles.tabContentPanel}>
                    
                    {/* ──── OVERVIEW TAB ──── */}
                    {activeTab === 'overview' && (
                        <div className={styles.overviewTabGrid}>
                            
                            {/* Academic Profile */}
                            <div className={`${styles.bentoCard} glass-panel`}>
                                <h3 className={styles.cardHeader}><IconHat size={20} /> Academic Overview</h3>
                                <div className={styles.academicMetaGrid}>
                                    <div className={styles.metaField}>
                                        <span className={styles.metaLabel}>College</span>
                                        <span className={styles.metaVal}>{profileUser.college || 'Not set'}</span>
                                    </div>
                                    <div className={styles.metaField}>
                                        <span className={styles.metaLabel}>Branch</span>
                                        <span className={styles.metaVal}>{profileUser.branch || 'Not set'}</span>
                                    </div>
                                    <div className={styles.metaField}>
                                        <span className={styles.metaLabel}>Semester</span>
                                        <span className={styles.metaVal}>{profileUser.semester || 'Not set'}</span>
                                    </div>
                                    <div className={styles.metaField}>
                                        <span className={styles.metaLabel}>Academic Year</span>
                                        <span className={styles.metaVal}>{profileUser.year || 'Not set'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Bio & About */}
                            <div className={`${styles.bentoCard} glass-panel`}>
                                <h3 className={styles.cardHeader}><IconUser size={20} /> About Me</h3>
                                <p className={styles.bioText}>
                                    {profileUser.bio || "This user is keeping a low profile. They haven't added a bio yet!"}
                                </p>
                            </div>

                            {/* Level Progression */}
                            <div className={`${styles.bentoCard} ${styles.levelOverviewCard} glass-panel`}>
                                <div className={styles.progressHeader}>
                                    <div>
                                        <h3 className={styles.cardHeader} style={{margin: 0}}>XP Progress</h3>
                                        <span className={styles.progressSub}>{gamification?.currentBadge?.name || 'Novice'} Status</span>
                                    </div>
                                    <span style={{fontSize: '2.5rem'}}>{gamification?.currentBadge?.icon || '🌱'}</span>
                                </div>
                                
                                <div className={styles.progressBarWrapper}>
                                    <div className={styles.progressBarFill} style={{ width: `${gamification?.progressToNextLevel || 0}%` }}></div>
                                </div>
                                <div className={styles.progressText}>
                                    <span>{profileUser.points || 0} XP Total</span>
                                    <span>{gamification?.currentPoints || 0} / {gamification?.nextLevelPoints || 10} XP for next level</span>
                                </div>
                            </div>

                            {/* Stats Summary */}
                            <div className={`${styles.bentoCard} glass-panel`}>
                                <h3 className={styles.cardHeader}><IconSparkles size={20} /> Quick Stats</h3>
                                <div className={styles.statsSummaryGrid}>
                                    <div className={styles.statSummaryBox}>
                                        <span className={styles.statSumNum}>{profileUser.points || 0}</span>
                                        <span className={styles.statSumLabel}>Total XP</span>
                                    </div>
                                    <div className={styles.statSummaryBox}>
                                        <span className={styles.statSumNum}>{userPosts.length}</span>
                                        <span className={styles.statSumLabel}>Discussions</span>
                                    </div>
                                    <div className={styles.statSummaryBox}>
                                        <span className={styles.statSumNum}>{profileUser.uploads || 0}</span>
                                        <span className={styles.statSumLabel}>Uploads</span>
                                    </div>
                                    <div className={styles.statSummaryBox}>
                                        <span className={styles.statSumNum}>{profileUser.classId || '—'}</span>
                                        <span className={styles.statSumLabel}>Classroom</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ──── TROPHIES TAB ──── */}
                    {activeTab === 'trophies' && (
                        <div className={`${styles.bentoCard} glass-panel`}>
                            <h2 className={styles.sectionTitle}>🏆 Earned Trophies</h2>
                            {gamification?.earnedBadges.length === 0 ? (
                                <p className={styles.emptyText}>No achievements unlocked yet. Participate around the platform to earn XP!</p>
                            ) : (
                                <div className={styles.trophyGridList}>
                                    {BADGES.map(badge => {
                                        const isEarned = (profileUser.points || 0) >= badge.minPoints;
                                        return (
                                            <div key={badge.id} className={`${styles.badgeDetailCard} ${isEarned ? styles.badgeEarned : styles.badgeLocked}`}>
                                                <div className={styles.badgeDetailIcon}>{badge.icon}</div>
                                                <div className={styles.badgeDetailMeta}>
                                                    <h4>{badge.name}</h4>
                                                    <p>{isEarned ? 'Unlocked' : `Requires ${badge.minPoints} XP`}</p>
                                                </div>
                                                {isEarned && <span className={styles.checkIcon}>✓</span>}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ──── ACTIVITY TAB ──── */}
                    {activeTab === 'activity' && (
                        <div className={styles.activityListWrap}>
                            <h2 className={styles.sectionTitle}>💬 Recent Post History</h2>
                            {userPosts.length === 0 ? (
                                <div className={styles.emptyFeedBox}>
                                    <span>📭</span>
                                    <p>No community posts created by this user yet.</p>
                                </div>
                            ) : (
                                <div className={styles.activityFeed}>
                                    {userPosts.map((post, i) => (
                                        <div key={post.id} className={styles.feedItemCard} style={{ animationDelay: `${i * 50}ms` }}>
                                            <span className={styles.feedItemTime}>{formatDate(post.timestamp)}</span>
                                            <p className={styles.feedItemContent}>{post.content}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ──── CUSTOMIZER TAB (Owner Only) ──── */}
                    {isOwner && activeTab === 'customize' && (
                        <div className={`${styles.bentoCard} glass-panel`}>
                            <h2 className={styles.sectionTitle}><IconPen size={20} /> Redesign Your Profile Panel</h2>
                            <p style={{color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem'}}>Customize how your dashboard displays to other users in the Sutraverse.</p>
                            
                            {saveSuccess && (
                                <div className={styles.alertSuccess}>
                                    ✨ Profile details updated successfully!
                                </div>
                            )}

                            <form onSubmit={handleSaveCustomization} className={styles.customizerForm}>
                                <div className={styles.formSection}>
                                    <label>Display Name</label>
                                    <input 
                                        type="text" 
                                        maxLength={35}
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        className={styles.glassInput}
                                        required
                                    />
                                </div>

                                <div className={styles.formSection}>
                                    <label>Tagline</label>
                                    <input 
                                        type="text" 
                                        maxLength={50}
                                        value={editTagline}
                                        onChange={(e) => setEditTagline(e.target.value)}
                                        placeholder="e.g. Code wizard & math solver"
                                        className={styles.glassInput}
                                    />
                                </div>

                                <div className={styles.formSection}>
                                    <label>Biography</label>
                                    <textarea 
                                        maxLength={250}
                                        value={editBio}
                                        onChange={(e) => setEditBio(e.target.value)}
                                        placeholder="Write something about yourself..."
                                        className={styles.glassTextarea}
                                        rows={4}
                                    />
                                </div>

                                {/* Banner Selector */}
                                <div className={styles.formSection}>
                                    <label>Header Banner Theme</label>
                                    <div className={styles.bannerPresetGrid}>
                                        {BANNER_PRESETS.map(p => (
                                            <button
                                                key={p.id}
                                                type="button"
                                                onClick={() => setEditBanner(p.id)}
                                                className={`${styles.bannerBtn} ${editBanner === p.id ? styles.bannerBtnActive : ''}`}
                                                style={{ background: p.gradient }}
                                                title={p.label}
                                            >
                                                <span className={styles.bannerLabel}>{p.label}</span>
                                                {editBanner === p.id && <span className={styles.bannerCheck}>✓</span>}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Showcase Badge Selector */}
                                <div className={styles.formSection}>
                                    <label>Pin Badges to Showcase (Max 3)</label>
                                    <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '-8px', marginBottom: '12px'}}>Select up to 3 unlocked badges to showcase at the top of your profile.</p>
                                    
                                    {gamification?.earnedBadges.length === 0 ? (
                                        <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)'}}>No badges unlocked yet to showcase.</p>
                                    ) : (
                                        <div className={styles.badgePickerGrid}>
                                            {gamification?.earnedBadges.map(badge => {
                                                const isSelected = editShowcase.includes(badge.id);
                                                return (
                                                    <button
                                                        key={badge.id}
                                                        type="button"
                                                        onClick={() => toggleShowcaseBadge(badge.id)}
                                                        className={`${styles.badgePickerBtn} ${isSelected ? styles.badgePickerSelected : ''}`}
                                                    >
                                                        <span style={{fontSize: '1.8rem'}}>{badge.icon}</span>
                                                        <span style={{fontSize: '0.8rem', fontWeight: 'bold'}}>{badge.name}</span>
                                                        {isSelected && <span className={styles.badgeCheck}>✓</span>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={saving}
                                    className={styles.saveSubmitBtn}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
