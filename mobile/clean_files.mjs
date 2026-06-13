import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit, deleteDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  projectId: 'sutraverse2',
  apiKey: "AIzaSyCKWoYmyjRcdmqnaHerEHCr9ScNmXNBets",
  authDomain: "sutraverse2.firebaseapp.com"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function main() {
  const q = query(collection(db, 'files'), orderBy('createdAt', 'desc'), limit(100));
  const snap = await getDocs(q);
  for (const d of snap.docs) {
    const data = d.data();
    if (!data.fileUrl && !data.fileURL) {
      console.log('Deleting dummy file:', data.title);
      await deleteDoc(doc(db, 'files', d.id));
    } else {
      console.log('Keeping:', data.title);
    }
  }
  console.log('Done!');
  process.exit(0);
}
main().catch(console.error);
