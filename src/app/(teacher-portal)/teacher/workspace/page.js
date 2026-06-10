'use client';

import { useState } from 'react';
import { useTeacher } from '../layout';
import { db } from '@/database/config/firebase';
import { collection, addDoc } from 'firebase/firestore';
import styles from './page.module.css';

export default function WorkspacePage() {
    const { user } = useTeacher();
    const [equipmentType, setEquipmentType] = useState('Whiteboard Markers (2 Set)');
    const [equipmentNote, setEquipmentNote] = useState('');
    const [status, setStatus] = useState({ text: '', type: '' });
    const [isSaving, setIsSaving] = useState(false);

    const handleEquipmentRequest = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await addDoc(collection(db, 'equipmentRequests'), {
                teacherEmail: user.email, teacherName: user.name || user.email,
                item: equipmentType, note: equipmentNote, status: 'pending',
                timestamp: new Date().toISOString()
            });
            setStatus({ text: `Ticket submitted for ${equipmentType}`, type: 'success' });
            setEquipmentNote('');
        } catch(e) { setStatus({ text: 'Error: ' + e.message, type: 'error' }); }
        setIsSaving(false);
    };

    return (
        <div className={styles.workspacePage}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Teacher Workspace</h1>
                <p className={styles.pageSubtitle}>Manage leave balances and request institutional resources.</p>
            </header>

            {/* Leave Balance Cards */}
            <div className={styles.leaveGrid}>
                <div className={`${styles.leaveCard} ${styles.casualCard}`}>
                    <span className={styles.leaveLabel}>Casual Leaves</span>
                    <span className={styles.leaveValue}>4</span>
                    <span className={styles.leaveFooter}>Remaining this semester</span>
                </div>
                <div className={`${styles.leaveCard} ${styles.medicalCard}`}>
                    <span className={styles.leaveLabel}>Medical Leaves</span>
                    <span className={styles.leaveValue}>8</span>
                    <span className={styles.leaveFooter}>Remaining this semester</span>
                </div>
                <div className={`${styles.leaveCard} ${styles.dutyCard}`}>
                    <span className={styles.leaveLabel}>On-Duty</span>
                    <span className={styles.leaveValue}>2</span>
                    <span className={styles.leaveFooter}>Used this month</span>
                </div>
            </div>

            {/* Equipment Requisition */}
            <div className={styles.requestCard}>
                <h3 className={styles.cardTitle}>Submit Equipment Ticket</h3>
                <p className={styles.cardSub}>Request stationery or equipment from the Admin office.</p>
                <form onSubmit={handleEquipmentRequest} className={styles.requestForm}>
                    <div className={styles.formField}>
                        <label>Requisition Item</label>
                        <select className={styles.select} value={equipmentType} onChange={e => setEquipmentType(e.target.value)}>
                            <option value="Whiteboard Markers (2 Set)">Whiteboard Markers (2 Set)</option>
                            <option value="HDMI Cable Adapter">HDMI Cable Adapter</option>
                            <option value="Portable Projector">Portable Projector</option>
                            <option value="A4 Paper Rim">A4 Paper Rim</option>
                            <option value="Lab Coat (Faculty)">Lab Coat (Faculty)</option>
                            <option value="Chalk Box">Chalk Box</option>
                        </select>
                    </div>
                    <div className={styles.formField}>
                        <label>Additional Instructions</label>
                        <textarea placeholder="e.g., Deliver to Room 102 before 10am" className={styles.textarea} rows={3} value={equipmentNote} onChange={e => setEquipmentNote(e.target.value)} />
                    </div>
                    {status.text && <p className={`${styles.statusMsg} ${status.type === 'error' ? styles.statusError : styles.statusSuccess}`}>{status.text}</p>}
                    <button type="submit" disabled={isSaving} className={styles.submitBtn}>
                        {isSaving ? 'Submitting...' : 'Submit Ticket'}
                    </button>
                </form>
            </div>
        </div>
    );
}
