const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

async function main() {
  const files = fs.readdirSync(process.cwd());
  const keyFile = files.find(f => f.startsWith('sutraverse2-firebase-adminsdk-') && f.endsWith('.json'));
  if (!keyFile) {
    console.error('Service account file not found in current directory.');
    process.exit(1);
  }
  
  const keyPath = path.join(process.cwd(), keyFile);
  const serviceAccount = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  
  const db = admin.firestore();
  console.log('Fetching notifications...');
  const snapshot = await db.collection('notifications').get();
  console.log(`Found ${snapshot.size} notifications. Checking fields...`);
  
  let migratedCount = 0;
  for (const doc of snapshot.docs) {
    const data = doc.data();
    if (!data.recipientId && !data.recipientEmail) {
      console.log(`Migrating notification ${doc.id}: ${data.title}`);
      await db.collection('notifications').doc(doc.id).update({
        recipientId: 'global'
      });
      migratedCount++;
    }
  }
  
  console.log(`Migration complete. Updated ${migratedCount} notifications.`);
}

main().catch(err => {
  console.error('Error during migration:', err);
  process.exit(1);
});
