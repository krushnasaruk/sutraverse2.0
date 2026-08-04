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

// 2. Mappings and configuration
const SUBJECT_MAPPINGS = {
  'bxe dataset': {
    subject: 'Basic Electronics Engineering',
    shorthand: 'electronics'
  },
  'engineering graphics dataset': {
    subject: 'Engineering Graphics',
    shorthand: 'engineering-graphics'
  },
  'fpl dataset': {
    subject: 'FPL',
    shorthand: 'fpl'
  },
  'engineering mathamatics 2 dataset': {
    subject: 'Engineering Mathematics II',
    shorthand: 'maths2'
  },
  'mechanics dataset': {
    subject: 'Engineering Mechanics',
    shorthand: 'engineering-mechanics'
  },
  'physics dataset': {
    subject: 'Physics',
    shorthand: 'physics'
  },
  'pps dataset': {
    subject: 'PPS',
    shorthand: 'pps'
  },
  'bee dataset': {
    subject: 'Basic Electrical Engineering',
    shorthand: 'bee'
  },
  'chemistry dataset': {
    subject: 'Engineering Chemistry',
    shorthand: 'chemistry'
  },
  'unsorted dataset': {
    subject: 'Unsorted',
    shorthand: 'unsorted'
  }
};

const YEAR_MAPPINGS = {
  'first year': '1st Year',
  'second year': '2nd Year',
  'third year': '3rd Year',
  'forth year': '4th Year'
};

// Target directory paths
const publicUploadsDir = path.join(process.cwd(), 'public', 'uploads');
const publicPyqsDir = path.join(process.cwd(), 'public', 'pyqs');

// Ensure base directories exist
if (!fs.existsSync(publicUploadsDir)) {
  fs.mkdirSync(publicUploadsDir, { recursive: true });
}
if (!fs.existsSync(publicPyqsDir)) {
  fs.mkdirSync(publicPyqsDir, { recursive: true });
}

// Clean and capitalize titles
function cleanTitle(filename, subject) {
  const ext = path.extname(filename);
  let nameWithoutExt = path.basename(filename, ext);
  
  // Replace underscores and hyphens with spaces
  let readable = nameWithoutExt.replace(/_/g, ' ').replace(/-/g, ' ').trim();
  
  // Capitalize words
  readable = readable.split(/\s+/).map(word => {
    if (!word) return '';
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');

  return readable;
}

// Determine file type
function determineFileType(filePath) {
  const normalizedPath = filePath.toLowerCase().replace(/\\/g, '/');
  if (normalizedPath.includes('assignment')) {
    return 'Assignment';
  }
  if (
    normalizedPath.includes('pyq') ||
    normalizedPath.includes('question bank') ||
    normalizedPath.includes('qb') ||
    normalizedPath.includes('paper')
  ) {
    return 'PYQ';
  }
  return 'Notes';
}

// Traverse folders and copy files
async function processFiles() {
  const dpcoePath = path.join(process.cwd(), 'dpcoe');
  if (!fs.existsSync(dpcoePath)) {
    console.error('ERROR: "dpcoe" folder does not exist in root directory.');
    process.exit(1);
  }

  const filesProcessed = [];

  function scanDir(dir) {
    const list = fs.readdirSync(dir);
    for (const item of list) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        scanDir(fullPath);
      } else {
        const ext = path.extname(item).toLowerCase();
        if (['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls', '.zip'].includes(ext)) {
          filesProcessed.push({
            fullPath,
            fileName: item,
            ext,
            size: stat.size
          });
        }
      }
    }
  }

  scanDir(dpcoePath);
  console.log(`Found ${filesProcessed.length} candidate files in dpcoe/ directory.`);

  let successCount = 0;

  for (const fileObj of filesProcessed) {
    const relativePath = path.relative(dpcoePath, fileObj.fullPath);
    const pathSegments = relativePath.toLowerCase().split(path.sep);
    
    // Find year segment
    const yearSegment = pathSegments[0];
    const dbYear = YEAR_MAPPINGS[yearSegment] || '1st Year';

    // Find subject mapping
    const subjectSegment = pathSegments[1];
    const mapping = SUBJECT_MAPPINGS[subjectSegment];
    if (!mapping) {
      console.warn(`[SKIP] No subject mapping found for segment "${subjectSegment}" in path: ${relativePath}`);
      continue;
    }

    const subjectName = mapping.subject;
    const type = determineFileType(fileObj.fullPath);
    const title = cleanTitle(fileObj.fileName, subjectName);

    // Generate unique name for public/uploads/
    const sanitizedFileName = fileObj.fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const uniqueName = `${Date.now()}_${sanitizedFileName}`;
    const destUploadPath = path.join(publicUploadsDir, uniqueName);

    try {
      // Copy to public/uploads/
      fs.copyFileSync(fileObj.fullPath, destUploadPath);

      // If it's a PYQ, copy it to public/pyqs/<subject>/ as well for the pyqs page
      if (type === 'PYQ') {
        const subjectPyqsDir = path.join(publicPyqsDir, mapping.shorthand);
        if (!fs.existsSync(subjectPyqsDir)) {
          fs.mkdirSync(subjectPyqsDir, { recursive: true });
        }
        const destPyqPath = path.join(subjectPyqsDir, fileObj.fileName);
        fs.copyFileSync(fileObj.fullPath, destPyqPath);
        console.log(`[PYQ COPY] Copied PYQ to: public/pyqs/${mapping.shorthand}/${fileObj.fileName}`);
      }

      // Save to Firestore
      const docData = {
        title,
        type,
        subject: subjectName,
        branch: 'All', // Default first year branch configuration
        year: dbYear,
        uploaderUID: 'admin',
        uploaderName: 'Admin',
        uploaderEmail: 'sutraverse11@gmail.com',
        fileUrl: `/uploads/${uniqueName}`,
        fileName: uniqueName,
        fileSize: fileObj.size,
        downloads: 0,
        rating: '5.0',
        status: 'approved',
        createdAt: new Date().toISOString()
      };

      await db.collection('files').add(docData);
      console.log(`[SUCCESS] Registered: ${title} (${type}) for subject ${subjectName}`);
      successCount++;
    } catch (err) {
      console.error(`[ERROR] Failed to process file ${fileObj.fileName}:`, err.message);
    }
  }

  console.log(`\nProcessing complete! Successfully seeded ${successCount} files.`);
  process.exit(0);
}

processFiles();
