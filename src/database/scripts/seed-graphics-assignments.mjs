import admin from 'firebase-admin';
import fs from 'fs';

// Read secure service account credentials
const serviceAccount = JSON.parse(
  fs.readFileSync('./sutraverse2-firebase-adminsdk-fbsvc-de34e6d305.json', 'utf8')
);

// Initialize Firebase Admin SDK if not already initialized
if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

const GRAPHICS_ASSIGNMENTS = [
  {
    title: "EG Assignment 1: Theory of Projections, Points & Lines",
    subject: "Engineering Graphics",
    type: "Assignment",
    year: "FE",
    semester: "Sem 2",
    uploader: "Prof. K. P. Shinde",
    downloads: 850,
    rating: 4.6,
    status: "approved",
    fileUrl: "https://firebasestorage.googleapis.com/v0/b/sutraverse2.appspot.com/o/materials%2Fbee-notes.zip?alt=media",
    createdAt: new Date().toISOString()
  },
  {
    title: "EG Assignment 1 Solution: Projection of Lines (Verified Draw Sheets)",
    subject: "Engineering Graphics",
    type: "Assignment",
    year: "FE",
    semester: "Sem 2",
    uploader: "Amit K. (TE Scholar)",
    downloads: 1950,
    rating: 4.9,
    status: "approved",
    fileUrl: "https://firebasestorage.googleapis.com/v0/b/sutraverse2.appspot.com/o/materials%2Fbee-notes.zip?alt=media",
    createdAt: new Date().toISOString()
  },
  {
    title: "EG Assignment 2: Projection of Planes (Inclined to both reference planes)",
    subject: "Engineering Graphics",
    type: "Assignment",
    year: "FE",
    semester: "Sem 2",
    uploader: "Prof. K. P. Shinde",
    downloads: 720,
    rating: 4.5,
    status: "approved",
    fileUrl: "https://firebasestorage.googleapis.com/v0/b/sutraverse2.appspot.com/o/materials%2Fbee-notes.zip?alt=media",
    createdAt: new Date().toISOString()
  },
  {
    title: "EG Assignment 2 Solution: Projection of Planes (Fully Handdrawn)",
    subject: "Engineering Graphics",
    type: "Assignment",
    year: "FE",
    semester: "Sem 2",
    uploader: "Amit K. (TE Scholar)",
    downloads: 1650,
    rating: 4.8,
    status: "approved",
    fileUrl: "https://firebasestorage.googleapis.com/v0/b/sutraverse2.appspot.com/o/materials%2Fbee-notes.zip?alt=media",
    createdAt: new Date().toISOString()
  },
  {
    title: "EG Assignment 3: Projection of Solids (Prisms, Pyramids, Cylinders & Cones)",
    subject: "Engineering Graphics",
    type: "Assignment",
    year: "FE",
    semester: "Sem 2",
    uploader: "Prof. K. P. Shinde",
    downloads: 980,
    rating: 4.7,
    status: "approved",
    fileUrl: "https://firebasestorage.googleapis.com/v0/b/sutraverse2.appspot.com/o/materials%2Fbee-notes.zip?alt=media",
    createdAt: new Date().toISOString()
  },
  {
    title: "EG Assignment 3 Solution: Projection of Solids (AutoCAD Sheet Outputs)",
    subject: "Engineering Graphics",
    type: "Assignment",
    year: "FE",
    semester: "Sem 2",
    uploader: "Amit K. (TE Scholar)",
    downloads: 2100,
    rating: 4.9,
    status: "approved",
    fileUrl: "https://firebasestorage.googleapis.com/v0/b/sutraverse2.appspot.com/o/materials%2Fbee-notes.zip?alt=media",
    createdAt: new Date().toISOString()
  }
];

async function seedGraphics() {
  console.log("🚀 Starting Engineering Graphics (EG) Assignments Database Seeding...");
  let count = 0;
  
  const filesCol = db.collection('files');
  
  for (const item of GRAPHICS_ASSIGNMENTS) {
    console.log(`[SEEDING] Adding "${item.title}"...`);
    await filesCol.add(item);
    count++;
  }
  
  console.log(`\n🎉 Success! Successfully seeded ${count} Engineering Graphics assignments and solutions into the database!`);
  process.exit(0);
}

seedGraphics().catch(err => {
  console.error("❌ Database seeding failed:", err);
  process.exit(1);
});
