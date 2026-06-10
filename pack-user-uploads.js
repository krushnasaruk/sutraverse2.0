const fs = require('fs-extra');
const archiver = require('archiver');
const path = require('path');
const os = require('os');

async function packData() {
  const rootDir = __dirname;
  const deployZipPath = path.join(rootDir, 'cpanel-user-uploads.zip');
  const pyqsDir = path.join(rootDir, 'public', 'pyqs');
  const uploadsDir = path.join(rootDir, 'public', 'uploads');
  const localUserUploadsDir = path.join(os.homedir(), 'user-uploads');

  console.log("Preparing full cPanel data package (combining public/uploads, public/pyqs, and ~/user-uploads)...");

  // Remove old zip if exists
  if (fs.existsSync(deployZipPath)) {
    await fs.remove(deployZipPath);
  }

  const output = fs.createWriteStream(deployZipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', function() {
    console.log(`\n✅ Data package ready: ${deployZipPath}`);
    console.log(`   Package size: ${formatBytes(archive.pointer())}`);
    console.log('\n── Data Upload Steps ──────────────────────────────────');
    console.log('1. Upload cpanel-user-uploads.zip to your cPanel file manager');
    console.log('2. Move it to your ROOT user-uploads folder (e.g. /home/krushnasaruk.in/user-uploads)');
    console.log('3. Extract it there');
    console.log('────────────────────────────────────────────────────\n');
  });

  archive.on('error', function(err) { throw err; });
  archive.pipe(output);

  // Add pyqs directory
  if (fs.existsSync(pyqsDir)) {
    archive.directory(pyqsDir, 'pyqs');
    console.log("  ✓ Added public/pyqs/ -> pyqs/");
  }

  // Add uploads directory
  if (fs.existsSync(uploadsDir)) {
    archive.directory(uploadsDir, 'uploads');
    console.log("  ✓ Added public/uploads/ -> uploads/");
  }

  // Add local user-uploads directory contents directly to the root of the zip
  if (fs.existsSync(localUserUploadsDir)) {
    // Add all files and folders inside ~/user-uploads to the root of the zip
    archive.directory(localUserUploadsDir, false);
    console.log(`  ✓ Added ${localUserUploadsDir}/* -> (root of zip)`);
  } else {
    console.warn(`  ⚠ Warning: ${localUserUploadsDir} not found!`);
  }

  archive.finalize();
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

packData().catch(console.error);
