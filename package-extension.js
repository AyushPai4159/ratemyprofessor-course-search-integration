const fs = require('fs');
const path = require('path');
const https = require('https');
const archiver = require('archiver');
const uglifyJS = require('uglify-js');
const cleanCSS = require('clean-css');
const htmlMinifier = require('html-minifier');

const sourceDir = 'src';
const tempDir = 'temp_minified';
const jqueryVersion = '3.6.0';
const jqueryUrl = `https://code.jquery.com/jquery-${jqueryVersion}.min.js`;
const jqueryPath = path.join(sourceDir, 'jquery.min.js');


const fileRegex = /\.(js|css|json|html|png)$/i;

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

function getFilesRecursively(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            getFilesRecursively(filePath, fileList);
        } else if (fileRegex.test(file)) {
            fileList.push(filePath);
        }
    });

    return fileList;
}

function copyFilesToTempDir() {
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });

    const files = getFilesRecursively(sourceDir);
    files.forEach(file => {
        const relativePath = path.relative(sourceDir, file);
        const destPath = path.join(tempDir, relativePath);
        const destDir = path.dirname(destPath);

        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        fs.copyFileSync(file, destPath);
    });
}

function combineScripts(scripts, outputFile) {
    const combined = scripts.map(script => fs.readFileSync(path.join(tempDir, script), 'utf8')).join('\n');
    fs.writeFileSync(path.join(tempDir, outputFile), combined);
    scripts.forEach(script => fs.unlinkSync(path.join(tempDir, script)));
    return outputFile;
}

function minifyFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const ext = path.extname(filePath).toLowerCase();

    switch (ext) {
        case '.js':
            const result = uglifyJS.minify(content, {
                mangle: {
                    toplevel: true,
                    reserved: ['$', 'jQuery'] // Prevent mangling of jQuery identifiers
                },
                compress: {
                    dead_code: true,
                    drop_debugger: true,
                    conditionals: true,
                    evaluate: true,
                    booleans: true,
                    loops: true,
                    unused: true,
                    hoist_funs: true,
                    keep_fargs: false,
                    hoist_vars: true,
                    if_return: true,
                    join_vars: true
                }
            });
            if (result.error) {
                console.error(`Error minifying ${filePath}: ${result.error}`);
                return content; // Return original content if minification fails
            }
            return result.code;
        case '.css':
            return new cleanCSS().minify(content).styles;
        case '.html':
            return htmlMinifier.minify(content, {
                collapseWhitespace: true,
                removeComments: true,
                minifyJS: true,
                minifyCSS: true
            });
        case '.json':
            return JSON.stringify(JSON.parse(content));
        default:
            return null; // For .png and any other unhandled file types
    }
}

function minifyFiles() {
    const files = getFilesRecursively(tempDir);
    files.forEach(file => {
        const minified = minifyFile(file);
        if (minified !== null) {
            fs.writeFileSync(file, minified);
        }
    });
}

function createTempMinifiedFiles(files) {
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }

    return files.map(filePath => {
        const relativePath = path.relative(sourceDir, filePath);
        const tempFilePath = path.join(tempDir, relativePath);
        const tempDirPath = path.dirname(tempFilePath);

        if (!fs.existsSync(tempDirPath)) {
            fs.mkdirSync(tempDirPath, { recursive: true });
        }

        const minifiedContent = minifyFile(filePath);

        if (minifiedContent !== null) {
            fs.writeFileSync(tempFilePath, minifiedContent);
            return tempFilePath;
        } else {
            // If the file wasn't minified (e.g., .png), use the original file
            return filePath;
        }
    });
}

function cleanupTempFiles() {
    if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true });
    }
}


async function main() {
    try {
        console.log('Copying files to temp directory...');
        copyFilesToTempDir();

        const manifestPath = path.join(tempDir, 'manifest.json');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        const extensionName = manifest.name.replace(/\s+/g, '_');
        const extensionVersion = manifest.version;

        console.log('Combining scripts...');
        // Combine content scripts
        if (manifest.content_scripts) {
            const contentScripts = manifest.content_scripts.flatMap(cs => cs.js || []);
            const combinedContentScript = combineScripts(contentScripts, 'c.js');
            manifest.content_scripts.forEach(cs => {
                cs.js = [combinedContentScript];
            });
        }

        // Combine background scripts
        if (manifest.background && manifest.background.service_worker) {
            const backgroundScripts = [manifest.background.service_worker];
            const combinedBackgroundScript = combineScripts(backgroundScripts, 'b.js');
            manifest.background.service_worker = combinedBackgroundScript;
        }

        // Write updated manifest
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

        console.log('Minifying files...');
        minifyFiles();

        if (!fs.existsSync(jqueryPath)) {
            console.log('Downloading jQuery...');
            await downloadJquery();
        } else {
            console.log(`Using existing jQuery file: ${jqueryPath}`);
        }

        console.log('Creating extension zip...');
        const outputFilename = `${extensionName}-${extensionVersion}.zip`;
        await createExtensionZip(outputFilename, getFilesRecursively(tempDir));

        console.log('Cleaning up temporary files...');
        fs.rmSync(tempDir, { recursive: true });

        console.log('Packaging complete!');
    } catch (error) {
        console.error('Error:', error.message);
    }
}

function createExtensionZip(outputFilename, files) {
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

        files.forEach(filePath => {
            const relativePath = path.relative(tempDir, filePath);
            archive.file(filePath, { name: relativePath });
            console.log(`Added to package: ${relativePath}`);
        });

        archive.finalize();
    });
}

main();