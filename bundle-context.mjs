// bundle-context.mjs
import fs from 'fs';
import path from 'path';

const IGNORE_DIRS = ['.next', 'node_modules', '.git', 'public'];
const IGNORE_FILES = ['package-lock.json', 'bundle-context.mjs', 'project-context.txt'];
const ALLOWED_EXTS = ['.ts', '.tsx', '.js', '.mjs', '.json', '.sql', '.md', '.css'];

function generateTree(dir, prefix = '') {
    let tree = '';
    const files = fs.readdirSync(dir);
    files.forEach((file, index) => {
        if (IGNORE_DIRS.includes(file) || IGNORE_FILES.includes(file)) return;
        const fullPath = path.join(dir, file);
        const isLast = index === files.length - 1;
        tree += `${prefix}${isLast ? '└── ' : '├── '}${file}\n`;
        if (fs.statSync(fullPath).isDirectory()) {
            tree += generateTree(fullPath, prefix + (isLast ? '    ' : '│   '));
        }
    });
    return tree;
}

function getFilesContent(dir) {
    let content = '';
    const files = fs.readdirSync(dir);
    for (const file of files) {
        if (IGNORE_DIRS.includes(file) || IGNORE_FILES.includes(file)) continue;
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            content += getFilesContent(fullPath);
        } else if (ALLOWED_EXTS.includes(path.extname(file))) {
            content += `\n\n================================================\n`;
            content += `FILE: ${fullPath.replace(/\\/g, '/')}\n`;
            content += `================================================\n`;
            content += fs.readFileSync(fullPath, 'utf8');
        }
    }
    return content;
}
//
const outputFile = 'project-context.txt';
console.log('📦 Bundling project context...');
let output = '=== NEPEAN INVOICE ENGINE : FILE TREE ===\n\n';
output += 'nepean-invoice-engine/\n' + generateTree('./');
output += '\n\n=== SOURCE CODE ===\n';
output += getFilesContent('./');

fs.writeFileSync(outputFile, output);
console.log(`✅ Done! You can now upload/paste ${outputFile} to your AI.`);