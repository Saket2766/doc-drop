import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { type DocumentType, FILE_TYPE_MAP, IMAGE_MIME_TYPES, VIDEO_MIME_TYPES, AUDIO_MIME_TYPES } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
// Helper function to detect document type from file

export function detectDocumentType(file: File): DocumentType {
  const mimeType = file.type;

  if (FILE_TYPE_MAP[mimeType]) {
    return FILE_TYPE_MAP[mimeType];
  }

  if (IMAGE_MIME_TYPES.includes(mimeType)) {
    return 'image';
  }

  if (VIDEO_MIME_TYPES.includes(mimeType)) {
    return 'video';
  }

  if (AUDIO_MIME_TYPES.includes(mimeType)) {
    return 'audio';
  }

  // Fallback to extension-based detection
  const extension = file.name.split('.').pop()?.toLowerCase();

  const extensionMap: Record<string, DocumentType> = {
    'pdf': 'pdf',
    'docx': 'docx',
    'doc': 'doc',
    'xlsx': 'xlsx',
    'xls': 'xls',
    'pptx': 'pptx',
    'ppt': 'ppt',
    'txt': 'txt',
    'md': 'md',
    'json': 'json',
    'xml': 'xml',
    'csv': 'csv',
    'jpg': 'image',
    'jpeg': 'image',
    'png': 'image',
    'gif': 'image',
    'webp': 'image',
    'svg': 'image',
    'mp4': 'video',
    'webm': 'video',
    'mov': 'video',
    'mp3': 'audio',
    'wav': 'audio',
    'ogg': 'audio',
  };

  return extension ? (extensionMap[extension] || 'unknown') : 'unknown';
}
// Get human-readable file type name

export function getFileTypeName(type: DocumentType): string {
  const names: Record<DocumentType, string> = {
    'pdf': 'PDF Document',
    'docx': 'Word Document',
    'doc': 'Word Document (Legacy)',
    'xlsx': 'Excel Spreadsheet',
    'xls': 'Excel Spreadsheet (Legacy)',
    'pptx': 'PowerPoint Presentation',
    'ppt': 'PowerPoint Presentation (Legacy)',
    'txt': 'Text File',
    'md': 'Markdown File',
    'json': 'JSON File',
    'xml': 'XML File',
    'csv': 'CSV File',
    'image': 'Image',
    'video': 'Video',
    'audio': 'Audio',
    'unknown': 'Unknown File',
  };

  return names[type];
}
// Format file size

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
