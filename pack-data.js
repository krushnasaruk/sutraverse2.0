const fs = require('fs-extra');
const archiver = require('archiver');
const path = require('path');

async function packData() {
  const rootDir = __dirname;
  const deployZipPath = path.join(rootDir, 'cpanel-data.zip');
  const pyqsDir = path.join(rootDir, 'public', 'pyqs');
  const uploadsDir = path.join(rootDir, 'public', 'uploads');

  console.log("Preparing cPanel data package (PDFs & PYQs)...");

  // Remove old zip if exists
  if (fs.existsSync(deployZipPath)) {
    await fs.removeSync(deployZipPath);
  }

  const output = fs.createWriteStream(deployZipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', function() {
    console.log(`\n✅ Data package ready: ${deployZipPath}`);
    console.log(`   Package size: ${formatBytes(archive.pointer())}`);
    console.log('\n── Data Upload Steps ──────────────────────────────────');
    console.log('1. Upload cpanel-data.zip to your cPanel file manager');
    console.log('2. Move it to your main application folder (same folder as server.js)');
    console.log('3. Extract it there (it will create "pyqs" and "uploads" directories directly in the main folder)');
    console.log('4. Ensure the files are readable (e.g. 0644 permission)');
    console.log('────────────────────────────────────────────────────\n');
  });

  archive.on('error', function(err) { throw err; });
  archive.pipe(output);

  // Add pyqs directory
  if (fs.existsSync(pyqsDir)) {
    archive.directory(pyqsDir, 'pyqs');
    console.log("  ✓ Added public/pyqs/");
  } else {
    console.warn("  ⚠ Warning: public/pyqs/ not found!");
  }

  // Add uploads directory
  if (fs.existsSync(uploadsDir)) {
    archive.directory(uploadsDir, 'uploads');
    console.log("  ✓ Added public/uploads/");
  } else {
    console.warn("  ⚠ Warning: public/uploads/ not found!");
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
