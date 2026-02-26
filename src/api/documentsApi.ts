import { backendClient } from "./client";

export type DocumentVersionResponse = {
  id: string;
  versionNumber: number;
  uploadedAt: string;
  uploadedBy: string;
  fileUrl: string;
  fileSize: number;
  pdfUrl?: string | null;
  conversionStatus?: "none" | "pending" | "processing" | "succeeded" | "failed";
  conversionError?: string | null;
  convertedAt?: string | null;
  conversionAttempts?: number;
  documentId: number;
};

export type DocumentResponse = {
  id: number;
  title: string;
  fileUrl: string | null;
  mimeType: string;
  documentType: string;
  fileSize: number;
  uploadedAt: string;
  currentPage: number;
  totalPages: number;
  currentVersionNumber: number;
  projectId: number;
  isFavorite: boolean;
  tag: string | null;
  comments?: unknown[];
  versions?: DocumentVersionResponse[];
};

export type CreateDocumentPayload = {
  title: string;
  fileKey?: string | null;
  mimeType: string;
  documentType: string;
  fileSize: number;
  projectId: number;
  isFavorite?: boolean;
  tag?: string | null;
};

export type UploadDocumentResponse = {
  uploadUrl: string;
};

export type UploadDocumentPresignResponse = {
  uploadUrl: string;
  fileKey: string;
  expiresAt?: string;
};

export type DownloadUrlResponse = {
  downloadUrl: string;
  expiresAt?: string;
};

export type NewVersionResponse = {
  uploadUrl: string;
  versionNumber: number;
  expiresAt?: string;
};

export async function getDocumentById(id: number): Promise<DocumentResponse> {
  const { data } = await backendClient.get<DocumentResponse>(
    `/documents/${id}`,
  );
  return data;
}

export async function getDocumentsByProjectId(
  projectId: number,
): Promise<DocumentResponse[]> {
  const { data } = await backendClient.get<DocumentResponse[]>(
    `/projects/${projectId}/documents`,
  );
  return data;
}

export async function getDocumentDownloadUrl(
  id: number,
): Promise<DownloadUrlResponse> {
  const { data } = await backendClient.get<DownloadUrlResponse>(
    `/documents/${id}/download-url`,
  );
  return data;
}

export async function getDocumentVersions(
  documentId: number,
): Promise<DocumentVersionResponse[]> {
  const { data } = await backendClient.get<DocumentVersionResponse[]>(
    `/documents/versions/${documentId}`,
  );
  return data;
}

export async function createDocument(
  payload: CreateDocumentPayload,
): Promise<DocumentResponse> {
  const { data } = await backendClient.post<DocumentResponse>(
    "/documents",
    payload,
  );
  return data;
}

export async function getUploadUrl(
  fileName: string,
  contentType: string,
): Promise<string> {
  const { data } = await backendClient.post<UploadDocumentResponse>(
    "/documents/upload",
    { fileName, contentType },
  );
  return data.uploadUrl;
}

export async function getUploadUrlWithKey(
  fileName: string,
  contentType: string,
): Promise<UploadDocumentPresignResponse> {
  const { data } = await backendClient.post<UploadDocumentPresignResponse>(
    "/documents/upload",
    { fileName, contentType },
  );
  return data;
}

export type UploadDocumentMultipartPayload = {
  file: File;
  projectId: number;
  title?: string;
  mimeType?: string;
  documentType?: string;
  isFavorite?: boolean;
  tag?: string | null;
};

export async function uploadDocumentMultipart(
  payload: UploadDocumentMultipartPayload,
): Promise<DocumentResponse> {
  const form = new FormData();
  form.append("file", payload.file);
  form.append("projectId", String(payload.projectId));
  if (payload.title) form.append("title", payload.title);
  if (payload.mimeType) form.append("mimeType", payload.mimeType);
  if (payload.documentType) form.append("documentType", payload.documentType);
  if (typeof payload.isFavorite === "boolean")
    form.append("isFavorite", String(payload.isFavorite));
  if (payload.tag) form.append("tag", payload.tag);

  const { data } = await backendClient.post<DocumentResponse>(
    "/documents/upload",
    form,
    { headers: {} },
  );
  return data;
}

export async function requestNewVersionUpload(input: {
  documentId: number;
  fileName: string;
  contentType: string;
  fileSize: number;
}): Promise<NewVersionResponse> {
  const { data } = await backendClient.post<NewVersionResponse>(
    "/documents/new-version",
    {
      documentId: input.documentId,
      fileName: input.fileName,
      contentType: input.contentType,
      fileSize: input.fileSize,
    },
  );
  return data;
}

export async function putFileToPresignedUrl(input: {
  uploadUrl: string;
  file: File;
  contentType: string;
}): Promise<void> {
  const res = await fetch(input.uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": input.contentType,
    },
    body: input.file,
  });
  if (!res.ok) {
    throw new Error(`Upload failed with status ${res.status}`);
  }
}

export type EnqueueConversionResponse = {
  conversionStatus: "none" | "pending" | "processing" | "succeeded" | "failed";
  conversionError?: string | null;
  conversionAttempts?: number;
  convertedAt?: string | null;
  pdfUrl?: string | null;
};

export async function enqueueDocumentConversion(input: {
  documentId: number;
  versionNumber: number;
  force?: boolean;
}): Promise<EnqueueConversionResponse> {
  const qs = input.force ? "?force=true" : "";
  const { data } = await backendClient.post<EnqueueConversionResponse>(
    `/documents/${input.documentId}/versions/${input.versionNumber}/convert${qs}`,
  );
  return data;
}

export type DeleteDocumentResponse = {
  documentId: number;
  versionsDeleted: number;
  s3KeysDeleted: number;
};

export async function deleteDocument(id: number): Promise<void> {
  await backendClient.delete<DeleteDocumentResponse>(`/documents/${id}`);
}
