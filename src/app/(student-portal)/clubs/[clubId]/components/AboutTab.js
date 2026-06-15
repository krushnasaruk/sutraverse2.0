'use client';

import styles from '../page.module.css';

export default function AboutTab({ club }) {
    return (
        <div className={styles.tabContent}>
            <div className={styles.aboutGrid}>
                {/* Description */}
                <div className={styles.aboutCard} style={{ gridColumn: '1 / -1' }}>
                    <div className={styles.aboutCardIcon} style={{ background: 'linear-gradient(135deg, #dc2626, #15803d)' }}>📖</div>
                    <div className={styles.aboutCardTitle}>About the Club</div>
                    <div className={styles.aboutCardText}>{club.description}</div>
                </div>

                {/* Tags */}
                {club.tags?.length > 0 && (
                    <div className={styles.aboutCard}>
                        <div className={styles.aboutCardIcon} style={{ background: 'linear-gradient(135deg, #b91c1c, #22c55e)' }}>🏷️</div>
                        <div className={styles.aboutCardTitle}>Tags & Interests</div>
                        <div className={styles.aboutTagsRow}>
                            {club.tags.map(tag => (
                                <span key={tag} className={styles.aboutTag}>{tag}</span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Meeting schedule */}
                {club.meetSchedule && (
                    <div className={styles.aboutCard}>
                        <div className={styles.aboutCardIcon} style={{ background: 'linear-gradient(135deg, #f59e0b, #ef4444)' }}>📍</div>
                        <div className={styles.aboutCardTitle}>Meeting Schedule</div>
                        <div className={styles.aboutCardText}>{club.meetSchedule}</div>
                    </div>
                )}

                {/* Upcoming event */}
                {club.upcomingEvent && (
                    <div className={styles.aboutCard}>
                        <div className={styles.aboutCardIcon} style={{ background: 'linear-gradient(135deg, #10b981, #dc2626)' }}>📅</div>
                        <div className={styles.aboutCardTitle}>Upcoming Event</div>
                        <div className={styles.aboutCardText}>{club.upcomingEvent}</div>
                    </div>
                )}

                {/* Join / Links */}
                {(club.joiningLink || club.discord || club.whatsapp) && (
                    <div className={styles.aboutCard}>
                        <div className={styles.aboutCardIcon} style={{ background: 'linear-gradient(135deg, #5865f2, #15803d)' }}>🔗</div>
                        <div className={styles.aboutCardTitle}>Join & Connect</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                            {club.joiningLink && (
                                <a href={club.joiningLink.startsWith('http') ? club.joiningLink : `https://${club.joiningLink}`} target="_blank" rel="noopener noreferrer" className={styles.aboutLink}>
                                    🔗 Registration Link ↗
                                </a>
                            )}
                            {club.discord && (
                                <a href={club.discord.startsWith('http') ? club.discord : `https://${club.discord}`} target="_blank" rel="noopener noreferrer" className={styles.aboutLink} style={{ color: '#5865f2' }}>
                                    💬 Discord Community ↗
                                </a>
                            )}
                            {club.whatsapp && (
                                <a href={club.whatsapp.startsWith('http') ? club.whatsapp : `https://chat.whatsapp.com/${club.whatsapp}`} target="_blank" rel="noopener noreferrer" className={styles.aboutLink} style={{ color: '#25D366' }}>
                                    📱 WhatsApp Group ↗
                                </a>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
