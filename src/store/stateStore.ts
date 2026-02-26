import { create } from "zustand";
import { type DocumentType } from "@/lib/types";
import { detectDocumentType } from "@/lib/utils";
import { createJSONStorage, persist } from "zustand/middleware";
import * as authApi from "@/api/authApi";
import * as commentsApi from "@/api/commentsApi";
import * as documentsApi from "@/api/documentsApi";
import * as usersApi from "@/api/usersApi";
import * as projectsApi from "@/api/projectsApi";

interface PersistedMap {
  __type: "Map";
  value: [number, project][];
}

export type comment = {
  id: string;
  message: string;
  author: string;
  createdAt: Date;
  page?: number;
  resolved: boolean;
  parentCommentId?: string; // For threading replies
  replytoUserId?: string;
  version?: number; // Version number this comment belongs to (optional for backward compatibility)
};

export type docVersion = {
  id: string;
  versionNumber: number;
  uploadedAt: Date;
  uploadedBy: string;
  file: File | null;
  fileUrl: string;
  fileSize: number;
  pdfUrl?: string | null;
  conversionStatus?: "none" | "pending" | "processing" | "succeeded" | "failed";
  conversionError?: string | null;
  convertedAt?: Date | null;
  conversionAttempts?: number;
};

export type DocTag = "red" | "green" | "yellow";

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
  currentPage: number;
  totalPages: number;
  versions: docVersion[];
  currentVersionNumber: number;
  projectId: number; // Reference to parent project
  isFavorite: boolean;
  tag: DocTag | null;
};

export type project = {
  id: number;
  name: string;
  description: string;
  creator: string;
  editorAccessUsers: string[];
  viewerAccessUsers: string[];
  createdAt: Date;
  updatedAt: Date;
  docs: Map<number, doc>;
};

export type pathItem = {
  label: string;
  isLink: boolean;
  href?: string;
};

/** Matches backend User model (password omitted for client safety) */
export type user = {
  id: number;
  username: string;
  email: string;
  token: string; // JWT for auth
  createdAt: Date;
  updatedAt: Date;
};

export type CommentFilterMode = "all" | "page";

interface StateStore {
  // State
  user: user | null;
  projects: Map<number, project>;
  currentProject: project | null;
  currentDoc: doc | null;
  currentPath: pathItem[];
  previewDoc: doc | null;
  isPreviewOpen: boolean;
  isCommentsOpen: boolean;
  commentFilterMode: CommentFilterMode;
  uploadInProgressCount: number;

  // User actions
  setUser: (user: user | null) => void;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loadProjects: () => Promise<void>;
  createProject: (name: string, description: string) => Promise<project>;

  // Path actions
  setCurrentPath: (path: pathItem[]) => void;

  // Project actions
  addProject: (project: project) => void;
  setCurrentProject: (project: project) => void;
  refreshProject: (projectId: number) => Promise<project>;
  deleteProject: (projectId: number) => Promise<void>;
  grantProjectAccess: (
    projectId: number,
    userIdentifier: string,
    role: "editor" | "viewer",
  ) => Promise<project>;
  revokeProjectAccess: (
    projectId: number,
    userIdentifier: string,
  ) => Promise<project>;
  searchUsers: (q: string) => Promise<usersApi.UserResponse[]>;

  // Document actions
  setCurrentDoc: (doc: doc | null) => void;
  loadProjectDocuments: (projectId: number) => Promise<void>;
  addDocToProject: (projectId: number, file: File) => doc;
  uploadDocToProject: (projectId: number, file: File) => Promise<doc>;
  deleteDocFromProject: (projectId: number, docId: number) => Promise<void>;
  refreshDocDownloadUrl: (projectId: number, docId: number) => Promise<void>;
  loadDocVersions: (projectId: number, docId: number) => Promise<void>;
  removeDocFromProject: (projectId: number, docId: number) => void;
  toggleDocFavorite: (projectId: number, docId: number) => void;
  setDocTag: (projectId: number, docId: number, tag: DocTag | null) => void;
  addVersionToDoc: (projectId: number, docId: number, file: File) => void;
  uploadNewVersionToDoc: (
    projectId: number,
    docId: number,
    file: File,
  ) => Promise<void>;
  switchDocVersion: (
    projectId: number,
    docId: number,
    versionNumber: number,
  ) => void;

  // Comment actions
  loadCommentsForDocument: (projectId: number, docId: number) => Promise<void>;
  addComment: (
    projectId: number,
    docId: number,
    comment: Omit<comment, "id" | "createdAt" | "resolved" | "version">,
    page?: number,
  ) => Promise<void>;

  // Preview actions
  openPreview: (doc: doc) => void;
  closePreview: () => void;

  // Comments panel actions
  toggleComments: () => void;
  setCommentsOpen: (isOpen: boolean) => void;
  setCommentFilterMode: (mode: CommentFilterMode) => void;

  // Page navigation for preview
  setDocCurrentPage: (docId: number, page: number) => void;
  setDocTotalPages: (docId: number, totalPages: number) => void;
}

let docIdCounter = 1;

function normalizeDocTag(tag: unknown): DocTag | null {
  if (tag === "red" || tag === "green" || tag === "yellow") return tag;
  return null;
}

function mapCommentResponseToComment(c: commentsApi.CommentResponse): comment {
  return {
    id: c.id,
    message: c.message,
    author: c.author,
    createdAt: new Date(c.createdAt),
    page: c.page,
    resolved: c.resolved,
    parentCommentId: c.parentCommentId,
    replytoUserId: c.replytoUserId,
    version: c.version,
  };
}

function mapBackendVersionToDocVersion(
  v: documentsApi.DocumentVersionResponse,
): docVersion {
  return {
    id: v.id,
    versionNumber: v.versionNumber,
    uploadedAt: new Date(v.uploadedAt),
    uploadedBy: v.uploadedBy,
    file: null,
    fileUrl: v.fileUrl,
    fileSize: v.fileSize,
    pdfUrl: v.pdfUrl ?? null,
    conversionStatus: v.conversionStatus,
    conversionError: v.conversionError ?? null,
    convertedAt: v.convertedAt ? new Date(v.convertedAt) : null,
    conversionAttempts: v.conversionAttempts ?? 0,
  };
}

function mapBackendDocToStoreDoc(d: documentsApi.DocumentResponse): doc {
  const versions = d.versions
    ? d.versions.map(mapBackendVersionToDocVersion)
    : [];
  return {
    id: d.id,
    title: d.title,
    file: null,
    fileUrl: d.fileUrl,
    mimeType: d.mimeType,
    documentType: d.documentType as DocumentType,
    fileSize: d.fileSize,
    uploadedAt: new Date(d.uploadedAt),
    comments: [],
    currentPage: d.currentPage ?? 1,
    totalPages: d.totalPages ?? 1,
    versions,
    currentVersionNumber: d.currentVersionNumber ?? 1,
    projectId: d.projectId,
    isFavorite: d.isFavorite ?? false,
    tag: normalizeDocTag(d.tag),
  };
}

export const useStateStore = create<StateStore>()(
  persist(
    (set) => ({
      user: null,
      projects: new Map(),
      currentProject: null,
      currentDoc: null,
      currentPath: [{ label: "Projects", isLink: true, href: "/dashboard" }],
      previewDoc: null,
      isPreviewOpen: false,
      isCommentsOpen: true,
      commentFilterMode: "all" as CommentFilterMode,
      uploadInProgressCount: 0,

      setUser: (user: user | null) => {
        set(() => ({ user }));
      },

      login: async (email: string, password: string) => {
        const res = await authApi.login(email, password);
        set({
          user: {
            id: res.userId,
            username: res.username,
            email: res.email,
            token: res.token,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          projects: new Map(),
          currentProject: null,
          currentDoc: null,
          currentPath: [{ label: "Projects", isLink: true, href: "/dashboard" }],
          previewDoc: null,
          isPreviewOpen: false,
          uploadInProgressCount: 0,
        });
      },

      signup: async (username: string, email: string, password: string) => {
        await usersApi.createUser({ username, email, password });
        await useStateStore.getState().login(email, password);
      },

      logout: () => {
        set({
          user: null,
          projects: new Map(),
          currentProject: null,
          currentDoc: null,
          currentPath: [{ label: "Projects", isLink: true, href: "/dashboard" }],
          previewDoc: null,
          isPreviewOpen: false,
          uploadInProgressCount: 0,
        });
      },

      loadProjects: async () => {
        const list = await projectsApi.getProjects();
        set((state) => {
          const projects = new Map<number, project>();
          for (const p of list) {
            const existing = state.projects.get(p.id);
            projects.set(p.id, {
              id: p.id,
              name: p.name,
              description: p.description,
              creator: p.creator ?? "",
              editorAccessUsers: p.editorAccessUsers ?? [],
              viewerAccessUsers: p.viewerAccessUsers ?? [],
              createdAt: new Date(p.createdAt),
              updatedAt: new Date(p.updatedAt),
              docs: existing?.docs ?? new Map(),
            });
          }
          return { projects };
        });
      },

      createProject: async (name: string, description: string) => {
        const user = useStateStore.getState().user;
        if (!user) throw new Error("Not logged in");
        const p = await projectsApi.createProject({
          name,
          description,
          userId: user.id,
        });
        const creator = p.creator ?? "";
        const editors = p.editorAccessUsers ?? [];
        const newProject: project = {
          id: p.id,
          name: p.name,
          description: p.description,
          creator,
          editorAccessUsers: creator && !editors.includes(creator) ? [creator, ...editors] : editors,
          viewerAccessUsers: p.viewerAccessUsers ?? [],
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          docs: new Map(),
        };
        set((state) => {
          const next = new Map(state.projects);
          next.set(newProject.id, newProject);
          return { projects: next };
        });
        return newProject;
      },

      setCurrentPath: (path: pathItem[]) => {
        set(() => ({ currentPath: path }));
      },

      loadProjectDocuments: async (projectId: number) => {
        const list = await documentsApi.getDocumentsByProjectId(projectId);
        const docs = new Map<number, doc>();
        for (const d of list) {
          docs.set(d.id, mapBackendDocToStoreDoc(d));
        }
        set((state) => {
          const project = state.projects.get(projectId);
          if (!project) return state;
          const updated: project = { ...project, docs };
          const next = new Map(state.projects);
          next.set(projectId, updated);
          return {
            projects: next,
            currentProject:
              state.currentProject?.id === projectId ? updated : state.currentProject,
          };
        });
      },

      refreshProject: async (projectId: number) => {
        const p = await projectsApi.getProjectById(projectId);
        const creator = p.creator ?? "";
        const editors = p.editorAccessUsers ?? [];
        const updated: project = {
          id: p.id,
          name: p.name,
          description: p.description,
          creator,
          editorAccessUsers:
            creator && !editors.includes(creator) ? [creator, ...editors] : editors,
          viewerAccessUsers: p.viewerAccessUsers ?? [],
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          docs: useStateStore.getState().projects.get(p.id)?.docs ?? new Map(),
        };
        set((state) => {
          const next = new Map(state.projects);
          next.set(projectId, updated);
          return {
            projects: next,
            currentProject:
              state.currentProject?.id === projectId ? updated : state.currentProject,
          };
        });
        return updated;
      },

      deleteProject: async (projectId: number) => {
        await projectsApi.deleteProject(projectId);
        set((state) => {
          const next = new Map(state.projects);
          next.delete(projectId);
          return {
            projects: next,
            currentProject:
              state.currentProject?.id === projectId ? null : state.currentProject,
          };
        });
      },

      grantProjectAccess: async (
        projectId: number,
        userIdentifier: string,
        role: "editor" | "viewer",
      ) => {
        const p = await authApi.grantProjectAccess(projectId, {
          userIdentifier,
          role,
        });
        const creator = p.creator ?? "";
        const editors = p.editorAccessUsers ?? [];
        const updated: project = {
          id: p.id,
          name: p.name,
          description: p.description,
          creator,
          editorAccessUsers:
            creator && !editors.includes(creator) ? [creator, ...editors] : editors,
          viewerAccessUsers: p.viewerAccessUsers ?? [],
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          docs: useStateStore.getState().projects.get(p.id)?.docs ?? new Map(),
        };
        set((state) => {
          const next = new Map(state.projects);
          next.set(projectId, updated);
          return {
            projects: next,
            currentProject:
              state.currentProject?.id === projectId ? updated : state.currentProject,
          };
        });
        return updated;
      },

      revokeProjectAccess: async (
        projectId: number,
        userIdentifier: string,
      ) => {
        const p = await authApi.revokeProjectAccess(projectId, {
          userIdentifier,
        });
        const creator = p.creator ?? "";
        const editors = p.editorAccessUsers ?? [];
        const updated: project = {
          id: p.id,
          name: p.name,
          description: p.description,
          creator,
          editorAccessUsers:
            creator && !editors.includes(creator) ? [creator, ...editors] : editors,
          viewerAccessUsers: p.viewerAccessUsers ?? [],
          createdAt: new Date(p.createdAt),
          updatedAt: new Date(p.updatedAt),
          docs: useStateStore.getState().projects.get(p.id)?.docs ?? new Map(),
        };
        set((state) => {
          const next = new Map(state.projects);
          next.set(projectId, updated);
          return {
            projects: next,
            currentProject:
              state.currentProject?.id === projectId ? updated : state.currentProject,
          };
        });
        return updated;
      },

      searchUsers: async (q: string) => {
        return usersApi.searchUsers(q);
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

      setCurrentDoc: (doc: doc | null) => {
        set(() => ({ currentDoc: doc }));
      },

      addDocToProject: (projectId: number, file: File) => {
        const id = docIdCounter++;
        const documentType = detectDocumentType(file);
        const fileUrl = URL.createObjectURL(file);
        const versionId = crypto.randomUUID();

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
          currentPage: 1,
          totalPages: 1,
          versions: [
            {
              id: versionId,
              versionNumber: 1,
              uploadedAt: new Date(),
              uploadedBy: "Current User",
              fileUrl,
              file,
              fileSize: file.size,
            },
          ],
          currentVersionNumber: 1,
          projectId,
          isFavorite: false,
          tag: null,
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
            currentProject:
              state.currentProject?.id === projectId
                ? updatedProject
                : state.currentProject,
          };
        });

        return newDoc;
      },

      uploadDocToProject: async (projectId: number, file: File) => {
        const user = useStateStore.getState().user;
        if (!user) throw new Error("Not logged in");

        set((s) => ({
          uploadInProgressCount: s.uploadInProgressCount + 1,
        }));
        try {
          const backendDoc = await documentsApi.uploadDocumentMultipart({
          file,
          projectId,
          title: file.name,
          mimeType: file.type,
        });

        const newDoc = mapBackendDocToStoreDoc(backendDoc);

        try {
          const versions = await documentsApi.getDocumentVersions(
            backendDoc.id,
          );
          newDoc.versions = versions.map(mapBackendVersionToDocVersion);
        } catch {
          // Versions endpoint is optional for basic preview; ignore failures.
        }

        try {
          const dl = await documentsApi.getDocumentDownloadUrl(backendDoc.id);
          newDoc.fileUrl = dl.downloadUrl;
        } catch {
          // Fallback to whatever upload response returned.
        }

        set((state) => {
          const project = state.projects.get(projectId);
          if (!project) return state;

          const newDocs = new Map(project.docs);
          newDocs.set(newDoc.id, newDoc);

          const updatedProject = {
            ...project,
            docs: newDocs,
            updatedAt: new Date(),
          };

          const newProjects = new Map(state.projects);
          newProjects.set(projectId, updatedProject);

          return {
            projects: newProjects,
            currentProject:
              state.currentProject?.id === projectId
                ? updatedProject
                : state.currentProject,
          };
        });

          return newDoc;
        } finally {
          set((s) => ({
            uploadInProgressCount: Math.max(0, s.uploadInProgressCount - 1),
          }));
        }
      },

      deleteDocFromProject: async (projectId: number, docId: number) => {
        await documentsApi.deleteDocument(docId);
        useStateStore.getState().removeDocFromProject(projectId, docId);
      },

      refreshDocDownloadUrl: async (projectId: number, docId: number) => {
        const dl = await documentsApi.getDocumentDownloadUrl(docId);
        set((state) => {
          const project = state.projects.get(projectId);
          if (!project) return state;
          const existing = project.docs.get(docId);
          if (!existing) return state;

          const updatedDoc: doc = { ...existing, fileUrl: dl.downloadUrl };

          const newDocs = new Map(project.docs);
          newDocs.set(docId, updatedDoc);

          const updatedProject = {
            ...project,
            docs: newDocs,
            updatedAt: new Date(),
          };

          const newProjects = new Map(state.projects);
          newProjects.set(projectId, updatedProject);

          return {
            projects: newProjects,
            currentProject:
              state.currentProject?.id === projectId
                ? updatedProject
                : state.currentProject,
            currentDoc:
              state.currentDoc?.id === docId ? updatedDoc : state.currentDoc,
            previewDoc:
              state.previewDoc?.id === docId ? updatedDoc : state.previewDoc,
          };
        });
      },

      loadDocVersions: async (projectId: number, docId: number) => {
        const versions = await documentsApi.getDocumentVersions(docId);
        set((state) => {
          const project = state.projects.get(projectId);
          if (!project) return state;
          const existing = project.docs.get(docId);
          if (!existing) return state;

          const mapped = versions.map(mapBackendVersionToDocVersion);
          const latestVersionNumber = Math.max(
            existing.currentVersionNumber ?? 1,
            ...mapped.map((v) => v.versionNumber),
          );
          const updatedDoc: doc = {
            ...existing,
            versions: mapped,
            currentVersionNumber: latestVersionNumber,
          };

          const newDocs = new Map(project.docs);
          newDocs.set(docId, updatedDoc);

          const updatedProject = {
            ...project,
            docs: newDocs,
            updatedAt: new Date(),
          };

          const newProjects = new Map(state.projects);
          newProjects.set(projectId, updatedProject);

          return {
            projects: newProjects,
            currentProject:
              state.currentProject?.id === projectId
                ? updatedProject
                : state.currentProject,
            currentDoc:
              state.currentDoc?.id === docId ? updatedDoc : state.currentDoc,
            previewDoc:
              state.previewDoc?.id === docId ? updatedDoc : state.previewDoc,
          };
        });
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
            currentProject:
              state.currentProject?.id === projectId
                ? updatedProject
                : state.currentProject,
            currentDoc:
              state.currentDoc?.id === docId ? null : state.currentDoc,
            previewDoc:
              state.previewDoc?.id === docId ? null : state.previewDoc,
            isPreviewOpen:
              state.previewDoc?.id === docId ? false : state.isPreviewOpen,
          };
        });
      },

      toggleDocFavorite: (projectId: number, docId: number) => {
        set((state) => {
          const project = state.projects.get(projectId);
          if (!project) return state;

          const doc = project.docs.get(docId);
          if (!doc) return state;

          const updatedDoc: doc = {
            ...doc,
            isFavorite: !doc.isFavorite,
          };

          const newDocs = new Map(project.docs);
          newDocs.set(docId, updatedDoc);

          const updatedProject = {
            ...project,
            docs: newDocs,
            updatedAt: new Date(),
          };

          const newProjects = new Map(state.projects);
          newProjects.set(projectId, updatedProject);

          return {
            projects: newProjects,
            currentProject:
              state.currentProject?.id === projectId
                ? updatedProject
                : state.currentProject,
            currentDoc:
              state.currentDoc?.id === docId ? updatedDoc : state.currentDoc,
            previewDoc:
              state.previewDoc?.id === docId ? updatedDoc : state.previewDoc,
          };
        });
      },

      setDocTag: (projectId: number, docId: number, tag: DocTag | null) => {
        set((state) => {
          const project = state.projects.get(projectId);
          if (!project) return state;

          const doc = project.docs.get(docId);
          if (!doc) return state;

          const updatedDoc: doc = {
            ...doc,
            tag,
          };

          const newDocs = new Map(project.docs);
          newDocs.set(docId, updatedDoc);

          const updatedProject = {
            ...project,
            docs: newDocs,
            updatedAt: new Date(),
          };

          const newProjects = new Map(state.projects);
          newProjects.set(projectId, updatedProject);

          return {
            projects: newProjects,
            currentProject:
              state.currentProject?.id === projectId
                ? updatedProject
                : state.currentProject,
            currentDoc:
              state.currentDoc?.id === docId ? updatedDoc : state.currentDoc,
            previewDoc:
              state.previewDoc?.id === docId ? updatedDoc : state.previewDoc,
          };
        });
      },

      loadCommentsForDocument: async (projectId: number, docId: number) => {
        const list = await commentsApi.getCommentsByDocumentId(docId);
        const comments = list.map(mapCommentResponseToComment);
        set((state) => {
          const project = state.projects.get(projectId);
          if (!project) return state;
          const existing = project.docs.get(docId);
          if (!existing) return state;

          const updatedDoc: doc = { ...existing, comments };
          const newDocs = new Map(project.docs);
          newDocs.set(docId, updatedDoc);
          const updatedProject = {
            ...project,
            docs: newDocs,
            updatedAt: new Date(),
          };
          const newProjects = new Map(state.projects);
          newProjects.set(projectId, updatedProject);

          let updatedPreviewDoc = state.previewDoc;
          if (state.previewDoc?.id === docId) {
            updatedPreviewDoc = { ...state.previewDoc, comments };
          }
          let updatedCurrentDoc = state.currentDoc;
          if (state.currentDoc?.id === docId) {
            updatedCurrentDoc = { ...state.currentDoc, comments };
          }

          return {
            projects: newProjects,
            currentProject:
              state.currentProject?.id === projectId
                ? updatedProject
                : state.currentProject,
            currentDoc: updatedCurrentDoc,
            previewDoc: updatedPreviewDoc,
          };
        });
      },

      addComment: async (
        projectId: number,
        docId: number,
        commentData,
        page?: number,
      ) => {
        const project = useStateStore.getState().projects.get(projectId);
        const doc = project?.docs.get(docId);
        if (!doc) return;

        await commentsApi.createComment({
          message: commentData.message,
          author: commentData.author,
          documentId: docId,
          page,
          parentCommentId: commentData.parentCommentId,
          replytoUserId: commentData.replytoUserId,
          version: doc.currentVersionNumber,
        });
        await useStateStore.getState().loadCommentsForDocument(projectId, docId);
      },

      addVersionToDoc: (projectId: number, docId: number, file: File) => {
        set((state) => {
          const project = state.projects.get(projectId);
          if (!project) return state;

          const doc = project.docs.get(docId);
          if (!doc) return state;

          const fileUrl = URL.createObjectURL(file);
          const versionId = crypto.randomUUID();
          const newVersionNumber =
            Math.max(...doc.versions.map((v) => v.versionNumber), 0) + 1;

          const newVersion: docVersion = {
            id: versionId,
            versionNumber: newVersionNumber,
            uploadedAt: new Date(),
            uploadedBy: "Current User",
            fileUrl,
            file,
            fileSize: file.size,
          };

          const updatedDoc: doc = {
            ...doc,
            versions: [...doc.versions, newVersion],
            currentVersionNumber: newVersionNumber,
            file: newVersion.file,
            fileUrl: newVersion.fileUrl,
            fileSize: newVersion.fileSize,
          };

          const newDocs = new Map(project.docs);
          newDocs.set(docId, updatedDoc);

          const updatedProject = {
            ...project,
            docs: newDocs,
            updatedAt: new Date(),
          };

          const newProjects = new Map(state.projects);
          newProjects.set(projectId, updatedProject);

          return {
            projects: newProjects,
            currentProject:
              state.currentProject?.id === projectId
                ? updatedProject
                : state.currentProject,
            currentDoc:
              state.currentDoc?.id === docId ? updatedDoc : state.currentDoc,
            previewDoc:
              state.previewDoc?.id === docId ? updatedDoc : state.previewDoc,
          };
        });
      },

      uploadNewVersionToDoc: async (
        projectId: number,
        docId: number,
        file: File,
      ) => {
        set((s) => ({
          uploadInProgressCount: s.uploadInProgressCount + 1,
        }));
        try {
          const existingDoc =
            useStateStore.getState().projects.get(projectId)?.docs.get(docId) ??
            null;
          const contentType = file.type || "application/octet-stream";
          const presign = await documentsApi.requestNewVersionUpload({
            documentId: docId,
            fileName: file.name,
            contentType,
            fileSize: file.size,
          });
          await documentsApi.putFileToPresignedUrl({
            uploadUrl: presign.uploadUrl,
            file,
            contentType,
          });

          if (
            existingDoc?.documentType === "pptx" ||
            existingDoc?.documentType === "ppt"
          ) {
            try {
              await documentsApi.enqueueDocumentConversion({
                documentId: docId,
                versionNumber: presign.versionNumber,
              });
            } catch {
              // Best-effort: viewer can still trigger conversion.
            }
          }

          // After upload, refresh versions and the current download URL.
          await useStateStore.getState().loadDocVersions(projectId, docId);
          await useStateStore.getState().refreshDocDownloadUrl(projectId, docId);

          // Update currentVersionNumber + fileSize locally (backend is source of truth, but this keeps UI snappy).
          set((state) => {
            const project = state.projects.get(projectId);
            if (!project) return state;
            const existing = project.docs.get(docId);
            if (!existing) return state;

            const updatedDoc: doc = {
              ...existing,
              currentVersionNumber: presign.versionNumber,
              fileSize: file.size,
              file: null,
            };

            const newDocs = new Map(project.docs);
            newDocs.set(docId, updatedDoc);

            const updatedProject = {
              ...project,
              docs: newDocs,
              updatedAt: new Date(),
            };

            const newProjects = new Map(state.projects);
            newProjects.set(projectId, updatedProject);

            return {
              projects: newProjects,
              currentProject:
                state.currentProject?.id === projectId
                  ? updatedProject
                  : state.currentProject,
              currentDoc:
                state.currentDoc?.id === docId ? updatedDoc : state.currentDoc,
              previewDoc:
                state.previewDoc?.id === docId ? updatedDoc : state.previewDoc,
            };
          });
        } finally {
          set((s) => ({
            uploadInProgressCount: Math.max(0, s.uploadInProgressCount - 1),
          }));
        }
      },

      switchDocVersion: (
        projectId: number,
        docId: number,
        versionNumber: number,
      ) => {
        set((state) => {
          const project = state.projects.get(projectId);
          if (!project) return state;

          const doc = project.docs.get(docId);
          if (!doc) return state;

          const version = doc.versions.find(
            (v) => v.versionNumber === versionNumber,
          );
          if (!version) return state;

          const updatedDoc: doc = {
            ...doc,
            currentVersionNumber: versionNumber,
            file: version.file,
            fileUrl: version.fileUrl,
            fileSize: version.fileSize,
          };

          const newDocs = new Map(project.docs);
          newDocs.set(docId, updatedDoc);

          const updatedProject = {
            ...project,
            docs: newDocs,
            updatedAt: new Date(),
          };

          const newProjects = new Map(state.projects);
          newProjects.set(projectId, updatedProject);

          return {
            projects: newProjects,
            currentProject:
              state.currentProject?.id === projectId
                ? updatedProject
                : state.currentProject,
            currentDoc:
              state.currentDoc?.id === docId ? updatedDoc : state.currentDoc,
            previewDoc:
              state.previewDoc?.id === docId ? updatedDoc : state.previewDoc,
          };
        });
      },

      openPreview: (doc: doc) => {
        set(() => ({ previewDoc: doc, isPreviewOpen: true }));
      },

      closePreview: () => {
        set(() => ({ previewDoc: null, isPreviewOpen: false }));
      },

      toggleComments: () => {
        set((state) => ({ isCommentsOpen: !state.isCommentsOpen }));
      },

      setCommentsOpen: (isOpen: boolean) => {
        set(() => ({ isCommentsOpen: isOpen }));
      },

      setCommentFilterMode: (mode: CommentFilterMode) => {
        set(() => ({ commentFilterMode: mode }));
      },

      setDocCurrentPage: (docId: number, page: number) => {
        set((state) => {
          let updatedPreviewDoc = state.previewDoc;
          let updatedCurrentDoc = state.currentDoc;
          let updatedProjects = state.projects;
          let updatedCurrentProject = state.currentProject;

          // Update in previewDoc if it's the current preview
          if (state.previewDoc?.id === docId) {
            updatedPreviewDoc = { ...state.previewDoc, currentPage: page };
          }

          // Update in currentDoc if it matches
          if (state.currentDoc?.id === docId) {
            updatedCurrentDoc = { ...state.currentDoc, currentPage: page };
          }

          // Update in projects map
          const projectEntries = Array.from(state.projects.entries());
          for (const [projectId, project] of projectEntries) {
            const doc = project.docs.get(docId);
            if (doc) {
              const updatedDoc = { ...doc, currentPage: page };
              const newDocs = new Map(project.docs);
              newDocs.set(docId, updatedDoc);

              const updatedProject = {
                ...project,
                docs: newDocs,
                updatedAt: new Date(),
              };

              updatedProjects = new Map(updatedProjects);
              updatedProjects.set(projectId, updatedProject);

              if (state.currentProject?.id === projectId) {
                updatedCurrentProject = updatedProject;
              }

              // Also update currentDoc if it matches
              if (updatedCurrentDoc?.id === docId) {
                updatedCurrentDoc = updatedDoc;
              }
              break;
            }
          }

          return {
            projects: updatedProjects,
            currentProject: updatedCurrentProject,
            currentDoc: updatedCurrentDoc,
            previewDoc: updatedPreviewDoc,
          };
        });
      },

      setDocTotalPages: (docId: number, totalPages: number) => {
        set((state) => {
          let updatedPreviewDoc = state.previewDoc;
          let updatedCurrentDoc = state.currentDoc;
          let updatedProjects = state.projects;
          let updatedCurrentProject = state.currentProject;

          // Update in previewDoc if it's the current preview
          if (state.previewDoc?.id === docId) {
            updatedPreviewDoc = { ...state.previewDoc, totalPages };
          }

          // Update in currentDoc if it matches
          if (state.currentDoc?.id === docId) {
            updatedCurrentDoc = { ...state.currentDoc, totalPages };
          }

          // Update in projects map
          const projectEntries = Array.from(state.projects.entries());
          for (const [projectId, project] of projectEntries) {
            const doc = project.docs.get(docId);
            if (doc) {
              const updatedDoc = { ...doc, totalPages };
              const newDocs = new Map(project.docs);
              newDocs.set(docId, updatedDoc);

              const updatedProject = {
                ...project,
                docs: newDocs,
                updatedAt: new Date(),
              };

              updatedProjects = new Map(updatedProjects);
              updatedProjects.set(projectId, updatedProject);

              if (state.currentProject?.id === projectId) {
                updatedCurrentProject = updatedProject;
              }

              // Also update currentDoc if it matches
              if (updatedCurrentDoc?.id === docId) {
                updatedCurrentDoc = updatedDoc;
              }
              break;
            }
          }

          return {
            projects: updatedProjects,
            currentProject: updatedCurrentProject,
            currentDoc: updatedCurrentDoc,
            previewDoc: updatedPreviewDoc,
          };
        });
      },
    }),
    {
      name: "state-store",
      storage: createJSONStorage(() => localStorage, {
        // Handle incoming JSON -> State
        reviver: (_, value) => {
          if (
            value &&
            typeof value === "object" &&
            (value as PersistedMap).__type === "Map"
          ) {
            return new Map((value as PersistedMap).value);
          }

          if (
            typeof value === "string" &&
            /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/.test(value)
          ) {
            return new Date(value);
          }
          return value;
        },
        // Handle outgoing State -> JSON
        replacer: (_, value) => {
          if (value instanceof Map) {
            return {
              __type: "Map",
              value: Array.from(value.entries()),
            } as PersistedMap;
          }
          return value;
        },
      }),
    },
  ),
);
