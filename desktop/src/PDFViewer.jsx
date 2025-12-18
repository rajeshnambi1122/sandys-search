import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Loader2, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, X } from 'lucide-react';

import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.js?url';

// Set worker source
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

import 'pdfjs-dist/web/pdf_viewer.css';

const PDFViewer = ({ fileUrl, query, onClose }) => {
    const canvasRef = useRef(null);
    const textLayerRef = useRef(null);
    const [pdfDoc, setPdfDoc] = useState(null);
    const [pageNum, setPageNum] = useState(1);
    const [scale, setScale] = useState(1.0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadPdf = async () => {
            try {
                setLoading(true);
                setError(null);
                const loadingTask = pdfjsLib.getDocument(fileUrl);
                const doc = await loadingTask.promise;
                setPdfDoc(doc);
                setLoading(false);
            } catch (err) {
                console.error('Error loading PDF:', err);
                setError('Failed to load PDF file.');
                setLoading(false);
            }
        };

        if (fileUrl) {
            loadPdf();
        }
    }, [fileUrl]);

    useEffect(() => {
        const renderPage = async () => {
            if (!pdfDoc) return;

            try {
                const page = await pdfDoc.getPage(pageNum);
                const viewport = page.getViewport({ scale });
                const canvas = canvasRef.current;
                const context = canvas.getContext('2d');

                canvas.height = viewport.height;
                canvas.width = viewport.width;

                const renderContext = {
                    canvasContext: context,
                    viewport: viewport,
                };

                await page.render(renderContext).promise;

                // Text Layer for selection
                const textLayerDiv = textLayerRef.current;
                if (textLayerDiv) {
                    textLayerDiv.innerHTML = '';
                    textLayerDiv.style.height = viewport.height + 'px';
                    textLayerDiv.style.width = viewport.width + 'px';
                    textLayerDiv.style.setProperty('--scale-factor', scale);

                    const textContent = await page.getTextContent();
                    pdfjsLib.renderTextLayer({
                        textContentSource: textContent,
                        container: textLayerDiv,
                        viewport: viewport,
                        textDivs: []
                    });
                }

                // Highlighting Logic
                if (query) {
                    const textContent = await page.getTextContent(); // Cached internally by pdfjs usually
                    const queryLower = query.toLowerCase();

                    context.fillStyle = 'rgba(255, 255, 0, 0.4)'; // Semi-transparent yellow

                    textContent.items.forEach(item => {
                        if (item.str.toLowerCase().includes(queryLower)) {
                            const tx = item.transform;
                            const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
                            const width = item.width;
                            const x = tx[4];
                            const y = tx[5];

                            const rect = viewport.convertToViewportRectangle([
                                x,
                                y,
                                x + width,
                                y + fontHeight
                            ]);

                            const minX = Math.min(rect[0], rect[2]);
                            const maxX = Math.max(rect[0], rect[2]);
                            const minY = Math.min(rect[1], rect[3]);
                            const maxY = Math.max(rect[1], rect[3]);

                            context.fillRect(minX, minY, maxX - minX, maxY - minY);
                        }
                    });
                }

            } catch (err) {
                console.error('Error rendering page:', err);
            }
        };

        renderPage();
    }, [pdfDoc, pageNum, scale, query]);

    const changePage = (offset) => {
        setPageNum((prev) => Math.min(Math.max(1, prev + offset), pdfDoc?.numPages || 1));
    };

    if (!fileUrl) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 bg-slate-50 shrink-0">
                    <div className="flex items-center gap-4 min-w-0">
                        <h3 className="font-semibold text-slate-900 truncate text-sm">
                            {fileUrl.split('/').pop()}
                        </h3>
                        {pdfDoc && (
                            <span className="text-xs text-slate-500 shrink-0">
                                Page {pageNum} of {pdfDoc.numPages}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center bg-white rounded-lg border border-slate-200 p-0.5 mr-2">
                            <button
                                onClick={() => setScale(s => Math.max(0.5, s - 0.25))}
                                className="p-1 hover:bg-slate-100 rounded-md text-slate-600"
                                title="Zoom Out"
                            >
                                <ZoomOut className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-1.5 text-xs font-medium text-slate-600 w-10 text-center">
                                {Math.round(scale * 100)}%
                            </span>
                            <button
                                onClick={() => setScale(s => Math.min(3, s + 0.25))}
                                className="p-1 hover:bg-slate-100 rounded-md text-slate-600"
                                title="Zoom In"
                            >
                                <ZoomIn className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        <button
                            onClick={onClose}
                            className="p-1.5 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto bg-slate-100 flex p-4 relative justify-center">
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10">
                            <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                        </div>
                    )}

                    {error && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="text-red-600 bg-red-50 px-4 py-2 rounded-lg border border-red-100 pointer-events-auto">
                                {error}
                            </div>
                        </div>
                    )}

                    <div className="relative shadow-lg bg-white">
                        <canvas
                            ref={canvasRef}
                            className="block"
                        />
                        <div ref={textLayerRef} className="textLayer" />
                    </div>
                </div>

                {/* Footer Controls */}
                {pdfDoc && pdfDoc.numPages > 1 && (
                    <div className="p-4 border-t border-slate-200 bg-white flex justify-center gap-4">
                        <button
                            onClick={() => changePage(-1)}
                            disabled={pageNum <= 1}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-medium transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Previous
                        </button>
                        <button
                            onClick={() => changePage(1)}
                            disabled={pageNum >= pdfDoc.numPages}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 font-medium transition-colors"
                        >
                            Next
                            <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PDFViewer;
