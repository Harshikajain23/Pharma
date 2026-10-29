import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../../app/routing/routes";
import Introduction from "../../../pvr/introduction/introduction";

export type DocumentType = "bmr" | "bpr" | "pvp" | "pvr";

/* =========================================================
   BMR ROUTES
   ========================================================= */

const BMR_STEP_ROUTES: Record<
  string,
  (documentId: string) => string
> = {
  type: () => ROUTES.newDocument,

  inputs: (id) =>
    `/documents/${encodeURIComponent(id)}/inputs`,

  preview: (id) =>
    `/documents/${encodeURIComponent(id)}/preview`,

  "cover-bom": (id) =>
    `/documents/${encodeURIComponent(id)}/cover-bom`,

  stages: (id) =>
    `/documents/${encodeURIComponent(id)}/stages`,

  "stage-input": (id) =>
    `/documents/${encodeURIComponent(id)}/stage-input`,

  "generate-submit": (id) =>
    `/documents/${encodeURIComponent(id)}/generate`,
};

/* =========================================================
   BPR ROUTES
   ========================================================= */

const BPR_STEP_ROUTES: Record<
  string,
  (documentId: string) => string
> = {
  inputs: (id) =>
    `/bpr-documents/${encodeURIComponent(id)}/inputs`,

  preview: (id) =>
    `/bpr/${encodeURIComponent(id)}/preview`,

  "cover-page": (id) =>
    `/bpr/${encodeURIComponent(id)}/cover`,

  stages: (id) =>
    `/bpr/${encodeURIComponent(id)}/select`,

  "stage-input": (id) =>
    `/bpr/${encodeURIComponent(id)}/stage-input`,

  "generate-submit": (id) =>
    `/bpr/${encodeURIComponent(id)}/generate`,
};

/* =========================================================
   PVP ROUTES
   ========================================================= */

const PVP_STEP_ROUTES: Record<
  string,
  (documentId: string) => string
> = {
  type: () => ROUTES.newDocument,

  "select-document": (id) =>
    `/pvp/${encodeURIComponent(id)}/select`,

  "preview-basic-details": (id) =>
    `/pvp/${encodeURIComponent(id)}/preview`,

  "process-flow-bom": (id) =>
    `/pvp/${encodeURIComponent(id)}/process`,

  "material-specification": (id) =>
    `/pvp/${encodeURIComponent(id)}/material`,

  "cpp-cqa": (id) =>
    `/pvp/${encodeURIComponent(id)}/cpp`,

  "procedure-sampling-plan": (id) =>
    `/pvp/${encodeURIComponent(id)}/procedure`,

  "generate-submit": (id) =>
    `/pvp/${encodeURIComponent(id)}/generate`,
};

/* =========================================================
   PVP PACKING ROUTES
   ========================================================= */

const PVP_PACKING_STEP_ROUTES: Record<
  string,
  (documentId: string) => string
> = {
  "type-packing": () => ROUTES.newDocument,

  "select-packing": (id) =>
    `/pvp/${encodeURIComponent(id)}/selectpacking`,

  "preview-basic-details-packing": (id) =>
    `/pvp/${encodeURIComponent(id)}/previewpacking`,

  "process-flow-bom-packing": (id) =>
    `/pvp/${encodeURIComponent(id)}/processpacking`,

  "cpp-cqa-packing": (id) =>
    `/pvp/${encodeURIComponent(id)}/cpppacking`,

  "procedure-sampling-plan-packing": (id) =>
    `/pvp/${encodeURIComponent(id)}/procedurepacking`,

  "generate-submit-packing": (id) =>
    `/pvp/${encodeURIComponent(id)}/generatepacking`,
};

/* =========================================================
   PVR ROUTES
   ========================================================= */

const PVR_STEP_ROUTES: Record<
  string,
  (documentId: string) => string
> = {
  type: () => ROUTES.newDocument,

  inputs: (id) =>
    `/pvr/${encodeURIComponent(id)}/input`,

  introduction: (id) =>
     `/pvr/${encodeURIComponent(id)}/introduction`,

  "cover": (id) =>
    `/pvr/${encodeURIComponent(id)}/basic-cover`,


  "cpp-cqa": (id) =>
    `/pvr/${encodeURIComponent(id)}/cpp`,

  "stage-output": (id) =>
    `/pvr/${encodeURIComponent(id)}/stage`,

  "generate-submit": (id) =>
    `/pvr/${encodeURIComponent(id)}/generate`,

  "recommendation": (id) =>
    `/pvr/${encodeURIComponent(id)}/recommendation`,
};

/* =========================================================
   NAVIGATION HOOK
   ========================================================= */


export function useStepNavigation(
  documentId: string,
  documentType: DocumentType = "bmr",
  validationType: "manufacturing" | "packing" = "manufacturing",
) {
  const navigate = useNavigate();

  const routes =
    documentType === "pvr"
      ? PVR_STEP_ROUTES
      : documentType === "pvp"
        ? validationType === "packing"
          ? PVP_PACKING_STEP_ROUTES
          : PVP_STEP_ROUTES
        : documentType === "bpr"
          ? BPR_STEP_ROUTES
          : BMR_STEP_ROUTES;

  const goToStep = useCallback(
    (stepId: string) => {
      const route = routes[stepId];

      if (!route) {
        console.warn(`No route configured for step: ${stepId}`);
        return;
      }

      navigate(route(documentId));
    },
    [documentId, navigate, routes],
  );

  return {
    goToStep,
    isStepRoutable: (stepId: string) => stepId in routes,
  };
}
