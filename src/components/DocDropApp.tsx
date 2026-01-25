import { useDocumentStore } from '@/lib/store';
import { FileUpload } from '@/components/FileUpload';
import { DocumentList } from '@/components/DocumentList';
import { DocumentViewer } from '@/components/DocumentViewer';
import { formatFileSize, getFileTypeName } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

export function DocDropApp() {
  const { documents, selectedDocumentId } = useDocumentStore();
  const selectedDocument = documents.find((d) => d.id === selectedDocumentId);

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-80 border-r bg-card flex flex-col shrink-0">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5 text-primary-foreground"
              >
                <path
                  fillRule="evenodd"
                  d="M5.625 1.5c-1.036 0-1.875.84-1.875 1.875v17.25c0 1.035.84 1.875 1.875 1.875h12.75c1.035 0 1.875-.84 1.875-1.875V12.75A3.75 3.75 0 0016.5 9h-1.875a1.875 1.875 0 01-1.875-1.875V5.25A3.75 3.75 0 009 1.5H5.625zM7.5 15a.75.75 0 01.75-.75h7.5a.75.75 0 010 1.5h-7.5A.75.75 0 017.5 15zm.75 2.25a.75.75 0 000 1.5H12a.75.75 0 000-1.5H8.25z"
                  clipRule="evenodd"
                />
                <path d="M12.971 1.816A5.23 5.23 0 0114.25 5.25v1.875c0 .207.168.375.375.375H16.5a5.23 5.23 0 013.434 1.279 9.768 9.768 0 00-6.963-6.963z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold">DocDrop</h1>
              <p className="text-xs text-muted-foreground">Document Preview</p>
            </div>
          </div>
        </div>

        {/* Upload area */}
        <div className="p-4 border-b">
          <FileUpload />
        </div>

        {/* Document list */}
        <div className="flex-1 overflow-auto p-2">
          <div className="px-2 py-1 mb-2">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Documents ({documents.length})
            </span>
          </div>
          <DocumentList />
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0">
        {selectedDocument ? (
          <>
            {/* Document header */}
            <header className="px-6 py-4 border-b bg-card flex items-center justify-between gap-4">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold truncate">
                  {selectedDocument.title}
                </h2>
                <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                  <span>{getFileTypeName(selectedDocument.type)}</span>
                  <span>•</span>
                  <span>{formatFileSize(selectedDocument.fileSize)}</span>
                  {selectedDocument.totalPages > 1 && (
                    <>
                      <span>•</span>
                      <span>
                        Page {selectedDocument.currentPage} of {selectedDocument.totalPages}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  className={
                    selectedDocument.status === 'approved'
                      ? 'bg-green-500/10 text-green-600 hover:bg-green-500/20'
                      : selectedDocument.status === 'in_review'
                      ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                      : 'bg-muted text-muted-foreground'
                  }
                >
                  {selectedDocument.status.replace('_', ' ')}
                </Badge>
              </div>
            </header>

            {/* Document viewer */}
            <div className="flex-1 p-4 overflow-hidden">
              <DocumentViewer document={selectedDocument} />
            </div>
          </>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md px-4">
              <div className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-8 h-8 text-muted-foreground"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">No document selected</h3>
              <p className="text-muted-foreground">
                Upload a document or select one from the sidebar to preview it here.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
