import React, { useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Sparkles, 
  ChevronDown,
  Activity
} from 'lucide-react';
import { SamplePDFTemplate } from '../types';

interface NavbarProps {
  currentSampleId: string;
  samples: SamplePDFTemplate[];
  onSelectSample: (sample: SamplePDFTemplate) => void;
  onUploadPDF: (bytes: Uint8Array, fileName: string) => void;
  onOpenGenerator: () => void;
  activeTab: 'viewer' | 'diagnostics';
  setActiveTab: (tab: 'viewer' | 'diagnostics') => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentSampleId,
  samples,
  onSelectSample,
  onUploadPDF,
  onOpenGenerator,
  activeTab,
  setActiveTab,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        onUploadPDF(new Uint8Array(buffer), file.name);
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset file input value so same file can be re-selected
    e.target.value = '';
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-sm shadow-rose-200">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 leading-none">
                  laughing-adventure
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider bg-rose-50 text-rose-700 border border-rose-200 rounded-md">
                  Test PDF
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                AxelJohnson1988/laughing-adventure • PDF Test & Diagnostics Suite
              </p>
            </div>
          </div>

          {/* Center Tabs: Viewer vs Diagnostics */}
          <div className="hidden md:flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
            <button
              id="tab-btn-viewer"
              onClick={() => setActiveTab('viewer')}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'viewer'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF Viewer</span>
            </button>
            <button
              id="tab-btn-diagnostics"
              onClick={() => setActiveTab('diagnostics')}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'diagnostics'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-blue-600" />
              <span>Diagnostics & Inspector</span>
            </button>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2.5">
            {/* Quick Sample Selector */}
            <div className="relative">
              <select
                id="select-sample-pdf"
                value={currentSampleId}
                onChange={(e) => {
                  const selected = samples.find((s) => s.id === e.target.value);
                  if (selected) onSelectSample(selected);
                }}
                className="text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 pr-7 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none transition-colors"
                title="Select Test Sample"
              >
                {samples.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Hidden file input for uploading any test PDF */}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Upload PDF Button */}
            <button
              id="btn-upload-pdf"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors"
              title="Upload your own PDF to test"
            >
              <Upload className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Upload Test PDF</span>
            </button>

            {/* Generate Custom Test PDF Button */}
            <button
              id="btn-open-generator"
              onClick={onOpenGenerator}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-2xs shadow-blue-200 transition-colors"
              title="Generate a custom test PDF"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Generate PDF</span>
            </button>
          </div>
        </div>

        {/* Mobile Sub-tabs */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('viewer')}
            className={`text-xs font-semibold py-1 px-3 rounded-md ${
              activeTab === 'viewer' ? 'bg-slate-200 text-slate-900' : 'text-slate-600'
            }`}
          >
            PDF Viewer
          </button>
          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`text-xs font-semibold py-1 px-3 rounded-md ${
              activeTab === 'diagnostics' ? 'bg-slate-200 text-slate-900' : 'text-slate-600'
            }`}
          >
            Diagnostics & Inspector
          </button>
        </div>
      </div>
    </header>
  );
};
