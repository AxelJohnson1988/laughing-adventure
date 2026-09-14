export interface PDFDocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modDate?: string;
  pdfVersion?: string;
  pageCount: number;
  fileSizeBytes: number;
  fileName: string;
  isEncrypted: boolean;
  pageSize?: {
    width: number;
    height: number;
    name?: string;
  };
}

export interface PDFPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  textSnippet: string;
}

export interface PDFDiagnosticCheck {
  id: string;
  name: string;
  description: string;
  status: 'passed' | 'warning' | 'failed' | 'info';
  details: string;
}

export interface SamplePDFTemplate {
  id: string;
  title: string;
  category: string;
  description: string;
  pageCount: number;
  generator: () => Uint8Array;
}
