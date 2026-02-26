/** Maximum allowed file size for uploads (100 MB) */
export const MAX_UPLOAD_FILE_SIZE_BYTES = 100 * 1024 * 1024;

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


