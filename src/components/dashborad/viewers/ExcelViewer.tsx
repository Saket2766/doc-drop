import { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExcelViewerProps {
  file: File;
  className?: string;
}

interface SheetData {
  name: string;
  data: (string | number | null)[][];
  headers: string[];
}

export function ExcelViewer({ file, className }: ExcelViewerProps) {
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWorkbook = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        const parsedSheets: SheetData[] = workbook.SheetNames.map((sheetName) => {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json<(string | number | null)[]>(worksheet, { 
            header: 1,
            defval: null,
          });
          
          // Extract headers (first row) and data
          const headers = jsonData[0]?.map(h => String(h ?? '')) || [];
          const data = jsonData.slice(1);
          
          return {
            name: sheetName,
            data,
            headers,
          };
        });
        
        setSheets(parsedSheets);
      } catch (err) {
        console.error('Excel load error:', err);
        setError('Failed to load Excel file. The file may be corrupted or in an unsupported format.');
      } finally {
        setIsLoading(false);
      }
    };

    loadWorkbook();
  }, [file]);

  if (isLoading) {
    return (
      <div className={cn('flex items-center justify-center h-full', className)}>
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Loading spreadsheet...</p>
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

  if (sheets.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        <p>No data found in the spreadsheet</p>
      </div>
    );
  }

  const currentSheet = sheets[activeSheet];

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Sheet tabs */}
      {sheets.length > 1 && (
        <div className="flex items-center gap-1 p-1.5 sm:p-2 bg-muted/50 border-b overflow-x-auto">
          {sheets.map((sheet, index) => (
            <Button
              key={sheet.name}
              variant={activeSheet === index ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setActiveSheet(index)}
              className="shrink-0 h-7 sm:h-8 px-2 sm:px-3 text-xs sm:text-sm"
            >
              {sheet.name}
            </Button>
          ))}
        </div>
      )}

      {/* Table content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse text-xs sm:text-sm">
          <thead className="sticky top-0 bg-muted z-10">
            <tr>
              <th className="border border-border px-1.5 sm:px-3 py-1.5 sm:py-2 text-left font-semibold text-muted-foreground w-8 sm:w-12">
                #
              </th>
              {currentSheet.headers.map((header, index) => (
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
            {currentSheet.data.map((row, rowIndex) => (
              <tr key={rowIndex} className="hover:bg-muted/30">
                <td className="border border-border px-1.5 sm:px-3 py-1.5 sm:py-2 text-muted-foreground font-mono text-[10px] sm:text-xs">
                  {rowIndex + 1}
                </td>
                {currentSheet.headers.map((_, colIndex) => (
                  <td
                    key={colIndex}
                    className="border border-border px-1.5 sm:px-3 py-1.5 sm:py-2"
                  >
                    {row[colIndex] !== null && row[colIndex] !== undefined
                      ? String(row[colIndex])
                      : ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        
        {currentSheet.data.length === 0 && (
          <div className="flex items-center justify-center p-4 sm:p-8 text-muted-foreground">
            <p>This sheet is empty</p>
          </div>
        )}
      </div>

      {/* Footer with stats */}
      <div className="px-2 sm:px-3 py-1.5 sm:py-2 bg-muted/30 border-t text-[10px] sm:text-xs text-muted-foreground">
        {currentSheet.data.length} rows × {currentSheet.headers.length} columns
      </div>
    </div>
  );
}
