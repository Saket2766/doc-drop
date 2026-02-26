import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PDFViewer } from "./PDFViewer";
import { BASE_URL } from "@/api/client";
import { enqueueDocumentConversion } from "@/api/documentsApi";
import { useStateStore } from "@/store/stateStore";

interface PptxViewerProps {
  documentId: number;
  versionNumber: number;
  file: File;
  downloadUrl?: string | null;
  fileName?: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onTotalPagesChange: (totalPages: number) => void;
  className?: string;
}

export function PptxViewer({
  documentId,
  versionNumber,
  file,
  downloadUrl,
  fileName,
  currentPage,
  onPageChange,
  onTotalPagesChange,
  className,
}: PptxViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // PDF preview state
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [usingPdfPreview, setUsingPdfPreview] = useState<boolean>(false);

  // Main loader: try to use backend PDF conversion
  useEffect(() => {
    let isCancelled = false;
    let eventSource: EventSource | null = null;
    async function loadAndMaybeConvert() {
      setIsLoading(true);
      setError(null);
      setPdfUrl(null);
      setUsingPdfPreview(false);

      // If file looks like a PPTX, attempt conversion to PDF for visual preview.
      const isPptx =
        file.name.toLowerCase().endsWith(".pptx") ||
        file.type ===
          "application/vnd.openxmlformats-officedocument.presentationml.presentation";

      if (isPptx) {
        // Kick off conversion and open SSE stream.
        (async () => {
          try {
            await enqueueDocumentConversion({ documentId, versionNumber });
          } catch (convErr) {
            console.warn("Failed to enqueue conversion:", convErr);
          }

          const token = useStateStore.getState().user?.token;
          if (!token) {
            setError(
              "Currently not able to preview PPTX. Try again later or download the file now.",
            );
            setIsLoading(false);
            return;
          }

          const sseUrl = `${BASE_URL}/documents/${documentId}/versions/${versionNumber}/events?token=${encodeURIComponent(
            token,
          )}`;
          eventSource = new EventSource(sseUrl);

          eventSource.addEventListener("conversion_update", (event) => {
            if (isCancelled) return;
            try {
              const payload = JSON.parse(
                (event as MessageEvent<string>).data,
              ) as {
                status: string;
                pdfUrl?: string | null;
                error?: string | null;
              };
              if (payload.status === "succeeded" && payload.pdfUrl) {
                setPdfUrl(payload.pdfUrl);
                setUsingPdfPreview(true);
                setIsLoading(false);
                eventSource?.close();
              } else if (payload.status === "failed") {
                setError(
                  payload.error ||
                    "Currently not able to preview PPTX. Try again later or download the file now.",
                );
                setIsLoading(false);
                eventSource?.close();
              }
            } catch (err) {
              console.warn("Invalid SSE payload", err);
            }
          });

          eventSource.onerror = () => {
            eventSource?.close();
            setError(
              "Currently not able to preview PPTX. Try again later or download the file now.",
            );
            setIsLoading(false);
          };
        })();
      } else {
        setError(
          "Currently not able to preview PPTX. Try again later or download the file now.",
        );
        setIsLoading(false);
      }
    }

    loadAndMaybeConvert();

    return () => {
      isCancelled = true;
      eventSource?.close();
    };
  }, [file, documentId, versionNumber, onTotalPagesChange]);

  // Render loading / error / empty states
  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">
            Generating PPTX preview...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("flex items-center justify-center h-full", className)}>
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm text-muted-foreground">{error}</p>
          {downloadUrl ? (
            <Button asChild variant="outline" size="sm">
              <a href={downloadUrl} download={fileName}>
                Download PPTX
              </a>
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Download link is unavailable.
            </p>
          )}
        </div>
      </div>
    );
  }

  // If PDF preview is available, render PDFViewer (visual preview)
  if (usingPdfPreview && pdfUrl) {
    return (
      <PDFViewer
        fileUrl={pdfUrl}
        currentPage={currentPage}
        onPageChange={onPageChange}
        onTotalPagesChange={onTotalPagesChange}
        isPresentationMode={true}
      />
    );
  }

  return null;
}
