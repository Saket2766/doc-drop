import { useState, useCallback } from "react";
import UploadButton from "@rpldy/upload-button";
import UploadDropZone from "@rpldy/upload-drop-zone";
import Uploady, { useBatchAddListener } from "@rpldy/uploady";
import type { BatchItem } from "@rpldy/shared";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { useStateStore, type doc } from "@/store/stateStore";
import { formatFileSize, getFileTypeName, detectDocumentType } from "@/lib/types";
import { GlobalDocumentPreview } from "./DocumentPreviewModal";
import { cn } from "@/lib/utils";

// File type icon component
function FileTypeIcon({ type }: { type: string }) {
  const iconClasses = 'w-6 h-6';
  
  switch (type) {
    case 'pdf':
      return (
        <svg className={cn(iconClasses, 'text-red-500')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M7 18h2v-2H7v2zm0-4h2v-2H7v2zm0-4h2V8H7v2zm12-8H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2zm0 18H5V4h14v16z" />
        </svg>
      );
    case 'docx':
    case 'doc':
      return (
        <svg className={cn(iconClasses, 'text-blue-500')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
        </svg>
      );
    case 'xlsx':
    case 'xls':
    case 'csv':
      return (
        <svg className={cn(iconClasses, 'text-green-500')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 11h-2v2H9v-2H7v-2h2V9h2v2h2v2zM6 20V4h7v5h5v11H6z" />
        </svg>
      );
    case 'pptx':
    case 'ppt':
      return (
        <svg className={cn(iconClasses, 'text-orange-500')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-2 15H8v-5h4a2.5 2.5 0 0 1 0 5zm0-3H10v1h2a.5.5 0 0 0 0-1zM6 20V4h7v5h5v11H6z" />
        </svg>
      );
    case 'image':
      return (
        <svg className={cn(iconClasses, 'text-purple-500')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
        </svg>
      );
    case 'video':
      return (
        <svg className={cn(iconClasses, 'text-pink-500')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18 4l2 4h-3l-2-4h-2l2 4h-3l-2-4H8l2 4H7L5 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V4h-4z" />
        </svg>
      );
    case 'audio':
      return (
        <svg className={cn(iconClasses, 'text-cyan-500')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
        </svg>
      );
    default:
      return (
        <svg className={cn(iconClasses, 'text-gray-400')} viewBox="0 0 24 24" fill="currentColor">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zM6 20V4h7v5h5v11H6z" />
        </svg>
      );
  }
}

// Helper to get document type from BatchItem
function getDocumentTypeFromItem(item: BatchItem): string {
  if (!item.file) return 'unknown';
  // Create a minimal File-like object to detect type
  const fakeFile = {
    name: item.file.name || '',
    type: item.file.type || '',
  } as File;
  return detectDocumentType(fakeFile);
}

// Item card with preview capability
const ItemsListItem = ({ item, onPreview }: { item: BatchItem; onPreview: () => void }) => {
  const fileName = item.file?.name || item.url || "Unknown file";
  const fileSize = item.file?.size || 0;
  const documentType = getDocumentTypeFromItem(item);

  return (
    <Card 
      size="sm" 
      className="cursor-pointer hover:bg-gray-50 transition-colors"
      onClick={onPreview}
    >
      <CardHeader className="flex-row items-center gap-3">
        <FileTypeIcon type={documentType} />
        <CardTitle>
          <span className="text-wrap text-sm">{fileName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">
          {getFileTypeName(documentType as Parameters<typeof getFileTypeName>[0])}
        </p>
        <p className="text-xs text-muted-foreground">
          {fileSize > 0 ? formatFileSize(fileSize) : "URL file"}
        </p>
      </CardContent>
    </Card>
  );
};

const ItemsList = () => {
  const [items, setItems] = useState<BatchItem[]>([]);
  const { currentProject, openPreview } = useStateStore();

  useBatchAddListener((batch) => {
    setItems((prevItems) => prevItems.concat(batch.items));
    
    // Also add to store for persistence within project
    if (currentProject) {
      batch.items.forEach((item) => {
        if (item.file) {
          // Cast FileLike to File for our store
          useStateStore.getState().addDocToProject(currentProject.id, item.file as unknown as File);
        }
      });
    }
  });

  const handlePreview = useCallback((item: BatchItem) => {
    if (!item.file) return;
    
    const file = item.file as unknown as File;
    const documentType = getDocumentTypeFromItem(item);
    const fileUrl = URL.createObjectURL(file);
    
    // Create a doc object for preview
    const previewDoc: doc = {
      id: Date.now(),
      title: file.name,
      file: file,
      fileUrl,
      mimeType: file.type,
      documentType: documentType as doc['documentType'],
      fileSize: file.size,
      uploadedAt: new Date(),
      comments: [],
      creator: 'Current User',
      editorAccessUsers: [],
      currentPage: 1,
      totalPages: 1,
    };
    
    openPreview(previewDoc);
  }, [openPreview]);

  return (
    <div className="w-full flex-1 space-y-4">
      {items.length > 0 && (
        <>
          <p className="text-sm text-muted-foreground">
            Click on a file to preview it
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <ItemsListItem 
                key={item.id} 
                item={item} 
                onPreview={() => handlePreview(item)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};


export const ItemsView = () => {
  return (
    <Uploady
      debug
      destination={{ url: "https://your-upload-endpoint.com" }}
      autoUpload={false}
    >
      <UploadDropZone className="w-full h-full min-h-[80vh] p-4 flex flex-col gap-6">
        <ItemsList />
        <div className="w-full py-4 flex items-center justify-end">
          <UploadButton className="px-4 py-2 w-fit bg-blue-700 hover:bg-blue-900 text-white rounded-xl font-medium transition-colors cursor-pointer">
            Upload Files
          </UploadButton>
        </div>
      </UploadDropZone>
      
      {/* Global preview modal */}
      <GlobalDocumentPreview />
    </Uploady>
  );
};
