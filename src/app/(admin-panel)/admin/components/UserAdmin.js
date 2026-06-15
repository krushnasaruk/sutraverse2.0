'use client';

import { useState } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '@/database/config/firebase';
import styles from '../page.module.css';
import { IconUser, IconPen } from '@/frontend/components/ui/Icons';

export default function UserAdmin({ usersList, setUsersList, loading, searchQuery, setSearchQuery, openEditUserModal, actionLoading, setActionLoading, removeTeacherAssignment }) {

    return (
        <div style={{marginTop: '20px'}}>
            <div style={{marginBottom: '20px'}}>
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={styles.searchBar}
                />
            </div>
            {loading ? (
                <div className={styles.loadingState}>Fetching active accounts...</div>
            ) : usersList.length === 0 ? (
                <div className={styles.emptyState}>No users found.</div>
            ) : (
                <div className={styles.fileList}>
                    {usersList
                        .filter(u => `${u.name||''} ${u.email||''}`.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(u => (
                        <div key={u.id} className={styles.fileCard} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                            <div className={styles.fileInfo}>
                                <div className={styles.fileTitle}>{u.name || 'No Name Set'}</div>
                                <div className={styles.fileMeta}>
                                    <span className={styles.metaTag}><IconUser size={14} /> {u.email}</span>
                                    <span className={styles.metaTag} style={{color: u.role === 'teacher' ? 'var(--neo)' : 'var(--text-secondary)'}}>Role: {u.role || 'student'}</span>
                                    {u.role === 'student' && u.classId && <span className={styles.metaTag}>Class: {u.classId}</span>}
                                    {u.isAdmin && <span className={styles.metaTag} style={{color: 'var(--primary)'}}>★ Admin</span>}
                                </div>
                                {u.role === 'teacher' && u.assignments?.length > 0 && (
                                    <div style={{marginTop: '8px', fontSize: '0.8rem', color: 'var(--text-secondary)'}}>
                                        {u.assignments.map((a, i) => (
                                            <div key={i} style={{display: 'flex', gap: '8px', alignItems: 'center', marginBottom:'4px'}}>
                                                <span>• {a.classId} ({a.subject}) {a.isTG && <strong style={{color:'var(--primary)'}}>[TG]</strong>} {a.isClassTeacher && <strong style={{color:'var(--error)'}}>[Class Teacher]</strong>} {a.isHOD && <strong style={{color:'var(--success)'}}>[HOD]</strong>}</span>
                                                <button
                                                    onClick={() => removeTeacherAssignment(u.id, i)}
                                                    style={{background:'none', border:'none', color:'var(--error)', cursor:'pointer', fontSize:'0.75rem'}}
                                                >✕</button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className={styles.fileActions} style={{flexDirection: 'column', gap: '6px', alignItems: 'flex-end'}}>
                                <button
                                    className={`${styles.actionBtn} ${styles.editBtn}`}
                                    onClick={() => openEditUserModal(u)}
                                    disabled={actionLoading === u.id}
                                >
                                    <IconPen size={16} /> Edit Profile & Roles
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
