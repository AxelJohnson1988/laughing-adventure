import React from 'react';
import { PDFDiagnosticCheck, PDFDocumentMetadata } from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  FileCheck, 
  Binary, 
  ShieldCheck, 
  Database
} from 'lucide-react';

interface PDFDiagnosticsPanelProps {
  metadata: PDFDocumentMetadata | null;
  diagnostics: PDFDiagnosticCheck[];
  rawHeader?: string;
  rawTrailer?: string;
}

export const PDFDiagnosticsPanel: React.FC<PDFDiagnosticsPanelProps> = ({
  metadata,
  diagnostics,
  rawHeader,
  rawTrailer,
}) => {
  if (!metadata) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        <FileCheck className="w-10 h-10 text-slate-400 mx-auto mb-2" />
        <p className="text-sm font-medium">Load or generate a PDF to inspect diagnostics.</p>
      </div>
    );
  }

  const passedCount = diagnostics.filter((d) => d.status === 'passed').length;
  const warningCount = diagnostics.filter((d) => d.status === 'warning').length;
  const failedCount = diagnostics.filter((d) => d.status === 'failed').length;

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const getStatusIcon = (status: PDFDiagnosticCheck['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />;
      case 'info':
      default:
        return <Info className="w-4 h-4 text-blue-500 flex-shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Health Overview Card */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              PDF Specification Health & Conformance
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Automated ISO 32000-1 binary structure validation and diagnostic test results.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold">
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg">
              {passedCount} Passed
            </span>
            {warningCount > 0 && (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
                {warningCount} Warnings
              </span>
            )}
            {failedCount > 0 && (
              <span className="px-2.5 py-1 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg">
                {failedCount} Errors
              </span>
            )}
          </div>
        </div>

        {/* Diagnostic Check List */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {diagnostics.map((check) => (
            <div
              key={check.id}
              className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/80 flex items-start gap-3"
            >
              <div className="mt-0.5">{getStatusIcon(check.status)}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-800 truncate">{check.name}</h4>
                  <span
                    className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 rounded ${
                      check.status === 'passed'
                        ? 'bg-emerald-100/60 text-emerald-800'
                        : check.status === 'warning'
                        ? 'bg-amber-100/60 text-amber-800'
                        : check.status === 'failed'
                        ? 'bg-rose-100/60 text-rose-800'
                        : 'bg-blue-100/60 text-blue-800'
                    }`}
                  >
                    {check.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{check.description}</p>
                <p className="text-[11px] font-medium text-slate-700 mt-1 bg-white px-2 py-1 rounded border border-slate-200/60">
                  {check.details}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Document Properties & Metadata Matrix */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-4">
          <Database className="w-4 h-4 text-indigo-600" />
          Document Metadata & Object Hierarchy
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Document Title</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate" title={metadata.title}>
              {metadata.title || 'Untitled Document'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">PDF Version</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block">
              {metadata.pdfVersion || 'PDF 1.4'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Page Count</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block">
              {metadata.pageCount} {metadata.pageCount === 1 ? 'Page' : 'Pages'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">File Size</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block">
              {formatFileSize(metadata.fileSizeBytes)}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Author</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
              {metadata.author || 'Jakob Axel Paper'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Producer / Engine</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block truncate">
              {metadata.producer || 'laughing-adventure PDF'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Default MediaBox</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block">
              {metadata.pageSize?.name || 'US Letter (612 x 792 pt)'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
            <span className="text-[11px] font-medium text-slate-500 block">Encryption Status</span>
            <span className="text-xs font-bold text-slate-800 mt-0.5 block">
              {metadata.isEncrypted ? 'Protected' : 'Unencrypted (Standard)'}
            </span>
          </div>
        </div>
      </div>

      {/* Raw Stream Inspector (Header & Trailer) */}
      <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 mb-3">
          <Binary className="w-4 h-4 text-emerald-600" />
          Low-Level PDF Stream Byte Inspector
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Document Header Stream (First 256 bytes)
            </span>
            <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-[11px] rounded-lg overflow-x-auto whitespace-pre-wrap max-h-48 border border-slate-800">
              {rawHeader || '%PDF-1.4\n%âãÏÓ'}
            </pre>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-700 mb-1.5 block">
              Trailer & Cross-Reference Table (End of file)
            </span>
            <pre className="p-3 bg-slate-900 text-cyan-400 font-mono text-[11px] rounded-lg overflow-x-auto whitespace-pre-wrap max-h-48 border border-slate-800">
              {rawTrailer || 'startxref\n%%EOF'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
