import { useState } from "react";
import UploadButton from "@rpldy/upload-button";
import UploadDropZone from "@rpldy/upload-drop-zone";
import Uploady, { useBatchAddListener } from "@rpldy/uploady";
import type { BatchItem } from "@rpldy/shared";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

const ItemsListItem = ({ item }: { item: BatchItem }) => {
  const fileName = item.file?.name || item.url || "Unknown file";
  const fileType = item.file?.type || "Unknown file type";
  const fileSize = item.file?.size || 0;

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>
          <span className="text-wrap">{fileName}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          {fileType}
        </p>
        <p className="text-sm text-muted-foreground">
          {fileSize > 0 ? formatFileSize(fileSize) : "URL file"}
        </p>
      </CardContent>
    </Card>
  );
};

const ItemsList = () => {
  const [items, setItems] = useState<BatchItem[]>([]);

  useBatchAddListener((batch) => {
    setItems((items) => items.concat(batch.items));
  });

  return (
    <div className="w-full flex-1 space-y-4">
      {items.length > 0 && (
        <>
          <div className="space-y-2">
            {items.map((item) => (
              <ItemsListItem key={item.id} item={item} />
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
      <UploadDropZone className="w-full h-full min-h-[80vh] p-4 flex flex-col gap-6 bg-white border-t border-gray-200 ">
        <ItemsList />
        <div className="w-full py-4 flex items-center justify-end">
          <UploadButton className="px-4 py-2 w-fit bg-blue-700 hover:bg-blue-900 text-white rounded-xl font-medium transition-colors cursor-pointer">
            Upload Files
          </UploadButton>
        </div>
      </UploadDropZone>
    </Uploady>
  );
};
