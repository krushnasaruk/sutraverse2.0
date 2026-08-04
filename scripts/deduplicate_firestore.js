const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// 1. Initialize Firebase Admin SDK
function initializeFirebase() {
  const rootDir = process.cwd();
  const files = fs.readdirSync(rootDir);
  const keyFile = files.find(f => f.startsWith('sutraverse2-firebase-adminsdk-') && f.endsWith('.json'));

  if (!keyFile) {
    console.error('ERROR: Could not find firebase service account key file in root directory.');
    process.exit(1);
  }

  const keyPath = path.join(rootDir, keyFile);
  console.log(`Loading Firebase credential file: ${keyFile}`);
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

initializeFirebase();
const db = admin.firestore();

async function deduplicate() {
  console.log('Fetching files from Firestore...');
  const snap = await db.collection('files').get();
  console.log(`Found ${snap.size} documents in files collection.`);

  const seen = new Map();
  let duplicatesDeleted = 0;

  // Sort docs by createdAt ascending (so that we keep the newest one / overwrite seen map)
  const docs = snap.docs.map(doc => ({
    id: doc.id,
    ref: doc.ref,
    data: doc.data()
  }));
  
  docs.sort((a, b) => {
    const timeA = new Date(a.data.createdAt || 0).getTime();
    const timeB = new Date(b.data.createdAt || 0).getTime();
    return timeA - timeB;
  });

  for (const docObj of docs) {
    const data = docObj.data;
    
    // Construct a unique key representing the identical file metadata
    const cleanTitle = String(data.title || '').trim().toLowerCase();
    const cleanSubject = String(data.subject || '').trim().toLowerCase();
    const cleanType = String(data.type || '').trim().toLowerCase();
    const size = data.fileSize || 0;
    
    const key = `${cleanTitle}_${cleanSubject}_${cleanType}_${size}`;

    if (seen.has(key)) {
      // It is a duplicate! Delete the older one (which is currently stored in seen, or delete the current one if it's identical)
      const olderDoc = seen.get(key);
      try {
        await db.collection('files').doc(olderDoc.id).delete();
        console.log(`[DELETED DUPLICATE] Removed old record of: "${data.title}" (${data.type})`);
        duplicatesDeleted++;
      } catch (err) {
        console.error(`Failed to delete doc ${olderDoc.id}:`, err.message);
      }
    }

    // Save the current document (which is newer) in the map
    seen.set(key, docObj);
  }

  console.log(`\nDeduplication complete! Total duplicates deleted: ${duplicatesDeleted}`);
  process.exit(0);
}

deduplicate().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
