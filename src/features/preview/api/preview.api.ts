import { httpClient } from "../../../shared/api/httpClient";
import type { PreviewResponse } from "./preview.types";

export async function getDocumentPreview(documentId: string): Promise<PreviewResponse> {
  const response = await httpClient.get<PreviewResponse>(
    `/api/bmr/documents/${encodeURIComponent(documentId)}/preview`,
  );

  return response.data;
}

/**
 * The real page-1 layout, rendered by the AI backend and returned as a PDF (letterhead
 * / logo / header / footer — the body fills in after the MFC is read). Fetched through
 * the authenticated client so the caller can embed it via an object URL.
 */
export async function getPageOnePdf(documentId: string): Promise<Blob> {
  const response = await httpClient.get(
    `/api/bmr/documents/${encodeURIComponent(documentId)}/page-one.pdf`,
    { responseType: "blob" },
  );

  return response.data as Blob;
}
