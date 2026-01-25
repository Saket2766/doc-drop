import { useCallback } from 'react';
import { useDocumentStore } from '@/lib/store';
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
import type { Document } from '@/lib/types';

interface DocumentViewerProps {
  document: Document;
}

export function DocumentViewer({ document }: DocumentViewerProps) {
  const { setCurrentPage, setTotalPages } = useDocumentStore();

  const handlePageChange = useCallback(
    (page: number) => {
      setCurrentPage(document.id, page);
    },
    [document.id, setCurrentPage]
  );

  const handleTotalPagesChange = useCallback(
    (totalPages: number) => {
      setTotalPages(document.id, totalPages);
    },
    [document.id, setTotalPages]
  );

  // Render appropriate viewer based on document type
  const renderViewer = () => {
    const { type, file, fileUrl, mimeType, title, fileSize } = document;

    if (!file && !fileUrl) {
      return (
        <div className="flex items-center justify-center h-full text-muted-foreground">
          <p>No file available for preview</p>
        </div>
      );
    }

    switch (type) {
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
          <TextViewer file={file} type={type} className="h-full" />
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
            fileType={type}
            fileUrl={fileUrl}
            className="h-full"
          />
        ) : null;
    }
  };

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border bg-card">
      {renderViewer()}
    </div>
  );
}
