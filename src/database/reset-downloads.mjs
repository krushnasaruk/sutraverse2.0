import admin from 'firebase-admin';
import fs from 'fs';

const serviceAccount = JSON.parse(
  fs.readFileSync('./sutraverse2-firebase-adminsdk-fbsvc-de34e6d305.json', 'utf8')
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function resetDownloads() {
  console.log("Resetting downloads to 0 for all files...");
  const filesSnap = await db.collection('files').get();
  
  let batch = db.batch();
  let count = 0;
  let totalCount = 0;
  
  for (const doc of filesSnap.docs) {
    batch.update(doc.ref, { downloads: 0 });
    count++;
    totalCount++;
    
    if (count === 400) {
      await batch.commit();
      batch = db.batch();
      count = 0;
    }
  }
  
  if (count > 0) {
    await batch.commit();
  }
  
  console.log(`Successfully reset downloads to 0 for ${totalCount} files.`);
  process.exit(0);
}

resetDownloads().catch(err => {
  console.error(err);
  process.exit(1);
});
