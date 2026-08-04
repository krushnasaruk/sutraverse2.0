const fs = require('fs');
const path = require('path');

const publicPyqsDir = path.join(process.cwd(), 'public', 'pyqs');
if (!fs.existsSync(publicPyqsDir)) {
  fs.mkdirSync(publicPyqsDir, { recursive: true });
}

// Allowed extensions for PYQ section
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.doc', '.pptx', '.ppt', '.xlsx', '.xls', '.zip']);

// Subject mapping logic based on name analysis
function classifySubject(fileName) {
  const name = fileName.toLowerCase();
  if (name.includes('graphics') || name.includes('eg')) return 'engineering-graphics';
  if (name.includes('mechanics') || name.includes('em') || name.includes('mech')) return 'engineering-mechanics';
  if (name.includes('chemistry') || name.includes('chem')) return 'chemistry';
  if (name.includes('physics')) return 'physics';
  if (name.includes('pps')) return 'pps';
  if (name.includes('fpl')) return 'fpl';
  if (name.includes('bxe') || name.includes('electronics')) return 'electronics';
  if (name.includes('bee') || name.includes('electrical')) return 'bee';
  if (name.includes('maths2') || name.includes('maths 2') || name.includes('m2') || name.includes('m-ii')) return 'maths2';
  if (name.includes('maths1') || name.includes('maths 1') || name.includes('m1') || name.includes('m-i')) return 'maths1';
  return 'unsorted';
}

// Check if filename indicates a PYQ / Question Paper / Question Bank
function isPyqFile(fileName) {
  const name = fileName.toLowerCase();
  return (
    name.includes('pyq') ||
    name.includes('question_bank') ||
    name.includes('question bank') ||
    name.includes('qb') ||
    name.includes('paper') ||
    name.includes('insem') ||
    name.includes('endsem') ||
    name.includes('test') ||
    name.includes('prelium') ||
    name.includes('anspaper')
  );
}

// Find all files in directories recursively
function findFilesRecursively(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  try {
    const stat = fs.statSync(dir);
    if (!stat.isDirectory()) return fileList;

    const entries = fs.readdirSync(dir);
    const skip = new Set(['node_modules', '.next', '.git', 'cache', 'tmp', '.cache', 'pyqs']); // Skip public/pyqs folder itself!
    
    for (const entry of entries) {
      if (skip.has(entry)) continue;
      const fullPath = path.join(dir, entry);
      try {
        const s = fs.statSync(fullPath);
        if (s.isFile()) {
          const ext = path.extname(entry).toLowerCase();
          if (ALLOWED_EXTENSIONS.has(ext)) {
            fileList.push({
              fullPath,
              fileName: entry,
              ext,
              size: s.size
            });
          }
        } else if (s.isDirectory()) {
          findFilesRecursively(fullPath, fileList);
        }
      } catch (e) {}
    }
  } catch (e) {}
  return fileList;
}

function runOfflineLinker() {
  const searchDirs = [
    path.join(process.cwd(), 'public', 'uploads'),
    path.join(process.cwd(), 'user_uploads'),
    path.join(process.cwd(), 'structured_uploads'),
    path.join(process.cwd(), 'dpcoe')
  ];

  console.log('Scanning directories for offline files...');
  const allFiles = [];
  for (const dir of searchDirs) {
    findFilesRecursively(dir, allFiles);
  }

  console.log(`Found ${allFiles.length} total potential files. Processing PYQs...`);

  let copiedCount = 0;
  const processedNames = new Set();

  for (const fileObj of allFiles) {
    if (!isPyqFile(fileObj.fileName)) continue;

    // Clean up filename (remove timestamp prefix if present)
    let cleanedName = fileObj.fileName;
    const timestampMatch = fileObj.fileName.match(/^(\d{13})_(.+)$/);
    if (timestampMatch) {
      cleanedName = timestampMatch[2];
    }

    const shorthand = classifySubject(cleanedName);
    const subjectDir = path.join(publicPyqsDir, shorthand);

    if (!fs.existsSync(subjectDir)) {
      fs.mkdirSync(subjectDir, { recursive: true });
    }

    const destPath = path.join(subjectDir, cleanedName);
    const uniqueKey = `${shorthand}/${cleanedName.toLowerCase()}`;

    // Skip duplicates to avoid unnecessary writes
    if (processedNames.has(uniqueKey)) continue;

    try {
      fs.copyFileSync(fileObj.fullPath, destPath);
      processedNames.add(uniqueKey);
      copiedCount++;
      console.log(`[SUCCESS] Copied to public/pyqs/${shorthand}/${cleanedName}`);
    } catch (err) {
      console.error(`[ERROR] Failed to copy ${fileObj.fileName}:`, err.message);
    }
  }

  console.log(`\nOffline link complete!`);
  console.log(`Successfully Copied: ${copiedCount} files into public/pyqs/`);
}

runOfflineLinker();
