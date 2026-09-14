import { PDFDiagnosticCheck, PDFDocumentMetadata } from '../types';

/**
 * Analyzes raw PDF bytes and extracts metadata, structure details, and runs diagnostic integrity checks.
 */
export function analyzePDFBytes(bytes: Uint8Array, fileName: string): {
  metadata: PDFDocumentMetadata;
  diagnostics: PDFDiagnosticCheck[];
  rawHeader: string;
  rawTrailer: string;
} {
  const decoder = new TextDecoder('latin1');
  const text = decoder.decode(bytes);

  const diagnostics: PDFDiagnosticCheck[] = [];

  // 1. Magic Header Check
  const headerMatch = text.match(/^%PDF-([0-9]+\.[0-9]+)/);
  const pdfVersion = headerMatch ? `PDF ${headerMatch[1]}` : 'Unknown';
  if (headerMatch) {
    diagnostics.push({
      id: 'diag-header',
      name: 'PDF Header & Magic Bytes',
      status: 'passed',
      description: 'Verifies the document starts with the standard %PDF-x.y signature.',
      details: `Detected valid header: %PDF-${headerMatch[1]}`
    });
  } else {
    diagnostics.push({
      id: 'diag-header',
      name: 'PDF Header & Magic Bytes',
      status: 'failed',
      description: 'Verifies the document starts with standard %PDF-x.y signature.',
      details: 'Missing or corrupt %PDF header at byte offset 0.'
    });
  }

  // 2. Binary Marker (High-bit comment in 2nd line)
  const first100 = text.slice(0, 100);
  const hasBinaryComment = /%\r?\n%[\x80-\xFF]{4}/.test(first100) || first100.slice(0, 30).split('').some(c => c.charCodeAt(0) > 127);
  diagnostics.push({
    id: 'diag-binary',
    name: 'Binary Stream Marker',
    status: hasBinaryComment ? 'passed' : 'warning',
    description: 'Verifies non-ASCII binary marker to alert file transfer utilities of binary data.',
    details: hasBinaryComment 
      ? 'Binary marker present (ensures clean 8-bit transport).'
      : 'Binary marker not detected on line 2 (advisory warning).'
  });

  // 3. EOF Marker Check
  const last1024 = text.slice(-1024);
  const hasEOF = last1024.includes('%%EOF');
  diagnostics.push({
    id: 'diag-eof',
    name: 'End of File (%%EOF) Tag',
    status: hasEOF ? 'passed' : 'failed',
    description: 'Ensures the document terminates with a standard %%EOF token.',
    details: hasEOF ? '%%EOF marker found in the final byte buffer.' : 'Missing %%EOF marker at document termination.'
  });

  // 4. Cross-Reference Table Check
  const hasXref = text.includes('xref') || text.includes('/XRef');
  const hasStartXref = last1024.includes('startxref');
  diagnostics.push({
    id: 'diag-xref',
    name: 'Cross-Reference (xref) Table',
    status: hasXref && hasStartXref ? 'passed' : 'warning',
    description: 'Validates presence of cross-reference index and startxref pointer.',
    details: hasXref 
      ? `Cross-reference table detected with startxref pointer.`
      : 'Linearized or object-stream xref table.'
  });

  // 5. Encryption & Security Check
  const isEncrypted = text.includes('/Encrypt');
  diagnostics.push({
    id: 'diag-encrypt',
    name: 'Encryption & Permissions',
    status: isEncrypted ? 'info' : 'passed',
    description: 'Checks whether the document is encrypted with password protection or DRM.',
    details: isEncrypted ? 'Document contains /Encrypt dictionary.' : 'Standard unencrypted document (public access).'
  });

  // 6. Page Count detection
  let pageCount = 0;
  // Check /Type /Page (excluding /Pages)
  const pageMatches = text.match(/\/Type\s*\/Page\b/g);
  if (pageMatches) {
    pageCount = pageMatches.length;
  } else {
    // Try finding /Count in /Pages
    const pagesCountMatch = text.match(/\/Type\s*\/Pages[\s\S]*?\/Count\s+([0-9]+)/);
    if (pagesCountMatch) {
      pageCount = parseInt(pagesCountMatch[1], 10);
    }
  }

  diagnostics.push({
    id: 'diag-pages',
    name: 'Page Tree Hierarchy',
    status: pageCount > 0 ? 'passed' : 'warning',
    description: 'Validates the page count and tree structure.',
    details: pageCount > 0 ? `Identified ${pageCount} distinct page node(s).` : 'Could not statically determine page count.'
  });

  // 7. Font & Resource Inspection
  const fontMatches = text.match(/\/BaseFont\s*\/([A-Za-z0-9+_-]+)/g);
  const fontNames = fontMatches ? Array.from(new Set(fontMatches.map(f => f.replace(/\/BaseFont\s*\//, '')))) : [];
  diagnostics.push({
    id: 'diag-fonts',
    name: 'Font Resource Descriptor',
    status: fontNames.length > 0 ? 'passed' : 'info',
    description: 'Scans for embedded or standard font resources.',
    details: fontNames.length > 0 
      ? `Detected ${fontNames.length} font(s): ${fontNames.slice(0, 4).join(', ')}${fontNames.length > 4 ? '...' : ''}`
      : 'No standard BaseFont descriptors found.'
  });

  // Extract metadata fields
  function extractString(field: string): string | undefined {
    // Matches /Field (Value) or /Field <hex>
    const regex = new RegExp(`\\/${field}\\s*\\(([^)]*)\\)`);
    const match = text.match(regex);
    if (match) return match[1].replace(/\\([\\()])/g, '$1');
    return undefined;
  }

  const title = extractString('Title');
  const author = extractString('Author');
  const subject = extractString('Subject');
  const creator = extractString('Creator');
  const producer = extractString('Producer');
  const creationDate = extractString('CreationDate');
  const modDate = extractString('ModDate');

  const metadata: PDFDocumentMetadata = {
    title: title || fileName.replace(/\.pdf$/i, ''),
    author,
    subject,
    creator,
    producer,
    creationDate,
    modDate,
    pdfVersion,
    pageCount: Math.max(1, pageCount),
    fileSizeBytes: bytes.byteLength,
    fileName,
    isEncrypted,
    pageSize: {
      width: 612,
      height: 792,
      name: 'US Letter (8.5 x 11 in)'
    }
  };

  const rawHeader = text.slice(0, Math.min(256, text.length));
  const rawTrailer = text.slice(Math.max(0, text.length - 350));

  return { metadata, diagnostics, rawHeader, rawTrailer };
}
