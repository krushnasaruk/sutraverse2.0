'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const SUBJECT_COLORS = {
  'BEE': '#f59e0b',
  'Engineering Chemistry': '#10b981',
  'Electronics': '#dc2626',
  'Engineering Graphics': '#b91c1c',
  'Engineering Mathematics 1': '#ef4444',
  'Engineering Mathematics 2': '#22c55e',
  'Engineering Mechanics': '#15803d',
  'Engineering Physics': '#f97316',
  'PPS': '#16a34a',
};

export default function SeedPyqs() {
  const { user } = useAuth();
  const [status, setStatus] = useState('');
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(false);
  const [preview, setPreview] = useState(null);

  const handlePreview = async () => {
    setStatus('Scanning PYQ folders...');
    try {
      const res = await fetch('/api/seed-pyqs');
      const data = await res.json();
      if (!data.success) throw new Error(data.error);
      setPreview(data);
      setStatus(`Found ${data.count} PYQ papers ready to seed.`);
    } catch (e) {
      setStatus('Error: ' + e.message);
    }
  };

  const handleSeed = async () => {
    if (!user) { setStatus('You must be logged in!'); return; }
    if (!preview) { setStatus('Run preview first.'); return; }

    setStatus('Starting seed...');
    setTotal(preview.metadataList.length);
    setProgress(0);
    setDone(false);

    try {
      for (let i = 0; i < preview.metadataList.length; i++) {
        const meta = {
          ...preview.metadataList[i],
          uploader: user.displayName || user.email || 'Admin',
          uploaderUID: user.uid,
          uploaderEmail: user.email,
        };
        await addDoc(collection(db, 'files'), meta);
        setProgress(i + 1);
        setStatus(`Seeded ${i + 1}/${preview.metadataList.length}: ${meta.title}`);
      }
      setDone(true);
      setStatus(`✅ All ${preview.metadataList.length} PYQ papers added to Firestore! Go check the PYQs page.`);
    } catch (e) {
      setStatus('Error during seed: ' + e.message);
    }
  };

  // Group preview by subject
  const grouped = preview?.metadataList?.reduce((acc, item) => {
    if (!acc[item.subject]) acc[item.subject] = [];
    acc[item.subject].push(item);
    return acc;
  }, {}) ?? {};

  return (
    <div style={{ padding: '40px 24px', marginTop: '80px', maxWidth: '900px', margin: '80px auto 0', color: 'var(--text-primary)', lineHeight: 1.6 }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '8px' }}>📚 Seed PYQ Papers</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '32px' }}>
        This tool scans <code>public/pyqs/</code> and adds all {preview?.count ?? '~130'} papers to Firestore.
      </p>

      {!user && (
        <p style={{ color: '#ef4444', padding: '16px', background: 'rgba(239,68,68,0.1)', borderRadius: '12px', marginBottom: '24px' }}>
          ⚠️ You must be logged in to seed the database.
        </p>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '32px' }}>
        <button
          onClick={handlePreview}
          style={{ padding: '12px 24px', background: 'var(--bg-input)', border: '1px solid var(--border)', color: 'var(--text-primary)', borderRadius: '10px', cursor: 'pointer', fontWeight: 600 }}
        >
          1. Preview Files
        </button>
        <button
          onClick={handleSeed}
          disabled={!user || !preview || done}
          style={{ padding: '12px 28px', background: done ? '#10b981' : 'var(--primary)', color: 'white', borderRadius: '10px', cursor: !user || !preview || done ? 'not-allowed' : 'pointer', fontWeight: 700, opacity: !user || !preview || done ? 0.7 : 1 }}
        >
          {done ? '✅ Done!' : '2. Seed to Firestore'}
        </button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ background: 'var(--bg-input)', borderRadius: '8px', overflow: 'hidden', height: '8px', marginBottom: '8px' }}>
            <div style={{ height: '100%', width: `${(progress/total)*100}%`, background: 'var(--primary)', transition: 'width 0.3s ease', borderRadius: '8px' }} />
          </div>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{progress} / {total}</span>
        </div>
      )}

      {/* Status */}
      {status && (
        <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', padding: '12px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '10px', marginBottom: '32px', color: done ? '#10b981' : 'var(--text-primary)' }}>
          {status}
        </p>
      )}

      {/* Preview grouped by subject */}
      {preview && (
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '16px' }}>Preview — {preview.count} Papers</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {Object.entries(grouped).map(([subject, items]) => (
              <details key={subject} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px' }}>
                <summary style={{ cursor: 'pointer', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: SUBJECT_COLORS[subject] || '#888', display: 'inline-block' }} />
                  {subject} — {items.length} papers
                </summary>
                <ul style={{ marginTop: '12px', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {items.map((item, i) => (
                    <li key={i} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {item.title}
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
