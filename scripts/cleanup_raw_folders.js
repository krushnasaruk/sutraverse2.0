const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

const foldersToClean = [
  'chemistry',
  'fpl',
  'pps',
  'physics data',
  'BXE',
  'EG',
  'structured_uploads'
];

const zipPath = path.join(process.cwd(), 'backup_raw_folders.zip');
console.log(`Starting cleanup. Creating ZIP file at: ${zipPath}`);

const output = fs.createWriteStream(zipPath);
const archive = archiver('zip', {
  zlib: { level: 9 } // Sets the compression level.
});

output.on('close', function() {
  console.log(`ZIP file created successfully. Total size: ${archive.pointer()} bytes.`);
  console.log('Now deleting original folders...');
  
  for (const folder of foldersToClean) {
    const folderPath = path.join(process.cwd(), folder);
    if (fs.existsSync(folderPath)) {
      try {
        fs.rmSync(folderPath, { recursive: true, force: true });
        console.log(`[DELETED] ${folder}`);
      } catch (err) {
        console.error(`[ERROR] Failed to delete folder ${folder}:`, err.message);
      }
    } else {
      console.log(`[SKIP] Folder ${folder} does not exist.`);
    }
  }
  
  console.log('Cleanup completed successfully.');
  process.exit(0);
});

archive.on('warning', function(err) {
  if (err.code === 'ENOENT') {
    console.warn('[WARNING] Archive entry missing:', err.message);
  } else {
    throw err;
  }
});

archive.on('error', function(err) {
  console.error('[ERROR] Archive creation failed:', err.message);
  process.exit(1);
});

archive.pipe(output);

// Add directories to archive
let directoriesAdded = 0;
for (const folder of foldersToClean) {
  const folderPath = path.join(process.cwd(), folder);
  if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
    archive.directory(folderPath, folder);
    console.log(`[ADDED TO ZIP] ${folder}`);
    directoriesAdded++;
  } else {
    console.log(`[SKIP ZIP] Folder ${folder} does not exist or is not a directory.`);
  }
}

if (directoriesAdded === 0) {
  console.log('No folders found to zip. Exiting.');
  process.exit(0);
}

archive.finalize();
