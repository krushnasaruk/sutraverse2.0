'use client';

import styles from '../page.module.css';

export default function MembersTab({
    club,
    members,
    isAdmin,
    handleAssignRole
}) {
    return (
        <div className={styles.tabContent}>
            <div className={styles.membersHeader}>
                <span className={styles.membersTitle}>Members</span>
                <span className={styles.membersSubtitle}>({club.membersCount || members.length} total)</span>
            </div>
            <div className={styles.memberGrid}>
                {members.slice().sort((a, b) => {
                    // Calculate sort weights
                    const getWeight = (member) => {
                        if (member.id === club.adminId) return 3;
                        if (club.memberRoles?.[member.id]) return 2;
                        return 1;
                    };
                    return getWeight(b) - getWeight(a);
                }).map((m, i) => {
                    const colors = ['#dc2626','#b91c1c','#22c55e','#10b981','#f59e0b','#15803d'];
                    const bg = colors[i % colors.length];

                    let role = 'Member';
                    if (m.id === club.adminId) role = 'Admin';
                    else if (club.memberRoles?.[m.id]) role = club.memberRoles[m.id];

                    const isAdminRole = role === 'Admin';
                    const isSpecialRole = role !== 'Member' && role !== 'Admin';

                    return (
                        <div key={m.id} className={styles.memberCard} style={{ animationDelay: `${i * 50}ms` }}>
                            <div className={styles.memberAvatarWrap}>
                                <div className={styles.memberAvatar} style={{ background: bg }}>
                                    {m.photoURL
                                        ? <img src={m.photoURL} alt={m.name} style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />
                                        : (m.emoji || m.name?.charAt(0) || '?')}
                                </div>
                                {role === 'Admin' && <span className={styles.adminCrown}>👑</span>}
                            </div>
                            <div className={styles.memberInfo}>
                                <div className={styles.memberName}>{m.name || 'Member'}</div>
                                {m.branch && <div className={styles.memberBranch}>{m.branch} {m.year ? `· ${m.year}` : ''}</div>}
                                <span className={`${styles.memberRoleBadge} ${isAdminRole ? styles.adminBadge : isSpecialRole ? styles.coreBadge : ''}`}>
                                    {isAdminRole ? '⭐ Admin' : isSpecialRole ? `🔶 ${role}` : '• Member'}
                                </span>
                            </div>
                            {isAdmin && m.id !== club.adminId && (
                                <button
                                    className={styles.assignRoleBtn}
                                    onClick={() => handleAssignRole(m.id)}
                                    title="Assign Position Title"
                                >
                                    ⚡ Assign Role
                                </button>
                            )}
                            <span className={styles.memberArrow}>›</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
