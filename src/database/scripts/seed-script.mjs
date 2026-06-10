import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCKWoYmyjRcdmqnaHerEHCr9ScNmXNBets",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sutraverse2.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sutraverse2",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "sutraverse2.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "666020084296",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:666020084296:web:0dd52b77ce6a245253b67d",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

const PHYSICS_LECTURES = [
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
  {
    title: "UNIT 4 | ONE SHOT | ULTRASONICS | SPPU PUNE UNIVERSITY | 2024 PATTERN",
    url: "https://www.youtube.com/watch?v=DGiVFCGFKFE",
    videoId: "DGiVFCGFKFE",
    unit: "Unit 4",
  },
  {
    title: "UNIT 5 | ONE SHOT | NANOPARTICLES | SPPU PUNE UNIVERSITY | 2024 PATTERN",
    url: "https://www.youtube.com/watch?v=27mhnrW4pX0",
    videoId: "27mhnrW4pX0",
    unit: "Unit 5",
  },
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

async function seed() {
  console.log('Starting seed...');
  let added = 0;

  // Seed M2 Unit 5
  console.log('Seeding M2 Unit 5...');
  for (const lecture of M2_UNIT5_LECTURES) {
    await addDoc(collection(db, 'youtube_lectures'), {
      title: lecture.title,
      url: lecture.url,
      videoId: lecture.videoId,
      branch: 'Computer',
      year: '1st Year',
      subject: 'Engineering Mathematics II',
      unit: 'Unit 5',
      createdAt: new Date().toISOString(),
    });
    added++;
  }

  // Seed Physics
  console.log('Seeding Physics...');
  for (const lecture of PHYSICS_LECTURES) {
    await addDoc(collection(db, 'youtube_lectures'), {
      title: lecture.title,
      url: lecture.url,
      videoId: lecture.videoId,
      branch: 'Computer',
      year: '1st Year',
      subject: 'Physics',
      unit: lecture.unit || 'Unit 1',
      createdAt: new Date().toISOString(),
    });
    added++;
  }

  // Seed BXE
  console.log('Seeding BXE...');
  for (const lecture of BXE_LECTURES) {
    await addDoc(collection(db, 'youtube_lectures'), {
      title: lecture.title,
      url: lecture.url,
      videoId: lecture.videoId,
      branch: 'Computer',
      year: '1st Year',
      subject: 'Basic Electronics Engineering',
      unit: lecture.unit || 'Unit 1',
      createdAt: new Date().toISOString(),
    });
    added++;
  }

  console.log(`Successfully seeded ${added} lectures!`);
  process.exit(0);
}

seed().catch(console.error);
