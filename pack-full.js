const fs = require('fs-extra');
const archiver = require('archiver');
const path = require('path');

async function packStandaloneCPanel() {
  const rootDir = __dirname;
  const standaloneDir = path.join(rootDir, '.next', 'standalone');
  const deployZipPath = path.join(rootDir, 'cpanel-full-deploy.zip');

  if (!fs.existsSync(standaloneDir)) {
    console.error("Standalone directory doesn't exist. Did you run 'npm run build' with output: 'standalone'?");
    return;
  }

  console.log("Preparing Cloudlinux/cPanel compatible standalone build...");

  // ── 1. Copy public folder (excluding uploads & pyqs — those live outside the app) ──
  const publicSrc = path.join(rootDir, 'public');
  const publicDest = path.join(standaloneDir, 'public');

  // Remove any old public copy first
  if (fs.existsSync(publicDest)) {
    await fs.remove(publicDest);
  }

  if (fs.existsSync(publicSrc)) {
    await fs.copy(publicSrc, publicDest);
  }

  // ── 2. Copy .next/static to standalone/.next/static ──
  const staticSrc = path.join(rootDir, '.next', 'static');
  const staticDest = path.join(standaloneDir, '.next', 'static');
  if (fs.existsSync(staticSrc)) {
    await fs.copy(staticSrc, staticDest);
  }

  // ── 2.5 Copy .env.local to standalone ──
  const envSrc = path.join(rootDir, '.env.local');
  const envDest = path.join(standaloneDir, '.env.local');
  if (fs.existsSync(envSrc)) {
    await fs.copy(envSrc, envDest);
    console.log("  ✓ Copied .env.local");
  }

  // ── 3. Clean junk that Turbopack's NFT tracing pulled into standalone ──
  console.log("Cleaning unnecessary files from standalone build...");

  const junkPatterns = [
    // Old deployment artifacts
    'cpanel-deploy.zip', 'cpanel-deploy-clean.zip', 'deploy.zip',
    'student-platform-source.zip',
    // Old scripts & misc files
    'pack-cpanel.js', 'pack-deploy-clean.js', 'check-case.js',
    'seed-script.mjs', 'diff.txt', 'package-lock.json',
    // Directories that shouldn't be in the build
    'sutraverse-deployment', 'bee_temp_extract',
    'fwdengineeringphysicsnotesandppt',
    '_deploy',
  ];

  for (const item of junkPatterns) {
    const itemPath = path.join(standaloneDir, item);
    if (fs.existsSync(itemPath)) {
      await fs.remove(itemPath);
      console.log(`  ✕ Removed: ${item}`);
    }
  }

  // Remove any PDFs, ZIPs, and DOCX files at root level (old seed data)
  const rootFiles = await fs.readdir(standaloneDir);
  for (const file of rootFiles) {
    const ext = path.extname(file).toLowerCase();
    if (['.pdf', '.zip', '.docx', '.doc', '.pptx', '.ppt'].includes(ext)) {
      try {
        await fs.remove(path.join(standaloneDir, file));
        console.log(`  ✕ Removed: ${file}`);
      } catch (e) { /* already removed */ }
    }
  }

  // Remove any PYQ extraction directories (matched by pattern)
  for (const file of rootFiles) {
    const lower = file.toLowerCase();
    if (lower.includes('pyq') || lower.includes('pattern') || lower.includes('question')) {
      const fp = path.join(standaloneDir, file);
      try {
        const stat = await fs.stat(fp);
        if (stat.isDirectory()) {
          await fs.remove(fp);
          console.log(`  ✕ Removed dir: ${file}`);
        }
      } catch (e) {
        // file might have already been deleted in the previous pass
      }
    }
  }

  // ── 4. Check final size ──
  const finalSize = await getDirSize(standaloneDir);
  console.log(`\nStandalone size after cleanup: ${formatBytes(finalSize)}`);

  // ── 5. Create the deployment ZIP ──
  console.log("Zipping deployment package for cPanel...");

  // Remove old zip if exists
  if (fs.existsSync(deployZipPath)) {
    await fs.remove(deployZipPath);
  }

  const output = fs.createWriteStream(deployZipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', function() {
    console.log(`\n✅ Deployment package ready: ${deployZipPath}`);
    console.log(`   Package size: ${formatBytes(archive.pointer())}`);
    console.log('\n── Deployment Steps ──────────────────────────────────');
    console.log('1. Upload cpanel-deploy.zip to your cPanel file manager');
    console.log('2. Extract it (keeping existing user-uploads/ folder intact)');
    console.log('3. Set Node.js app entry point to: server.js');
    console.log('4. Restart the Node.js application');
    console.log('────────────────────────────────────────────────────\n');
  });

  archive.on('error', function(err) { throw err; });
  archive.pipe(output);

  // Place all standalone files into 'next-app' folder inside the zip
  archive.directory(standaloneDir, 'next-app');

  // Add root server.js that forwards to standalone
  const rootServerJs = `
// cPanel Cloudlinux entry point
// Forwards execution to the Next.js standalone application
const path = require('path');
process.chdir(path.join(__dirname, 'next-app'));
require('./next-app/server.js');
`;
  archive.append(rootServerJs, { name: 'server.js' });

  archive.finalize();
}

async function getDirSize(dirPath) {
  let size = 0;
  const files = await fs.readdir(dirPath, { withFileTypes: true });
  for (const file of files) {
    const fp = path.join(dirPath, file.name);
    if (file.isDirectory()) {
      size += await getDirSize(fp);
    } else {
      const stat = await fs.stat(fp);
      size += stat.size;
    }
  }
  return size;
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1073741824).toFixed(2) + ' GB';
}

packStandaloneCPanel().catch(console.error);
