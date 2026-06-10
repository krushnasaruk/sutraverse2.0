import admin from 'firebase-admin';
import fs from 'fs';

// Read the secure service account key
const serviceAccount = JSON.parse(
  fs.readFileSync('./sutraverse2-firebase-adminsdk-fbsvc-de34e6d305.json', 'utf8')
);

// Initialize Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const BXE_MATERIALS = [
  // ── Unit Notes ──
  {
    title: "BXE Unit 1: Semiconductor Diodes & Zener Regulator Notes",
    subject: "Electronics",
    type: "Notes",
    year: "FE",
    semester: "Sem 2",
    uploader: "Dr. A. P. Ghokhale",
    downloads: 1450,
    rating: 4.8,
    status: "approved",
    fileUrl: "https://firebasestorage.googleapis.com/v0/b/sutraverse2.appspot.com/o/materials%2Fbee-notes.zip?alt=media",
    createdAt: new Date().toISOString()
  },
  {
    title: "BXE Unit 2: Bipolar Junction Transistor (BJT) & Biasing Notes",
    subject: "Electronics",
    type: "Notes",
    year: "FE",
    semester: "Sem 2",
    uploader: "Dr. A. P. Ghokhale",
    downloads: 1200,
    rating: 4.7,
    status: "approved",
    fileUrl: "https://firebasestorage.googleapis.com/v0/b/sutraverse2.appspot.com/o/materials%2Fbee-notes.zip?alt=media",
    createdAt: new Date().toISOString()
  },
  {
    title: "BXE Unit 3: Linear Integrated Circuits & Op-Amp Ideal Parameters",
    subject: "Electronics",
    type: "Notes",
    year: "FE",
    semester: "Sem 2",
    uploader: "Prof. S. R. Joshi",
    downloads: 1850,
    rating: 4.9,
    status: "approved",
    fileUrl: "https://firebasestorage.googleapis.com/v0/b/sutraverse2.appspot.com/o/materials%2Fbee-notes.zip?alt=media",
    createdAt: new Date().toISOString()
  },
  {
    title: "BXE Unit 4: Digital Electronics, Logic Gates & Flip Flops Notes",
    subject: "Electronics",
    type: "Notes",
    year: "FE",
    semester: "Sem 2",
    uploader: "Prof. S. R. Joshi",
    downloads: 1600,
    rating: 4.9,
    status: "approved",
    fileUrl: "https://firebasestorage.googleapis.com/v0/b/sutraverse2.appspot.com/o/materials%2Fbee-notes.zip?alt=media",
    createdAt: new Date().toISOString()
  },
  {
    title: "BXE Unit 5: Electronic Instrumentation & Transducers (RTD/LVDT)",
    subject: "Electronics",
    type: "Notes",
    year: "FE",
    semester: "Sem 2",
    uploader: "Dr. A. P. Ghokhale",
    downloads: 1100,
    rating: 4.6,
    status: "approved",
    fileUrl: "https://firebasestorage.googleapis.com/v0/b/sutraverse2.appspot.com/o/materials%2Fbee-notes.zip?alt=media",
    createdAt: new Date().toISOString()
  },

  // ── PYQs ──
  {
    title: "Basic Electronics (BXE) End-Sem Exam May 2024 Paper",
    subject: "Electronics",
    type: "PYQ",
    year: "FE",
    semester: "Sem 2",
    uploader: "Admin",
    downloads: 2400,
    rating: 4.9,
    status: "approved",
    fileUrl: "https://firebasestorage.googleapis.com/v0/b/sutraverse2.appspot.com/o/materials%2Fbee-notes.zip?alt=media",
    createdAt: new Date().toISOString()
  },
  {
    title: "Basic Electronics (BXE) In-Sem Exam March 2024 Paper",
    subject: "Electronics",
    type: "PYQ",
    year: "FE",
    semester: "Sem 2",
    uploader: "Admin",
    downloads: 1350,
    rating: 4.7,
    status: "approved",
    fileUrl: "https://firebasestorage.googleapis.com/v0/b/sutraverse2.appspot.com/o/materials%2Fbee-notes.zip?alt=media",
    createdAt: new Date().toISOString()
  },
  {
    title: "Basic Electronics (BXE) End-Sem Exam Dec 2023 Paper",
    subject: "Electronics",
    type: "PYQ",
    year: "FE",
    semester: "Sem 2",
    uploader: "Admin",
    downloads: 1950,
    rating: 4.8,
    status: "approved",
    fileUrl: "https://firebasestorage.googleapis.com/v0/b/sutraverse2.appspot.com/o/materials%2Fbee-notes.zip?alt=media",
    createdAt: new Date().toISOString()
  }
];

async function seedBxe() {
  console.log("🚀 Starting BXE (Basic Electronics) Database Seeding using Firebase Admin SDK...");
  let count = 0;
  
  const filesCol = db.collection('files');
  
  for (const item of BXE_MATERIALS) {
    console.log(`[SEEDING] Adding "${item.title}"...`);
    await filesCol.add(item);
    count++;
  }
  
  console.log(`\n🎉 Success! Successfully seeded ${count} BXE academic notes and question papers into the database!`);
  process.exit(0);
}

seedBxe().catch(err => {
  console.error("❌ Database seeding failed:", err);
  process.exit(1);
});
