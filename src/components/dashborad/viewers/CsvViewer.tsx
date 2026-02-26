import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface CsvViewerProps {
  file: File;
  className?: string;
}

function parseCSV(content: string): string[][] {
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < content.length; i++) {
    const char = content[i];
    const nextChar = content[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++; // Skip next quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentLine.push(currentCell);
        currentCell = '';
      } else if (char === '\n' || (char === '\r' && nextChar === '\n')) {
        currentLine.push(currentCell);
        lines.push(currentLine);
        currentLine = [];
        currentCell = '';
        if (char === '\r') i++; // Skip \n
      } else if (char !== '\r') {
        currentCell += char;
      }
    }
  }

  // Add last cell and line if there's content
  if (currentCell || currentLine.length > 0) {
    currentLine.push(currentCell);
    lines.push(currentLine);
  }

  return lines;
}

export function CsvViewer({ file, className }: CsvViewerProps) {
  const [data, setData] = useState<string[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCSV = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const content = await file.text();
        const parsed = parseCSV(content);
        
        if (parsed.length > 0) {
          setHeaders(parsed[0]);
          setData(parsed.slice(1));
        }
      } catch (err) {
        console.error('CSV parse error:', err);
        setError('Failed to parse CSV file');
      } finally {
        setIsLoading(false);
      }
    };

    loadCSV();
  }, [file]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading CSV...</p>
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

  if (headers.length === 0 && data.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        <p>No data found in the CSV file</p>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Table content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs sm:text-sm">
          <thead className="sticky top-0 bg-muted z-10">
            <tr>
              <th className="border border-border px-1.5 sm:px-3 py-1.5 sm:py-2 text-left font-semibold text-muted-foreground w-8 sm:w-12">
                #
              </th>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="border border-border px-1.5 sm:px-3 py-1.5 sm:py-2 text-left font-semibold min-w-[60px] sm:min-w-[100px]"
                >
                  {header || `Col ${index + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-muted/30">
                <td className="border border-border px-1.5 sm:px-3 py-1.5 sm:py-2 text-muted-foreground font-mono text-[10px] sm:text-xs">
                  {rowIndex + 1}
                </td>
                {headers.map((_, colIndex) => (
                  <td
                    key={colIndex}
                    className="border border-border px-1.5 sm:px-3 py-1.5 sm:py-2"
                  >
                    {row[colIndex] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer with stats */}
      <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-muted/30 border-t text-[10px] sm:text-xs text-muted-foreground">
        {data.length} rows × {headers.length} columns
      </div>
    </div>
  );
}
