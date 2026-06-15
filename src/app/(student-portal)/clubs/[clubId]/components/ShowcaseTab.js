'use client';

import styles from '../page.module.css';

export default function ShowcaseTab({
    projectsList,
    joined,
    setShowAddProjModal,
    user,
    handleLikeProject,
    showAddProjModal,
    handleCreateProject,
    newProjTitle,
    setNewProjTitle,
    newProjDesc,
    setNewProjDesc,
    newProjLink,
    setNewProjLink,
    newProjImage,
    setNewProjImage,
    newProjTags,
    setNewProjTags,
    submittingProj
}) {
    return (
        <div className={styles.tabContent}>
            {/* Showcase Controls */}
            <div className={styles.eventsHeader}>
                <div>
                    <span className={styles.membersTitle}>Project Showcase</span>
                    <span className={styles.membersSubtitle}>({projectsList.length} innovations)</span>
                </div>
                {joined && (
                    <button
                        className={styles.postBtn}
                        onClick={() => setShowAddProjModal(true)}
                    >
                        🚀 Share Your Project
                    </button>
                )}
            </div>

            {/* Projects Masonry / Grid */}
            {projectsList.length === 0 ? (
                <div className={styles.emptyTab}>
                    <div className={styles.emptyTabIcon}>🎨</div>
                    <p>No projects shared yet. {joined ? "Be the first to showcase your work!" : "Join the club to start sharing projects."}</p>
                </div>
            ) : (
                <div className={styles.projectsMasonry}>
                    {projectsList.map((proj, i) => {
                        const hasLiked = user && proj.likes?.includes(user.uid);
                        return (
                            <div key={proj.id} className={styles.projectCard} style={{ animationDelay: `${i * 60}ms` }}>
                                <div className={styles.projectImageWrap}>
                                    <img
                                        src={proj.imageUrl}
                                        alt={proj.title}
                                        className={styles.projectImage}
                                        loading="lazy"
                                    />
                                    <div className={styles.projectGlassOverlay}>
                                        {proj.link && (
                                            <a
                                                href={proj.link.startsWith('http') ? proj.link : `https://${proj.link}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={styles.projLinkBtn}
                                            >
                                                🔗 View Project ↗
                                            </a>
                                        )}
                                    </div>
                                    <button
                                        className={`${styles.projLikeBtn} ${hasLiked ? styles.projLikeBtnActive : ''}`}
                                        onClick={() => handleLikeProject(proj.id)}
                                        title={hasLiked ? 'Unlike Project' : 'Like Project'}
                                    >
                                        ❤️ <span className={styles.projLikeCount}>{proj.likeCount || 0}</span>
                                    </button>
                                </div>

                                <div className={styles.projectInfo}>
                                    <h4 className={styles.projectTitle}>{proj.title}</h4>
                                    <p className={styles.projectDesc}>{proj.description}</p>

                                    {proj.tags && proj.tags.length > 0 && (
                                        <div className={styles.projTags}>
                                            {proj.tags.map(tag => (
                                                <span key={tag} className={styles.projTag}>#{tag}</span>
                                            ))}
                                        </div>
                                    )}

                                    <div className={styles.projectFooter}>
                                        <span className={styles.projectCreator}>BY {proj.creatorName.toUpperCase()}</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add Project Modal */}
            {showAddProjModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>🚀 Share New Project</h3>
                            <button
                                className={styles.closeModalBtn}
                                onClick={() => setShowAddProjModal(false)}
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCreateProject} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Project Title</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    required
                                    placeholder="Enter project name..."
                                    value={newProjTitle}
                                    onChange={e => setNewProjTitle(e.target.value)}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Description</label>
                                <textarea
                                    className={styles.textarea}
                                    required
                                    placeholder="What did you build? Explain the stack and features..."
                                    value={newProjDesc}
                                    onChange={e => setNewProjDesc(e.target.value)}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Demo / Repository URL</label>
                                <input
                                    type="url"
                                    className={styles.input}
                                    placeholder="https://github.com/... or live URL"
                                    value={newProjLink}
                                    onChange={e => setNewProjLink(e.target.value)}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Visual Thumbnail Image URL</label>
                                <input
                                    type="url"
                                    className={styles.input}
                                    placeholder="https://images.unsplash.com/..."
                                    value={newProjImage}
                                    onChange={e => setNewProjImage(e.target.value)}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Tags (comma separated)</label>
                                <input
                                    type="text"
                                    className={styles.input}
                                    placeholder="react, firebase, ai, robotics"
                                    value={newProjTags}
                                    onChange={e => setNewProjTags(e.target.value)}
                                />
                            </div>
                            <div className={styles.modalFooter}>
                                <button
                                    type="button"
                                    className={styles.deleteBtn}
                                    style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
                                    onClick={() => setShowAddProjModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className={styles.postBtn}
                                    disabled={submittingProj}
                                >
                                    {submittingProj ? 'Sharing...' : 'Share Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
