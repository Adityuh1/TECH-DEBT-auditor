const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEBT_REGEX = /\/\/\s*(TODO|FIXME|HACK):(.*)/g;
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'build'];

function getAllFiles(dirPath, arrayOfFiles = []) {
    const files = fs.readdirSync(dirPath);
    files.forEach((file) => {
        const absolutePath = path.join(dirPath, file);
        if (fs.statSync(absolutePath).isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) getAllFiles(absolutePath, arrayOfFiles);
        } else if (/\.(js|ts|jsx|tsx)$/.test(file)) {
            arrayOfFiles.push(absolutePath);
        }
    });
    return arrayOfFiles;
}

function runAudit(directory) {
    const files = getAllFiles(directory);
    let allDebts = [];

    files.forEach(file => {
        const content = fs.readFileSync(file, 'utf8');
        let match;
        
        while ((match = DEBT_REGEX.exec(content)) !== null) {
            const relativePath = path.relative(directory, file);
            const lineNumber = content.substring(0, match.index).split('\n').length;
            
            // --- NEW: BLAME INTEGRATION ---
            let author = "Unknown";
            let commitDate = new Date().toISOString();
            
            try {
                // Run git blame on the specific line and get the author name and author date
                const blameOutput = execSync(`git blame -L ${lineNumber},${lineNumber} --porcelain ${relativePath}`, { encoding: 'utf8' });
                
                // Parse porcelain output to extract author name and timestamp
                const authorMatch = blameOutput.match(/^author (.+)$/m);
                const dateMatch = blameOutput.match(/^author-time (.+)$/m);
                
                if (authorMatch) author = authorMatch[1];
                if (dateMatch) commitDate = new Date(parseInt(dateMatch[1]) * 1000).toISOString();
            } catch (error) {
                // If it's a new file not committed yet, it will fallback to defaults
                console.log(`⚠️ Git blame skipped for uncommitted line in ${relativePath}`);
            }
            // ------------------------------

            allDebts.push({
                type: match[1],
                comment: match[2].trim(),
                file: relativePath,
                line: lineNumber,
                author: author,
                createdAt: commitDate
            });
        }
    });

    return allDebts;
}