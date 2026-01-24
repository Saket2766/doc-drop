import { create } from "zustand";

export type comment = {
    message: string,
    author: string,
    createdAt: Date,
}

export type doc = {
    id: number,
    title: string,
    url: string,
    documentType: string,
    uploadedAt: Date,
    comments: comment[] | null,
    creator: string,
    editorAccessUsers: string[],
}

export type project = {
    id: number,
    name: string,
    description: string,
    createdAt: Date,
    updatedAt: Date,
    docs: Map<number, doc>,
}

interface StateStore {
    projects: Map<number, project>,
    currentProject: project | null,
    currentDoc: doc | null,
    addProject: (project: project) => void,
    setCurrentProject: (project: project) => void,
    setCurrentDoc: (doc: doc) => void,
}

export const useStateStore = create<StateStore>((set) => ({
    projects: new Map(),
    currentProject: null,
    currentDoc: null,
    addProject: (project: project) => {
        set((state) => ({ projects: state.projects.set(project.id, project) }));
    },
    setCurrentProject: (project: project) => {
        set(() => ({ currentProject: project }));
    },
    setCurrentDoc: (doc: doc) => {
        set(() => ({ currentDoc: doc }));
    },
}));