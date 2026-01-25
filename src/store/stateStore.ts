
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

export type pathItem = {
    label: string;
    isLink: boolean;
    href?: string;
}

interface StateStore {
    projects: Map<number, project>,
    currentProject: project | null,
    currentDoc: doc | null,
    currentPath: pathItem[] | null,
    setCurrentPath: (path: pathItem[]) => void,
    addProject: (project: project) => void,
    setCurrentProject: (project: project) => void,
    setCurrentDoc: (doc: doc) => void,
}

export const useStateStore = create<StateStore>((set) => ({
    projects: new Map(),
    currentProject: null,
    currentDoc: null,
    currentPath: [{label: "Projects", isLink: false}],
    setCurrentPath: (path: pathItem[]) => {
        set(() => ({ currentPath: path }));
    },
    addToCurrentPath: (item: pathItem) => {
        set((state) => ({ currentPath: [...state.currentPath!, item] }));
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
}));