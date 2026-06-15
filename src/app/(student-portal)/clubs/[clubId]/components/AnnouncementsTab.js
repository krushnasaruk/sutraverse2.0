'use client';

import styles from '../page.module.css';

export default function AnnouncementsTab({
    isAdmin,
    user,
    newAnnouncement,
    setNewAnnouncement,
    handlePostAnnouncement,
    posting,
    joined,
    handleJoin,
    joiningLoading,
    announcements,
    formatDate
}) {
    return (
        <div className={styles.tabContent}>
            {/* Compose box — visible to admins */}
            {isAdmin && (
                <div className={styles.composeBox}>
                    <div className={styles.composeAvatar}>
                        {user?.photoURL ? <img src={user.photoURL} alt="" style={{ width: 44, height: 44, borderRadius: '50%' }} /> : '📢'}
                    </div>
                    <div className={styles.composeRight}>
                        <textarea
                            className={styles.composeInput}
                            placeholder="Post an announcement to all members..."
                            value={newAnnouncement}
                            onChange={e => setNewAnnouncement(e.target.value)}
                            maxLength={2000}
                        />
                        <div className={styles.composeFooter}>
                            <span className={styles.composeTip}>📌 Members will see this immediately.</span>
                            <button
                                className={styles.postBtn}
                                onClick={handlePostAnnouncement}
                                disabled={posting || !newAnnouncement.trim()}
                            >
                                {posting ? 'Posting...' : 'Post Announcement'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Join prompt for non-members */}
            {!joined && !isAdmin && (
                <div className={styles.joinPrompt}>
                    <span>🔔</span>
                    <div>
                        <strong>Join to see all announcements!</strong>
                        <p>Members get notified about events, updates, and much more.</p>
                    </div>
                    <button className={styles.joinPromptBtn} onClick={handleJoin} disabled={joiningLoading}>
                        {joiningLoading ? 'Joining...' : 'Join Club'}
                    </button>
                </div>
            )}

            {announcements.length === 0 ? (
                <div className={styles.emptyTab}>
                    <div className={styles.emptyTabIcon}>📭</div>
                    <p>No announcements yet.{isAdmin ? ' Be the first to post!' : ' Check back soon!'}</p>
                </div>
            ) : (
                <div className={styles.announcementList}>
                    {announcements.map((a, i) => (
                        <div key={a.id}
                            className={`${styles.announcementCard} ${a.pinned ? styles.pinnedCard : ''}`}
                            style={{ animationDelay: `${i * 60}ms` }}
                        >
                            {a.pinned && <div className={styles.pinnedBanner}>📌 Pinned</div>}
                            <div className={styles.announceHeader}>
                                <div className={styles.announceAuthorRow}>
                                    <div className={styles.announceAvatar}>{a.authorEmoji || a.authorName?.charAt(0) || '👤'}</div>
                                    <div>
                                        <div className={styles.announceAuthor}>{a.authorName}</div>
                                        <div className={styles.announceTime}>{formatDate(a.createdAt)}</div>
                                    </div>
                                </div>
                            </div>
                            <div className={styles.announceBody}>{a.content}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
