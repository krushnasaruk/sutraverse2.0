'use client';

import styles from '../page.module.css';

export default function LeaveModal({
    leaveModalOpen,
    setLeaveModalOpen,
    submitLeaveRequest,
    leaveDate,
    setLeaveDate,
    leaveReason,
    setLeaveReason,
    leaveSubmitting
}) {
    if (!leaveModalOpen) return null;

    return (
        <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) setLeaveModalOpen(false); }}>
            <div className={`${styles.modalContent} glass-panel`}>
                <h2 style={{ marginBottom: '8px' }}>Request Leave of Absence</h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '0.9rem' }}>This request will be sent directly to your teacher for approval.</p>

                <form onSubmit={submitLeaveRequest}>
                    <div className={styles.formGroup}>
                        <label>Date of Absence</label>
                        <input
                            type="date"
                            value={leaveDate}
                            onChange={e => setLeaveDate(e.target.value)}
                            required
                            className={styles.inputField}
                        />
                    </div>
                    <div className={styles.formGroup} style={{ marginTop: '16px' }}>
                        <label>Reason</label>
                        <textarea
                            value={leaveReason}
                            onChange={e => setLeaveReason(e.target.value)}
                            required
                            placeholder="Briefly explain your reason (e.g., Medical, Event, Transport Issue)"
                            className={styles.inputField}
                            rows={4}
                        />
                    </div>

                    <div className={styles.modalActions} style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                        <button type="button" className={styles.cancelBtn} onClick={() => setLeaveModalOpen(false)}>Cancel</button>
                        <button type="submit" className={styles.saveBtn} disabled={leaveSubmitting}>
                            {leaveSubmitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
