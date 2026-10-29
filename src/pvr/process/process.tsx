
import { useEffect, useMemo, useState } from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Info,
  LoaderCircle,
} from "lucide-react";
import {
  useLocation,
  useNavigate,
  useParams,
} from "react-router-dom";

import { AppHeader } from "../../features/new-document/components/AppHeader";
import { AppSidebar } from "../../features/new-document/components/AppSidebar";
import { WizardHeader } from "../../features/new-document/components/WizardHeader";

import { useAuthStore } from "../../features/auth/state/auth.store";
import { useDocument } from "../../features/new-document/hooks/useDocument";
import { useDocumentSelectorData } from "../../features/new-document/hooks/useDocumentSelectorData";
import { useStepNavigation } from "../../features/new-document/hooks/useStepNavigation";

// =========================================================
// TYPES
// =========================================================

type ProcessStage = {
  label: string;
  stage: string | null;
  side?: {
    label: string;
    oval?: boolean;
  }[];
};

type BomItem = {
  code: string;
  name: string;
  qty: string | number;
  uom: string;
};

type ProcessFlowBomResponse = {
  processFlow?: ProcessStage[];
  bom?: BomItem[];
  stages?: string[];
};

// =========================================================
// CONFIGURATION
// =========================================================

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? ""
).replace(/\/$/, "");

const DEFAULT_FLOW: ProcessStage[] = [
  { label: "Sifting of raw materials", stage: "Dispensing" },
  { label: "Mixing", stage: "Granulation" },
  {
    label: "Final Mixing",
    stage: "Granulation",
    side: [{ label: "Sifting" }, { label: "Lubricants" }],
  },
  { label: "Compression", stage: "Compression" },
  { label: "Inspection", stage: "Inspection (uncoated)" },
  {
    label: "Coating",
    stage: "Coating",
    side: [{ label: "Coating Solution Preparation", oval: true }],
  },
  { label: "Inspection", stage: "Inspection (coated)" },
  { label: "Packing", stage: null },
];

const EMPTY_RESPONSE: ProcessFlowBomResponse = {
  processFlow: [],
  bom: [],
  stages: [],
};

// =========================================================
// FLOW NODE
// =========================================================

function FlowNode({ item }: { item: ProcessStage }) {
  return (
    <div className="flex w-full max-w-[420px] items-center justify-center gap-3">
      {item.side && item.side.length > 0 && (
        <>
          <div className="flex min-w-0 flex-1 flex-col items-end gap-3">
            {item.side.map((sideItem, index) => (
              <div
                key={`${sideItem.label}-${index}`}
                className={[
                  "flex min-h-10 w-full items-center justify-center",
                  "border border-[#b7dddd] bg-[#eaf6f6] px-3 py-2",
                  "text-center text-small font-medium text-[#176767]",
                  sideItem.oval ? "rounded-full" : "rounded-control",
                ].join(" ")}
              >
                {sideItem.label}
              </div>
            ))}
          </div>

          <ArrowRight
            size={18}
            className="shrink-0 text-subdued"
            aria-hidden="true"
          />
        </>
      )}

      <div
        className={[
          "flex min-h-[66px] min-w-0 flex-1 flex-col",
          "items-center justify-center rounded-control border px-4 py-3",
          item.stage === null
            ? "border-[#0e8c8c] bg-[#0e8c8c] text-white"
            : "border-border-strong bg-surface text-text",
        ].join(" ")}
      >
        <span className="text-center text-small font-semibold">
          {item.label}
        </span>

        {item.stage && (
          <span className="mt-1 text-micro text-subdued">
            {item.stage}
          </span>
        )}
      </div>
    </div>
  );
}

// =========================================================
// EMPTY STATE
// =========================================================

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex min-h-28 items-center justify-center rounded-control border border-dashed border-border-strong px-4 py-6 text-center text-small text-subdued">
      {message}
    </div>
  );
}

// =========================================================
// COMPONENT
// =========================================================

export default function Process() {
  const navigate = useNavigate();
  const location = useLocation();
  const { documentId = "" } = useParams<{ documentId: string }>();

  // -------------------------------------------------------
  // SHARED APPLICATION LAYOUT
  // -------------------------------------------------------

  const user = useAuthStore((state) => state.user);

  const authStore = useAuthStore() as {
    token?: string;
    accessToken?: string;
  };

  const token = authStore.token ?? authStore.accessToken;

  const {
    context,
    isLoading: isLoadingContext,
  } = useDocumentSelectorData(user);

  const { document: saved } = useDocument(documentId);

  const { goToStep } = useStepNavigation(documentId, "pvr");

  // -------------------------------------------------------
  // DATA
  // -------------------------------------------------------

  const [data, setData] =
    useState<ProcessFlowBomResponse>(EMPTY_RESPONSE);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigationState = (
    location.state ?? {}
  ) as {
    selectedStages?: string[];
    processFlowBom?: ProcessFlowBomResponse;
  };

  // -------------------------------------------------------
  // LOAD PROCESS FLOW AND BOM
  // -------------------------------------------------------

  useEffect(() => {
    if (!documentId) {
      setError("The PVR document ID is missing.");
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    async function loadProcessFlowBom() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/pvr/documents/${documentId}/process-flow-bom`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              ...(token
                ? { Authorization: `Bearer ${token}` }
                : {}),
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(
            `Unable to load process flow and BOM (${response.status}).`,
          );
        }

        const result =
          (await response.json()) as ProcessFlowBomResponse;

        setData({
          processFlow: result.processFlow ?? [],
          bom: result.bom ?? [],
          stages: result.stages ?? [],
        });
      } catch (err) {
        if (controller.signal.aborted) return;

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load process flow and BOM.",
        );
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void loadProcessFlowBom();

    return () => controller.abort();
  }, [documentId, token]);

  // -------------------------------------------------------
  // PROCESS FLOW
  // -------------------------------------------------------

  const flow = useMemo(() => {
    const backendFlow = data.processFlow ?? [];

    if (backendFlow.length > 0) {
      return backendFlow;
    }

    const selectedStages =
      navigationState.selectedStages ?? data.stages ?? [];

    if (selectedStages.length === 0) {
      return [];
    }

    return DEFAULT_FLOW.filter(
      (item) =>
        item.stage === null ||
        selectedStages.includes(item.stage),
    );
  }, [
    data.processFlow,
    data.stages,
    navigationState.selectedStages,
  ]);

  const bom = data.bom ?? [];

  // -------------------------------------------------------
  // NAVIGATION
  // -------------------------------------------------------

  function goBack() {
    navigate(`/pvr/${documentId}/cover-preview`, {
      state: location.state,
    });
  }

  function continueToBOM() {
    navigate(
      `/pvr/${documentId}/BOM`,
      {
        state: {
          ...navigationState,
          processFlowBom: data,
        },
      },
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="fixed inset-0 flex flex-col bg-background text-text">
      {/* APP HEADER */}

      <AppHeader
        user={user}
        unit={context?.unit ?? null}
        isLoadingUnit={isLoadingContext}
      />

      {/* SIDEBAR + MAIN CONTENT */}

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
        <AppSidebar user={user} />

        <main className="min-w-0 overflow-y-auto">
          <section className="bg-surface">
            {/* WIZARD HEADER */}

            <div className="bg-background">
              <WizardHeader
                activeStepId="process-flow"
                completedStepIds={saved?.completed_steps ?? []}
                onStepClick={goToStep}
                title="Process flow"
                description="The manufacturing process as a top-to-bottom flow, generated from the stages of the executed BMR. Read-only."
                identifier={saved?.draft_id ?? documentId}
                status="DRAFT"
                dosageForm={saved?.dosage_form}
                docType="pvr"
                isPvr
              />
            </div>

            {/* PAGE CONTENT */}

            <div className="px-5 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-[1100px] space-y-6">
                {/* PROCESS FLOW CARD */}

                <section className="overflow-hidden rounded-control border border-border-strong bg-surface shadow-sm">
                  <div className="flex h-12 flex-wrap items-center justify-between gap-3 border-b border-border bg-surface px-4">
                    <div>
                      <h2 className="m-0 text-small font-semibold text-text">
                        Process flow diagram
                      </h2>
                    </div>

                    <span className="text-small text-subdued">
                      from BMR · read-only
                    </span>
                  </div>

                  <div className="p-5 sm:p-8">
                    {loading ? (
                      <div className="flex min-h-32 items-center justify-center gap-2 text-small text-subdued">
                        <LoaderCircle
                          size={18}
                          className="animate-spin"
                        />
                        Loading process flow...
                      </div>
                    ) : error ? (
                      <EmptyState message={error} />
                    ) : flow.length === 0 ? (
                      <EmptyState message="No process flow data is available for this document." />
                    ) : (
                      <div className="flex flex-col items-center">
                        {flow.map((item, index) => (
                          <div
                            key={`${item.label}-${index}`}
                            className="flex w-full flex-col items-center"
                          >
                            <FlowNode item={item} />

                            {index < flow.length - 1 && (
                              <div className="flex h-10 items-center justify-center">
                                <ArrowDown
                                  size={20}
                                  className="text-subdued"
                                  aria-hidden="true"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>


           
              </div>
            </div>

            {/* FOOTER ACTIONS */}

            <div className="border-t border-border bg-surface px-5 py-4 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-[1100px] flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                {/* BACK */}

                <button
                  type="button"
                  onClick={goBack}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-5 py-2.5 text-small font-semibold text-text transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[#0e8c8c] focus:ring-offset-2"
                >
                  <ArrowLeft size={16} aria-hidden="true" />
                  Back
                </button>

                {/* CONTINUE */}

                <button
                  type="button"
                  onClick={continueToBOM}
                  disabled={loading || Boolean(error) || !documentId}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-[#0e8c8c] px-5 py-2.5 text-small font-semibold text-white transition hover:bg-[#0b7777] focus:outline-none focus:ring-2 focus:ring-[#0e8c8c] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-border-strong disabled:text-white/70"
                >
                  Continue to BOM
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
