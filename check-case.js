const fs = require('fs');
const path = require('path');

function checkFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    const importRegex = /import\s+.*?\s+from\s+['"]([^'"]+)['"]/g;
    let match;
    while ((match = importRegex.exec(content)) !== null) {
        let importPath = match[1];
        if (importPath.startsWith('@/')) {
            importPath = importPath.replace('@/', './src/');
        } else if (importPath.startsWith('.')) {
            importPath = path.join(path.dirname(filePath), importPath);
        } else {
            continue; // Node module
        }
        
        let ext = '';
        if (!path.extname(importPath)) ext = '.js';

        let fullPath = importPath + ext;
        if (!fs.existsSync(fullPath)) {
             fullPath = importPath + '/index.js';
        }
        if (!fs.existsSync(fullPath)) {
            // Check without extension if it's CSS
            if (fs.existsSync(importPath + '.css')) fullPath = importPath + '.css';
            else if (fs.existsSync(importPath + '.module.css')) fullPath = importPath + '.module.css';
        }

        if (fs.existsSync(fullPath)) {
            // Check case sensitivity
            const dir = path.dirname(fullPath);
            const base = path.basename(fullPath);
            const files = fs.readdirSync(dir);
            if (!files.includes(base)) {
                console.log(`CASE SENSITIVITY ERROR in ${filePath}:\n  Imported: ${importPath}\n  Expected filename: ${base}\n`);
            }
        }
    }
}

function walk(dir) {
    const files = fs.readdirSync(dir);
    for (const f of files) {
        const p = path.join(dir, f);
        if (fs.statSync(p).isDirectory()) walk(p);
        else if (p.endsWith('.js') || p.endsWith('.jsx')) checkFile(p);
    }
}

walk('./src');
console.log('Case check complete.');
