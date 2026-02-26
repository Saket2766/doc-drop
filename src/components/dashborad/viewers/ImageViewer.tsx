import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ImageViewerProps {
  fileUrl: string;
  fileName: string;
  className?: string;
}

export function ImageViewer({ fileUrl, fileName, className }: ImageViewerProps) {
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const zoomIn = () => setScale((prev) => Math.min(prev + 0.25, 5));
  const zoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.25));
  const resetZoom = () => setScale(1);
  const rotateLeft = () => setRotation((prev) => prev - 90);
  const rotateRight = () => setRotation((prev) => prev + 90);

  const handleLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  const handleError = () => {
    setIsLoading(false);
    setError('Failed to load image');
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 p-2 sm:p-3 bg-muted/50 border-b">
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="outline" size="sm" onClick={zoomOut} disabled={scale <= 0.25} className="h-7 sm:h-8 w-7 sm:w-8 p-0">
            −
          </Button>
          <Button variant="ghost" size="sm" onClick={resetZoom} className="h-7 sm:h-8 px-1 sm:px-2 text-xs sm:text-sm">
            {Math.round(scale * 100)}%
          </Button>
          <Button variant="outline" size="sm" onClick={zoomIn} disabled={scale >= 5} className="h-7 sm:h-8 w-7 sm:w-8 p-0">
            +
          </Button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="outline" size="sm" onClick={rotateLeft} className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
            ↺ <span className="hidden xs:inline">Rotate</span>
          </Button>
          <Button variant="outline" size="sm" onClick={rotateRight} className="h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm">
            <span className="hidden xs:inline">Rotate</span> ↻
          </Button>
        </div>
      </div>

      {/* Image content */}
      <div className="flex-1 overflow-auto bg-[repeating-conic-gradient(#80808015_0%_25%,transparent_0%_50%)] bg-[length:20px_20px] flex items-center justify-center p-2 sm:p-4">
        {error ? (
          <div className="text-destructive">
            <p>{error}</p>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}
            <img
              src={fileUrl}
              alt={fileName}
              onLoad={handleLoad}
              onError={handleError}
              className={cn(
                'max-w-full max-h-full object-contain shadow-lg transition-transform duration-200',
                isLoading && 'opacity-0'
              )}
              style={{
                transform: `scale(${scale}) rotate(${rotation}deg)`,
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
