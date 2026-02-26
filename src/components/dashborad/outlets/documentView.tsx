import { useParams, useNavigate, Link } from "react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStateStore, type doc } from "@/store/stateStore";
import { formatFileSize, getFileTypeName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  PDFViewer,
  DocxViewer,
  ExcelViewer,
  PptxViewer,
  ImageViewer,
  TextViewer,
  CsvViewer,
  VideoViewer,
  AudioViewer,
  UnsupportedViewer,
} from "../viewers";
import { Comments } from "../layout/Comments";
import { NewVersionButton } from "../layout/newVersionButton";
import { HugeiconsIcon } from "@hugeicons/react";
import { Download } from "@hugeicons/core-free-icons";
import { errorToast } from "@/components/layout/errorToast";

export const DocumentView: React.FC = () => {
  const { projectId, documentId } = useParams<{
    projectId: string;
    documentId: string;
  }>();
  const navigate = useNavigate();
  const {
    projects,
    setCurrentDoc,
    setCurrentPath,
    currentDoc,
    isCommentsOpen,
    toggleComments,
    setCommentsOpen,
    refreshDocDownloadUrl,
    loadDocVersions,
  } = useStateStore();

  const docId = documentId ? parseInt(documentId) : null;
  const projId = projectId ? parseInt(projectId) : null;

  const project = projId ? projects.get(projId) : null;
  const docFromStore = project && docId ? project.docs.get(docId) : null;
  // Use currentDoc from store if it matches, otherwise use doc from projects map
  // This ensures we get the latest version state
  const docItem =
    currentDoc && currentDoc.id === docId ? currentDoc : docFromStore;

  // Hide comments by default on mobile screens (below md breakpoint: 768px)
  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setCommentsOpen(false);
    }
  }, [setCommentsOpen]);

  useEffect(() => {
    if (docItem) {
      setCurrentDoc(docItem);
      if (project) {
        setCurrentPath([
          { label: "Projects", isLink: true, href: "/dashboard" },
          {
            label: project.name,
            isLink: true,
            href: `/dashboard/project/${projectId}`,
          },
          { label: docItem.title, isLink: false },
        ]);
      }
    }
  }, [docItem, project, projectId, setCurrentDoc, setCurrentPath]);

  const didInitialFetchRef = useRef<string | null>(null);
  useEffect(() => {
    if (!projId || !docId) return;
    const key = `${projId}:${docId}`;
    if (didInitialFetchRef.current === key) return;
    didInitialFetchRef.current = key;

    refreshDocDownloadUrl(projId, docId).catch(() => {});
    loadDocVersions(projId, docId).catch(() => {});
  }, [projId, docId, refreshDocDownloadUrl, loadDocVersions]);

  const downloadUrl = useMemo(() => {
    if (!docItem) return null;
    const currentVersion = docItem.versions?.find(
      (v) => v.versionNumber === docItem.currentVersionNumber,
    );
    return currentVersion?.fileUrl ?? docItem.fileUrl ?? null;
  }, [docItem]);

  const handleDownload = useCallback(async () => {
    if (!downloadUrl || !docItem) return;
    try {
      const res = await fetch(downloadUrl);
      if (!res.ok) {
        throw new Error(`Failed to download file (${res.status})`);
      }
      const blob = await res.blob();
      const fileName = docItem.title || "document";
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      anchor.style.display = "none";
      window.document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      errorToast(
        err instanceof Error ? err.message : "Failed to download file",
      );
    }
  }, [downloadUrl, docItem]);

  const handleClose = () => {
    if (projectId) {
      navigate(`/dashboard/project/${projectId}`);
    } else {
      navigate("/dashboard");
    }
  };

  if (!docItem || !project) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>Document not found</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col overflow-hidden">
      {/* Header */}
      <header className="px-3 sm:px-6 py-3 sm:py-4 border-b bg-card flex items-center justify-between gap-2 sm:gap-4 shrink-0">
        <div className="min-w-0 flex-1">
          <h2 className="text-base sm:text-lg font-semibold truncate">
            {docItem.title}
          </h2>
          <div className="flex items-center gap-1 sm:gap-2 mt-1 text-xs sm:text-sm text-muted-foreground flex-wrap">
            <span>{getFileTypeName(docItem.documentType)}</span>
            <span className="hidden xs:inline">•</span>
            <span className="hidden xs:inline">
              {formatFileSize(docItem.fileSize)}
            </span>
            {docItem.totalPages > 1 && (
              <>
                <span>•</span>
                <span>
                  {docItem.currentPage}/{docItem.totalPages}
                </span>
              </>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/*Download button*/}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={"outline"}
                size={"icon"}
                onClick={handleDownload}
                disabled={!downloadUrl}
              >
                <HugeiconsIcon icon={Download} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Download</TooltipContent>
          </Tooltip>

          {/* Toggle comments button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isCommentsOpen ? "secondary" : "ghost"}
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                onClick={toggleComments}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-4 h-4 sm:w-5 sm:h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
                  />
                </svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {isCommentsOpen ? "Hide comments" : "Show comments"}
            </TooltipContent>
          </Tooltip>

          {/* All version comments button */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 sm:h-10 sm:w-10"
                asChild
              >
                <Link
                  to={`/dashboard/project/${projectId}/document/${documentId}/comments`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4 sm:w-5 sm:h-5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155"
                    />
                  </svg>
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>All version comments</TooltipContent>
          </Tooltip>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:h-10 sm:w-10"
            onClick={handleClose}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-4 h-4 sm:w-5 sm:h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>
      </header>

      {/* Content - Stack vertically on mobile, side by side on larger screens */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* Document Preview */}
        <div
          className={`overflow-auto relative transition-all duration-300 ${
            isCommentsOpen ? "h-1/2 md:h-full md:flex-2" : "h-full flex-1"
          }`}
        >
          <DocumentPreviewContent document={docItem} />
          <div className="absolute bottom-6 right-4 w-40 z-100">
            <NewVersionButton />
          </div>
        </div>

        {/* Comments Panel - Bottom sheet on mobile, side panel on desktop */}
        {isCommentsOpen && (
          <div className="h-1/2 md:h-full min-h-0 border-t md:border-t-0 md:border-l flex flex-col md:flex-1 md:max-w-md">
            <Comments
              document={docItem}
              currentPage={docItem.currentPage}
              totalPages={docItem.totalPages}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export function DocumentPreviewContent({ document }: { document: doc }) {
  const { setDocCurrentPage, setDocTotalPages, refreshDocDownloadUrl } =
    useStateStore();

  const handlePageChange = useCallback(
    (page: number) => {
      setDocCurrentPage(document.id, page);
    },
    [document.id, setDocCurrentPage],
  );

  const handleTotalPagesChange = useCallback(
    (totalPages: number) => {
      setDocTotalPages(document.id, totalPages);
    },
    [document.id, setDocTotalPages],
  );

  const { documentType, file, fileUrl, mimeType, title, fileSize } = document;
  const [remoteFile, setRemoteFile] = useState<File | null>(null);
  const [remoteFileError, setRemoteFileError] = useState<string | null>(null);

  const needsRemoteFile = useMemo(() => {
    return (
      documentType === "docx" ||
      documentType === "doc" ||
      documentType === "xlsx" ||
      documentType === "xls" ||
      documentType === "pptx" ||
      documentType === "ppt" ||
      documentType === "txt" ||
      documentType === "md" ||
      documentType === "json" ||
      documentType === "xml" ||
      documentType === "csv"
    );
  }, [documentType]);

  useEffect(() => {
    if (!needsRemoteFile) {
      setRemoteFile(null);
      setRemoteFileError(null);
      return;
    }
    if (file) {
      setRemoteFile(file);
      setRemoteFileError(null);
      return;
    }
    if (!fileUrl) return;

    let cancelled = false;
    setRemoteFile(null);
    setRemoteFileError(null);

    (async () => {
      try {
        const res = await fetch(fileUrl);
        if (!res.ok) {
          throw new Error(`Failed to fetch file (${res.status})`);
        }
        const blob = await res.blob();
        if (cancelled) return;
        const inferredType =
          mimeType || blob.type || "application/octet-stream";
        const f = new File([blob], title || "document", { type: inferredType });
        setRemoteFile(f);
      } catch (err) {
        if (cancelled) return;
        setRemoteFileError(
          err instanceof Error ? err.message : "Failed to load file",
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [needsRemoteFile, file, fileUrl, mimeType, title]);

  const effectiveFile = remoteFile ?? file;

  if (!file && !fileUrl) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p>No file available for preview</p>
      </div>
    );
  }

  if (needsRemoteFile && !effectiveFile && remoteFileError) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="flex flex-col items-center gap-3">
          <p>{remoteFileError}</p>
          <Button
            variant="outline"
            onClick={() => {
              refreshDocDownloadUrl(document.projectId, document.id).catch(
                () => {},
              );
            }}
          >
            Refresh Link
          </Button>
        </div>
      </div>
    );
  }

  switch (documentType) {
    case "pdf":
      return fileUrl ? (
        <PDFViewer
          fileUrl={fileUrl}
          currentPage={document.currentPage}
          onPageChange={handlePageChange}
          onTotalPagesChange={handleTotalPagesChange}
          className="h-full"
        />
      ) : null;

    case "docx":
    case "doc":
      return effectiveFile ? (
        <DocxViewer file={effectiveFile} className="h-full" />
      ) : null;

    case "xlsx":
    case "xls":
      return effectiveFile ? (
        <ExcelViewer file={effectiveFile} className="h-full" />
      ) : null;

    case "pptx":
    case "ppt":
      return effectiveFile ? (
        <PptxViewer
          documentId={document.id}
          versionNumber={document.currentVersionNumber}
          file={effectiveFile}
          downloadUrl={fileUrl}
          fileName={title || "document"}
          currentPage={document.currentPage}
          onPageChange={handlePageChange}
          onTotalPagesChange={handleTotalPagesChange}
          className="h-full"
        />
      ) : null;

    case "image":
      return fileUrl ? (
        <ImageViewer fileUrl={fileUrl} fileName={title} className="h-full" />
      ) : null;

    case "txt":
    case "md":
    case "json":
    case "xml":
      return effectiveFile ? (
        <TextViewer
          file={effectiveFile}
          type={documentType}
          className="h-full"
        />
      ) : null;

    case "csv":
      return effectiveFile ? (
        <CsvViewer file={effectiveFile} className="h-full" />
      ) : null;

    case "video":
      return fileUrl ? (
        <VideoViewer fileUrl={fileUrl} mimeType={mimeType} className="h-full" />
      ) : null;

    case "audio":
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
