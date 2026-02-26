import { cn } from '@/lib/utils';

interface AudioViewerProps {
  fileUrl: string;
  fileName: string;
  mimeType: string;
  className?: string;
}

export function AudioViewer({ fileUrl, fileName, mimeType, className }: AudioViewerProps) {
  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 p-4 sm:p-8">
        <div className="w-full max-w-md px-2 sm:px-0">
          {/* Audio visualization placeholder */}
          <div className="mb-4 sm:mb-8 flex items-center justify-center">
            <div className="w-20 h-20 sm:w-32 sm:h-32 rounded-full bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-xl">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-10 h-10 sm:w-16 sm:h-16 text-primary-foreground"
              >
                <path
                  fillRule="evenodd"
                  d="M19.952 1.651a.75.75 0 01.298.599V16.303a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.403-4.909l2.311-.66a1.5 1.5 0 001.088-1.442V6.994l-9 2.572v9.737a3 3 0 01-2.176 2.884l-1.32.377a2.553 2.553 0 11-1.402-4.909l2.31-.66a1.5 1.5 0 001.088-1.442V5.25a.75.75 0 01.544-.721l10.5-3a.75.75 0 01.658.122z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </div>

          {/* File name */}
          <h3 className="text-sm sm:text-lg font-semibold text-center mb-4 sm:mb-6 truncate px-2">
            {fileName}
          </h3>

          {/* Audio player */}
          <audio
            src={fileUrl}
            controls
            className="w-full"
            controlsList="nodownload"
          >
            <source src={fileUrl} type={mimeType} />
            Your browser does not support audio playback.
          </audio>
        </div>
      </div>
    </div>
  );
}
