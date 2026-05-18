// Root file for cPanel Cloudlinux
// Forwards execution to the Next.js standalone application
const path = require('path');
process.chdir(path.join(__dirname, 'next-app'));
require('./next-app/server.js');
