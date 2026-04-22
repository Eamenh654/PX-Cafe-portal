const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let originalContent = content;

    // 1. fetch('http://localhost:3001/api/...', ...) -> fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/...`, ...)
    // 2. io('http://localhost:3001') -> io(import.meta.env.VITE_API_URL || 'http://localhost:3001')
    
    // Replace io
    content = content.replace(/io\('http:\/\/localhost:3001'\)/g, "io(import.meta.env.VITE_API_URL || 'http://localhost:3001')");

    // Replace fetch with literal
    // Looking for: 'http://localhost:3001/api/products' -> `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/products`
    content = content.replace(/'http:\/\/localhost:3001\/api\/([^']+)'/g, "\`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/$1\`");

    // Looking for: fetch(`http://localhost:3001/api...`)
    content = content.replace(/`http:\/\/localhost:3001\/api/g, "`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api");

    // Looking for AuthPage/AuthPortals `http://localhost:3001${endpoint}`
    content = content.replace(/`http:\/\/localhost:3001\$\{endpoint\}`/g, "\`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${endpoint}\`");

    if (content !== originalContent) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

const pagesDir = path.join(__dirname, 'src', 'pages');
const files = fs.readdirSync(pagesDir).filter(f => f.endsWith('.jsx'));
for (const file of files) {
    replaceInFile(path.join(pagesDir, file));
}

// Server URL update
const serverFile = path.join(__dirname, '..', 'server', 'server.js');
let serverContent = fs.readFileSync(serverFile, 'utf8');
// Fix hardcoded upload URL
serverContent = serverContent.replace(
    /const imageUrl = `http:\/\/localhost:3001\/uploads\/\$\{req.file.filename\}`;/g,
    "const baseUrl = process.env.RENDER_EXTERNAL_URL || process.env.API_URL || 'http://localhost:3001';\n    const imageUrl = `${baseUrl}/uploads/${req.file.filename}`;"
);
fs.writeFileSync(serverFile, serverContent, 'utf8');
console.log('Updated server.js');

