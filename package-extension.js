const fs = require('fs-extra');
const archiver = require('archiver');
const path = require('path');

const sourceDir = './src';
const outputDir = './packages';

const files = [
    'bg_page.js',
    'data_processing.js',
    '*.png',
    'jquery.min.js',
    'manifest.json',
    'scripts.js',
    'styles.css'
];

async function createPackage(browserName, manifestModifier) {
    const outputPath = path.join(outputDir, `${browserName}_extension.zip`);
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
        console.log(`${browserName} package created: ${outputPath}`);
    });

    archive.on('error', (err) => {
        throw err;
    });

    archive.pipe(output);

    for (const file of files) {
        if (file.includes('*')) {
            archive.glob(file, { cwd: sourceDir });
        } else if (file === 'manifest.json') {
            const manifestContent = await fs.readJson(path.join(sourceDir, file));
            const modifiedManifest = manifestModifier(manifestContent);
            archive.append(JSON.stringify(modifiedManifest, null, 2), { name: file });
        } else {
            archive.file(path.join(sourceDir, file), { name: file });
        }
    }

    await archive.finalize();
}

async function packageExtensions() {
    await fs.ensureDir(outputDir);

    // Chrome package (no modifications needed)
    await createPackage('chrome', (manifest) => manifest);

    // Firefox package
    await createPackage('firefox', (manifest) => {
        const firefoxManifest = { ...manifest };
        // Add any Firefox-specific modifications here
        return firefoxManifest;
    });

    // Safari package
    await createPackage('safari', (manifest) => {
        const safariManifest = { ...manifest };
        // Add any Safari-specific modifications here
        return safariManifest;
    });
}

packageExtensions().catch(console.error);
