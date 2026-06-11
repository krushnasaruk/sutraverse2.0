import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import fs from 'fs';
import path from 'path';

// Firebase configuration matching your web app
const firebaseConfig = {
  apiKey: "AIzaSyCKWoYmyjRcdmqnaHerEHCr9ScNmXNBets",
  authDomain: "sutraverse2.firebaseapp.com",
  projectId: "sutraverse2",
  storageBucket: "sutraverse2.firebasestorage.app",
  messagingSenderId: "666020084296",
  appId: "1:666020084296:web:0dd52b77ce6a245253b67d",
};

// Initialize Firebase
console.log("Initializing Firebase Connection...");
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

const UPLOADS_BASE_DIR = path.resolve('./public/uploads');

// Helper to recursively find a file inside public/uploads
function findFile(baseDir, fileName) {
  if (!fs.existsSync(baseDir)) return null;
  const items = fs.readdirSync(baseDir);
  
  for (const item of items) {
    const fullPath = path.join(baseDir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      const found = findFile(fullPath, fileName);
      if (found) return found;
    } else if (item === fileName) {
      return fullPath;
    }
  }
  return null;
}

// Extract clean filename from a URL path
function getFileNameFromUrl(url) {
  try {
    // If it's a relative path or absolute URL, grab the last segment
    const decodedUrl = decodeURIComponent(url);
    const parts = decodedUrl.split('/');
    const lastPart = parts[parts.length - 1];
    // Remove query params if any
    return lastPart.split('?')[0];
  } catch (e) {
    return null;
  }
}

async function migrateCollections() {
  console.log("\n--- Starting Firestore Media Migration to Firebase Storage ---");
  
  const collectionsToMigrate = ['files', 'submissions'];
  
  for (const colName of collectionsToMigrate) {
    console.log(`\nChecking collection: "${colName}"...`);
    const colRef = collection(db, colName);
    const snap = await getDocs(colRef);
    
    let count = 0;
    let migratedCount = 0;
    
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const docId = docSnap.id;
      const fileUrl = data.fileUrl || data.fileURL;
      
      if (!fileUrl) continue;
      
      // Check if it's a local/relative URL that needs migration
      const isLocal = fileUrl.includes('localhost') || 
                      fileUrl.includes('172.20.10.2') || 
                      fileUrl.includes('192.168.') || 
                      fileUrl.startsWith('/uploads') || 
                      fileUrl.startsWith('/api/downloads');
      
      if (isLocal) {
        count++;
        const fileName = getFileNameFromUrl(fileUrl);
        if (!fileName) {
          console.warn(`[SKIP] Document ${docId} has invalid fileUrl: ${fileUrl}`);
          continue;
        }
        
        console.log(`[FOUND] Local file referenced: "${fileName}" in document ${docId}`);
        
        // Locate file on local Mac filesystem
        const localFilePath = findFile(UPLOADS_BASE_DIR, fileName);
        if (!localFilePath || !fs.existsSync(localFilePath)) {
          console.error(`[ERROR] File "${fileName}" not found in ${UPLOADS_BASE_DIR}. Please check if the file exists locally.`);
          continue;
        }
        
        console.log(`[UPLOADING] Uploading "${fileName}" to Firebase Storage...`);
        try {
          const fileBuffer = fs.readFileSync(localFilePath);
          
          // Determine storage folder context
          const contextFolder = colName === 'submissions' ? 'submissions' : 'materials';
          const storageRef = ref(storage, `${contextFolder}/${fileName}`);
          
          // Upload file
          await uploadBytes(storageRef, fileBuffer, {
            contentType: 'application/pdf', // fallback
          });
          
          // Get public secure HTTPS URL
          const publicUrl = await getDownloadURL(storageRef);
          
          // Update doc in Firestore
          const docRef = doc(db, colName, docId);
          const updateData = {};
          if (data.fileUrl !== undefined) updateData.fileUrl = publicUrl;
          if (data.fileURL !== undefined) updateData.fileURL = publicUrl;
          
          await updateDoc(docRef, updateData);
          
          console.log(`[SUCCESS] Migrated! New URL: ${publicUrl}`);
          migratedCount++;
        } catch (err) {
          console.error(`[FAILED] Failed migrating file ${fileName}:`, err.message);
        }
      }
    }
    
    console.log(`\nFinished "${colName}": Found ${count} local references, successfully migrated ${migratedCount} files to the Cloud.`);
  }
  
  console.log("\n--- Migration Complete! ---");
  process.exit(0);
}

migrateCollections().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});
