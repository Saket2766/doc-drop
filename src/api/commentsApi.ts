import { backendClient } from "./client";

export type CommentResponse = {
  id: string;
  message: string;
  author: string;
  createdAt: string;
  page?: number;
  resolved: boolean;
  parentCommentId?: string;
  replytoUserId?: string;
  version?: number;
  documentId: number;
};

export type CreateCommentPayload = {
  message: string;
  author: string;
  documentId: number;
  page?: number;
  parentCommentId?: string;
  replytoUserId?: string;
  version?: number;
};

/** Fetches all comments for a document. */
export async function getCommentsByDocumentId(
  documentId: number,
): Promise<CommentResponse[]> {
  const { data } = await backendClient.get<CommentResponse[]>(
    `/comments/${documentId}`,
  );
  return data;
}

export async function createComment(
  payload: CreateCommentPayload,
): Promise<CommentResponse> {
  const { data } = await backendClient.post<CommentResponse>(
    "/comments",
    payload,
  );
  return data;
}
