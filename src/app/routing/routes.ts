export const ROUTES = {
  login: "/login",
  newDocument: "/new",
  statusBoard: "/session",
  documentInputs: "/documents/:documentId/inputs",
  bprDocumentInputs: "/bpr/:documentId/inputs",
  documentPreview: "/documents/:documentId/preview",
  bprDocumentPreview: "/bpr/:documentId/preview",
  documentCoverBom: "/documents/:documentId/cover-bom",
  bprcover: "/bpr/:documentId/cover",
  bprCoverTest: "/test/bpr-cover/:documentId",
  bprSelect: "/bpr/:documentId/select",
  bprSelectTest: "/test/bpr-select/:documentId",
  documentStages: "/documents/:documentId/stages",
  documentStageInput: "/documents/:documentId/stage-input",
  documentBprStages: "/documents/:documentId/bpr/stages",
  documentGenerate: "/documents/:documentId/generate",
  companyInfo: "/settings/company",
  masterData: "/settings/master-data",
  masterDataSetup: "/master-data-setup",
  versionHistory: "/versions",
  notifications: "/notifications",
  auditTrail: "/audit",
  queue: "/queue",
  employees: "/settings/employees",
  setPassword: "/set-password",
  documentReview: "/documents/:documentId/review",
} as const;

export function getDocumentInputsRoute(documentId: string) {
  return `/documents/${encodeURIComponent(documentId)}/inputs`;
}

export function getBprDocumentInputsRoute(documentId: string) {
  return `/bpr-documents/${encodeURIComponent(documentId)}/inputs`;
}

export function getDocumentPreviewRoute(documentId: string) {
  return `/documents/${encodeURIComponent(documentId)}/preview`;
}

export function getBprDocumentPreviewRoute(documentId: string) {
  return `/bpr/${encodeURIComponent(documentId)}/preview`;
}

export function getDocumentCoverBomRoute(documentId: string) {
  return `/documents/${encodeURIComponent(documentId)}/cover-bom`;
}

export function getBprCoverRoute(documentId: string) {
  return `/bpr/${encodeURIComponent(documentId)}/cover`;
}

export function getBprSelectRoute(documentId: string) {
  return `/bpr/${encodeURIComponent(documentId)}/select`;
}