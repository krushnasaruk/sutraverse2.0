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

// 2. Mappings and configurations
const SUBJECT_TO_SHORTHAND = {
  'basic electrical engineering': 'bee',
  'bee': 'bee',
  'engineering physics': 'physics',
  'physics': 'physics',
  'engineering chemistry': 'chemistry',
  'chemistry': 'chemistry',
  'engineering mathematics i': 'maths1',
  'engineering mathematics 1': 'maths1',
  'engineering mathematics ii': 'maths2',
  'engineering mathematics 2': 'maths2',
  'engineering mechanics': 'engineering-mechanics',
  'mechanics': 'engineering-mechanics',
  'basic electronics engineering': 'electronics',
  'basic electronics': 'electronics',
  'electronics': 'electronics',
  'bxe': 'electronics',
  'programming & problem solving': 'pps',
  'pps': 'pps',
  'programming and problem solving': 'pps',
  'engineering graphics': 'engineering-graphics',
  'engineering graphics & design': 'engineering-graphics',
  'eg': 'engineering-graphics',
  'fpl': 'fpl',
  'unsorted': 'unsorted'
};

const publicPyqsDir = path.join(process.cwd(), 'public', 'pyqs');
if (!fs.existsSync(publicPyqsDir)) {
  fs.mkdirSync(publicPyqsDir, { recursive: true });
}

// Recursively find a file by name
function findFile(dir, targetName, maxDepth = 6, currentDepth = 0) {
  if (currentDepth > maxDepth) return null;
  try {
    if (!fs.existsSync(dir)) return null;
    const stat = fs.statSync(dir);
    if (!stat.isDirectory()) return null;

    const entries = fs.readdirSync(dir);
    for (const entry of entries) {
      if (entry === targetName) {
        const fullPath = path.join(dir, entry);
        if (fs.statSync(fullPath).isFile()) return fullPath;
      }
    }

    const skip = new Set(['node_modules', '.next', '.git', 'cache', 'tmp', '.cache']);
    for (const entry of entries) {
      if (skip.has(entry)) continue;
      const fullPath = path.join(dir, entry);
      if (fs.statSync(fullPath).isDirectory()) {
        const found = findFile(fullPath, targetName, maxDepth, currentDepth + 1);
        if (found) return found;
      }
    }
  } catch (e) {}
  return null;
}

async function linkPyqs() {
  console.log('Fetching files from Firestore...');
  const snap = await db.collection('files').get();
  console.log(`Found ${snap.size} total files in Firestore.`);

  let pyqCount = 0;
  let copiedCount = 0;
  let skippedCount = 0;

  for (const doc of snap.docs) {
    const data = doc.data();
    
    // Check if type is PYQ
    const type = String(data.type || '').trim().toLowerCase();
    if (type !== 'pyq') continue;

    pyqCount++;

    const fileUrl = data.fileUrl || data.fileURL || '';
    if (!fileUrl) {
      console.warn(`[SKIP] No fileUrl for document: ${data.title}`);
      skippedCount++;
      continue;
    }



    // Extract raw filename
    let rawFilename = path.basename(fileUrl.split('?')[0]);
    try {
      rawFilename = decodeURIComponent(rawFilename);
    } catch (e) {}

    // Find the file on disk
    const searchDirs = [
      path.join(process.cwd(), 'public', 'uploads'),
      path.join(process.cwd(), 'user_uploads'),
      path.join(process.cwd(), 'structured_uploads'),
      path.join(process.cwd(), 'dpcoe'),
      process.cwd()
    ];

    let physicalPath = null;
    for (const searchDir of searchDirs) {
      physicalPath = findFile(searchDir, rawFilename);
      if (physicalPath) break;
    }

    if (!physicalPath) {
      console.warn(`[WARNING] Could not find physical file on disk for: ${rawFilename}`);
      skippedCount++;
      continue;
    }

    // Determine target shorthand folder
    const subjectNorm = String(data.subject || '').trim().toLowerCase();
    const shorthand = SUBJECT_TO_SHORTHAND[subjectNorm] || subjectNorm.replace(/[^a-z0-9]/g, '-');

    const subjectDir = path.join(publicPyqsDir, shorthand);
    if (!fs.existsSync(subjectDir)) {
      fs.mkdirSync(subjectDir, { recursive: true });
    }

    // Clean up filename (remove timestamp prefix if present, e.g. "1785826327521_")
    let targetFileName = rawFilename;
    const timestampMatch = rawFilename.match(/^(\d{13})_(.+)$/);
    if (timestampMatch) {
      targetFileName = timestampMatch[2];
    }

    const destPath = path.join(subjectDir, targetFileName);

    try {
      fs.copyFileSync(physicalPath, destPath);
      console.log(`[SUCCESS] Copied to public/pyqs/${shorthand}/${targetFileName}`);
      copiedCount++;
    } catch (err) {
      console.error(`[ERROR] Failed to copy ${rawFilename} to ${destPath}:`, err.message);
      skippedCount++;
    }
  }

  console.log(`\nLink complete!`);
  console.log(`Total Firestore PYQs: ${pyqCount}`);
  console.log(`Successfully Copied:  ${copiedCount}`);
  console.log(`Skipped / Not Found:  ${skippedCount}`);
  process.exit(0);
}

linkPyqs().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
