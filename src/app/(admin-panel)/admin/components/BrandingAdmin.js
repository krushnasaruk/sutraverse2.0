'use client';

import { useState } from 'react';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '@/database/config/firebase';
import styles from '../page.module.css';
import { IconPen, IconCheck } from '@/frontend/components/ui/Icons';

export default function BrandingAdmin({ brandingForm, setBrandingForm, editingTheme, setEditingTheme }) {
    const [saving, setSaving] = useState(false);

    const handleSaveBranding = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, 'settings', 'college'), brandingForm);
            alert('Branding updated successfully! Refresh to see full changes.');
        } catch (e) {
            console.error('Error saving branding:', e);
            alert('Failed to save branding.');
        }
        setSaving(false);
    };

    return (
        <div className={styles.brandingContainer}>
            <div className={styles.brandingHeader}>
                <h2><IconPen size={24} /> College Branding</h2>
                <p>Customize the platform appearance and identity for your institution.</p>
            </div>

            <div className={styles.brandingGrid}>
                <div className={styles.brandingCard}>
                    <h3>Identity Settings</h3>

                    <div className={styles.formGroup}>
                        <label>Full College Name</label>
                        <input
                            type="text"
                            className={styles.modalInput}
                            value={brandingForm.collegeName}
                            onChange={e => setBrandingForm({...brandingForm, collegeName: e.target.value})}
                            placeholder="e.g. Dhole Patil College of Engineering"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Short Name (Acronym)</label>
                        <input
                            type="text"
                            className={styles.modalInput}
                            value={brandingForm.collegeShortName}
                            onChange={e => setBrandingForm({...brandingForm, collegeShortName: e.target.value})}
                            placeholder="e.g. DPCOE"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Hero Tagline</label>
                        <input
                            type="text"
                            className={styles.modalInput}
                            value={brandingForm.tagline}
                            onChange={e => setBrandingForm({...brandingForm, tagline: e.target.value})}
                            placeholder="e.g. Digital Academic Ecosystem for DPCOE Students"
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Hero Subtitle</label>
                        <textarea
                            className={styles.modalInput}
                            value={brandingForm.heroSubtitle}
                            onChange={e => setBrandingForm({...brandingForm, heroSubtitle: e.target.value})}
                            placeholder="A brief description of the platform's goals..."
                            rows={3}
                        />
                    </div>
                </div>

                <div className={styles.brandingCard}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px'}}>
                        <h3 style={{margin: 0, padding: 0, border: 'none'}}>Theme Colors</h3>
                        <div style={{display: 'flex', gap: '10px'}}>
                            <button
                                className={styles.tab}
                                style={{padding: '6px 12px', fontSize: '0.85rem', background: editingTheme === 'dark' ? 'var(--bg-elevated)' : 'transparent', color: editingTheme === 'dark' ? 'var(--text-primary)' : 'var(--text-muted)'}}
                                onClick={() => setEditingTheme('dark')}
                            >
                                🌙 Dark
                            </button>
                            <button
                                className={styles.tab}
                                style={{padding: '6px 12px', fontSize: '0.85rem', background: editingTheme === 'light' ? 'var(--bg-elevated)' : 'transparent', color: editingTheme === 'light' ? 'var(--text-primary)' : 'var(--text-muted)'}}
                                onClick={() => setEditingTheme('light')}
                            >
                                ☀️ Light
                            </button>
                        </div>
                    </div>

                    <div className={styles.formRow} style={{display: 'flex', gap: '15px'}}>
                        <div className={styles.formGroup} style={{flex: 1}}>
                            <label>Primary Color</label>
                            <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                <input
                                    type="color"
                                    className={styles.colorPicker}
                                    value={editingTheme === 'dark' ? brandingForm.primaryColor : (brandingForm.primaryColorLight || brandingForm.primaryColor)}
                                    onChange={e => setBrandingForm({...brandingForm, [editingTheme === 'dark' ? 'primaryColor' : 'primaryColorLight']: e.target.value})}
                                />
                                <input
                                    type="text"
                                    className={styles.modalInput}
                                    value={editingTheme === 'dark' ? brandingForm.primaryColor : (brandingForm.primaryColorLight || brandingForm.primaryColor)}
                                    onChange={e => setBrandingForm({...brandingForm, [editingTheme === 'dark' ? 'primaryColor' : 'primaryColorLight']: e.target.value})}
                                    style={{flex: 1}}
                                />
                            </div>
                        </div>
                    </div>
                    {/* ... other color fields can be added here ... */}
                </div>
            </div>

            <div className={styles.brandingFooter}>
                <button
                    className={styles.saveBrandingBtn}
                    onClick={handleSaveBranding}
                    disabled={saving}
                >
                    {saving ? 'Saving...' : <><IconCheck size={20} /> Save Branding Changes</>}
                </button>
            </div>
        </div>
    );
}
