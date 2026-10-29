import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { Fragment, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { AppHeader } from "../../../features/new-document/components/AppHeader";
import { AppSidebar } from "../../../features/new-document/components/AppSidebar";
import { WizardHeader } from "../../../features/new-document/components/WizardHeader";

import { useAuthStore } from "../../../features/auth/state/auth.store";
import { useDocument } from "../../../features/new-document/hooks/useDocument";
import { useDocumentSelectorData } from "../../../features/new-document/hooks/useDocumentSelectorData";
import { useStepNavigation } from "../../../features/new-document/hooks/useStepNavigation";

// Adjust this import if your masterDataAdmin.ts file is in another folder.
import { listMasterRows } from "../../../features/master-data/api/masterDataAdmin";

interface SubStage {
  key: string;
  name: string;
  cpp: string[];
  cqa: string[];
}

interface MainStage {
  id: string;
  key: string;
  name: string;
  subStages: SubStage[];
}

interface EquipmentProcessingStage {
  stage?: string;
  cpps?: unknown;
}

interface EquipmentMasterRow {
  name?: string;
  stage?: string;
  stages?: EquipmentProcessingStage[];
  cpps?: unknown;
}

interface MasterRowItem {
  row: Record<string, unknown>;
  is_active: boolean;
}

const MAIN_STAGES = [
  { id: "01", key: "Packing Material Dispensing", name: "Packing Material Dispensing" },
  { id: "02", key: "Primary Packing", name: "Primary Packing" },
  { id: "03", key: "Secondary Packing", name: "Secondary Packing" },
];

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function toStringList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function buildStages(rows: MasterRowItem[]): MainStage[] {
  const grouped = new Map<string, Map<string, string[]>>();

  for (const mainStage of MAIN_STAGES) {
    grouped.set(mainStage.key, new Map());
  }

  for (const item of rows) {
    if (!item.is_active) continue;

    const equipment = item.row as EquipmentMasterRow;

    const equipmentStage = equipment.stage?.trim() ?? "";

    const mainStage = MAIN_STAGES.find(
      (stage) => normalize(stage.name) === normalize(equipmentStage),
    );

    // Ignore stages other than Granulation, Compression and Coating.
    if (!mainStage) continue;

    const subStages = equipment.stages ?? [];
    const stageMap = grouped.get(mainStage.key);

    if (!stageMap) continue;

    for (const processingStage of subStages) {
      const subStageName = processingStage.stage?.trim();

      if (!subStageName) continue;

      const cppValues = toStringList(processingStage.cpps);
      const key = normalize(subStageName);

      const existing = stageMap.get(key) ?? [];

      stageMap.set(key, unique([...existing, ...cppValues]));
    }

    // Support records that store CPPs directly on the equipment row.
    // Use the equipment stage as the label only when no processing
    // stages have been supplied.
    if (subStages.length === 0) {
      const cppValues = toStringList(equipment.cpps);

      if (cppValues.length > 0) {
        const key = normalize(equipmentStage);
        const existing = stageMap.get(key) ?? [];

        stageMap.set(key, unique([...existing, ...cppValues]));
      }
    }
  }

  return MAIN_STAGES.map((mainStage) => {
    const stageMap = grouped.get(mainStage.key) ?? new Map();

    const subStages: SubStage[] = [...stageMap.entries()].map(([key, cpp]) => ({
      key: `${mainStage.key}-${key}`,
      name: key
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" "),
      cpp,
      // CQA master data has not been implemented yet.
      cqa: [],
    }));

    return {
      ...mainStage,
      subStages,
    };
  });
}

export const Cpp = () => {
  const { documentId = "" } = useParams();

  const user = useAuthStore((state) => state.user);

  const { context, isLoading: isLoadingContext } =
    useDocumentSelectorData(user);

  const { document: saved } = useDocument(documentId);

  const { goToStep } = useStepNavigation(
  documentId,
  "pvp",
  "packing",
);
  const [openStage, setOpenStage] = useState<string | null>("granulation");
  const [stages, setStages] = useState<MainStage[]>(() =>
    MAIN_STAGES.map((stage) => ({ ...stage, subStages: [] })),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;

    async function fetchEquipmentData() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await listMasterRows("equipments");

        if (cancelled) return;

        const fetchedStages = buildStages(response.rows as MasterRowItem[]);

        setStages(fetchedStages);
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load equipment master data:", err);

        // Keep the stage rows visible with placeholder content.
        setStages(
          MAIN_STAGES.map((stage) => ({
            ...stage,
            subStages: [
              {
                key: `${stage.key}-placeholder`,
                name: "Data unavailable",
                cpp: [],
                cqa: [],
              },
            ],
          })),
        );

        setError(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void fetchEquipmentData();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleStageClick(stageKey: string) {
    setOpenStage((previous) => (previous === stageKey ? null : stageKey));
  }

  function handleBack() {
    goToStep("material-specification");
  }

  function handleContinue() {
    goToStep("procedure-sampling-plan");
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background text-text">
      <AppHeader
        user={user}
        unit={context?.unit ?? null}
        isLoadingUnit={isLoadingContext}
      />

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
        <AppSidebar user={user} />

        <main className="min-h-0 overflow-y-auto">
          <section className="flex min-h-full flex-col bg-surface">
            <div className="bg-background">
              <WizardHeader
                activeStepId="cpp-cqa-packing"
                completedStepIds={saved?.completed_steps ?? []}
                onStepClick={goToStep}
                title="CPP + CQA"
                description="Critical process parameters and critical quality attributes, drawn from the selected BPR. Read-only. Only Packing Material Dispensing, Primary Packing and Secondary Packing carry CPP & CQA."
                identifier={saved?.draft_id ?? documentId}
                status="DRAFT"
                dosageForm={saved?.dosage_form}
                docType="pvp"
                isPvp
                validationType="packing"
              />
            </div>

            <div className="flex-1 px-5 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-[1100px]">
                <div className="overflow-x-auto">
                  <table className="w-full table-fixed border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border">
                        <th
                          colSpan={3}
                          className="px-4 py-4 text-small font-semibold text-text"
                        >
                          Stages CPP &amp; CQA on Material Dispensing, Primary Packing and Secondary Packing · read-only
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-12 text-center">
                            <div className="flex items-center justify-center gap-2 text-small text-subdued">
                              <Loader2 className="size-5 animate-spin" />
                              Loading equipment master data...
                            </div>
                          </td>
                        </tr>
                      ) : error ? (
                        <tr>
                          <td colSpan={3} className="px-4 py-8">
                            <div className="flex flex-col items-center gap-3 text-center">
                              <AlertCircle className="size-6 text-red-600" />
                              <p className="text-small text-text">{error}</p>
                              <button
                                type="button"
                                onClick={() => {
                                  setError(null);
                                  setIsLoading(true);

                                  void listMasterRows("equipments")
                                    .then((response) => {
                                      setStages(
                                        buildStages(
                                          response.rows as MasterRowItem[],
                                        ),
                                      );
                                    })
                                    .catch((err) => {
                                      console.error(
                                        "Failed to reload equipment master data:",
                                        err,
                                      );
                                      setError(
                                        "Unable to load equipment master data. Please try again.",
                                      );
                                    })
                                    .finally(() => setIsLoading(false));
                                }}
                                className="rounded-control bg-[#0e8c8c] px-4 py-2 text-small font-semibold text-white hover:bg-[#0b7777]"
                              >
                                Try again
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        stages.map((stage) => {
                          const isOpen = openStage === stage.key;

                          return (
                            <Fragment key={stage.key}>
                              <tr className="border-b border-border bg-white transition-colors">
                                <td colSpan={3} className="p-0">
                                  <button
                                    type="button"
                                    onClick={() => handleStageClick(stage.key)}
                                    aria-expanded={isOpen}
                                    className={[
                                      "flex min-h-[58px] w-full items-center gap-3",
                                      "border-l-4 px-4 py-3 text-left",
                                      "transition-colors focus:outline-none",
                                      "focus-visible:ring-2 focus-visible:ring-inset",
                                      "focus-visible:ring-[#0e8c8c]",
                                      isOpen
                                        ? "border-l-[#0e8c8c]"
                                        : "border-l-transparent",
                                    ].join(" ")}
                                  >
                                    <span className="font-mono text-micro font-medium text-subdued">
                                      {stage.id}
                                    </span>

                                    <span className="text-small font-semibold text-text">
                                      {stage.name}
                                    </span>

                                    <span className="ml-auto flex shrink-0 items-center gap-2">
                                      <span className="text-micro font-medium text-subdued">
                                        from equipment master · read-only
                                      </span>

                                      {isOpen ? (
                                        <ChevronUp
                                          className="size-7 rounded-md border border-border p-1.5 text-text"
                                          aria-hidden="true"
                                        />
                                      ) : (
                                        <ChevronDown
                                          className="size-7 rounded-md border border-border p-1.5 text-text"
                                          aria-hidden="true"
                                        />
                                      )}
                                    </span>
                                  </button>
                                </td>
                              </tr>

                              {isOpen && (
                                <>
                                  <tr className="h-[55px] border-b border-border bg-muted/30">
                                    <th
                                      scope="col"
                                      className="w-[28%] pl-[52px] pr-4 py-3 text-left text-micro font-semibold text-text"
                                    >
                                      Critical stage
                                    </th>

                                    <th
                                      scope="col"
                                      className="w-[36%] px-4 py-3 text-left text-micro font-semibold text-text"
                                    >
                                      Critical Process Parameter
                                    </th>

                                    <th
                                      scope="col"
                                      className="w-[36%] px-4 py-3 text-left text-micro font-semibold text-text"
                                    >
                                      Critical Quality Attributes
                                    </th>
                                  </tr>

                                  {stage.subStages.length > 0 ? (
                                    stage.subStages.map((subStage) => (
                                      <tr
                                        key={subStage.key}
                                        className="border-b border-border/70 bg-muted/10 last:border-b-0"
                                      >
                                        <td className="py-4 pl-[52px] pr-4 align-top">
                                          <span className="text-small font-medium text-text">
                                            {subStage.name}
                                          </span>
                                        </td>

                                        <td className="py-4 px-4 align-top">
                                          {subStage.cpp.length > 0 ? (
                                            <div className="min-h-10 rounded-control border border-border bg-white px-3 py-2 text-small leading-5 text-black">
                                              {subStage.cpp.join(", ")}
                                            </div>
                                          ) : (
                                            <div className="min-h-10 rounded-control border border-dashed border-border bg-muted/30 px-3 py-2 text-small text-subdued">
                                              CPP values unavailable
                                            </div>
                                          )}
                                        </td>

                                        <td className="px-4 py-4 align-top">
                                          <div className="min-h-10 rounded-control border border-dashed border-border bg-muted/30 px-3 py-2 text-small text-subdued">
                                            CQA values unavailable
                                          </div>
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr className="border-b border-border/70">
                                      <td
                                        colSpan={3}
                                        className="px-4 py-6 text-center text-small text-subdued"
                                      >
                                        No processing stages found for this
                                        stage in equipment master data.
                                      </td>
                                    </tr>
                                  )}
                                </>
                              )}
                            </Fragment>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <p className="mb-0 mt-3 text-micro text-subdued">
                  CPP = Critical Process Parameter. CQA = Critical Quality
                  Attribute. CPP values are read from equipment master data. CQA
                  values will be added when CQA master data is available.
                </p>
              </div>
            </div>

            <div className="border-t border-border bg-surface px-5 py-4 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-[1100px] flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-5 py-2.5 text-small font-semibold text-text transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[#0e8c8c] focus:ring-offset-2"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleContinue}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-[#0e8c8c] px-5 py-2.5 text-small font-semibold text-white transition-all duration-300 hover:bg-[#0b7777] focus:outline-none focus:ring-2 focus:ring-[#0e8c8c] focus:ring-offset-2"
                >
                  Continue to procedure &amp; sampling plan
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
