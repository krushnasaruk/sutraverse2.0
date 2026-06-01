'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

export default function SeedM2() {
    const { user } = useAuth();
    const [status, setStatus] = useState('');

    const handleSeed = async () => {
        if (!user) {
            setStatus('You must be logged in!');
            return;
        }

        setStatus('Fetching metadata and copying M2 PDFs to /uploads...');
        try {
            const res = await fetch('/api/seed-m2');
            const data = await res.json();
            if (!data.success) throw new Error(data.error || 'Failed to fetch API res');

            setStatus(`Seeding ${data.metadataList.length} M2 files to Firestore...`);
            
            for (let i = 0; i < data.metadataList.length; i++) {
                const meta = data.metadataList[i];
                meta.uploader = user.name || 'Admin';
                meta.uploaderUID = user.uid;
                meta.uploaderEmail = user.email;
                await addDoc(collection(db, 'files'), meta);
                setStatus(`Seeded ${i+1}/${data.metadataList.length}: ${meta.title}`);
            }

            setStatus('All M2 files inserted successfully! Check them out in the Notes section.');
        } catch (e) {
            setStatus('Error: ' + e.message);
            console.error(e);
        }
    };

    return (
        <div style={{ padding: '40px', marginTop: '100px', background: 'var(--bg-main)', minHeight: '100vh', color: 'var(--text-primary)' }}>
            <h1 style={{fontSize: '2rem', marginBottom: '1rem'}}>Seed Engineering Mathematics 2 (M2) Notes</h1>
            <p style={{marginBottom: '2rem'}}>Click the button below to add the 6 M2 PDFs to Sutraverse.</p>
            {user ? (
                <>
                    <p style={{color: 'green', marginBottom: '1rem'}}>✓ Logged in as {user.email}</p>
                    <button 
                        onClick={handleSeed}
                        style={{ padding: '12px 24px', background: 'var(--primary)', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Start Seeding M2 Notes
                    </button>
                    <p style={{ marginTop: '20px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{status}</p>
                </>
            ) : (
                <p style={{color: 'red'}}>⚠️ You must go to the Login page and sign in first.</p>
            )}
        </div>
    );
}
