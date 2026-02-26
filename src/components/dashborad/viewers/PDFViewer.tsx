import { useState, useCallback, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

// Set up PDF.js worker - import directly from node_modules for Vite compatibility
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker;

interface PDFViewerProps {
  fileUrl: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onTotalPagesChange: (totalPages: number) => void;
  className?: string;
  isPresentationMode?: boolean; // For PPTX converted to PDF
}

export function PDFViewer({
  fileUrl,
  currentPage,
  onPageChange,
  onTotalPagesChange,
  className,
  isPresentationMode = false,
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [scale, setScale] = useState<number>(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pageInput, setPageInput] = useState<string>(String(currentPage));
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Measure container width for responsive PDF sizing
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        // Get the actual available width
        // For presentation mode, we use the full width; for PDFs, account for padding
        if (isPresentationMode) {
          setContainerWidth(containerRef.current.clientWidth);
        } else {
          // Account for padding (p-2 = 8px on each side on mobile, p-4 = 16px on larger)
          const padding = window.innerWidth < 640 ? 16 : 32;
          setContainerWidth(containerRef.current.clientWidth - padding);
        }
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, [isPresentationMode]);

  // Sync page input with current page when it changes externally
  useEffect(() => {
    setPageInput(String(currentPage));
  }, [currentPage]);

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPageInput(e.target.value);
  };

  const handlePageInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      goToPage();
    }
  };

  const handlePageInputBlur = () => {
    goToPage();
  };

  const goToPage = () => {
    const pageNum = parseInt(pageInput, 10);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= numPages) {
      onPageChange(pageNum);
    } else {
      // Reset to current page if invalid
      setPageInput(String(currentPage));
    }
  };

  const onDocumentLoadSuccess = useCallback(
    ({ numPages }: { numPages: number }) => {
      setNumPages(numPages);
      onTotalPagesChange(numPages);
      setIsLoading(false);
      setError(null);
    },
    [onTotalPagesChange],
  );

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error("PDF load error:", error);
    setError("Failed to load PDF document");
    setIsLoading(false);
  }, []);

  const goToPrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < numPages) {
      onPageChange(currentPage + 1);
    }
  };

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const resetZoom = () => setScale(1);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 p-2 sm:p-3 bg-muted/50 border-b">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevPage}
            disabled={currentPage <= 1}
            className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
          >
            <span className="hidden sm:inline">←</span> Prev
          </Button>
          <div className="flex items-center gap-1 text-xs sm:text-sm font-medium">
            <span className="hidden xs:inline">Page</span>
            <Input
              type="text"
              value={pageInput}
              onChange={handlePageInputChange}
              onKeyDown={handlePageInputKeyDown}
              onBlur={handlePageInputBlur}
              className="w-10 sm:w-14 h-6 sm:h-7 text-center text-xs sm:text-sm px-1"
              aria-label="Go to page"
            />
            <span>of {numPages || "..."}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage >= numPages}
            className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
          >
            Next <span className="hidden sm:inline">→</span>
          </Button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="h-7 sm:h-8 w-7 sm:w-8 p-0"
          >
            −
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetZoom}
            className="h-7 sm:h-8 px-1 sm:px-2 text-xs sm:text-sm"
          >
            {Math.round(scale * 100)}%
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={zoomIn}
            disabled={scale >= 3}
            className="h-7 sm:h-8 w-7 sm:w-8 p-0"
          >
            +
          </Button>
        </div>
      </div>

      {/* PDF Content */}
      <div
        ref={containerRef}
        className={cn(
          "flex-1 overflow-auto bg-muted/30 scroll-smooth",
          isPresentationMode ? "p-4" : "p-2 sm:p-4"
        )}
      >
        {error ? (
          <div className="flex items-center justify-center h-full text-destructive">
            <p>{error}</p>
          </div>
        ) : (
          <div className={cn(
            "flex justify-center",
            isPresentationMode ? "min-h-full" : ""
          )}>
            <Document
              file={fileUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              }
            >
              {isLoading ? null : (
                <div className="flex justify-center">
                  <Page
                    pageNumber={currentPage}
                    scale={scale}
                    width={
                      isPresentationMode
                        ? containerWidth > 0 ? Math.min(containerWidth - 32, 1200) : undefined
                        : containerWidth > 0 && containerWidth < 600
                          ? containerWidth
                          : undefined
                    }
                    className={cn(
                      "shadow-lg",
                      !isPresentationMode && "max-w-full"
                    )}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </div>
              )}
            </Document>
          </div>
        )}
      </div>
    </div>
  );
}
