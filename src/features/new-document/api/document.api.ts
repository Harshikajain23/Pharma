import { httpClient } from "../../../shared/api/httpClient";
import type { StageParamsMap } from "../../stages/model/stageParams";
import type { DocumentDetail, OptionsResponse } from "./document.types";

// ---------------- BMR ----------------

export async function getDocument(documentId: string): Promise<DocumentDetail> {
  const response = await httpClient.get<DocumentDetail>(
    `/api/bmr/documents/${encodeURIComponent(documentId)}`,
  );

  return response.data;
}

export async function getOptions(): Promise<OptionsResponse> {
  const response = await httpClient.get<OptionsResponse>("/api/bmr/options");
  return response.data;
}

export async function setStages(
  documentId: string,
  stages: string[],
  params: StageParamsMap = {},
): Promise<{
  document_id: string;
  status: string;
  stages: string[];
  params: StageParamsMap;
}> {
  const response = await httpClient.put(
    `/api/bmr/documents/${encodeURIComponent(documentId)}/stages`,
    { stages, params },
  );

  return response.data;
}

// ---------------- BPR ----------------

export async function getBprDocument(documentId: string): Promise<DocumentDetail> {
  const response = await httpClient.get<DocumentDetail>(
    `/api/bpr/documents/${encodeURIComponent(documentId)}`,
  );

  return response.data;
}

export async function getBprOptions(): Promise<OptionsResponse> {
  const response = await httpClient.get<OptionsResponse>("/api/bpr/options");
  return response.data;
}

export async function setBprStages(
  documentId: string,
  stages: string[],
  params: StageParamsMap = {},
): Promise<{
  document_id: string;
  status: string;
  stages: string[];
  params: StageParamsMap;
}> {
  const response = await httpClient.put(
    `/api/bpr/documents/${encodeURIComponent(documentId)}/stages`,
    { stages, params },
  );

  return response.data;
}