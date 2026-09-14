import React, { useState, useEffect, useMemo } from 'react';
import { Navbar } from './components/Navbar';
import { PDFCanvasViewer } from './components/PDFCanvasViewer';
import { PDFDiagnosticsPanel } from './components/PDFDiagnosticsPanel';
import { PDFGeneratorModal } from './components/PDFGeneratorModal';
import { getSampleTemplates } from './utils/pdfGenerator';
import { analyzePDFBytes } from './utils/pdfAnalyzer';
import { SamplePDFTemplate } from './types';
import { UploadCloud } from 'lucide-react';

export const App: React.FC = () => {
  const sampleTemplates = useMemo(() => getSampleTemplates(), []);

  const [currentSampleId, setCurrentSampleId] = useState<string>(sampleTemplates[0].id);
  const [fileName, setFileName] = useState<string>('laughing-adventure-standard-test.pdf');
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [activeTab, setActiveTab] = useState<'viewer' | 'diagnostics'>('viewer');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Initialize with standard test sample
  useEffect(() => {
    const defaultSample = sampleTemplates[0];
    const initialBytes = defaultSample.generator();
    setPdfBytes(initialBytes);
    setFileName('laughing-adventure-standard-test.pdf');
  }, [sampleTemplates]);

  // Compute diagnostics whenever pdfBytes changes
  const analysisResult = useMemo(() => {
    if (!pdfBytes) return null;
    return analyzePDFBytes(pdfBytes, fileName);
  }, [pdfBytes, fileName]);

  const handleSelectSample = (sample: SamplePDFTemplate) => {
    setCurrentSampleId(sample.id);
    const bytes = sample.generator();
    setPdfBytes(bytes);
    setFileName(`${sample.id}.pdf`);
  };

  const handleUploadPDF = (bytes: Uint8Array, uploadedName: string) => {
    setCurrentSampleId('custom-upload');
    setPdfBytes(bytes);
    setFileName(uploadedName);
  };

  const handleCustomGenerated = (bytes: Uint8Array, genName: string) => {
    setCurrentSampleId('custom-generated');
    setPdfBytes(bytes);
    setFileName(genName);
    setActiveTab('viewer');
  };

  // Drag and drop handler for PDF files
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const buffer = ev.target?.result as ArrayBuffer;
          if (buffer) {
            handleUploadPDF(new Uint8Array(buffer), file.name);
          }
        };
        reader.readAsArrayBuffer(file);
      }
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col bg-slate-100 text-slate-900"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top Navigation */}
      <Navbar
        currentSampleId={currentSampleId}
        samples={sampleTemplates}
        onSelectSample={handleSelectSample}
        onUploadPDF={handleUploadPDF}
        onOpenGenerator={() => setIsGeneratorOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Drag and Drop Overlay Indicator */}
      {isDragging && (
        <div className="fixed inset-0 z-50 bg-blue-600/80 backdrop-blur-xs flex flex-col items-center justify-center text-white border-4 border-dashed border-white m-4 rounded-3xl pointer-events-none">
          <UploadCloud className="w-16 h-16 animate-bounce mb-3" />
          <h2 className="text-2xl font-bold">Drop your PDF test file here</h2>
          <p className="text-sm text-blue-100 mt-1">Instant client-side rendering & diagnostics</p>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        {/* Sample Quick Banner */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-800">
              Active Test Document:
            </span>
            <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
              {fileName}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="hidden sm:inline">Switch Test Presets:</span>
            {sampleTemplates.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelectSample(s)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  currentSampleId === s.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {s.title.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Tab View Containers */}
        {activeTab === 'viewer' ? (
          <div className="flex-1 flex flex-col min-h-[620px]">
            <PDFCanvasViewer
              pdfBytes={pdfBytes}
              fileName={fileName}
            />
          </div>
        ) : (
          <div className="flex-1">
            <PDFDiagnosticsPanel
              metadata={analysisResult?.metadata ?? null}
              diagnostics={analysisResult?.diagnostics ?? []}
              rawHeader={analysisResult?.rawHeader}
              rawTrailer={analysisResult?.rawTrailer}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700">laughing-adventure</span>
            <span>•</span>
            <span>Test PDF Suite</span>
            <span>•</span>
            <span>MIT License © 2026 Jakob Axel Paper</span>
          </div>

          <div className="flex items-center gap-3">
            <span>Imported from AxelJohnson1988/laughing-adventure</span>
            <span>•</span>
            <span className="text-emerald-600 font-medium">Node.js 22 + Vite SPA</span>
          </div>
        </div>
      </footer>

      {/* Custom Test PDF Generator Modal */}
      <PDFGeneratorModal
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        onGenerated={handleCustomGenerated}
      />
    </div>
  );
};
