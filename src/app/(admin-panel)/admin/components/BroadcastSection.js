'use client';

import { useState } from 'react';
import styles from '../page.module.css';
import { IconFlag, IconCheck } from '@/frontend/components/ui/Icons';
import { auth } from '@/database/config/firebase';

export default function BroadcastSection() {
    const [title, setTitle] = useState('');
    const [body, setBody] = useState('');
    const [loading, setLoading] = useState(false);

    const handleBroadcast = async () => {
        if (!title || !body) return alert('Title and body required');
        if (!confirm('Send push notification to ALL registered devices?')) return;

        setLoading(true);
        try {
            const token = auth.currentUser ? await auth.currentUser.getIdToken() : '';
            const res = await fetch('/api/notifications/send', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ title, body })
            });
            const data = await res.json();
            if (data.success) {
                alert(`Broadcast sent to ${data.sentCount} devices!`);
                setTitle('');
                setBody('');
            } else {
                alert('Error: ' + data.error);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to send broadcast');
        }
        setLoading(false);
    };

    return (
        <div className={styles.brandingCard} style={{ marginTop: '20px' }}>
            <h3><IconFlag size={20} /> Campus-Wide Broadcast</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '15px' }}>
                Send a push notification to all students and faculty.
            </p>
            <div className={styles.formGroup}>
                <label>Notification Title</label>
                <input
                    type="text"
                    className={styles.modalInput}
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Holiday Announcement"
                />
            </div>
            <div className={styles.formGroup}>
                <label>Message Body</label>
                <textarea
                    className={styles.modalInput}
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Detailed message..."
                    rows={3}
                />
            </div>
            <button
                className={styles.actionBtn}
                style={{ width: '100%', background: 'var(--primary)', color: 'white', marginTop: '10px', justifyContent: 'center' }}
                onClick={handleBroadcast}
                disabled={loading}
            >
                {loading ? 'Sending...' : <><IconCheck size={18} /> Send Broadcast Now</>}
            </button>
        </div>
    );
}
