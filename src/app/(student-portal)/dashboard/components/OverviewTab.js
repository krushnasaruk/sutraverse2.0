'use client';

import Link from 'next/link';
import { IconUpload, IconDownload } from '@/frontend/components/ui/Icons';
import { Skeleton } from '@/frontend/components/ui/Skeleton/Skeleton';
import styles from '../page.module.css';

export default function OverviewTab({
    setDockOpen,
    dockOpen,
    user,
    earnedBadges,
    uploads,
    totalDownloads,
    userPoints,
    currentBadge,
    userLevel,
    loadingUploads
}) {
    return (
        <div className={styles.tabOverviewLayout}>
            {/* ═══ QUICK ACCESS DOCK (Collapsible on Mobile) ═══ */}
            <section className={styles.dockSection}>
                <button
                    className={styles.dockToggle}
                    onClick={() => setDockOpen(prev => !prev)}
                >
                    <span className={styles.dockToggleLeft}>
                        <span className={styles.dockToggleEmoji}>⚡</span>
                        Quick Access
                    </span>
                    <span className={`${styles.dockToggleArrow} ${dockOpen ? styles.dockToggleArrowOpen : ''}`}>▼</span>
                </button>
                <div className={`${styles.dockCollapsible} ${dockOpen ? styles.dockCollapsibleOpen : ''}`}>
                    <div className={styles.dockGrid}>
                        {[
                            { href: '/community', emoji: '💬', label: 'Community', color: '#b91c1c' },
                            { href: '/leaderboard', emoji: '🏆', label: 'Leaderboard', color: '#FFD700' },
                            { href: '/subjects', emoji: '📚', label: 'Subjects', color: '#dc2626' },
                            { href: '/pyqs', emoji: '📄', label: 'PYQs', color: '#16a34a' },
                            { href: '/assistant', emoji: '🤖', label: 'AI Tutor', color: '#166534' },
                            { href: `/profile/${user.uid}`, emoji: '👤', label: 'Public Profile', color: '#22c55e' },
                        ].map(item => (
                            <Link key={item.href} href={item.href} className={styles.dockItem}>
                                <div className={styles.dockIcon} style={{ background: `${item.color}15`, color: item.color }}>
                                    <span>{item.emoji}</span>
                                </div>
                                <span className={styles.dockLabel}>{item.label}</span>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* ═══ TROPHY CASE ═══ */}
            {loadingUploads ? (
                 <section className={styles.trophySection}>
                    <Skeleton width="120px" height="24px" style={{ marginBottom: '16px' }} />
                    <div className={styles.trophyGrid}>
                        {[1, 2, 3].map(i => <Skeleton key={i} width="80px" height="80px" borderRadius="16px" />)}
                    </div>
                 </section>
            ) : earnedBadges.length > 0 && (
                <section className={styles.trophySection}>
                    <div className={styles.trophyHeader}>
                        <h3 className={styles.trophyTitle}>🏅 Trophy Case</h3>
                        <span className={styles.trophyCount}>{earnedBadges.length} earned</span>
                    </div>
                    <div className={styles.trophyGrid}>
                        {earnedBadges.map(b => (
                            <div key={b.id} className={styles.trophyCard}>
                                <span className={styles.trophyCardIcon}>{b.icon}</span>
                                <span className={styles.trophyCardName}>{b.name}</span>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ═══ METRICS ENGINE ═══ */}
            <div className={`${styles.bentoTile} glass-panel`} style={{ padding: '24px' }}>
                <div style={{display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px'}}>
                    <div style={{width: '8px', height: '32px', background: 'var(--primary)', borderRadius: '4px'}}></div>
                    <h2 className={styles.sectionTitle} style={{ margin: 0, fontSize: '1.5rem', letterSpacing: '0.05em' }}>Metrics Engine</h2>
                </div>
                <p style={{color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem'}}>Live statistics of your contributions and academic power.</p>

                <div className={styles.premiumMetricGrid}>
                    {loadingUploads ? (
                        [1, 2, 3, 4].map(i => <Skeleton key={i} width="100%" height="140px" borderRadius="20px" />)
                    ) : (
                        <>
                            <div className={styles.premiumMetricCard}>
                                <div className={styles.metricGlow}></div>
                                <IconUpload size={28} color="var(--primary-light)" />
                                <div className={styles.metricValueBig}>{uploads.length}</div>
                                <div className={styles.metricLabelBig}>Total Uploads</div>
                            </div>
                            <div className={styles.premiumMetricCard}>
                                <div className={styles.metricGlow}></div>
                                <IconDownload size={28} color="#22c55e" />
                                <div className={styles.metricValueBig}>{totalDownloads}</div>
                                <div className={styles.metricLabelBig}>Downloads</div>
                            </div>
                            <div className={styles.premiumMetricCard}>
                                <div className={styles.metricGlow}></div>
                                <span style={{ fontSize: '1.8rem' }}>⭐</span>
                                <div className={styles.metricValueBig}>{userPoints}</div>
                                <div className={styles.metricLabelBig}>Total XP</div>
                            </div>
                            <div className={styles.premiumMetricCard}>
                                <div className={styles.metricGlow}></div>
                                <span style={{ fontSize: '1.8rem' }}>{currentBadge?.icon || '🌱'}</span>
                                <div className={styles.metricValueBig} style={{fontSize: '1.8rem', marginTop: '18px'}}>Lvl {userLevel}</div>
                                <div className={styles.metricLabelBig} style={{marginTop: '8px'}}>{currentBadge?.name}</div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
