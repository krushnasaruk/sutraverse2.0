import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';
import fs from 'fs';

const firebaseConfig = {
  projectId: 'sutras-a3df5'
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const q = query(collection(db, 'files'), orderBy('createdAt', 'desc'), limit(15));
  const snap = await getDocs(q);
  const files = snap.docs.map(d => ({id: d.id, ...d.data()}));
  console.log(JSON.stringify(files, null, 2));
}

main().catch(console.error);
