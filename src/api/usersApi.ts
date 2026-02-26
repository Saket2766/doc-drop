import { backendClient } from "./client";

export type UserPayload = {
  id?: number;
  username: string;
  email: string;
  password: string;
  createdAt?: string;
  updatedAt?: string;
};

export type UserResponse = {
  id: number;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};

export async function createUser(payload: {
  username: string;
  email: string;
  password: string;
}): Promise<UserResponse> {
  const { data } = await backendClient.post<UserResponse>("/users", payload);
  return data;
}

export async function getUserById(id: number): Promise<UserResponse> {
  const { data } = await backendClient.get<UserResponse>(`/users/${id}`);
  return data;
}

export async function updateUserById(
  id: number,
  payload: Partial<Pick<UserPayload, "username" | "email" | "password">>,
): Promise<UserResponse> {
  const { data } = await backendClient.patch<UserResponse>(`/users/${id}`, payload);
  return data;
}

export async function searchUsers(q: string): Promise<UserResponse[]> {
  const trimmed = q.trim();
  if (!trimmed) return [];
  const { data } = await backendClient.get<UserResponse[]>("/users/search", {
    params: { q: trimmed },
  });
  return data;
}
