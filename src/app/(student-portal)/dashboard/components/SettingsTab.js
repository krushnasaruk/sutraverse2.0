'use client';

import { IconNotes } from '@/frontend/components/ui/Icons';
import { COLLEGES, BRANCHES, YEARS } from '@/shared/constants/subjectMap';
import { BANNER_PRESETS } from '@/shared/constants/bannerPresets';
import Webcam from 'react-webcam';
import styles from '../page.module.css';

export default function SettingsTab({
    editing,
    user,
    startEditing,
    avatarPreview,
    handleAvatarSelect,
    fileInputRef,
    editName,
    setEditName,
    editBio,
    setEditBio,
    editStudentPhone,
    setEditStudentPhone,
    editParentPhone,
    setEditParentPhone,
    editCollege,
    setEditCollege,
    editBranch,
    setEditBranch,
    editYear,
    setEditYear,
    editSemester,
    setEditSemester,
    availableSemesters,
    selectedSubjects,
    handleSubjectToggle,
    editBanner,
    setEditBanner,
    earnedBadges,
    editShowcase,
    setEditShowcase,
    isEnrolled,
    enrollmentStatus,
    setEnrollmentStatus,
    enrollWebcamRef,
    enrollBiometrics,
    setEditing,
    saveProfile,
    saving,
    uploadingAvatar,
    performanceMode,
    togglePerformanceMode
}) {
    return (
        <div className={styles.tabSettingsLayout}>
            {/* Tile 1: Academic Profile / Editing */}
            <div className={`${styles.bentoTile} ${editing ? styles.editingTile : ''} glass-panel`}>
                {!editing ? (
                    <div className={styles.profileSection}>
                        <div className={styles.profileSectionHeader}>
                            <h2 className={styles.sectionTitle}><IconNotes size={24} /> Profile Engine</h2>
                            <button className={styles.editBtn} onClick={startEditing}>Configure</button>
                        </div>
                        {user.branch ? (
                            <div className={styles.premiumGrid}>
                                <div className={styles.premiumFieldCard}>
                                    <span className={styles.fieldTitle}>Display Name</span>
                                    <span className={styles.fieldValueMain}>{user.name || 'Not set'}</span>
                                </div>
                                <div className={styles.premiumFieldCard}>
                                    <span className={styles.fieldTitle}>College</span>
                                    <span className={styles.fieldValueMain}>{user.college || 'Not set'}</span>
                                </div>
                                <div className={styles.premiumFieldCard}>
                                    <span className={styles.fieldTitle}>Branch</span>
                                    <span className={styles.fieldValueMain}>{user.branch}</span>
                                </div>
                                <div className={styles.premiumFieldCard}>
                                    <span className={styles.fieldTitle}>Year</span>
                                    <span className={styles.fieldValueMain}>{user.year}</span>
                                </div>
                                <div className={styles.premiumFieldCard}>
                                    <span className={styles.fieldTitle}>Semester</span>
                                    <span className={styles.fieldValueMain}>{user.semester}</span>
                                </div>
                            </div>
                        ) : (
                            <div className={styles.profileSetupCard}>
                                <span className={styles.setupIcon}>🎯</span>
                                <h3 className={styles.setupTitle}>Complete Your Profile</h3>
                                <p className={styles.setupDesc}>
                                    Set up your academic profile to unlock personalized notes, exam prep, and class features.
                                </p>
                                <div className={styles.setupProgressWrap}>
                                    <div className={styles.setupProgressLabel}>
                                        <span>Progress</span>
                                        <span>{Math.round(([user.name, user.college, user.branch, user.year, user.semester].filter(Boolean).length / 5) * 100)}%</span>
                                    </div>
                                    <div className={styles.setupProgressTrack}>
                                        <div className={styles.setupProgressFill} style={{ width: `${Math.round(([user.name, user.college, user.branch, user.year, user.semester].filter(Boolean).length / 5) * 100)}%` }}></div>
                                    </div>
                                </div>
                                <div className={styles.setupChecklist}>
                                    {[
                                        { label: 'Name', done: !!user.name },
                                        { label: 'College', done: !!user.college },
                                        { label: 'Branch', done: !!user.branch },
                                        { label: 'Year', done: !!user.year },
                                        { label: 'Semester', done: !!user.semester },
                                    ].map(c => (
                                        <span key={c.label} className={`${styles.setupCheckItem} ${c.done ? styles.setupCheckDone : styles.setupCheckPending}`}>
                                            {c.done ? '✓' : '○'} {c.label}
                                        </span>
                                    ))}
                                </div>
                                <button className={styles.setupBtn} onClick={startEditing}>
                                    ⚙️ Set Up Now
                                </button>
                            </div>
                        )}
                        {user.subjects && user.subjects.length > 0 && (
                            <div className={styles.subjectChips}>
                                {user.subjects.map(s => <span key={s} className={styles.subjectChip}>{s}</span>)}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className={styles.profileSection}>
                        <h2 className={styles.sectionTitle} style={{marginBottom:'20px'}}>Configure Profile</h2>

                        <div className={styles.avatarUploadSection}>
                            <div className={styles.avatarUploadPreview}>
                                {avatarPreview ? (
                                    <img src={avatarPreview} alt="Preview" />
                                ) : user.photoURL ? (
                                    <img src={user.photoURL} alt={user.name} referrerPolicy="no-referrer" />
                                ) : (
                                    <div className={styles.avatarUploadFallback}>
                                        {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                    </div>
                                )}
                            </div>
                            <div className={styles.avatarUploadControls}>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarSelect}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    type="button"
                                    className={styles.avatarUploadBtn}
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    📷 {avatarPreview ? 'Change Photo' : 'Upload Photo'}
                                </button>
                                <p className={styles.avatarUploadHint}>JPEG, PNG, or WebP · Max 5MB</p>
                            </div>
                        </div>

                        <div className={styles.glassForm}>
                            <div className={styles.modernInputWrap}>
                                <label className={styles.modernLabel}>Display Name</label>
                                <input type="text" maxLength={40} className={styles.premiumInput} value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name" />
                            </div>
                            <div className={styles.modernInputWrap}>
                                <label className={styles.modernLabel}>Short Bio</label>
                                <input type="text" maxLength={60} className={styles.premiumInput} value={editBio} onChange={(e) => setEditBio(e.target.value)} placeholder="e.g. Code wizard & coffee consumer" />
                            </div>
                            <div className={styles.formGroupRow}>
                                <div className={styles.modernInputWrap}>
                                    <label className={styles.modernLabel}>Student Phone</label>
                                    <input type="tel" className={styles.premiumInput} value={editStudentPhone} onChange={(e) => setEditStudentPhone(e.target.value)} placeholder="+1234567890" />
                                </div>
                                <div className={styles.modernInputWrap}>
                                    <label className={styles.modernLabel}>Parent Phone</label>
                                    <input type="tel" className={styles.premiumInput} value={editParentPhone} onChange={(e) => setEditParentPhone(e.target.value)} placeholder="+1987654321" />
                                </div>
                            </div>
                            <div className={styles.formGroupRow}>
                                <div className={styles.modernInputWrap}>
                                    <label className={styles.modernLabel}>College</label>
                                    <select className={`${styles.premiumInput} ${styles.premiumSelect}`} value={editCollege} onChange={(e) => setEditCollege(e.target.value)}>
                                        <option value="">Select</option>
                                        {COLLEGES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className={styles.modernInputWrap}>
                                    <label className={styles.modernLabel}>Branch</label>
                                    <select className={`${styles.premiumInput} ${styles.premiumSelect}`} value={editBranch} onChange={(e) => { setEditBranch(e.target.value); setEditSemester(''); }}>
                                        <option value="">Select</option>
                                        {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className={styles.formGroupRow}>
                                <div className={styles.modernInputWrap}>
                                    <label className={styles.modernLabel}>Year</label>
                                    <select className={`${styles.premiumInput} ${styles.premiumSelect}`} value={editYear} onChange={(e) => { setEditYear(e.target.value); setEditSemester(''); }}>
                                        <option value="">Select</option>
                                        {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div className={styles.modernInputWrap}>
                                    <label className={styles.modernLabel}>Semester</label>
                                    <select className={`${styles.premiumInput} ${styles.premiumSelect}`} value={editSemester} onChange={(e) => setEditSemester(e.target.value)} disabled={!editYear}>
                                        <option value="">Select</option>
                                        {availableSemesters.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                            </div>

                            {editBranch && editSemester && (
                                <div className={styles.modernInputWrap}>
                                    <label className={styles.modernLabel}>Select Subjects</label>
                                    <div style={{display:'flex', gap:'8px', flexWrap:'wrap', marginTop:'8px'}}>
                                        {getSubjects(editBranch, editSemester).map(sub => {
                                            const isSelected = selectedSubjects.includes(sub);
                                            return (
                                                <button
                                                    key={sub}
                                                    type="button"
                                                    onClick={() => handleSubjectToggle(sub)}
                                                    className={`${styles.subjectSelectBtn} ${isSelected ? styles.subjectSelectActive : ''}`}
                                                >
                                                    {sub} {isSelected && '✓'}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className={styles.modernInputWrap} style={{marginTop:'16px'}}>
                                <label className={styles.modernLabel}>Profile Banner Accent</label>
                                <div className={styles.bannerPickerGrid} style={{marginTop:'8px'}}>
                                    {BANNER_PRESETS.map(p => (
                                        <div
                                            key={p.id}
                                            className={`${styles.bannerSwatch} ${editBanner === p.id ? styles.bannerSwatchActive : ''}`}
                                            style={{ background: p.gradient }}
                                            onClick={() => setEditBanner(p.id)}
                                            title={p.label}
                                        >
                                            {editBanner === p.id && '✓'}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={styles.modernInputWrap} style={{marginTop:'20px'}}>
                                <label className={styles.modernLabel}>Pin Pinned Badges (Max 3)</label>
                                <div className={styles.badgePickerGrid}>
                                    {earnedBadges.map(badge => {
                                        const isSelected = editShowcase.includes(badge.id);
                                        return (
                                            <div
                                                key={badge.id}
                                                className={`${styles.badgePickerItem} ${isSelected ? styles.badgePickerActive : ''}`}
                                                onClick={() => {
                                                    setEditShowcase(prev => {
                                                        if (prev.includes(badge.id)) return prev.filter(id => id !== badge.id);
                                                        if (prev.length >= 3) return prev;
                                                        return [...prev, badge.id];
                                                    });
                                                }}
                                            >
                                                <span style={{fontSize:'1.8rem'}}>{badge.icon}</span>
                                                <span style={{fontSize:'0.75rem', fontWeight:'bold'}}>{badge.name}</span>
                                                {isSelected && <div className={styles.badgePickerCheck}>✓</div>}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div style={{marginTop:'30px', borderTop:'1px solid var(--border)', paddingTop:'24px'}}>
                                <div style={{display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px'}}>
                                    <span style={{fontSize:'1.3rem'}}>🧬</span>
                                    <h3 style={{margin:0, color:'#fff', fontFamily:'var(--font-heading)'}}>Biometric Identity Registry</h3>
                                </div>
                                <p style={{color:'var(--text-secondary)', fontSize:'0.85rem', marginBottom:'16px'}}>Register your unique facial node-map to authorize hands-free attendance check-ins.</p>

                                {isEnrolled ? (
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', background:'rgba(34,197,94,0.1)', border:'1px solid var(--success)', padding:'14px 20px', borderRadius:'12px'}}>
                                        <div>
                                            <span style={{color:'var(--success)', fontWeight:'bold', fontSize:'0.9rem'}}>✅ Registered Node Profile Secured</span>
                                            <div style={{fontSize:'0.75rem', color:'var(--text-secondary)', marginTop:'2px'}}>Mathematics encoded. Fully functional for radar checks.</div>
                                        </div>
                                        <button type="button" onClick={() => setEnrollmentStatus('restart')} className={styles.btnSecondary} style={{padding:'8px 16px', borderRadius:'12px', fontSize:'0.85rem'}}>Recalibrate</button>
                                    </div>
                                ) : (
                                    <div style={{display:'flex', flexDirection:'column', gap:'16px', background:'var(--bg-elevated)', padding:'24px', borderRadius:'16px', border:'1px solid var(--primary-glow)'}}>
                                        {(enrollmentStatus === 'loading' || enrollmentStatus === 'acquiring' || enrollmentStatus === 'restart') && (
                                            <div style={{width:'100%', height:'240px', borderRadius:'12px', overflow:'hidden', position:'relative', boxShadow:'0 0 20px var(--primary-glow)'}}>
                                                <Webcam audio={false} ref={enrollWebcamRef} screenshotFormat="image/jpeg" videoConstraints={{ facingMode: "user" }} style={{width:'100%', height:'100%', objectFit:'cover'}} />
                                                {enrollmentStatus === 'acquiring' && (
                                                    <div style={{position:'absolute', top:0, left:0, right:0, bottom:0, background:'linear-gradient(to bottom, var(--primary-glow), transparent)', border:'2px solid var(--primary)', animation:'scan 2s infinite linear'}} />
                                                )}
                                            </div>
                                        )}

                                        {enrollmentStatus === '' || enrollmentStatus === 'restart' ? (
                                            <button type="button" onClick={enrollBiometrics} className={styles.btnVerifyGeo} style={{width:'100%', padding:'16px', borderRadius:'12px', fontSize:'1rem', fontWeight:'bold', letterSpacing:'1px', textTransform:'uppercase'}}>Initialize ML Scanner</button>
                                        ) : enrollmentStatus === 'loading' ? (
                                            <div style={{textAlign:'center', color:'var(--neo)', padding:'12px', background:'rgba(99,102,241,0.1)', borderRadius:'12px'}}>Downloading AI Math Models (Wait)...</div>
                                        ) : enrollmentStatus === 'acquiring' ? (
                                            <div style={{textAlign:'center', color:'var(--warning)', padding:'12px', background:'rgba(245,158,11,0.1)', borderRadius:'12px'}}>Extracting 128-point face topography... Hold still.</div>
                                        ) : enrollmentStatus === 'success' ? (
                                            <div style={{textAlign:'center', color:'var(--success)', fontWeight:'bold', padding:'12px', background:'rgba(34,197,94,0.1)', borderRadius:'12px'}}>✅ Registration Complete! Math embedded.</div>
                                        ) : (
                                            <div style={{textAlign:'center', color:'var(--error)', padding:'12px', background:'rgba(239,68,68,0.1)', borderRadius:'12px'}}>❌ {enrollmentStatus.split('error: ')[1]} <br/><span style={{cursor:'pointer', textDecoration:'underline', display:'inline-block', marginTop:'8px', fontWeight:'bold'}} onClick={() => setEnrollmentStatus('restart')}>Try Again</span></div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className={styles.editActions} style={{marginTop:'30px'}}>
                                <button className={styles.cancelBtn} onClick={() => setEditing(false)}>Cancel</button>
                                <button className={styles.saveBtn} onClick={saveProfile} disabled={saving || uploadingAvatar}>
                                    {uploadingAvatar ? 'Uploading Photo...' : saving ? 'Saving...' : 'Save Configuration'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tile 2: Performance Engine */}
            <div className={`${styles.bentoTile} glass-panel`} style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '1.3rem' }}>⚡</span>
                    <h3 style={{ margin: 0, color: '#fff', fontFamily: 'var(--font-heading)' }}>Performance Engine</h3>
                </div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                    Optimize rendering for low-end laptops, Chromebooks, or budget mobile devices.
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-input)', border: '1px solid var(--border)', padding: '14px 20px', borderRadius: '12px' }}>
                    <div>
                        <span style={{ color: '#fff', fontWeight: 'bold', fontSize: '0.9rem' }}>Ultra-Performance Mode</span>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                            Disables backdrop blurs, floating ambient orbs, and GPU-intensive transitions.
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={togglePerformanceMode}
                        className={performanceMode === 'low' ? styles.saveBtn : styles.btnSecondary}
                        style={{ padding: '8px 16px', borderRadius: '12px', fontSize: '0.85rem', margin: 0, width: 'auto' }}
                    >
                        {performanceMode === 'low' ? 'Disable' : 'Enable'}
                    </button>
                </div>
            </div>
        </div>
    );
}
