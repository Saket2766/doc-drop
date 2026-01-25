import { useRef, useState, useCallback } from 'react';
import { useDocumentStore } from '@/lib/store';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

// Accepted file types
const ACCEPTED_FILE_TYPES = [
  // Documents
  '.pdf',
  '.doc',
  '.docx',
  '.xls',
  '.xlsx',
  '.ppt',
  '.pptx',
  // Text
  '.txt',
  '.md',
  '.json',
  '.xml',
  '.csv',
  // Images
  '.jpg',
  '.jpeg',
  '.png',
  '.gif',
  '.webp',
  '.svg',
  '.bmp',
  // Video
  '.mp4',
  '.webm',
  '.mov',
  '.ogg',
  // Audio
  '.mp3',
  '.wav',
  '.ogg',
].join(',');

interface FileUploadProps {
  onFileUploaded?: () => void;
  className?: string;
}

export function FileUpload({ onFileUploaded, className }: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const addDocument = useDocumentStore((state) => state.addDocument);

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;

      // Process each file
      Array.from(files).forEach((file) => {
        addDocument(file);
      });

      onFileUploaded?.();

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [addDocument, onFileUploaded]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={cn('w-full', className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        onChange={handleInputChange}
        className="hidden"
        multiple
      />

      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFilePicker}
        className={cn(
          'relative cursor-pointer rounded-xl border-2 border-dashed p-8 transition-all duration-200',
          'hover:border-primary/50 hover:bg-primary/5',
          isDragging
            ? 'border-primary bg-primary/10 scale-[1.02]'
            : 'border-border bg-muted/30'
        )}
      >
        <div className="flex flex-col items-center justify-center text-center">
          {/* Upload icon */}
          <div
            className={cn(
              'mb-4 rounded-full p-4 transition-colors',
              isDragging ? 'bg-primary/20' : 'bg-muted'
            )}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className={cn(
                'h-8 w-8 transition-colors',
                isDragging ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
              />
            </svg>
          </div>

          {/* Text */}
          <h3 className="mb-1 text-base font-semibold">
            {isDragging ? 'Drop files here' : 'Upload documents'}
          </h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Drag & drop or click to browse
          </p>

          {/* Button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              openFilePicker();
            }}
          >
            Choose Files
          </Button>

          {/* Supported formats */}
          <p className="mt-4 text-xs text-muted-foreground">
            Supports PDF, Word, Excel, PowerPoint, Images, Videos, Audio, and Text files
          </p>
        </div>
      </div>
    </div>
  );
}
