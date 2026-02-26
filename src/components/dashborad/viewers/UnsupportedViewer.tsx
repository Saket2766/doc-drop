import { cn } from '@/lib/utils';
import { type DocumentType } from '@/lib/types';
import { formatFileSize, getFileTypeName } from "@/lib/utils";
import { Button } from '@/components/ui/button';

interface UnsupportedViewerProps {
  fileName: string;
  fileSize: number;
  fileType: DocumentType;
  fileUrl: string;
  className?: string;
}

export function UnsupportedViewer({
  fileName,
  fileSize,
  fileType,
  fileUrl,
  className,
}: UnsupportedViewerProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={cn('flex flex-col items-center justify-center h-full p-4 sm:p-8', className)}>
      <div className="text-center max-w-md px-2">
        {/* File icon */}
        <div className="mb-4 sm:mb-6 inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl bg-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="w-8 h-8 sm:w-10 sm:h-10 text-muted-foreground"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
        </div>

        {/* File info */}
        <h3 className="text-base sm:text-lg font-semibold mb-2 break-all">{fileName}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground mb-1">
          {getFileTypeName(fileType)}
        </p>
        <p className="text-xs sm:text-sm text-muted-foreground mb-4 sm:mb-6">
          {formatFileSize(fileSize)}
        </p>

        {/* Message */}
        <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
          Preview is not available for this file type. You can download the file to view it locally.
        </p>

        {/* Download button */}
        <Button onClick={handleDownload} className="h-9 sm:h-10 text-sm">
          Download File
        </Button>
      </div>
    </div>
  );
}
