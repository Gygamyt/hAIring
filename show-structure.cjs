#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const EXCLUDED_FOLDERS = new Set([
    'node_modules',
    '.git',
    '.idea',
    '.vscode',
    '.turbo',
    'dist',
    'build',
    'coverage',
    '.nyc_output',
    '.husky'
]);

function generateTree(dir, prefix = '', isLast = true, depth = 0, maxDepth = 10) {
    if (depth > maxDepth) {
        return '';
    }

    let entries;
    try {
        entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (error) {
        return '';
    }

    const visibleEntries = entries.filter(entry =>
        !EXCLUDED_FOLDERS.has(entry.name)
    );

    visibleEntries.sort((a, b) => {
        if (a.isDirectory() && !b.isDirectory()) {
            return -1;
        }
        if (!a.isDirectory() && b.isDirectory()) {
            return 1;
        }
        return a.name.localeCompare(b.name);
    });

    let result = '';

    visibleEntries.forEach((entry, index) => {
        const isLastEntry = index === visibleEntries.length - 1;
        const currentPrefix = prefix + (isLast ? '    ' : '│   ');
        const connector = isLastEntry ? '└───' : '├───';

        result += `${prefix}${connector}${entry.name}\n`;

        if (entry.isDirectory()) {
            try {
                const fullPath = path.join(dir, entry.name);
                result += generateTree(fullPath, currentPrefix, isLastEntry, depth + 1, maxDepth);
            } catch (error) {
            }
        }
    });

    return result;
}

function countExcludedFolders(dir, depth = 0, maxDepth = 10) {
    if (depth > maxDepth) {
        return 0;
    }

    let count = 0;
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            if (entry.isDirectory()) {
                const fullPath = path.join(dir, entry.name);

                if (EXCLUDED_FOLDERS.has(entry.name)) {
                    count++;
                } else {
                    count += countExcludedFolders(fullPath, depth + 1, maxDepth);
                }
            }
        }
    } catch (error) {
    }

    return count;
}

console.log('🔍 Project structure (files and folders, excluding system directories):\n');

const currentDir = process.cwd();
const projectName = path.basename(currentDir);

console.log(`${projectName}`);
console.log(generateTree(currentDir));

const excludedCount = countExcludedFolders(currentDir);
if (excludedCount > 0) {
    console.log(`\n📊 Hidden ${excludedCount} system directories (${Array.from(EXCLUDED_FOLDERS).join(', ')})`);
} else {
    console.log('\n✅ No system directories found!');
}
