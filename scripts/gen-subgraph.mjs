import fs from 'fs';
import path from 'path';

// --- Utilities ---

/**
 * Converts 'technical-assessment' to 'TechnicalAssessment'
 */
const kebabToPascal = (s) => {
    const camel = s.replace(/-(\w)/g, (_, c) => c.toUpperCase());
    return camel.charAt(0).toUpperCase() + camel.slice(1);
};

// --- Main Logic ---

const main = () => {
    const relativePath = process.argv[2];
    if (!relativePath) {
        console.error(
            '❌ Error: Subgraph path and name not provided.',
        );
        console.log(
            '💡 Example: pnpm gen:subgraph post-interview/components/technical-assessment',
        );
        process.exit(1);
    }

    // 1. Define paths and names
    const basePath = path.resolve('packages', 'ai-pipelines', 'src');
    const targetDir = path.join(basePath, relativePath);
    const nameKebab = path.basename(relativePath); // 'technical-assessment'
    const namePascal = kebabToPascal(nameKebab); // 'TechnicalAssessment'
    const nameLower = namePascal.toLowerCase(); // 'technicalassessment'

    console.log(`🚀 Generating subgraph structure '${namePascal}' at ${targetDir}`);

    // 2. Check if directory already exists
    if (fs.existsSync(targetDir)) {
        console.error(`❌ Error: Directory ${targetDir} already exists.`);
        process.exit(1);
    }

    // 3. Create the directory
    fs.mkdirSync(targetDir, { recursive: true });

    // 4. Define the file list
    const moduleFiles = [
        `${nameKebab}.types.ts`,
        `${nameKebab}.state.ts`,
        `${nameKebab}.prompts.ts`,
        `${nameKebab}.nodes.ts`,
        `${nameKebab}.graph.ts`,
    ];

    const allFiles = ['index.ts', ...moduleFiles];

    // 5. Create files (with content for index.ts)
    allFiles.forEach((fileName) => {
        const filePath = path.join(targetDir, fileName);
        let fileContent = ''; // Default empty content

        // Populate index.ts with all exports
        if (fileName === 'index.ts') {
            fileContent = moduleFiles
                .map(modFile => `export * from './${modFile.replace('.ts', '')}';`)
                .join('\n') + '\n';
        }

        fs.writeFileSync(filePath, fileContent);
        console.log(`✅ Created file: ${filePath}`);
    });

    console.log(
        `\n🎉 Done! Subgraph structure '${namePascal}' created successfully.`,
    );
    console.log(
        `💡 Remember to export it from the parent 'index.ts' file.`,
    );
};

main();
