// Supported document types
export type DocumentType = 
  | 'pdf'
  | 'docx'
  | 'doc'
  | 'xlsx'
  | 'xls'
  | 'pptx'
  | 'ppt'
  | 'txt'
  | 'md'
  | 'json'
  | 'xml'
  | 'csv'
  | 'image'
  | 'video'
  | 'audio'
  | 'unknown';

// Document status for workflow
export type DocumentStatus = 'draft' | 'in_review' | 'approved';

// Comment type for document annotations
export interface DocComment {
  id: string;
  message: string;
  author: string;
  createdAt: Date;
  page?: number; // Page-based comments
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

// Activity log entry
export interface ActivityLogEntry {
  id: string;
  type: 'comment' | 'status_change' | 'version_upload' | 'tag_added' | 'tag_removed';
  description: string;
  author: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

// Document version
export interface DocumentVersion {
  id: string;
  versionNumber: number;
  uploadedAt: Date;
  uploadedBy: string;
  fileUrl: string;
  fileSize: number;
  changelog?: string;
}

// Main document interface
export interface Document {
  id: string;
  title: string;
  type: DocumentType;
  mimeType: string;
  status: DocumentStatus;
  file: File | null;
  fileUrl: string | null;
  fileSize: number;
  uploadedAt: Date;
  lastUpdatedAt: Date;
  creator: string;
  comments: DocComment[];
  tags: string[];
  activityLog: ActivityLogEntry[];
  versions: DocumentVersion[];
  currentPage: number;
  totalPages: number;
  projectId?: string;
}

// Project (folder) interface
export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  creator: string;
  documentIds: string[];
  color?: string;
}

// File type mapping for detection
export const FILE_TYPE_MAP: Record<string, DocumentType> = {
  'application/pdf': 'pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'application/vnd.ms-excel': 'xls',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
  'application/vnd.ms-powerpoint': 'ppt',
  'text/plain': 'txt',
  'text/markdown': 'md',
  'application/json': 'json',
  'application/xml': 'xml',
  'text/xml': 'xml',
  'text/csv': 'csv',
};

export const IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/bmp',
];

export const VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/quicktime',
];

export const AUDIO_MIME_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/ogg',
  'audio/webm',
];

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
