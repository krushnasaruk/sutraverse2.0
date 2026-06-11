const fs = require('fs-extra');
const archiver = require('archiver');
const path = require('path');

async function packClean() {
  const rootDir = path.join(__dirname, '..', '..');
  const standaloneDir = path.join(rootDir, '.next', 'standalone');
  const staticDir = path.join(rootDir, '.next', 'static');
  const deployZipPath = path.join(rootDir, 'cpanel-deploy-clean.zip');

  if (!fs.existsSync(standaloneDir)) {
    console.error("Run 'npm run build' first.");
    return;
  }

  console.log("Building clean cPanel deploy package...");

  // Create a temporary clean directory
  const tempDir = path.join(rootDir, '_deploy_temp');
  if (fs.existsSync(tempDir)) await fs.remove(tempDir);
  await fs.mkdirp(path.join(tempDir, 'next-app'));

  // Copy only essential standalone files
  const essentials = ['.next', 'node_modules', 'server.js', 'package.json'];
  for (const item of essentials) {
    const src = path.join(standaloneDir, item);
    if (fs.existsSync(src)) {
      await fs.copy(src, path.join(tempDir, 'next-app', item));
      console.log(`  ✓ Copied ${item}`);
    }
  }

  // Copy .next/static into next-app/.next/static
  if (fs.existsSync(staticDir)) {
    await fs.copy(staticDir, path.join(tempDir, 'next-app', '.next', 'static'));
    console.log('  ✓ Copied .next/static');
  }

  // Copy the entire public directory (including uploads and pyqs)
  const publicDir = path.join(rootDir, 'public');
  if (fs.existsSync(publicDir)) {
    await fs.copy(publicDir, path.join(tempDir, 'next-app', 'public'));
    console.log('  ✓ Copied entire public directory (including materials and uploads)');
  }

  // Remove old zip
  if (fs.existsSync(deployZipPath)) await fs.remove(deployZipPath);

  // Zip
  console.log("Zipping...");
  const output = fs.createWriteStream(deployZipPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  output.on('close', async () => {
    const mb = (archive.pointer() / 1024 / 1024).toFixed(1);
    console.log(`\n✅ Deploy zip ready: cpanel-deploy-clean.zip (${mb} MB)`);
    // Cleanup temp
    await fs.remove(tempDir);
    console.log('  Cleaned up temp files.');
  });

  archive.on('error', (err) => { throw err; });
  archive.pipe(output);

  archive.directory(path.join(tempDir, 'next-app'), 'next-app');

  // Root server.js wrapper
  const rootServer = `
const path = require('path');
process.chdir(path.join(__dirname, 'next-app'));
require('./next-app/server.js');
`;
  archive.append(rootServer, { name: 'server.js' });

  archive.finalize();
}

packClean().catch(console.error);
