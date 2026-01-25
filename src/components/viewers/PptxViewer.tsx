import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PptxViewerProps {
  file: File;
  currentPage: number;
  onPageChange: (page: number) => void;
  onTotalPagesChange: (totalPages: number) => void;
  className?: string;
}

interface SlideContent {
  title: string;
  content: string[];
  notes?: string;
}

export function PptxViewer({
  file,
  currentPage,
  onPageChange,
  onTotalPagesChange,
  className,
}: PptxViewerProps) {
  const [slides, setSlides] = useState<SlideContent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPresentation = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // PPTX files are ZIP archives containing XML files
        // We'll use JSZip to extract and parse the content
        const JSZip = (await import('jszip')).default;
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);

        // Parse slide content from PPTX
        const slideFiles = Object.keys(zip.files)
          .filter((name) => name.match(/ppt\/slides\/slide\d+\.xml$/))
          .sort((a, b) => {
            const numA = parseInt(a.match(/slide(\d+)/)?.[1] || '0');
            const numB = parseInt(b.match(/slide(\d+)/)?.[1] || '0');
            return numA - numB;
          });

        const parsedSlides: SlideContent[] = [];

        for (const slideFile of slideFiles) {
          const content = await zip.files[slideFile].async('string');
          
          // Parse XML to extract text content
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(content, 'text/xml');
          
          // Extract text from various elements
          const texts: string[] = [];
          let title = '';

          // Find all text elements
          const textElements = xmlDoc.querySelectorAll('*');
          textElements.forEach((el) => {
            if (el.localName === 't' && el.textContent) {
              // Check if this is a title placeholder
              const parent = el.closest('[type="title"], [type="ctrTitle"]');
              if (parent && !title) {
                title = el.textContent;
              } else if (el.textContent.trim()) {
                texts.push(el.textContent.trim());
              }
            }
          });

          // If no explicit title found, use first text as title
          if (!title && texts.length > 0) {
            title = texts.shift() || 'Untitled Slide';
          }

          parsedSlides.push({
            title: title || `Slide ${parsedSlides.length + 1}`,
            content: texts.filter((t, i, arr) => arr.indexOf(t) === i), // Remove duplicates
          });
        }

        setSlides(parsedSlides);
        onTotalPagesChange(parsedSlides.length);
      } catch (err) {
        console.error('PPTX load error:', err);
        setError('Failed to load PowerPoint presentation. The file may be corrupted or in an unsupported format.');
      } finally {
        setIsLoading(false);
      }
    };

    loadPresentation();
  }, [file, onTotalPagesChange]);

  const goToPrevSlide = useCallback(() => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  }, [currentPage, onPageChange]);

  const goToNextSlide = useCallback(() => {
    if (currentPage < slides.length) {
      onPageChange(currentPage + 1);
    }
  }, [currentPage, slides.length, onPageChange]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrevSlide();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        goToNextSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToPrevSlide, goToNextSlide]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading presentation...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn('flex items-center justify-center h-full text-destructive', className)}>
        <p>{error}</p>
      </div>
    );
  }

  if (slides.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        <p>No slides found in the presentation</p>
      </div>
    );
  }

  const currentSlide = slides[currentPage - 1];

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-3 bg-muted/50 border-b">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={goToPrevSlide}
            disabled={currentPage <= 1}
          >
            ← Prev
          </Button>
          <span className="text-sm font-medium px-3">
            Slide {currentPage} of {slides.length}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextSlide}
            disabled={currentPage >= slides.length}
          >
            Next →
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground hidden sm:block">
          Use arrow keys to navigate
        </p>
      </div>

      {/* Slide Content */}
      <div className="flex-1 overflow-auto bg-gradient-to-br from-muted/30 to-muted/10 p-4 sm:p-8 flex items-center justify-center">
        <div className="w-full max-w-4xl aspect-video bg-card rounded-xl shadow-lg border overflow-hidden flex flex-col">
          {/* Slide header */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4 border-b">
            <h2 className="text-xl sm:text-2xl font-bold text-foreground">
              {currentSlide.title}
            </h2>
          </div>
          
          {/* Slide body */}
          <div className="flex-1 p-6 overflow-auto">
            {currentSlide.content.length > 0 ? (
              <ul className="space-y-3">
                {currentSlide.content.map((text, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="text-primary mt-1.5">•</span>
                    <span className="text-foreground">{text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <p>No text content on this slide</p>
              </div>
            )}
          </div>

          {/* Slide footer */}
          <div className="px-6 py-2 border-t bg-muted/30 text-xs text-muted-foreground text-right">
            {currentPage} / {slides.length}
          </div>
        </div>
      </div>

      {/* Slide thumbnails */}
      <div className="border-t bg-muted/30 p-2 overflow-x-auto">
        <div className="flex gap-2">
          {slides.map((slide, index) => (
            <button
              key={index}
              onClick={() => onPageChange(index + 1)}
              className={cn(
                'shrink-0 w-24 h-16 rounded border bg-card text-xs p-2 text-left truncate transition-all',
                currentPage === index + 1
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <span className="font-medium">{index + 1}.</span> {slide.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
