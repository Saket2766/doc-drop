import { useState, useEffect } from 'react';
import mammoth from 'mammoth';
import { cn } from '@/lib/utils';

interface DocxViewerProps {
  file: File;
  className?: string;
}

export function DocxViewer({ file, className }: DocxViewerProps) {
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDocument = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        
        // Add some styling to the converted HTML
        const styledHtml = `
          <style>
            .docx-content {
              font-family: 'Inter Variable', -apple-system, BlinkMacSystemFont, sans-serif;
              line-height: 1.6;
              color: inherit;
            }
            .docx-content h1 { font-size: 2em; font-weight: 700; margin: 1em 0 0.5em; }
            .docx-content h2 { font-size: 1.5em; font-weight: 600; margin: 1em 0 0.5em; }
            .docx-content h3 { font-size: 1.25em; font-weight: 600; margin: 1em 0 0.5em; }
            .docx-content h4 { font-size: 1.1em; font-weight: 600; margin: 1em 0 0.5em; }
            .docx-content p { margin: 0.75em 0; }
            .docx-content ul, .docx-content ol { margin: 0.75em 0; padding-left: 2em; }
            .docx-content li { margin: 0.25em 0; }
            .docx-content table { border-collapse: collapse; width: 100%; margin: 1em 0; }
            .docx-content th, .docx-content td { 
              border: 1px solid var(--border); 
              padding: 0.5em 0.75em; 
              text-align: left; 
            }
            .docx-content th { background: var(--muted); font-weight: 600; }
            .docx-content img { max-width: 100%; height: auto; }
            .docx-content a { color: var(--primary); text-decoration: underline; }
            .docx-content blockquote { 
              border-left: 4px solid var(--border); 
              margin: 1em 0; 
              padding-left: 1em;
              color: var(--muted-foreground);
            }
          </style>
          <div class="docx-content">${result.value}</div>
        `;
        
        setHtmlContent(styledHtml);
        
        // Log any conversion messages/warnings
        if (result.messages.length > 0) {
          console.log('DOCX conversion messages:', result.messages);
        }
      } catch (err) {
        console.error('DOCX load error:', err);
        setError('Failed to load Word document. The file may be corrupted or in an unsupported format.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDocument();
  }, [file]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading document...</p>
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

  return (
    <div className={cn('h-full overflow-auto bg-background', className)}>
      <div 
        className="max-w-4xl mx-auto p-8 bg-card shadow-sm min-h-full"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </div>
  );
}
