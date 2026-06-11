import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';
import fs from 'fs';

// Use same config as the project
const firebaseConfig = JSON.parse(fs.readFileSync('./cors.json', 'utf8')); 
// wait, cors.json is not firebase config. Let's look for firebase config in the project.
