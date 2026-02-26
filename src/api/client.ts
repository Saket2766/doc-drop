import axios, { type AxiosError } from "axios";

export const BASE_URL =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:8080/api/v1";

export const backendClient = axios.create({
  baseURL: BASE_URL,
});

type TokenGetter = () => string | null;

let getToken: TokenGetter = () => null;

/**
 * Set the function used to get the current JWT (e.g. from Zustand store).
 * Call this once at app init (e.g. in main.tsx) to avoid circular deps.
 */
export function setApiTokenGetter(fn: TokenGetter) {
  getToken = fn;
}

backendClient.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Callback when the backend returns 401 (e.g. clear user and redirect to login).
 * Set from app init so the client doesn't depend on the store/router.
 */
type OnUnauthorized = () => void;
let onUnauthorized: OnUnauthorized = () => {};

export function setOnUnauthorized(fn: OnUnauthorized) {
  onUnauthorized = fn;
}

backendClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      onUnauthorized();
    }
    return Promise.reject(error);
  },
);

/** Normalized API error (message from backend or generic) */
export function getApiErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error) && error.response?.data) {
    const d = error.response.data as { error?: string; message?: string };
    return d.error ?? d.message ?? "Request failed";
  }
  return error instanceof Error ? error.message : "Request failed";
}
