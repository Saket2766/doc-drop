import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import type { DocumentType } from '@/lib/types';

interface TextViewerProps {
  file: File;
  type: DocumentType;
  className?: string;
}

// Simple syntax highlighting for common languages
function highlightSyntax(content: string, type: DocumentType): string {
  if (type === 'json') {
    try {
      // Format and highlight JSON
      const parsed = JSON.parse(content);
      const formatted = JSON.stringify(parsed, null, 2);
      return formatted
        .replace(/(".*?")(?=\s*:)/g, '<span class="text-blue-500 dark:text-blue-400">$1</span>')
        .replace(/:\s*(".*?")/g, ': <span class="text-green-600 dark:text-green-400">$1</span>')
        .replace(/:\s*(\d+\.?\d*)/g, ': <span class="text-amber-600 dark:text-amber-400">$1</span>')
        .replace(/:\s*(true|false|null)/g, ': <span class="text-purple-600 dark:text-purple-400">$1</span>');
    } catch {
      return escapeHtml(content);
    }
  }

  if (type === 'xml') {
    return content
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/(&lt;\/?)([\w:-]+)/g, '$1<span class="text-blue-500 dark:text-blue-400">$2</span>')
      .replace(/([\w:-]+)(=)/g, '<span class="text-amber-600 dark:text-amber-400">$1</span>$2')
      .replace(/(".*?")/g, '<span class="text-green-600 dark:text-green-400">$1</span>');
  }

  if (type === 'md') {
    return content
      .replace(/^(#{1,6})\s(.*)$/gm, '<span class="text-blue-500 dark:text-blue-400">$1</span> <strong>$2</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`(.*?)`/g, '<span class="bg-muted px-1 rounded text-primary">$1</span>')
      .replace(/^\s*[-*+]\s/gm, '<span class="text-primary">• </span>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<span class="text-blue-500 underline">[$1]($2)</span>');
  }

  return escapeHtml(content);
}

function escapeHtml(content: string): string {
  return content
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function TextViewer({ file, type, className }: TextViewerProps) {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLineNumbers, setShowLineNumbers] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const text = await file.text();
        setContent(text);
      } catch (err) {
        console.error('Text file load error:', err);
        setError('Failed to load text file');
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [file]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading file...</p>
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

  const lines = content.split('\n');
  const highlightedContent = highlightSyntax(content, type);
  const highlightedLines = highlightedContent.split('\n');

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 sm:gap-4 p-2 sm:p-3 bg-muted/50 border-b">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs sm:text-sm text-muted-foreground">
            {lines.length} lines • {(file.size / 1024).toFixed(1)} KB
          </span>
        </div>
        <button
          onClick={() => setShowLineNumbers(!showLineNumbers)}
          className={cn(
            'text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 sm:py-1 rounded transition-colors',
            showLineNumbers 
              ? 'bg-primary/10 text-primary' 
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <span className="hidden xs:inline">Line numbers</span>
          <span className="xs:hidden">#</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-card">
        <pre className="text-xs sm:text-sm font-mono">
          <code className="block p-2 sm:p-4">
            {highlightedLines.map((line, index) => (
              <div key={index} className="flex hover:bg-muted/30">
                {showLineNumbers && (
                  <span className="select-none text-muted-foreground text-right pr-2 sm:pr-4 w-8 sm:w-12 shrink-0 border-r border-border mr-2 sm:mr-4 text-[10px] sm:text-sm">
                    {index + 1}
                  </span>
                )}
                <span 
                  className="flex-1 whitespace-pre-wrap break-all"
                  dangerouslySetInnerHTML={{ __html: line || '&nbsp;' }}
                />
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
