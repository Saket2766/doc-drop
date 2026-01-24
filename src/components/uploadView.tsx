import { useState } from "react";
import UploadButton from "@rpldy/upload-button";
import Uploady, { useBatchAddListener, useUploady } from "@rpldy/uploady";
import type { BatchItem } from "@rpldy/shared";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
};

const UploadListItem = ({ item }: { item: BatchItem }) => {
    const fileName = item.file?.name || item.url || "Unknown file";
    const fileSize = item.file?.size || 0;

    return (
        <Card size="sm">
            <CardHeader>
                <CardTitle>
                    <span className="truncate">{fileName}</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    {fileSize > 0 ? formatFileSize(fileSize) : "URL file"}
                </p>
            </CardContent>
        </Card>
    );
};

const UploadList = () => {
    const { processPending } = useUploady();
    const [items, setItems] = useState<BatchItem[]>([]);

    useBatchAddListener((batch) => {
        setItems((items) => items.concat(batch.items));
    });

    return (
        <div className="space-y-4">
            {items.length > 0 && (
                <>
                    <div className="space-y-2">
                        <h2 className="text-lg font-semibold">Selected Files</h2>
                        <div className="space-y-2">
                            {items.map((item) => (
                                <UploadListItem key={item.id} item={item} />
                            ))}
                        </div>
                    </div>
                    <button
                        onClick={() => processPending()}
                        className="px-4 py-2 w-fit bg-blue-700 hover:bg-blue-900 text-white rounded-xl font-medium transition-colors cursor-pointer"
                        >
                        Upload All
                    </button>
                </>
            )}
        </div>
    );
};

export const UploadView = () => {
    
    return (
        <div className="flex flex-col gap-6">
            <Uploady debug
            destination={{ url: "https://your-upload-endpoint.com" }}
            autoUpload={false}>
                <UploadButton 
                    className="px-4 py-2 w-fit bg-blue-700 hover:bg-blue-900 text-white rounded-xl font-medium transition-colors cursor-pointer"
                >
                    Upload Files
                </UploadButton>
                <UploadList />
            </Uploady>
            
            
        </div>
    );
};