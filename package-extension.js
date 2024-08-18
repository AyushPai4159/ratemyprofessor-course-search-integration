const fs = require('fs');
const path = require('path');
const https = require('https');
const archiver = require('archiver');

const sourceDir = 'src';
const jqueryVersion = '3.6.0';
const jqueryUrl = `https://code.jquery.com/jquery-${jqueryVersion}.min.js`;
const jqueryPath = path.join(sourceDir, 'jquery.min.js');

function downloadJquery() {
    return new Promise((resolve, reject) => {
        https.get(jqueryUrl, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download jQuery: ${response.statusCode}`));
                return;
            }

            const file = fs.createWriteStream(jqueryPath);
            response.pipe(file);

            file.on('finish', () => {
                file.close();
                console.log(`jQuery ${jqueryVersion} downloaded successfully`);
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(jqueryPath, () => {});
            reject(err);
        });
    });
}

function getExistingFiles() {
    return fs.readdirSync(sourceDir).filter(file =>
        fs.statSync(path.join(sourceDir, file)).isFile()
    );
}

function createExtensionZip(outputFilename, existingFiles) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputFilename);
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        output.on('close', () => {
            console.log(`Extension packaged: ${outputFilename}`);
            console.log(`Total bytes: ${archive.pointer()}`);
            resolve();
        });

        archive.on('error', (err) => {
            reject(err);
        });

        archive.pipe(output);

        fs.readdirSync(sourceDir).forEach(file => {
            const filePath = path.join(sourceDir, file);
            if (fs.statSync(filePath).isFile() &&
                (existingFiles.includes(file) || path.extname(file).toLowerCase() === '.png')) {
                archive.file(filePath, { name: file });
                console.log(`Added to package: ${file}`);
            }
        });

        archive.finalize();
    });
}

async function main() {
    try {
        const manifestPath = path.join(sourceDir, 'manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const extensionName = manifest.name.replace(/\s+/g, '_');
        const extensionVersion = manifest.version;

        const existingFiles = getExistingFiles();

        if (!fs.existsSync(jqueryPath)) {
            await downloadJquery();
        } else {
            console.log(`Using existing jQuery file: ${jqueryPath}`);
        }

        const outputFilename = `${extensionName}-${extensionVersion}.zip`;
        await createExtensionZip(outputFilename, existingFiles);

        console.log('Packaging complete!');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

main();