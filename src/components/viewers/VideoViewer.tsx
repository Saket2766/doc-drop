import { cn } from '@/lib/utils';

interface VideoViewerProps {
  fileUrl: string;
  mimeType: string;
  className?: string;
}

export function VideoViewer({ fileUrl, mimeType, className }: VideoViewerProps) {
  return (
    <div className={cn('flex flex-col h-full bg-black', className)}>
      <div className="flex-1 flex items-center justify-center p-4">
        <video
          src={fileUrl}
          controls
          className="max-w-full max-h-full rounded-lg shadow-2xl"
          controlsList="nodownload"
        >
          <source src={fileUrl} type={mimeType} />
          Your browser does not support video playback.
        </video>
      </div>
    </div>
  );
}
