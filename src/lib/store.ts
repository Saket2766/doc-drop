import { create } from 'zustand';
import type { Document, DocumentStatus, DocComment } from './types';
import { detectDocumentType } from './types';

interface DocumentStore {
  // State
  documents: Document[];
  selectedDocumentId: string | null;
  
  // Actions
  addDocument: (file: File) => Document;
  removeDocument: (id: string) => void;
  selectDocument: (id: string | null) => void;
  getSelectedDocument: () => Document | null;
  
  // Page navigation
  setCurrentPage: (id: string, page: number) => void;
  setTotalPages: (id: string, totalPages: number) => void;
  
  // Status management
  updateStatus: (id: string, status: DocumentStatus) => void;
  
  // Comments
  addComment: (documentId: string, comment: Omit<DocComment, 'id' | 'createdAt' | 'resolved'>) => void;
  resolveComment: (documentId: string, commentId: string, resolvedBy: string) => void;
  reopenComment: (documentId: string, commentId: string) => void;
  
  // Tags
  addTag: (documentId: string, tag: string) => void;
  removeTag: (documentId: string, tag: string) => void;
  
  // Document update
  updateDocument: (id: string, updates: Partial<Document>) => void;
}

// Generate unique ID
const generateId = () => crypto.randomUUID();

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  selectedDocumentId: null,
  
  addDocument: (file: File) => {
    const id = generateId();
    const type = detectDocumentType(file);
    const fileUrl = URL.createObjectURL(file);
    
    const newDocument: Document = {
      id,
      title: file.name,
      type,
      mimeType: file.type,
      status: 'draft',
      file,
      fileUrl,
      fileSize: file.size,
      uploadedAt: new Date(),
      lastUpdatedAt: new Date(),
      creator: 'Current User', // This would come from auth in a real app
      comments: [],
      tags: [],
      activityLog: [
        {
          id: generateId(),
          type: 'version_upload',
          description: `Document "${file.name}" was uploaded`,
          author: 'Current User',
          timestamp: new Date(),
        }
      ],
      versions: [
        {
          id: generateId(),
          versionNumber: 1,
          uploadedAt: new Date(),
          uploadedBy: 'Current User',
          fileUrl,
          fileSize: file.size,
        }
      ],
      currentPage: 1,
      totalPages: 1,
    };
    
    set(state => ({
      documents: [...state.documents, newDocument],
      selectedDocumentId: id,
    }));
    
    return newDocument;
  },
  
  removeDocument: (id: string) => {
    const document = get().documents.find(d => d.id === id);
    if (document?.fileUrl) {
      URL.revokeObjectURL(document.fileUrl);
    }
    
    set(state => ({
      documents: state.documents.filter(d => d.id !== id),
      selectedDocumentId: state.selectedDocumentId === id ? null : state.selectedDocumentId,
    }));
  },
  
  selectDocument: (id: string | null) => {
    set({ selectedDocumentId: id });
  },
  
  getSelectedDocument: () => {
    const { documents, selectedDocumentId } = get();
    return documents.find(d => d.id === selectedDocumentId) || null;
  },
  
  setCurrentPage: (id: string, page: number) => {
    set(state => ({
      documents: state.documents.map(d =>
        d.id === id ? { ...d, currentPage: page } : d
      ),
    }));
  },
  
  setTotalPages: (id: string, totalPages: number) => {
    set(state => ({
      documents: state.documents.map(d =>
        d.id === id ? { ...d, totalPages } : d
      ),
    }));
  },
  
  updateStatus: (id: string, status: DocumentStatus) => {
    set(state => ({
      documents: state.documents.map(d => {
        if (d.id === id) {
          const updatedDoc: Document = {
            ...d,
            status,
            lastUpdatedAt: new Date(),
            activityLog: [
              ...d.activityLog,
              {
                id: generateId(),
                type: 'status_change',
                description: `Status changed to "${status.replace('_', ' ')}"`,
                author: 'Current User',
                timestamp: new Date(),
                metadata: { previousStatus: d.status, newStatus: status },
              }
            ],
          };
          return updatedDoc;
        }
        return d;
      }),
    }));
  },
  
  addComment: (documentId: string, comment) => {
    const newComment: DocComment = {
      ...comment,
      id: generateId(),
      createdAt: new Date(),
      resolved: false,
    };
    
    set(state => ({
      documents: state.documents.map(d => {
        if (d.id === documentId) {
          return {
            ...d,
            comments: [...d.comments, newComment],
            lastUpdatedAt: new Date(),
            activityLog: [
              ...d.activityLog,
              {
                id: generateId(),
                type: 'comment',
                description: `Comment added${comment.page ? ` on page ${comment.page}` : ''}`,
                author: comment.author,
                timestamp: new Date(),
              }
            ],
          };
        }
        return d;
      }),
    }));
  },
  
  resolveComment: (documentId: string, commentId: string, resolvedBy: string) => {
    set(state => ({
      documents: state.documents.map(d => {
        if (d.id === documentId) {
          return {
            ...d,
            comments: d.comments.map(c =>
              c.id === commentId
                ? { ...c, resolved: true, resolvedAt: new Date(), resolvedBy }
                : c
            ),
            lastUpdatedAt: new Date(),
          };
        }
        return d;
      }),
    }));
  },
  
  reopenComment: (documentId: string, commentId: string) => {
    set(state => ({
      documents: state.documents.map(d => {
        if (d.id === documentId) {
          return {
            ...d,
            comments: d.comments.map(c =>
              c.id === commentId
                ? { ...c, resolved: false, resolvedAt: undefined, resolvedBy: undefined }
                : c
            ),
            lastUpdatedAt: new Date(),
          };
        }
        return d;
      }),
    }));
  },
  
  addTag: (documentId: string, tag: string) => {
    set(state => ({
      documents: state.documents.map(d => {
        if (d.id === documentId && !d.tags.includes(tag)) {
          return {
            ...d,
            tags: [...d.tags, tag],
            lastUpdatedAt: new Date(),
            activityLog: [
              ...d.activityLog,
              {
                id: generateId(),
                type: 'tag_added',
                description: `Tag "${tag}" was added`,
                author: 'Current User',
                timestamp: new Date(),
              }
            ],
          };
        }
        return d;
      }),
    }));
  },
  
  removeTag: (documentId: string, tag: string) => {
    set(state => ({
      documents: state.documents.map(d => {
        if (d.id === documentId) {
          return {
            ...d,
            tags: d.tags.filter(t => t !== tag),
            lastUpdatedAt: new Date(),
            activityLog: [
              ...d.activityLog,
              {
                id: generateId(),
                type: 'tag_removed',
                description: `Tag "${tag}" was removed`,
                author: 'Current User',
                timestamp: new Date(),
              }
            ],
          };
        }
        return d;
      }),
    }));
  },
  
  updateDocument: (id: string, updates: Partial<Document>) => {
    set(state => ({
      documents: state.documents.map(d =>
        d.id === id ? { ...d, ...updates, lastUpdatedAt: new Date() } : d
      ),
    }));
  },
}));
