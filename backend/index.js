const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');


const app = express();
const PORT = 5002;

app.use(cors());
app.use(express.json());

const SEARCH_DIRS = [
    { key: 'invoices', path: path.join(__dirname, '../invoices') },
    { key: 'drive', path: 'P:\\My Drive\\Documents' }
];

// Mount static routes for each directory
SEARCH_DIRS.forEach(dir => {
    if (fs.existsSync(dir.path)) {
        app.use(`/files/${dir.key}`, (req, res, next) => {
            console.log(`Static file request [${dir.key}]: ${req.url}`);
            next();
        }, express.static(dir.path));
        console.log(`Mounted ${dir.key} at /files/${dir.key}`);
    } else {
        console.log(`Warning: Directory ${dir.path} not found. Skipping mount.`);
    }
});

// Helper for file logging
const log = (msg) => {
    console.log(msg);
    try {
        fs.appendFileSync(path.join(__dirname, 'debug.log'), msg + '\n');
    } catch (e) { }
};

// Helper function to recursively get all PDF files
const getAllFiles = (dirPath, arrayOfFiles) => {
    if (!fs.existsSync(dirPath)) return arrayOfFiles || [];

    const files = fs.readdirSync(dirPath);

    arrayOfFiles = arrayOfFiles || [];

    files.forEach(function (file) {
        const fullPath = path.join(dirPath, file);
        try {
            if (fs.statSync(fullPath).isDirectory()) {
                arrayOfFiles = getAllFiles(fullPath, arrayOfFiles);
            } else {
                if (file.toLowerCase().endsWith('.pdf')) {
                    arrayOfFiles.push(fullPath);
                }
            }
        } catch (err) {
            // Ignore access errors
        }
    });

    return arrayOfFiles;
}

app.post('/api/search', async (req, res) => {
    const { query } = req.body;

    log(`Received search request for: "${query}"`);

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        const results = [];

        for (const dir of SEARCH_DIRS) {
            if (!fs.existsSync(dir.path)) {
                log(`Skipping search in ${dir.path} (not found)`);
                continue;
            }

            log(`Searching in ${dir.key} (${dir.path})...`);
            const allFiles = getAllFiles(dir.path);
            log(`Found ${allFiles.length} PDF files in ${dir.key}.`);

            for (const filePath of allFiles) {
                let fileText = '';

                try {
                    // 1. Try standard PDF parsing first
                    const dataBuffer = fs.readFileSync(filePath);
                    const data = await pdf(dataBuffer);
                    fileText = data.text;



                    const lowerFileText = fileText.toLowerCase();
                    const lowerQuery = query.toLowerCase();
                    const matchIndex = lowerFileText.indexOf(lowerQuery);

                    if (matchIndex !== -1) {
                        const relativePath = path.relative(dir.path, filePath).replace(/\\/g, '/');
                        const stats = fs.statSync(filePath);


                        // Generate Peep and track all matching pages
                        let peep = null;
                        let matchPages = []; // Track all pages with matches
                        try {
                            const { createCanvas, Canvas, Image } = require('canvas');
                            global.Canvas = global.Canvas || Canvas;
                            global.Image = global.Image || Image;
                            const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');

                            class NodeCanvasFactory {
                                create(width, height) {
                                    if (width <= 0 || height <= 0) throw new Error('Invalid canvas size');
                                    const canvas = createCanvas(width, height);
                                    const context = canvas.getContext('2d');
                                    return { canvas, context };
                                }
                                reset(ctx, width, height) {
                                    if (!ctx.canvas) throw new Error('Canvas is not specified');
                                    if (width <= 0 || height <= 0) throw new Error('Invalid canvas size');
                                    ctx.canvas.width = width;
                                    ctx.canvas.height = height;
                                }
                                destroy(ctx) {
                                    if (!ctx.canvas) throw new Error('Canvas is not specified');
                                    ctx.canvas.width = 0;
                                    ctx.canvas.height = 0;
                                    ctx.canvas = null;
                                    ctx.context = null;
                                }
                            }
                            const canvasFactory = new NodeCanvasFactory();

                            log(`[PEEP] Starting peep generation for ${path.basename(filePath)}`);

                            const uint8Array = new Uint8Array(fs.readFileSync(filePath));
                            const loadingTask = pdfjsLib.getDocument(uint8Array);
                            const pdfDocument = await loadingTask.promise;

                            log(`[PEEP] PDF loaded. Pages: ${pdfDocument.numPages}`);

                            let peepGenerated = false;
                            for (let i = 1; i <= pdfDocument.numPages; i++) {
                                const page = await pdfDocument.getPage(i);
                                const textContent = await page.getTextContent();
                                const viewport = page.getViewport({ scale: 1.5 });

                                let matchRecs = [];

                                for (const item of textContent.items) {
                                    // log(`[PEEP] Checking item: \"${item.str}\"`);
                                    if (item.str.toLowerCase().includes(query.toLowerCase())) {
                                        log(`[PEEP] Match found in item: \"${item.str}\"`);
                                        const tx = item.transform;
                                        const x = tx[4];
                                        const y = tx[5];
                                        const w = item.width;
                                        const h = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]);

                                        const rect = viewport.convertToViewportRectangle([x, y, x + w, y + h]);
                                        // rect is [x1, y1, x2, y2]

                                        const minX = Math.min(rect[0], rect[2]);
                                        const maxX = Math.max(rect[0], rect[2]);
                                        const minY = Math.min(rect[1], rect[3]);
                                        const maxY = Math.max(rect[1], rect[3]);

                                        matchRecs.push({ x: minX, y: minY, w: maxX - minX, h: maxY - minY });
                                    }
                                }

                                if (matchRecs.length > 0) {
                                    matchPages.push(i); // Add this page to the list

                                    // Only generate peep for the first match
                                    if (!peepGenerated) {
                                        // Render Page to Canvas
                                        const canvas = createCanvas(viewport.width, viewport.height);
                                        const context = canvas.getContext('2d');

                                        await page.render({
                                            canvasContext: context,
                                            viewport: viewport,
                                            canvasFactory: canvasFactory
                                        }).promise;

                                        // Draw Highlights
                                        context.fillStyle = 'rgba(255, 215, 0, 0.4)'; // Gold highlight
                                        matchRecs.forEach(r => context.fillRect(r.x, r.y, r.w, r.h));

                                        // Crop around the first match
                                        const mainMatch = matchRecs[0];
                                        const pad = 100;
                                        const cropX = Math.max(0, mainMatch.x - pad);
                                        const cropY = Math.max(0, mainMatch.y - pad / 2);
                                        const cropW = Math.min(viewport.width - cropX, mainMatch.w + pad * 2);
                                        const cropH = Math.min(viewport.height - cropY, mainMatch.h + pad);

                                        const cropCanvas = createCanvas(cropW, cropH);
                                        const cropCtx = cropCanvas.getContext('2d');
                                        cropCtx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

                                        peep = cropCanvas.toDataURL('image/png');
                                        peepGenerated = true;
                                        log(`[PEEP] Generated peep for ${path.basename(filePath)}`);
                                    }
                                }
                            }
                        } catch (e) {
                            log(`[PEEP ERROR] ${e.message}`);
                        }

                        // Extract snippet (fallback)
                        const start = Math.max(0, matchIndex - 50);
                        const end = Math.min(fileText.length, matchIndex + query.length + 50);
                        let snippet = fileText.substring(start, end).replace(/\s+/g, ' ').trim();
                        if (start > 0) snippet = '...' + snippet;
                        if (end < fileText.length) snippet = snippet + '...';

                        // Prefix with directory key so client knows which static route to use
                        results.push({
                            path: `${dir.key}/${relativePath}`,
                            date: stats.mtime.toISOString(),
                            snippet: snippet,
                            peep: peep,
                            matchPage: matchPages[0] || 1,
                            matchPages: matchPages,
                            pageCount: matchPages.length
                        });
                        log(`[MATCH] Found "${query}" in ${dir.key}/${relativePath}`);
                    }
                } catch (error) {
                    log(`Error processing ${filePath}: ${error.message}`);
                }
            }
        }

        log(`Found ${results.length} total matches.`);

        // Sort by date descending (newest first)
        results.sort((a, b) => new Date(b.date) - new Date(a.date));

        res.json({ results });
    } catch (error) {
        log(`Search error: ${error}`);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.listen(PORT, () => {
    log(`Server running on http://localhost:${PORT}`);
});
