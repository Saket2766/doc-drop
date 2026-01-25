import { useDocumentStore } from '@/lib/store';
import { formatFileSize, getFileTypeName } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// File type icons mapping
function getFileIcon(type: string): JSX.Element {
  const iconClasses = 'w-5 h-5';
  
  switch (type) {
    case 'pdf':
      return (
        <svg className={cn(iconClasses, 'text-red-500')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 18h2v-2H7v2zm0-4h2v-2H7v2zm0-4h2V8H7v2zm12-8H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm0 18H5V4h14v16z" />
        </svg>
      );
    case 'docx':
    case 'doc':
      return (
        <svg className={cn(iconClasses, 'text-blue-500')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
        </svg>
      );
    case 'xlsx':
    case 'xls':
    case 'csv':
      return (
        <svg className={cn(iconClasses, 'text-green-500')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 11h-2v2H9v-2H7v-2h2V9h2v2h2v2zM6 20V4h7v5h5v11H6z" />
        </svg>
      );
    case 'pptx':
    case 'ppt':
      return (
        <svg className={cn(iconClasses, 'text-orange-500')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-2 15H8v-5h4a2.5 2.5 0 0 1 0 5zm0-3H10v1h2a.5.5 0 0 0 0-1zM6 20V4h7v5h5v11H6z" />
        </svg>
      );
    case 'image':
      return (
        <svg className={cn(iconClasses, 'text-purple-500')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      );
    case 'video':
      return (
        <svg className={cn(iconClasses, 'text-pink-500')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4h-4z" />
        </svg>
      );
    case 'audio':
      return (
        <svg className={cn(iconClasses, 'text-cyan-500')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      );
    default:
      return (
        <svg className={cn(iconClasses, 'text-muted-foreground')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
        </svg>
      );
  }
}

export function DocumentList() {
  const { documents, selectedDocumentId, selectDocument, removeDocument } = useDocumentStore();

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mb-4 rounded-full bg-muted p-4">
          <svg
            className="h-8 w-8 text-muted-foreground"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-sm font-medium text-foreground">No documents</h3>
        <p className="text-sm text-muted-foreground">Upload a document to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {documents.map((doc) => (
        <div
          key={doc.id}
          onClick={() => selectDocument(doc.id)}
          className={cn(
            'group flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors',
            selectedDocumentId === doc.id
              ? 'bg-primary/10 text-primary'
              : 'hover:bg-muted'
          )}
        >
          {/* File icon */}
          <div className="shrink-0">{getFileIcon(doc.type)}</div>

          {/* File info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{doc.title}</p>
            <p className="text-xs text-muted-foreground">
              {getFileTypeName(doc.type)} • {formatFileSize(doc.fileSize)}
            </p>
          </div>

          {/* Delete button */}
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={(e) => {
              e.stopPropagation();
              removeDocument(doc.id);
            }}
            className="opacity-0 group-hover:opacity-100 shrink-0 text-muted-foreground hover:text-destructive"
          >
            <svg
              className="h-4 w-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </Button>
        </div>
      ))}
    </div>
  );
}
