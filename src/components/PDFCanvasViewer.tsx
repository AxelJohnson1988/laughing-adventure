import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download, 
  Printer, 
  FileText,
  Loader2,
  Eye,
  AlertCircle
} from 'lucide-react';

// Setup pdf.js worker
try {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs`;
} catch (e) {
  console.warn('pdf.js worker initialization:', e);
}

interface PDFCanvasViewerProps {
  pdfBytes: Uint8Array | null;
  fileName: string;
  onPageChange?: (page: number, total: number) => void;
}

export const PDFCanvasViewer: React.FC<PDFCanvasViewerProps> = ({
  pdfBytes,
  fileName,
  onPageChange,
}) => {
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [numPages, setNumPages] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.25);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [useNativeViewer, setUseNativeViewer] = useState<boolean>(false);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pdfDocRef = useRef<any>(null);
  const renderTaskRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Generate blob URL for native viewer / downloads
  useEffect(() => {
    if (!pdfBytes) {
      setBlobUrl(null);
      return;
    }
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    setBlobUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [pdfBytes]);

  // Load PDF document when bytes change
  useEffect(() => {
    if (!pdfBytes) return;

    let isMounted = true;
    setIsLoading(true);
    setErrorMessage(null);
    setCurrentPage(1);

    // Cancel existing render if running
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel();
    }

    const loadDoc = async () => {
      try {
        // Clone bytes to avoid detached buffer issues
        const bytesCopy = new Uint8Array(pdfBytes);
        const loadingTask = pdfjsLib.getDocument({
          data: bytesCopy,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/cmaps/',
          cMapPacked: true,
        });

        const doc = await loadingTask.promise;
        if (!isMounted) return;

        pdfDocRef.current = doc;
        setNumPages(doc.numPages);
        if (onPageChange) {
          onPageChange(1, doc.numPages);
        }
        setIsLoading(false);
      } catch (err: any) {
        console.error('PDF.js parse error:', err);
        if (isMounted) {
          setErrorMessage(err.message || 'Failed to render PDF using canvas engine.');
          setIsLoading(false);
        }
      }
    };

    loadDoc();

    return () => {
      isMounted = false;
    };
  }, [pdfBytes]);

  // Render current page to canvas
  useEffect(() => {
    if (!pdfDocRef.current || isLoading || useNativeViewer) return;

    let isMounted = true;

    const renderPage = async () => {
      try {
        if (renderTaskRef.current) {
          renderTaskRef.current.cancel();
        }

        const page = await pdfDocRef.current.getPage(currentPage);
        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const viewport = page.getViewport({ scale, rotation });
        const ctx = canvas.getContext('2d', { alpha: false });
        if (!ctx) return;

        // Support high-DPI displays for crisp vector rendering
        const pixelRatio = window.devicePixelRatio || 1;
        canvas.width = Math.floor(viewport.width * pixelRatio);
        canvas.height = Math.floor(viewport.height * pixelRatio);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

        const renderContext = {
          canvasContext: ctx,
          viewport: viewport,
        };

        const renderTask = page.render(renderContext);
        renderTaskRef.current = renderTask;

        await renderTask.promise;
      } catch (err: any) {
        if (err?.name !== 'RenderingCancelledException') {
          console.warn('Page render warning:', err);
        }
      }
    };

    renderPage();

    return () => {
      isMounted = false;
    };
  }, [currentPage, scale, rotation, isLoading, useNativeViewer]);

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const p = currentPage - 1;
      setCurrentPage(p);
      if (onPageChange) onPageChange(p, numPages);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      const p = currentPage + 1;
      setCurrentPage(p);
      if (onPageChange) onPageChange(p, numPages);
    }
  };

  const handleZoomIn = () => {
    setScale((prev) => Math.min(3.0, Number((prev + 0.2).toFixed(2))));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.5, Number((prev - 0.2).toFixed(2))));
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrint = () => {
    if (!blobUrl) return;
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.src = blobUrl;
    document.body.appendChild(iframe);
    iframe.onload = () => {
      setTimeout(() => {
        iframe.focus();
        iframe.contentWindow?.print();
        setTimeout(() => document.body.removeChild(iframe), 2000);
      }, 500);
    };
  };

  const handleFitWidth = () => {
    if (!containerRef.current || !pdfDocRef.current) return;
    const containerW = containerRef.current.clientWidth - 80;
    if (containerW > 200) {
      const targetScale = containerW / 612;
      setScale(Number(targetScale.toFixed(2)));
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Viewer Control Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white border-b border-slate-200">
        {/* Left: Page Navigation */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-prev-page"
            onClick={handlePrevPage}
            disabled={currentPage <= 1 || isLoading}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 px-2 text-sm font-medium text-slate-700">
            <span>Page</span>
            <input
              id="input-page-number"
              type="number"
              min={1}
              max={numPages}
              value={currentPage}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1 && val <= numPages) {
                  setCurrentPage(val);
                  if (onPageChange) onPageChange(val, numPages);
                }
              }}
              className="w-12 px-1.5 py-0.5 text-center text-sm font-semibold border border-slate-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <span className="text-slate-400">/</span>
            <span className="text-slate-600 font-semibold">{numPages}</span>
          </div>

          <button
            id="btn-next-page"
            onClick={handleNextPage}
            disabled={currentPage >= numPages || isLoading}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Zoom and Rotation Controls */}
        <div className="flex items-center gap-1.5">
          <button
            id="btn-zoom-out"
            onClick={handleZoomOut}
            disabled={isLoading || scale <= 0.5}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-xs font-semibold px-2 text-slate-600 min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>

          <button
            id="btn-zoom-in"
            onClick={handleZoomIn}
            disabled={isLoading || scale >= 3.0}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <button
            id="btn-fit-width"
            onClick={handleFitWidth}
            disabled={isLoading}
            className="px-2 py-1 text-xs font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            title="Fit to Width"
          >
            Fit
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          <button
            id="btn-rotate-cw"
            onClick={handleRotate}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition-colors"
            title="Rotate 90 Clockwise"
          >
            <RotateCw className="w-4 h-4" />
          </button>

          <button
            id="btn-toggle-engine"
            onClick={() => setUseNativeViewer(!useNativeViewer)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors flex items-center gap-1.5 ${
              useNativeViewer
                ? 'bg-blue-50 border-blue-200 text-blue-700'
                : 'border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
            title="Switch between Canvas renderer and Embedded PDF viewer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>{useNativeViewer ? 'Native View' : 'Canvas Engine'}</span>
          </button>
        </div>

        {/* Right: Actions (Download & Print) */}
        <div className="flex items-center gap-2">
          <button
            id="btn-print-pdf"
            onClick={handlePrint}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
            title="Print PDF"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            id="btn-download-pdf"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
            title="Download PDF File"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Main Canvas / Preview Stage */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto p-6 flex items-center justify-center min-h-[500px] relative bg-slate-200/70"
      >
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 text-slate-600">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Rendering PDF test page...</p>
          </div>
        )}

        {errorMessage && !useNativeViewer && (
          <div className="max-w-md p-6 bg-white rounded-xl shadow-lg border border-rose-200 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto mb-3" />
            <h4 className="text-base font-semibold text-slate-900 mb-1">Canvas Renderer Notice</h4>
            <p className="text-xs text-slate-600 mb-4">{errorMessage}</p>
            <button
              onClick={() => setUseNativeViewer(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors inline-flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              Switch to Native Browser PDF Viewer
            </button>
          </div>
        )}

        {/* Native Embedded Iframe Viewer Option */}
        {useNativeViewer && blobUrl && (
          <iframe
            src={`${blobUrl}#page=${currentPage}&zoom=${Math.round(scale * 100)}`}
            title="PDF Document Native Preview"
            className="w-full h-full min-h-[600px] rounded-lg border border-slate-300 bg-white shadow-md"
          />
        )}

        {/* HTML5 Canvas Render */}
        {!useNativeViewer && !errorMessage && (
          <div
            className={`transition-opacity duration-200 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
          >
            <div className="shadow-2xl rounded-sm border border-slate-300 bg-white overflow-hidden">
              <canvas ref={canvasRef} className="block mx-auto" />
            </div>
          </div>
        )}
      </div>

      {/* Footer Info Bar */}
      <div className="px-4 py-2 bg-white border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <span className="font-medium text-slate-700 truncate max-w-xs">{fileName}</span>
          <span className="text-slate-400">•</span>
          <span>PDF-1.4 Spec</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Scale: {Math.round(scale * 100)}%</span>
          <span>Rotation: {rotation}°</span>
        </div>
      </div>
    </div>
  );
};
