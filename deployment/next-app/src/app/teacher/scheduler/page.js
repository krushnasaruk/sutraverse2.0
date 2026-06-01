'use client';

import { useState, useEffect } from 'react';
import { useTeacher } from '../layout';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import styles from './page.module.css';

export default function SchedulerPage() {
    const { selectedClass, user } = useTeacher();
    const [roomBookings, setRoomBookings] = useState([]);
    const [selectedRoom, setSelectedRoom] = useState('Room 101');
    const [selectedSession, setSelectedSession] = useState('');
    const [status, setStatus] = useState({ text: '', type: '' });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                const snap = await getDocs(query(collection(db, 'roomBookings')));
                const list = [];
                snap.forEach(d => list.push({ id: d.id, ...d.data() }));
                setRoomBookings(list);
            } catch(e) {}
        };
        fetchBookings();
    }, []);

    const handleBooking = async () => {
        if (!selectedRoom || !selectedSession) return;
        setIsSaving(true);
        try {
            const conflict = await getDocs(query(collection(db, 'roomBookings'), where('room', '==', selectedRoom), where('session', '==', selectedSession)));
            if (!conflict.empty) { setStatus({ text: 'Room already booked!', type: 'error' }); setIsSaving(false); return; }
            await addDoc(collection(db, 'roomBookings'), {
                room: selectedRoom, session: selectedSession,
                teacherEmail: user.email, teacherName: user.name || user.email,
                classId: selectedClass?.classId || 'Office Hours', timestamp: new Date().toISOString()
            });
            setStatus({ text: 'Room claimed!', type: 'success' });
            const snap = await getDocs(query(collection(db, 'roomBookings')));
            const list = []; snap.forEach(d => list.push({ id: d.id, ...d.data() }));
            setRoomBookings(list);
        } catch(e) { setStatus({ text: 'Error: ' + e.message, type: 'error' }); }
        setIsSaving(false);
    };

    const rooms = ['Room 101', 'Room 102', 'Lab A', 'Seminar Hall'];
    const sessions = ['Morning P1 (9:00 - 10:00)', 'Morning P2 (10:00 - 11:00)', 'Morning P3 (11:15 - 12:15)', 'Afternoon P4 (1:00 - 2:00)'];

    const isBooked = (room, session) => roomBookings.find(b => b.room === room && b.session === session);

    return (
        <div className={styles.schedulerPage}>
            <header className={styles.pageHeader}>
                <h1 className={styles.pageTitle}>Room Scheduler</h1>
                <p className={styles.pageSubtitle}>Reserve empty rooms or labs for extra lectures. Conflicts are automatically detected.</p>
            </header>

            {/* Booking Form */}
            <div className={styles.bookingCard}>
                <h3 className={styles.cardTitle}>Claim a Time Slot</h3>
                <div className={styles.bookingForm}>
                    <div className={styles.formField}>
                        <label>Select Room/Lab</label>
                        <select className={styles.select} value={selectedRoom} onChange={e => setSelectedRoom(e.target.value)}>
                            <option value="Room 101">Room 101 (Capacity 60)</option>
                            <option value="Room 102">Room 102 (Capacity 60)</option>
                            <option value="Lab A">Computer Lab A</option>
                            <option value="Seminar Hall">Main Seminar Hall</option>
                        </select>
                    </div>
                    <div className={styles.formField}>
                        <label>Select Session</label>
                        <select className={styles.select} value={selectedSession} onChange={e => setSelectedSession(e.target.value)}>
                            <option value="">— Choose Slot —</option>
                            {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    {status.text && <p className={`${styles.statusMsg} ${status.type === 'error' ? styles.statusError : styles.statusSuccess}`}>{status.text}</p>}
                    <button onClick={handleBooking} disabled={isSaving || !selectedSession} className={styles.claimBtn}>
                        {isSaving ? 'Checking...' : 'Claim Room'}
                    </button>
                </div>
            </div>

            {/* Visual Matrix */}
            <h3 className={styles.sectionTitle}>Availability Matrix</h3>
            <div className={styles.matrixWrapper}>
                <div className={styles.matrix}>
                    <div className={styles.matrixHeader}>
                        <div className={styles.matrixCorner}></div>
                        {rooms.map(r => <div key={r} className={styles.matrixColHeader}>{r}</div>)}
                    </div>
                    {sessions.map(session => (
                        <div key={session} className={styles.matrixRow}>
                            <div className={styles.matrixRowHeader}>{session.split('(')[0].trim()}</div>
                            {rooms.map(room => {
                                const booking = isBooked(room, session);
                                return (
                                    <div key={`${room}-${session}`} className={`${styles.matrixCell} ${booking ? styles.cellBooked : styles.cellOpen}`}>
                                        {booking ? (
                                            <span className={styles.cellTeacher}>{booking.teacherName?.split(' ')[0]}</span>
                                        ) : (
                                            <span className={styles.cellAvailable}>Open</span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Active Bookings */}
            <h3 className={styles.sectionTitle}>All Bookings</h3>
            <div className={styles.bookingsGrid}>
                {roomBookings.length > 0 ? roomBookings.map(b => (
                    <div key={b.id} className={styles.bookingChip}>
                        <strong>{b.room}</strong>
                        <span className={styles.chipSession}>{b.session}</span>
                        <span className={styles.chipTeacher}>By {b.teacherName}</span>
                    </div>
                )) : <p className={styles.noData}>No bookings yet.</p>}
            </div>
        </div>
    );
}
