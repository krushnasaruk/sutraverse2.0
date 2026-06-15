'use client';

import styles from '../page.module.css';

export default function GalleryTab({
    isMemberOrAdmin,
    setShowAddPhotoModal,
    galleryList,
    showAddPhotoModal,
    handleAddPhoto,
    newPhotoUrl,
    setNewPhotoUrl,
    newPhotoCaption,
    setNewPhotoCaption,
    newPhotoEvent,
    setNewPhotoEvent,
    submittingPhoto,
    eventsList
}) {
    return (
        <div className={styles.tabContent}>
            <div className={styles.sectionHeaderRow}>
                <div>
                    <h2 className={styles.sectionTitle}>📸 Event Memories Gallery</h2>
                    <p className={styles.sectionSubtitle}>Highlights, workshops, and milestones captured by our members.</p>
                </div>
                {isMemberOrAdmin && (
                    <button
                        className={styles.addPhotoBtn}
                        onClick={() => setShowAddPhotoModal(true)}
                    >
                        ✨ Add Memory
                    </button>
                )}
            </div>

            {galleryList.length === 0 ? (
                <div className={styles.emptyGalleryState}>
                    📷 No photos added yet. Click "Add Memory" to share the first club milestone!
                </div>
            ) : (
                <div className={styles.galleryGrid}>
                    {galleryList.map(item => (
                        <div key={item.id} className={styles.galleryCard}>
                            <div className={styles.galleryImgWrapper}>
                                <img src={item.photoUrl} alt={item.caption || 'Memory'} className={styles.galleryImg} />
                                <div className={styles.galleryOverlay}>
                                    <span className={styles.galleryEventBadge}>📍 {item.eventName}</span>
                                    {item.caption && <p className={styles.galleryCaptionText}>{item.caption}</p>}
                                    <div className={styles.galleryFooter}>
                                        <span>By {item.uploadedBy}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Photo Modal */}
            {showAddPhotoModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <div className={styles.modalHeader}>
                            <h3>✨ Add Memory to Gallery</h3>
                            <button className={styles.closeModalBtn} onClick={() => setShowAddPhotoModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleAddPhoto} className={styles.modalForm}>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Image URL</label>
                                <input type="url" className={styles.input} required placeholder="https://..." value={newPhotoUrl} onChange={e => setNewPhotoUrl(e.target.value)} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Caption</label>
                                <input type="text" className={styles.input} placeholder="Short caption..." value={newPhotoCaption} onChange={e => setNewPhotoCaption(e.target.value)} />
                            </div>
                            <div className={styles.formGroup}>
                                <label className={styles.label}>Associated Event</label>
                                <select className={styles.input} value={newPhotoEvent} onChange={e => setNewPhotoEvent(e.target.value)}>
                                    <option value="General Club">General Club</option>
                                    {eventsList.map(e => <option key={e.id} value={e.title}>{e.title}</option>)}
                                </select>
                            </div>
                            <button type="submit" className={styles.postBtn} disabled={submittingPhoto}>
                                {submittingPhoto ? 'Uploading...' : 'Save Memory'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
