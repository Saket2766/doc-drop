import { create } from "zustand";
import { detectDocumentType, type DocumentType } from "@/lib/types";

export type comment = {
    id: string;
    message: string;
    author: string;
    createdAt: Date;
    page?: number;
    resolved: boolean;
}

export type doc = {
    id: number;
    title: string;
    file: File | null;
    fileUrl: string | null;
    mimeType: string;
    documentType: DocumentType;
    fileSize: number;
    uploadedAt: Date;
    comments: comment[];
    creator: string;
    editorAccessUsers: string[];
    currentPage: number;
    totalPages: number;
}

export type project = {
    id: number;
    name: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
    docs: Map<number, doc>;
}

export type pathItem = {
    label: string;
    isLink: boolean;
    href?: string;
}

interface StateStore {
    // State
    projects: Map<number, project>;
    currentProject: project | null;
    currentDoc: doc | null;
    currentPath: pathItem[];
    previewDoc: doc | null;
    isPreviewOpen: boolean;
    
    // Path actions
    setCurrentPath: (path: pathItem[]) => void;
    
    // Project actions
    addProject: (project: project) => void;
    setCurrentProject: (project: project) => void;
    
    // Document actions
    setCurrentDoc: (doc: doc) => void;
    addDocToProject: (projectId: number, file: File) => doc;
    removeDocFromProject: (projectId: number, docId: number) => void;
    
    // Preview actions
    openPreview: (doc: doc) => void;
    closePreview: () => void;
    
    // Page navigation for preview
    setDocCurrentPage: (docId: number, page: number) => void;
    setDocTotalPages: (docId: number, totalPages: number) => void;
}

let docIdCounter = 1;

export const useStateStore = create<StateStore>((set, get) => ({
    projects: new Map(),
    currentProject: null,
    currentDoc: null,
    currentPath: [{label: "Projects", isLink: false}],
    previewDoc: null,
    isPreviewOpen: false,
    
    setCurrentPath: (path: pathItem[]) => {
        set(() => ({ currentPath: path }));
    },
    
    addProject: (project: project) => {
        set((state) => {
            const newProjects = new Map(state.projects);
            newProjects.set(project.id, project);
            return { projects: newProjects };
        });
    },
    
    setCurrentProject: (project: project) => {
        set(() => ({ currentProject: project }));
    },
    
    setCurrentDoc: (doc: doc) => {
        set(() => ({ currentDoc: doc }));
    },
    
    addDocToProject: (projectId: number, file: File) => {
        const id = docIdCounter++;
        const documentType = detectDocumentType(file);
        const fileUrl = URL.createObjectURL(file);
        
        const newDoc: doc = {
            id,
            title: file.name,
            file,
            fileUrl,
            mimeType: file.type,
            documentType,
            fileSize: file.size,
            uploadedAt: new Date(),
            comments: [],
            creator: 'Current User',
            editorAccessUsers: [],
            currentPage: 1,
            totalPages: 1,
        };
        
        set((state) => {
            const project = state.projects.get(projectId);
            if (!project) return state;
            
            const newDocs = new Map(project.docs);
            newDocs.set(id, newDoc);
            
            const updatedProject = {
                ...project,
                docs: newDocs,
                updatedAt: new Date(),
            };
            
            const newProjects = new Map(state.projects);
            newProjects.set(projectId, updatedProject);
            
            return {
                projects: newProjects,
                currentProject: state.currentProject?.id === projectId ? updatedProject : state.currentProject,
            };
        });
        
        return newDoc;
    },
    
    removeDocFromProject: (projectId: number, docId: number) => {
        set((state) => {
            const project = state.projects.get(projectId);
            if (!project) return state;
            
            const doc = project.docs.get(docId);
            if (doc?.fileUrl) {
                URL.revokeObjectURL(doc.fileUrl);
            }
            
            const newDocs = new Map(project.docs);
            newDocs.delete(docId);
            
            const updatedProject = {
                ...project,
                docs: newDocs,
                updatedAt: new Date(),
            };
            
            const newProjects = new Map(state.projects);
            newProjects.set(projectId, updatedProject);
            
            return {
                projects: newProjects,
                currentProject: state.currentProject?.id === projectId ? updatedProject : state.currentProject,
                previewDoc: state.previewDoc?.id === docId ? null : state.previewDoc,
                isPreviewOpen: state.previewDoc?.id === docId ? false : state.isPreviewOpen,
            };
        });
    },
    
    openPreview: (doc: doc) => {
        set(() => ({ previewDoc: doc, isPreviewOpen: true }));
    },
    
    closePreview: () => {
        set(() => ({ previewDoc: null, isPreviewOpen: false }));
    },
    
    setDocCurrentPage: (docId: number, page: number) => {
        set((state) => {
            // Update in previewDoc if it's the current preview
            if (state.previewDoc?.id === docId) {
                return { previewDoc: { ...state.previewDoc, currentPage: page } };
            }
            return state;
        });
    },
    
    setDocTotalPages: (docId: number, totalPages: number) => {
        set((state) => {
            // Update in previewDoc if it's the current preview
            if (state.previewDoc?.id === docId) {
                return { previewDoc: { ...state.previewDoc, totalPages } };
            }
            return state;
        });
    },
}));
