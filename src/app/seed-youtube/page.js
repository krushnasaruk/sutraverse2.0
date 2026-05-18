'use client';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { db } from '@/lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

/* ── M2 Unit 4 Lectures ─────────────────────────────────────────────────── */
const M2_LECTURES = [
  {
    title: "Differential Equation - Lecture 1 | First Order & First Degree",
    url: "https://www.youtube.com/watch?v=TH4Kd9mfIgI",
    videoId: "TH4Kd9mfIgI",
  },
  {
    title: "Differential Equation - Lecture 2 | First Order & First Degree",
    url: "https://www.youtube.com/watch?v=WXZETpHneec",
    videoId: "WXZETpHneec",
  },
  {
    title: "Differential Equation - Lecture 3 | First Order & First Degree",
    url: "https://www.youtube.com/watch?v=znwRMyRLv1Q",
    videoId: "znwRMyRLv1Q",
  },
  {
    title: "Differential Equation - Lecture 4 | First Order & First Degree",
    url: "https://www.youtube.com/watch?v=tfhytqk1kHk",
    videoId: "tfhytqk1kHk",
  },
  {
    title: "Differential Equation - Lecture 5 | First Order & First Degree",
    url: "https://www.youtube.com/watch?v=x1S7cb0l2PU",
    videoId: "x1S7cb0l2PU",
  },
  {
    title: "Differential Equation - Lecture 6 | First Order & First Degree",
    url: "https://www.youtube.com/watch?v=8Sn1-FpeEUQ",
    videoId: "8Sn1-FpeEUQ",
  },
  {
    title: "Differential Equation - Oneshot | Complete Chapter",
    url: "https://www.youtube.com/watch?v=QokgGO3omhU",
    videoId: "QokgGO3omhU",
  },
  {
    title: "Best Trick to Identify Types of First Order Differential Equations",
    url: "https://www.youtube.com/watch?v=73Acm6A6BLs",
    videoId: "73Acm6A6BLs",
  },
  {
    title: "Differential Equation - Quick Revision | Whole Chapter in 5 mins",
    url: "https://www.youtube.com/watch?v=kpf3DrjfSeA",
    videoId: "kpf3DrjfSeA",
  },
];

/* ── M2 Unit 5 Lectures ─────────────────────────────────────────────────── */
const M2_UNIT5_LECTURES = [
  {
    title: "Applications of Differential Equations | Orthogonal Trajectories | Lecture 01",
    url: "https://www.youtube.com/watch?v=Ziu0y2kWTCM",
    videoId: "Ziu0y2kWTCM",
  },
  {
    title: "Applications of Differential Equations | Newton's Law of Cooling | Lecture 02",
    url: "https://www.youtube.com/watch?v=gJSvcf9_Duc",
    videoId: "gJSvcf9_Duc",
  },
  {
    title: "Applications of Differential Equations | Kirchoff's Law of Electrical Circuit | Lecture 03",
    url: "https://www.youtube.com/watch?v=6ku8k9WmZK8",
    videoId: "6ku8k9WmZK8",
  },
  {
    title: "Applications of Differential Equations | Rectilinear Motion | Lecture 04",
    url: "https://www.youtube.com/watch?v=oHh3qvsVJjA",
    videoId: "oHh3qvsVJjA",
  },
  {
    title: "Applications of Differential Equations | Simple Harmonic Motion | Lecture 05",
    url: "https://www.youtube.com/watch?v=br8wfLxZAso",
    videoId: "br8wfLxZAso",
  },
  {
    title: "Applications of Differential Equations | Fourier's Law of Heat Flow | Conduction of Heat | Lecture 06",
    url: "https://www.youtube.com/watch?v=CzH3DkZdZNY",
    videoId: "CzH3DkZdZNY",
  },
];

/* ── Physics All Units Lectures ──────────────────────────────────────────── */
const PHYSICS_LECTURES = [
  // Unit 1
  {
    title: "UNIT 1 | ONE SHOT LASERS | SPPU PUNE UNIVERSITY | 2024 PATTERN | ENGINEERING PHYSICS",
    url: "https://www.youtube.com/watch?v=IWDLRoDWCYY",
    videoId: "IWDLRoDWCYY",
    unit: "Unit 1",
  },
  {
    title: "UNIT 1 | ONE SHOT OPTIC FIBERS | ENGINEERING PHYSICS | SPPU PUNE UNIVERSITY",
    url: "https://www.youtube.com/watch?v=nWDew7_c-Ts",
    videoId: "nWDew7_c-Ts",
    unit: "Unit 1",
  },
  // Unit 2
  {
    title: "UNIT 2 | ONE SHOT | STM & NUMERICALS RIGID BOX | QUANTUM PHYSICS | SPPU PUNE UNIVERSITY",
    url: "https://www.youtube.com/watch?v=CEu0wlNUiU0",
    videoId: "CEu0wlNUiU0",
    unit: "Unit 2",
  },
  {
    title: "UNIT 2 | ONE SHOT | QUANTUM PHYSICS DE BROGLIE | SPPU PUNE UNIVERSITY",
    url: "https://www.youtube.com/watch?v=h2B_4-t6vMA",
    videoId: "h2B_4-t6vMA",
    unit: "Unit 2",
  },
  // Unit 3
  {
    title: "UNIT 3 | ONE SHOT | POLARIZATION | SPPU PUNE UNIVERSITY | 2024 PATTERN",
    url: "https://www.youtube.com/watch?v=acd0_KNsP28",
    videoId: "acd0_KNsP28",
    unit: "Unit 3",
  },
  {
    title: "UNIT 3 | ONE SHOT | WAVE OPTICS | SPPU PUNE UNIVERSITY | 2024 PATTERN",
    url: "https://www.youtube.com/watch?v=UxZ6iY8bwsU",
    videoId: "UxZ6iY8bwsU",
    unit: "Unit 3",
  },
  // Unit 4
  {
    title: "UNIT 4 | ONE SHOT | ULTRASONICS | SPPU PUNE UNIVERSITY | 2024 PATTERN",
    url: "https://www.youtube.com/watch?v=DGiVFCGFKFE",
    videoId: "DGiVFCGFKFE",
    unit: "Unit 4",
  },
  // Unit 5
  {
    title: "UNIT 5 | ONE SHOT | NANOPARTICLES | SPPU PUNE UNIVERSITY | 2024 PATTERN",
    url: "https://www.youtube.com/watch?v=27mhnrW4pX0",
    videoId: "27mhnrW4pX0",
    unit: "Unit 5",
  },
  // General / Extras
  {
    title: "PHYSICS | PREPARATION STRATEGY | SPPU 2024 PATTERN",
    url: "https://www.youtube.com/watch?v=BMC-WDvaTPc",
    videoId: "BMC-WDvaTPc",
    unit: "General",
  },
  {
    title: "IMP QUE | PHYSICS | SPPU PUNE UNIVERSITY | 2024 PATTERN | ENGINEERING PHYSICS",
    url: "https://www.youtube.com/watch?v=MFuzDLndNpM",
    videoId: "MFuzDLndNpM",
    unit: "General",
  },
];

/* ── BXE (Basic Electronics Engineering) All Units Lectures ──────────── */
const BXE_LECTURES = [
  {
    title: "UNIT 1 | BXE ONESHOT | BASIC ELECTRONICS | All IMP QUE | ALL PYQs | SPPU 2024 PUNE UNIVERSITY",
    url: "https://www.youtube.com/watch?v=h7hOHZny5Uo",
    videoId: "h7hOHZny5Uo",
    unit: "Unit 1",
  },
  {
    title: "UNIT 2 | BXE ONESHOT | BASIC ELECTRONICS | All IMP QUE | ALL PYQs | SPPU 2024 PUNE UNIVERSITY",
    url: "https://www.youtube.com/watch?v=KKlctWpPXDM",
    videoId: "KKlctWpPXDM",
    unit: "Unit 2",
  },
  {
    title: "UNIT 2 | NUMERICAL BXE ONESHOT | BASIC ELECTRONICS | ALL PYQs | SPPU 2024 PUNE UNIVERSITY",
    url: "https://www.youtube.com/watch?v=J3WHuCTxM7Y",
    videoId: "J3WHuCTxM7Y",
    unit: "Unit 2",
  },
  {
    title: "UNIT 3 | NUMERICAL + THEORY ONESHOT | BASIC ELECTRONICS | ALL PYQs | SPPU 2024 PUNE UNIVERSITY",
    url: "https://www.youtube.com/watch?v=LGfJHRMkdTs",
    videoId: "LGfJHRMkdTs",
    unit: "Unit 3",
  },
  {
    title: "UNIT 4 | NUMERICAL + THEORY ONESHOT | BASIC ELECTRONICS | ALL PYQs | SPPU 2024 PUNE UNIVERSITY",
    url: "https://www.youtube.com/watch?v=-xdQLkc4nCs",
    videoId: "-xdQLkc4nCs",
    unit: "Unit 4",
  },
  {
    title: "UNIT 5 | BXE ONESHOT | BASIC ELECTRONICS | All IMP QUE | ALL PYQs | SPPU 2024 PUNE UNIVERSITY",
    url: "https://www.youtube.com/watch?v=XqRT3R0Qw-4",
    videoId: "XqRT3R0Qw-4",
    unit: "Unit 5",
  },
];

/* ── Engineering Mechanics Lectures ───────────────────────────────────────── */
const MECHANICS_LECTURES = [
  // Unit 1
  {
    title: "SYSTEM OF FORCES|ONE SHOT|ENGINEERING MECHANICS|PRADEEP GIRI SIR",
    url: "https://www.youtube.com/watch?v=YIkKnRUEfaY",
    videoId: "YIkKnRUEfaY",
    unit: "Unit 1",
  },
  {
    title: "Centroid | Engineering Mechanics | One Shot in 50 Mins | Pradeep Giri Sir",
    url: "https://www.youtube.com/watch?v=5wE1p7a99NI",
    videoId: "5wE1p7a99NI",
    unit: "Unit 1",
  },
  // Unit 2
  {
    title: "EQUILIBRIUM|FIRST YEAR|ENGINEERING MECHANICS 1|Lecture 01",
    url: "https://www.youtube.com/watch?v=HAySR-amOfU",
    videoId: "HAySR-amOfU",
    unit: "Unit 2",
  },
  {
    title: "EQUILIBRIUM|FIRST YEAR|ENGINEERING MECHANICS 1|Lecture 02|NUMERICAL TO FIND THE REACTION & LOADS",
    url: "https://www.youtube.com/watch?v=BGXbOIFy9Wg",
    videoId: "BGXbOIFy9Wg",
    unit: "Unit 2",
  },
  {
    title: "EQUILIBRIUM|FIRST YEAR|ENGINEERING MECHANICS 1|Lecture 03|Numericals",
    url: "https://www.youtube.com/watch?v=AFTyklCE5RM",
    videoId: "AFTyklCE5RM",
    unit: "Unit 2",
  },
  {
    title: "EQUILIBRIUM|FIRST YEAR|ENGINEERING MECHANICS 1|Lecture 04|Lami's Theorem",
    url: "https://www.youtube.com/watch?v=2jgfXFtCH1Y",
    videoId: "2jgfXFtCH1Y",
    unit: "Unit 2",
  },
  {
    title: "EQUILIBRIUM|FIRST YEAR|ENGINEERING MECHANICS 1|Lecture 05|Numericals on Cylinders and Spheres",
    url: "https://www.youtube.com/watch?v=fhBOm8PEyqY",
    videoId: "fhBOm8PEyqY",
    unit: "Unit 2",
  },
  {
    title: "EQUILIBRIUM|FIRST YEAR|ENGINEERING MECHANICS 1|Lecture 06|TWO BODIES CONNECTED",
    url: "https://www.youtube.com/watch?v=qY4q9Py6rso",
    videoId: "qY4q9Py6rso",
    unit: "Unit 2",
  },
  // Unit 3
  {
    title: "FRICTION|FIRST YEAR|ENGINEERING MECHANICS1|ONE SHOT LECTURE|PART2|PRADEEP GIRI SIR",
    url: "https://www.youtube.com/watch?v=eCUdaLSjklY",
    videoId: "eCUdaLSjklY",
    unit: "Unit 3",
  },
  {
    title: "FRICTION|FIRST YEAR|ENGINEERING MECHANICS1|ONE SHOT LECTURE|PART1|PRADEEP GIRI SIR",
    url: "https://www.youtube.com/watch?v=l0HgL4bXF80",
    videoId: "l0HgL4bXF80",
    unit: "Unit 3",
  },
  {
    title: "FRICTION|FIRST YEAR|ENGINEERING MECHANICS 1|Lecture 01|INTRODUCTION",
    url: "https://www.youtube.com/watch?v=DqNflziPGJM",
    videoId: "DqNflziPGJM",
    unit: "Unit 3",
  },
  {
    title: "Friction|FIRST YEAR|ENGINEERING MECHANICS 1|Lecture 02|Angles involved in friction",
    url: "https://www.youtube.com/watch?v=CjgHMa66gKk",
    videoId: "CjgHMa66gKk",
    unit: "Unit 3",
  },
  {
    title: "Friction|FIRST YEAR|ENGINEERING MECHANICS 1|Lecture 03|Numerical on Simple Friction",
    url: "https://www.youtube.com/watch?v=30FZvlpHG80",
    videoId: "30FZvlpHG80",
    unit: "Unit 3",
  },
  {
    title: "Friction|FIRST YEAR|ENGINEERING MECHANICS1|Lecture 4|Numerical on Simple Friction on Connected Block",
    url: "https://www.youtube.com/watch?v=NBwBUu1Qbb8",
    videoId: "NBwBUu1Qbb8",
    unit: "Unit 3",
  },
  {
    title: "Friction|FIRST YEAR|ENGINEERING MECHANICS1|Lecture 05|Numerical on  Wedges",
    url: "https://www.youtube.com/watch?v=6wG00oXJoRI",
    videoId: "6wG00oXJoRI",
    unit: "Unit 3",
  },
  {
    title: "Friction|FIRST YEAR|ENGINEERING MECHANICS1|Lecture 07|Wedges",
    url: "https://www.youtube.com/watch?v=RJwpjX6PIl0",
    videoId: "RJwpjX6PIl0",
    unit: "Unit 3",
  },
  {
    title: "Friction|FIRST YEAR|ENGINEERING MECHANICS1|Lecture 06|Ladder Friction",
    url: "https://www.youtube.com/watch?v=pbGKWCjVHgo",
    videoId: "pbGKWCjVHgo",
    unit: "Unit 3",
  },
  {
    title: "Friction|FIRST YEAR|ENGINEERING MECHANICS1|Lecture 07|Ladder Friction",
    url: "https://www.youtube.com/watch?v=TytdVNn5xxg",
    videoId: "TytdVNn5xxg",
    unit: "Unit 3",
  },
  // Unit 4
  {
    title: "KINETICS OF PARTICLES|ONE SHOT|ENGINEERING MECHANICS|PRADEEP GIRI SIR",
    url: "https://www.youtube.com/watch?v=1bVEu40JxGo",
    videoId: "1bVEu40JxGo",
    unit: "Unit 4",
  },
  {
    title: "INSTANTANEOUS CENTRE OF ROTATION|KINEMATICS OF RIGID BODY|ONE SHOT|ENGINEERING MECHANICS|PRADEEP SIR",
    url: "https://www.youtube.com/watch?v=GQKJ6ugELCs",
    videoId: "GQKJ6ugELCs",
    unit: "Unit 4",
  },
  {
    title: "KINEMATICS OF PARTICLES|ONE SHOT|ENGINEERING MECHANICS|PRADEEP GIRI SIR",
    url: "https://www.youtube.com/watch?v=9yaU22oASEc",
    videoId: "9yaU22oASEc",
    unit: "Unit 4",
  },
  {
    title: "EQUILIBRIUM|ONE SHOT|ENGINEERING MECHANICS|PRADEEP GIRI SIR",
    url: "https://www.youtube.com/watch?v=gQezRynNuXg",
    videoId: "gQezRynNuXg",
    unit: "Unit 4",
  },
  {
    title: "CENTROID|ONE SHOT|ENGINEERING MECHANICS|PRADEEP GIRI SIR",
    url: "https://www.youtube.com/watch?v=bL4Ahhmasag",
    videoId: "bL4Ahhmasag",
    unit: "Unit 4",
  },
  {
    title: "SPACE FORCES|ONE SHOT|ENGINEERING MECHANICS|PRADEEP GIRI SIR",
    url: "https://www.youtube.com/watch?v=azoHcRG9jsQ",
    videoId: "azoHcRG9jsQ",
    unit: "Unit 4",
  },
];

const SEED_CONFIGS = {
  m2: {
    label: 'M2 — Unit 4 (Differential Equations)',
    lectures: M2_LECTURES,
    subject: 'Engineering Mathematics II',
    unit: 'Unit 4',
    branch: 'Computer',
    year: '1st Year',
  },
  m2u5: {
    label: 'M2 — Unit 5 (Applications of DE)',
    lectures: M2_UNIT5_LECTURES,
    subject: 'Engineering Mathematics II',
    unit: 'Unit 5',
    branch: 'Computer',
    year: '1st Year',
  },
  physics: {
    label: 'Physics — All Units (One Shots)',
    lectures: PHYSICS_LECTURES,
    subject: 'Physics',
    unit: null, // per-lecture unit
    branch: 'Computer',
    year: '1st Year',
  },
  bxe: {
    label: 'BXE — All Units (Basic Electronics)',
    lectures: BXE_LECTURES,
    subject: 'Basic Electronics Engineering',
    unit: null, // per-lecture unit
    branch: 'Computer',
    year: '1st Year',
  },
  mechanics: {
    label: 'Mechanics — Units 1-4',
    lectures: MECHANICS_LECTURES,
    subject: 'Engineering Mechanics',
    unit: null, // per-lecture unit
    branch: 'Computer',
    year: '1st Year',
  },
};

export default function SeedYouTube() {
    const { user } = useAuth();
    const [status, setStatus] = useState('');
    const [seeding, setSeeding] = useState(false);
    const [activeConfig, setActiveConfig] = useState('physics');

    const config = SEED_CONFIGS[activeConfig];

    const handleSeed = async () => {
        if (!user) {
            setStatus('You must be logged in!');
            return;
        }
        if (!db) {
            setStatus('Firestore not initialized!');
            return;
        }

        setSeeding(true);
        setStatus('Starting seed...');
        try {
            for (let i = 0; i < config.lectures.length; i++) {
                const lecture = config.lectures[i];
                await addDoc(collection(db, 'youtube_lectures'), {
                    title: lecture.title,
                    url: lecture.url,
                    videoId: lecture.videoId,
                    branch: config.branch,
                    year: config.year,
                    subject: config.subject,
                    unit: lecture.unit || config.unit || 'Unit 1',
                    createdAt: new Date().toISOString(),
                });
                setStatus(`Seeded ${i + 1}/${config.lectures.length}: ${lecture.title}`);
            }
            setStatus(`✅ Done! Successfully seeded all ${config.lectures.length} lectures for ${config.subject}.`);
        } catch (e) {
            setStatus('❌ Error: ' + e.message);
            console.error(e);
        }
        setSeeding(false);
    };

    return (
        <div style={{ padding: '40px', marginTop: '100px', background: 'var(--bg-main)', minHeight: '100vh', color: 'var(--text-primary)' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Seed YouTube Lectures</h1>

            {/* Subject selector tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                {Object.entries(SEED_CONFIGS).map(([key, cfg]) => (
                    <button
                        key={key}
                        onClick={() => { setActiveConfig(key); setStatus(''); }}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '8px',
                            border: activeConfig === key ? '2px solid #dc2626' : '2px solid var(--border-default)',
                            background: activeConfig === key ? '#dc262620' : 'transparent',
                            color: activeConfig === key ? '#dc2626' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontWeight: activeConfig === key ? 'bold' : 'normal',
                            fontSize: '0.95rem',
                        }}
                    >
                        {cfg.label}
                    </button>
                ))}
            </div>

            <p style={{ marginBottom: '8px', fontWeight: 600 }}>{config.label}</p>
            <p style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>{config.lectures.length} lectures from playlist</p>

            {/* Preview list */}
            <div style={{ marginBottom: '24px', maxHeight: '300px', overflowY: 'auto', border: '1px solid var(--border-default)', borderRadius: '12px', padding: '16px' }}>
                {config.lectures.map((lec, i) => (
                    <div key={lec.videoId} style={{ padding: '8px 0', borderBottom: i < config.lectures.length - 1 ? '1px solid var(--border-default)' : 'none', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', minWidth: '24px' }}>{i + 1}.</span>
                        <img src={`https://img.youtube.com/vi/${lec.videoId}/default.jpg`} alt="" style={{ width: '60px', height: '45px', borderRadius: '6px', objectFit: 'cover' }} />
                        <div>
                            <div style={{ fontSize: '0.9rem' }}>{lec.title}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{lec.unit || config.unit} • {lec.videoId}</div>
                        </div>
                    </div>
                ))}
            </div>

            {user ? (
                <>
                    <p style={{ color: 'green', marginBottom: '1rem' }}>✓ Logged in as {user.email}</p>
                    <button
                        onClick={handleSeed}
                        disabled={seeding}
                        style={{ padding: '12px 24px', background: '#ff0000', color: 'white', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', border: 'none', fontSize: '1rem' }}
                    >
                        {seeding ? 'Seeding...' : `Seed All ${config.lectures.length} Lectures`}
                    </button>
                    <p style={{ marginTop: '20px', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>{status}</p>
                </>
            ) : (
                <p style={{ color: 'red' }}>⚠️ You must go to the Login page and sign in first.</p>
            )}
        </div>
    );
}
