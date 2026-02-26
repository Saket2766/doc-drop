import { backendClient } from "./client";

export type LoginRequest = {
  email: string;
  password: string;
};

export type LoginResponse = {
  token: string;
  userId: number;
  username: string;
  email: string;
};

export type GrantProjectAccessPayload = {
  userIdentifier: string;
  role: "editor" | "viewer";
};

export type RevokeProjectAccessPayload = {
  userIdentifier: string;
};

export async function login(
  email: string,
  password: string,
): Promise<LoginResponse> {
  const { data } = await backendClient.post<LoginResponse>("/login", {
    email,
    password,
  });
  return data;
}

export async function grantProjectAccess(
  projectId: number,
  payload: GrantProjectAccessPayload,
): Promise<import("./projectsApi").ProjectResponse> {
  const { data } = await backendClient.post<
    import("./projectsApi").ProjectResponse
  >(`/auth/project/${projectId}`, payload);
  return data;
}

export async function revokeProjectAccess(
  projectId: number,
  payload: RevokeProjectAccessPayload,
): Promise<import("./projectsApi").ProjectResponse> {
  const { data } = await backendClient.delete<
    import("./projectsApi").ProjectResponse
  >(`/auth/project/${projectId}`, { data: payload });
  return data;
}
