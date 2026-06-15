'use client';

import Link from 'next/link';
import styles from '../page.module.css';

export default function ClubHero({
    club,
    joined,
    isAdmin,
    handleJoin,
    joiningLoading,
    members
}) {
    return (
        <div className={styles.heroBanner}>
            <div className={styles.heroBannerBg} style={{
                background: club.coverImage
                    ? `url(${club.coverImage}) center/cover no-repeat`
                    : club.gradient || 'var(--gradient-brand)'
            }}></div>

            {/* Floating particles */}
            <div className={styles.heroParticles}>
                {[...Array(8)].map((_, i) => (
                    <div key={i} className={styles.particle}
                        style={{ left: `${10 + i * 12}%`, width: `${4 + i % 3 * 3}px`, height: `${4 + i % 3 * 3}px` }}
                    />
                ))}
            </div>

            <div className={styles.heroContainer}>
                <Link href="/clubs" className={styles.backBtn}>← All Clubs</Link>

                <div className={styles.heroContent}>
                    {/* Icon */}
                    <div className={styles.heroLeft}>
                        <div className={styles.heroIconWrap}>
                            <div className={styles.heroIcon}>{club.emoji || '🎓'}</div>
                            <div className={styles.heroIconGlow} style={{ background: club.gradient || 'var(--gradient-brand)' }}></div>
                        </div>
                    </div>

                    {/* Info */}
                    <div className={styles.heroInfo}>
                        <div className={styles.heroTopRow}>
                            <span className={styles.clubCategoryBadge}>{club.category}</span>
                            {club.upcomingEvent && (
                                <span className={styles.eventBadge}>📅 {club.upcomingEvent}</span>
                            )}
                        </div>
                        <h1 className={styles.clubName}>{club.name}</h1>
                        <p className={styles.clubDesc}>{club.description}</p>

                        {club.tags?.length > 0 && (
                            <div className={styles.heroTags}>
                                {club.tags.map(tag => (
                                    <span key={tag} className={styles.heroTag}>{tag}</span>
                                ))}
                            </div>
                        )}

                        <div className={styles.heroMetaRow}>
                            <span className={styles.metaPill}>👥 {club.membersCount || members.length} members</span>
                            {club.meetSchedule && <span className={styles.metaPill}>📍 {club.meetSchedule}</span>}
                            {club.adminName && <span className={styles.metaPill}>👤 Led by {club.adminName}</span>}
                            {club.supervisorName && <span className={styles.metaPill}>🎓 Supervised by {club.supervisorName}</span>}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className={styles.heroActions}>
                        {/* Join/Leave */}
                        {!isAdmin && (
                            joined ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                    <div className={styles.joinedBadge}>✅ You're a member!</div>
                                    <button className={styles.leaveBtnLarge} onClick={handleJoin} disabled={joiningLoading}>
                                        {joiningLoading ? 'Leaving...' : 'Leave Club'}
                                    </button>
                                </div>
                            ) : (
                                <button className={styles.joinBtnLarge} onClick={handleJoin} disabled={joiningLoading}>
                                    {joiningLoading ? 'Joining...' : <>Join Club <span className={styles.joinArrow}>→</span></>}
                                </button>
                            )
                        )}

                        {/* Joining/Registration link */}
                        {club.joiningLink && (
                            <a href={club.joiningLink.startsWith('http') ? club.joiningLink : `https://${club.joiningLink}`}
                                target="_blank" rel="noopener noreferrer" className={styles.linkBtn} style={{ background: 'rgba(34,197,94,0.25)', borderColor: 'rgba(34,197,94,0.5)' }}>
                                📋 Registration Form
                            </a>
                        )}

                        {/* Discord */}
                        {club.discord && (
                            <a href={club.discord.startsWith('http') ? club.discord : `https://${club.discord}`}
                                target="_blank" rel="noopener noreferrer" className={styles.discordBtn}>
                                💬 Discord Server
                            </a>
                        )}

                        {/* WhatsApp */}
                        {club.whatsapp && (
                            <a href={club.whatsapp.startsWith('http') ? club.whatsapp : `https://${club.whatsapp}`}
                                target="_blank" rel="noopener noreferrer" className={styles.linkBtn} style={{ background: 'rgba(34,197,94,0.2)', borderColor: 'rgba(34,197,94,0.4)' }}>
                                📱 WhatsApp Group
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
