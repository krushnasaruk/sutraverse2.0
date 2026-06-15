'use client';

import Link from 'next/link';
import { IconFolder, IconDownload, IconStar } from '@/frontend/components/ui/Icons';
import styles from '../page.module.css';

export default function RepositoryTab({
    user,
    classMaterials,
    getTypeClass,
    getUploadIcon,
    loadingUploads,
    uploads,
    getStatusBadge
}) {
    return (
        <div className={styles.tabRepositoryLayout}>
            {/* Teacher Added Material Tile */}
            {user.classId && classMaterials.length > 0 && (
                <div className={`${styles.bentoTile} ${styles.uploadsTile} glass-panel`} style={{marginBottom: '20px'}}>
                    <h2 className={styles.sectionTitle} style={{color: 'var(--secondary)'}}>📘 Teacher Materials</h2>
                    <p style={{color: 'var(--text-secondary)', marginBottom: '16px', fontSize: '0.9rem'}}>Curated directly for {user.classId}.</p>
                    <div className={styles.uploadsList}>
                        {classMaterials.map((item) => (
                            <div key={item.id} className={styles.uploadItem}>
                                <div className={`${styles.uploadIcon} ${getTypeClass(item.type)}`}>{getUploadIcon(item.type)}</div>
                                <div className={styles.uploadDetails}>
                                    <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.uploadTitle} style={{textDecoration: 'none', color: 'inherit'}}>{item.title}</a>
                                    <div className={styles.uploadMeta}>
                                        {item.type} · {item.subject} · Authored By {item.uploaderName}
                                    </div>
                                </div>
                                <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className={styles.downloadLink} style={{color: 'var(--secondary)'}}>
                                    <IconDownload size={18} />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tile 3: My Uploads */}
            <div className={`${styles.bentoTile} ${styles.uploadsTile} glass-panel`}>
                <h2 className={styles.sectionTitle}><IconFolder size={24} /> My Repository</h2>
                {loadingUploads ? (
                    <div className={styles.emptyState}><div className={styles.emptyText}>Syncing...</div></div>
                ) : uploads.length === 0 ? (
                    <div className={styles.emptyStateGamified}>
                        <div className={styles.bountyIcon}>🎯</div>
                        <div className={styles.emptyText} style={{ fontSize: '1.25rem', color: '#fff' }}>Bounty Available: First Contributor</div>
                        <div className={styles.emptySub} style={{ margin: '12px 0 24px', opacity: 0.8 }}>
                            Your personal repository is currently empty. Upload your first PDF to unlock the <strong style={{ color: 'var(--primary-light)' }}>🎓 Foundation</strong> badge and earn <strong style={{ color: 'var(--accent)' }}>50 Points</strong>!
                        </div>
                        <Link href="/subjects" className={styles.btnBounty}>
                            Claim Bounty →
                        </Link>
                    </div>
                ) : (
                    <div className={styles.uploadsList}>
                        {uploads.map((item) => (
                            <div key={item.id} className={styles.uploadItem}>
                                <div className={`${styles.uploadIcon} ${getTypeClass(item.type)}`}>{getUploadIcon(item.type)}</div>
                                <div className={styles.uploadDetails}>
                                    <div className={styles.uploadTitle}>{item.title}</div>
                                    <div className={styles.uploadMeta}>
                                        {item.type} · {item.subject} · {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '—'}
                                        {' · '}{getStatusBadge(item.status)}
                                    </div>
                                </div>
                                <div className={styles.uploadStats}>
                                    <span><IconDownload size={14} /> {item.downloads || 0}</span>
                                    <span><IconStar size={14} /> {item.rating || '—'}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
