import { useCallback } from 'react';
import { useStateStore, type doc } from '@/store/stateStore';
import { formatFileSize, getFileTypeName } from '@/lib/types';
import {
  PDFViewer,
  DocxViewer,
  ExcelViewer,
  PptxViewer,
  ImageViewer,
  TextViewer,
  VideoViewer,
  AudioViewer,
  CsvViewer,
  UnsupportedViewer,
} from '@/components/viewers';
import { Button } from '@/components/ui/button';

interface DocumentPreviewModalProps {
  document: doc;
  onClose: () => void;
}

function DocumentPreviewContent({ document }: { document: doc }) {
  const { setDocCurrentPage, setDocTotalPages } = useStateStore();

  const handlePageChange = useCallback(
    (page: number) => {
      setDocCurrentPage(document.id, page);
    },
    [document.id, setDocCurrentPage]
  );

  const handleTotalPagesChange = useCallback(
    (totalPages: number) => {
      setDocTotalPages(document.id, totalPages);
    },
    [document.id, setDocTotalPages]
  );

  const { documentType, file, fileUrl, mimeType, title, fileSize } = document;

  if (!file && !fileUrl) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No file available for preview</p>
      </div>
    );
  }

  switch (documentType) {
    case 'pdf':
      return fileUrl ? (
        <PDFViewer
          fileUrl={fileUrl}
          currentPage={document.currentPage}
          onPageChange={handlePageChange}
          onTotalPagesChange={handleTotalPagesChange}
          className="h-full"
        />
      ) : null;

    case 'docx':
    case 'doc':
      return file ? (
        <DocxViewer file={file} className="h-full" />
      ) : null;

    case 'xlsx':
    case 'xls':
      return file ? (
        <ExcelViewer file={file} className="h-full" />
      ) : null;

    case 'pptx':
    case 'ppt':
      return file ? (
        <PptxViewer
          file={file}
          currentPage={document.currentPage}
          onPageChange={handlePageChange}
          onTotalPagesChange={handleTotalPagesChange}
          className="h-full"
        />
      ) : null;

    case 'image':
      return fileUrl ? (
        <ImageViewer
          fileUrl={fileUrl}
          fileName={title}
          className="h-full"
        />
      ) : null;

    case 'txt':
    case 'md':
    case 'json':
    case 'xml':
      return file ? (
        <TextViewer file={file} type={documentType} className="h-full" />
      ) : null;

    case 'csv':
      return file ? (
        <CsvViewer file={file} className="h-full" />
      ) : null;

    case 'video':
      return fileUrl ? (
        <VideoViewer
          fileUrl={fileUrl}
          mimeType={mimeType}
          className="h-full"
        />
      ) : null;

    case 'audio':
      return fileUrl ? (
        <AudioViewer
          fileUrl={fileUrl}
          fileName={title}
          mimeType={mimeType}
          className="h-full"
        />
      ) : null;

    default:
      return fileUrl ? (
        <UnsupportedViewer
          fileName={title}
          fileSize={fileSize}
          fileType={documentType}
          fileUrl={fileUrl}
          className="h-full"
        />
      ) : null;
  }
}

export function DocumentPreviewModal({ document, onClose }: DocumentPreviewModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-[95vw] h-[90vh] max-w-7xl bg-background rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <header className="px-6 py-4 border-b bg-card flex items-center justify-between gap-4 shrink-0">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold truncate">
              {document.title}
            </h2>
            <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
              <span>{getFileTypeName(document.documentType)}</span>
              <span>•</span>
              <span>{formatFileSize(document.fileSize)}</span>
              {document.totalPages > 1 && (
                <>
                  <span>•</span>
                  <span>
                    Page {document.currentPage} of {document.totalPages}
                  </span>
                </>
              )}
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="shrink-0"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <DocumentPreviewContent document={document} />
        </div>
      </div>
    </div>
  );
}

// Global preview component that reads from store
export function GlobalDocumentPreview() {
  const { previewDoc, isPreviewOpen, closePreview } = useStateStore();

  if (!isPreviewOpen || !previewDoc) {
    return null;
  }

  return <DocumentPreviewModal document={previewDoc} onClose={closePreview} />;
}
