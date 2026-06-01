const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs } = require('firebase/firestore');
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCKWoYmyjRcdmqnaHerEHCr9ScNmXNBets",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "sutraverse2.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "sutraverse2",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
getDocs(collection(db, 'youtube_lectures')).then(snap => {
  console.log("Total lectures:", snap.docs.length);
  snap.docs.slice(0, 5).forEach(d => console.log(d.data()));
}).catch(console.error);
