import { backendClient } from "./client";

export type ProjectResponse = {
  id: number;
  name: string;
  description: string;
  userId: number;
  creator: string;
  editorAccessUsers: string[];
  viewerAccessUsers: string[];
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectPayload = {
  name: string;
  description: string;
  userId: number;
};

export async function getProjects(): Promise<ProjectResponse[]> {
  const { data } = await backendClient.get<ProjectResponse[]>("/projects");
  return data;
}

export async function getProjectById(id: number): Promise<ProjectResponse> {
  const { data } = await backendClient.get<ProjectResponse>(`/projects/${id}`);
  return data;
}

export async function createProject(
  payload: CreateProjectPayload,
): Promise<ProjectResponse> {
  const { data } = await backendClient.post<ProjectResponse>(
    "/projects",
    payload,
  );
  return data;
}

export async function deleteProject(id: number): Promise<void> {
  await backendClient.delete(`/projects/${id}`);
}
