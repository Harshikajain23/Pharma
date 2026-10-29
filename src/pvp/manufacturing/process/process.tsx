
import {
  ArrowLeft,
  ArrowRight,
  Info,
  Loader2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppHeader } from "../../../features/new-document/components/AppHeader";
import { AppSidebar } from "../../../features/new-document/components/AppSidebar";
import { WizardHeader } from "../../../features/new-document/components/WizardHeader";

import { useAuthStore } from "../../../features/auth/state/auth.store";
import { useDocument } from "../../../features/new-document/hooks/useDocument";
import { useDocumentSelectorData } from "../../../features/new-document/hooks/useDocumentSelectorData";
import { useStepNavigation } from "../../../features/new-document/hooks/useStepNavigation";

import { httpClient } from "../../../shared/api/httpClient";

// =========================================================
// TYPES
// =========================================================

interface ProcessStep {
  id?: string;
  name: string;
  process?: string;
}

interface BomMaterial {
  sr_no?: number;
  material_code: string;
  material: string;
  qty_required: string | number;
  uom: string;
}

interface ProcessFlowBomResponse {
  process_flow?: ProcessStep[];
  bill_of_materials?: BomMaterial[];
}

interface InputMaterial {
  id: number;
  name: string;
  functionalCategory: string;
}

type ActiveSection =
  | "process-flow"
  | "bom"
  | "input-specification";

// =========================================================
// INPUT MATERIAL MASTER DATA
// TEMPORARY DATA UNTIL API IS CREATED
// =========================================================

const SPECIFICATION_NUMBERS = [
  "SP/RM/001",
  "SP/RM/002",
  "SP/RM/003",
  "SP/RM/004",
  "SP/RM/005",
  "SP/RM/006",
  "SP/RM/007",
  "SP/RM/008",
  "SP/RM/009",
  "SP/RM/010",
];

const INPUT_MATERIALS: InputMaterial[] = [
  { id: 1, name: "Starch IP", functionalCategory: "Diluent" },
  {
    id: 2,
    name: "Dibasic Calcium Phosphate IP",
    functionalCategory: "Diluent",
  },
  {
    id: 3,
    name: "Purified water IP",
    functionalCategory: "Solvent",
  },
  { id: 4, name: "Atenolol IP", functionalCategory: "Active" },
  {
    id: 5,
    name: "Ethyl Cellulose IP",
    functionalCategory: "Binder",
  },
  { id: 6, name: "Acetone BP", functionalCategory: "Solvent" },
  {
    id: 7,
    name: "Sodium Starch Glycolate IP",
    functionalCategory: "Disintegrant",
  },
  {
    id: 8,
    name: "Colloidal Silicon Dioxide IP",
    functionalCategory: "Glidant",
  },
];

// =========================================================
// COMPONENT
// =========================================================

export const Process = () => {
  const { documentId = "" } = useParams();
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);

  const {
    context,
    isLoading: isLoadingContext,
  } = useDocumentSelectorData(user);

  const { document: saved } = useDocument(documentId);

  const { goToStep } = useStepNavigation(documentId, "pvp");

  const [activeSection, setActiveSection] =
    useState<ActiveSection>("process-flow");

  const [processFlow, setProcessFlow] = useState<ProcessStep[]>([]);
  const [billOfMaterials, setBillOfMaterials] =
    useState<BomMaterial[]>([]);

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [
    selectedSpecifications,
    setSelectedSpecifications,
  ] = useState<Record<number, string>>({});

  const selectedCount = Object.values(
    selectedSpecifications,
  ).filter(Boolean).length;

  const allSpecificationsSelected =
    selectedCount === INPUT_MATERIALS.length;

  // =========================================================
  // LOAD PROCESS FLOW + BOM
  // =========================================================

  useEffect(() => {
    if (!documentId) {
      setIsLoadingData(false);
      return;
    }

    let cancelled = false;

    async function loadProcessFlowAndBom() {
      try {
        setIsLoadingData(true);
        setError(null);

        const response =
          await httpClient.get<ProcessFlowBomResponse>(
            `/api/pvp/documents/${encodeURIComponent(
              documentId,
            )}/process-flow-bom`,
          );

        if (cancelled) return;

        const data = response.data;

        setProcessFlow(
          Array.isArray(data?.process_flow)
            ? data.process_flow
            : [],
        );

        setBillOfMaterials(
          Array.isArray(data?.bill_of_materials)
            ? data.bill_of_materials
            : [],
        );
      } catch (err) {
        console.error(
          "Failed to load PVP process flow and BOM:",
          err,
        );

        if (!cancelled) {
          setError(
            "Failed to load the process flow and bill of materials from the backend.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingData(false);
        }
      }
    }

    void loadProcessFlowAndBom();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  // =========================================================
  // TAB NAVIGATION
  // =========================================================

  function handleSectionChange(section: ActiveSection) {
    setActiveSection(section);
  }

  // =========================================================
  // SPECIFICATION SELECTION
  // =========================================================

  function handleSpecificationChange(
    materialId: number,
    specificationNumber: string,
  ) {
    setSelectedSpecifications((previous) => ({
      ...previous,
      [materialId]: specificationNumber,
    }));
  }

  // =========================================================
  // BACK BUTTON
  // =========================================================

  function handleBack() {
    switch (activeSection) {
      case "process-flow":
        navigate(`/pvp/${documentId}/preview`);
        break;

      case "bom":
        handleSectionChange("process-flow");
        break;

      case "input-specification":
        handleSectionChange("bom");
        break;
    }
  }

  // =========================================================
  // CONTINUE BUTTON
  // =========================================================

  function handleContinue() {
    switch (activeSection) {
      case "process-flow":
        handleSectionChange("bom");
        break;

      case "bom":
        handleSectionChange("input-specification");
        break;

      case "input-specification":
        if (!allSpecificationsSelected) return;

        // Add API saving for specification selections here later.
        goToStep("cpp-cqa");
        break;
    }
  }

  // =========================================================
  // REUSABLE LOADING / EMPTY STATE
  // =========================================================

  const stateContainerClass =
    "flex items-center justify-center rounded-control border border-border bg-muted px-6 py-12 text-center text-small text-subdued";

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="flex flex-col bg-background text-text">
      {/* HEADER */}

      <AppHeader
        user={user}
        unit={context?.unit ?? null}
        isLoadingUnit={isLoadingContext}
      />

      {/* BODY */}

      <div className="lg:grid lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
        <AppSidebar user={user} />

        <main className="min-w-0">
          <section className="bg-background">
            {/* WIZARD HEADER */}

            <div className="bg-background">
              <WizardHeader
                activeStepId="process-flow-bom"
                completedStepIds={saved?.completed_steps ?? []}
                onStepClick={goToStep}
                title="Process Flow & BOM"
                description="The manufacturing process flow generated from the BMR and the bill of materials. Both are read-only and will be included in the protocol."
                identifier={saved?.draft_id ?? documentId}
                status="DRAFT"
                dosageForm={saved?.dosage_form}
                docType="pvp"
                isPvp
                validationType="manufacturing"
              />
            </div>

            {/* PAGE CONTENT */}

            <div className="px-5 py-6 sm:px-6 lg:px-8">
              {error && (
                <div className="mb-5 rounded-control border border-danger/30 bg-danger/5 px-4 py-3 text-small text-danger">
                  {error}
                </div>
              )}

              {/* TAB BUTTONS */}

              <section className="space-y-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() =>
                      handleSectionChange("process-flow")
                    }
                    aria-pressed={
                      activeSection === "process-flow"
                    }
                    className={`min-h-12 rounded-control border px-4 py-3 text-small font-semibold transition-all duration-300 ${
                      activeSection === "process-flow"
                        ? "border-[#0e8c8c] bg-[#E8F5F5] text-[#0e8c8c] shadow-sm"
                        : "border-border bg-surface text-subdued hover:border-[#0e8c8c]/40 hover:bg-[#F5FAFA] hover:text-text"
                    }`}
                  >
                    Process Flow
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSectionChange("bom")}
                    aria-pressed={activeSection === "bom"}
                    className={`min-h-12 rounded-control border px-4 py-3 text-small font-semibold transition-all duration-300 ${
                      activeSection === "bom"
                        ? "border-[#0e8c8c] bg-[#E8F5F5] text-[#0e8c8c] shadow-sm"
                        : "border-border bg-surface text-subdued hover:border-[#0e8c8c]/40 hover:bg-[#F5FAFA] hover:text-text"
                    }`}
                  >
                    Bill of Materials
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSectionChange("input-specification")
                    }
                    aria-pressed={
                      activeSection === "input-specification"
                    }
                    className={`min-h-12 rounded-control border px-4 py-3 text-small font-semibold transition-all duration-300 ${
                      activeSection === "input-specification"
                        ? "border-[#0e8c8c] bg-[#E8F5F5] text-[#0e8c8c] shadow-sm"
                        : "border-border bg-surface text-subdued hover:border-[#0e8c8c]/40 hover:bg-[#F5FAFA] hover:text-text"
                    }`}
                  >
                    Input Material Specification
                  </button>
                </div>

                {/* ACTIVE TAB CONTENT
                    Only the selected tab is mounted.
                    Its height follows its own content. */}

                <div className="w-full min-w-0 self-start">
                  {/* TAB 1: PROCESS FLOW */}

                  {activeSection === "process-flow" && (
                    <section className="space-y-5">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-h3 font-semibold">
                            Process flow diagram
                          </h2>

                          <span className="rounded-sm border border-[#0e8c8c]/20 bg-[#E8F5F5] px-2 py-0.5 text-micro text-[#0e8c8c]">
                            From BMR · Read-only
                          </span>
                        </div>

                        <p className="mt-1 text-small text-subdued">
                          Manufacturing process flow generated
                          from the approved BMR.
                        </p>
                      </div>

                      {isLoadingData ? (
                        <div className={stateContainerClass}>
                          <div className="flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin text-[#0e8c8c]" />
                            Loading process flow...
                          </div>
                        </div>
                      ) : error ? (
                        <div className={stateContainerClass}>
                          Unable to load process flow.
                        </div>
                      ) : processFlow.length === 0 ? (
                        <div className={stateContainerClass}>
                          No process flow data was returned from
                          the backend.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-control border border-border-strong bg-muted p-6 shadow-sm">
                          <div className="mx-auto flex min-w-max items-center gap-3 py-8">
                            {processFlow.map((step, index) => (
                              <div
                                key={
                                  step.id ??
                                  `${step.name}-${index}`
                                }
                                className="flex items-center gap-3"
                              >
                                <div className="flex min-w-[150px] items-center justify-center rounded-control border border-[#0e8c8c]/30 bg-surface px-5 py-4 text-center shadow-sm">
                                  <span className="text-small font-semibold text-text">
                                    {step.name}
                                  </span>
                                </div>

                                {index <
                                  processFlow.length - 1 && (
                                  <ArrowRight
                                    className="size-5 shrink-0 text-[#0e8c8c]"
                                    aria-hidden="true"
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </section>
                  )}

                  {/* TAB 2: BILL OF MATERIALS */}

                  {activeSection === "bom" && (
                    <section className="space-y-5">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-h3 font-semibold">
                            Bill of materials
                          </h2>

                          <span className="rounded-sm border border-[#0e8c8c]/20 bg-[#E8F5F5] px-2 py-0.5 text-micro text-[#0e8c8c]">
                            From BMR · Read-only
                          </span>
                        </div>

                        <p className="mt-1 text-small text-subdued">
                          {billOfMaterials.length} materials ·
                          from BMR · read-only
                        </p>
                      </div>

                      {isLoadingData ? (
                        <div className={stateContainerClass}>
                          <div className="flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin text-[#0e8c8c]" />
                            Loading bill of materials...
                          </div>
                        </div>
                      ) : error ? (
                        <div className={stateContainerClass}>
                          Unable to load bill of materials.
                        </div>
                      ) : billOfMaterials.length === 0 ? (
                        <div className={stateContainerClass}>
                          No bill of materials data was returned
                          from the backend.
                        </div>
                      ) : (
                        <div className="overflow-x-auto rounded-control border border-border-strong bg-surface shadow-sm">
                          <table className="w-full min-w-[750px] border-collapse">
                            <thead>
                              <tr className="border-b border-border bg-muted">
                                <th className="px-4 py-3 text-left text-small font-semibold text-text">
                                  Sr.
                                </th>
                                <th className="px-4 py-3 text-left text-small font-semibold text-text">
                                  Material code
                                </th>
                                <th className="px-4 py-3 text-left text-small font-semibold text-text">
                                  Material
                                </th>
                                <th className="px-4 py-3 text-left text-small font-semibold text-text">
                                  Qty. required
                                </th>
                                <th className="px-4 py-3 text-left text-small font-semibold text-text">
                                  UOM
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {billOfMaterials.map(
                                (material, index) => (
                                  <tr
                                    key={`${material.material_code}-${index}`}
                                    className="border-b border-border last:border-b-0"
                                  >
                                    <td className="px-4 py-3 text-small text-subdued">
                                      {material.sr_no ?? index + 1}
                                    </td>
                                    <td className="px-4 py-3 text-small font-medium text-text">
                                      {material.material_code}
                                    </td>
                                    <td className="px-4 py-3 text-small font-semibold text-text">
                                      {material.material}
                                    </td>
                                    <td className="px-4 py-3 text-small text-text">
                                      {material.qty_required}
                                    </td>
                                    <td className="px-4 py-3 text-small text-text">
                                      {material.uom}
                                    </td>
                                  </tr>
                                ),
                              )}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </section>
                  )}

                  {/* TAB 3: INPUT MATERIAL SPECIFICATION */}

                  {activeSection === "input-specification" && (
                    <section className="space-y-5">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-h3 font-semibold">
                            Input material specification
                          </h2>

                          <span className="rounded-sm border border-[#0e8c8c]/20 bg-[#E8F5F5] px-2 py-0.5 text-micro text-[#0e8c8c]">
                            BMR + MFC
                          </span>
                        </div>

                        <p className="mt-1 text-small text-subdued">
                          Select a specification number for every
                          input material from the master data.
                        </p>
                      </div>

                      <div className="overflow-hidden rounded-control border border-border-strong bg-surface shadow-sm">
                        {/* TABLE SUMMARY */}

                        <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 border-b border-border bg-surface px-4 py-3">
                          <h3 className="m-0 text-small font-semibold text-text">
                            Input material specification
                          </h3>

                          <span className="text-small text-subdued">
                            {INPUT_MATERIALS.length} materials ·{" "}
                            {selectedCount}/{INPUT_MATERIALS.length}{" "}
                            spec no. set
                          </span>
                        </div>

                        {/* TABLE */}

                        <div className="overflow-x-auto">
                          <table className="w-full min-w-[850px] border-collapse">
                            <thead>
                              <tr className="h-10 border-b border-border bg-muted">
                                <th className="w-[70px] px-4 py-2 text-left text-small font-semibold text-text">
                                  Sr.
                                </th>

                                <th className="px-4 py-2 text-left text-small font-semibold text-text">
                                  <div className="flex items-center gap-3">
                                    <span>Name of material</span>
                                    <span className="inline-flex rounded-full border border-border-strong bg-muted px-2.5 py-0.5 text-micro font-medium text-subdued">
                                      BMR
                                    </span>
                                  </div>
                                </th>

                                <th className="px-4 py-2 text-left text-small font-semibold text-text">
                                  <div className="flex items-center gap-3">
                                    <span>Functional category</span>
                                    <span className="inline-flex rounded-full border border-border-strong bg-muted px-2.5 py-0.5 text-micro font-medium text-subdued">
                                      MFC
                                    </span>
                                  </div>
                                </th>

                                <th className="w-[300px] px-4 py-2 text-left text-small font-semibold text-text">
                                  <div className="flex items-center gap-3">
                                    <span>
                                      Specification No.
                                      <span className="ml-1 text-danger">
                                        *
                                      </span>
                                    </span>
                                    <span className="inline-flex rounded-full border border-border-strong bg-muted px-2.5 py-0.5 text-micro font-normal text-subdued">
                                      Master data
                                    </span>
                                  </div>
                                </th>
                              </tr>
                            </thead>

                            <tbody>
                              {INPUT_MATERIALS.map((material) => {
                                const selectedSpecification =
                                  selectedSpecifications[
                                    material.id
                                  ] ?? "";

                                const isSpecificationEmpty =
                                  !selectedSpecification;

                                return (
                                  <tr
                                    key={material.id}
                                    className="h-12 border-b border-border last:border-b-0"
                                  >
                                    <td className="px-4 py-2 align-middle text-small text-subdued">
                                      {material.id}
                                    </td>

                                    <td className="px-4 py-2 align-middle">
                                      <span className="text-small font-medium text-text">
                                        {material.name}
                                      </span>
                                    </td>

                                    <td className="px-4 py-2 align-middle">
                                      <span className="inline-flex rounded-full px-2.5 py-1 text-micro font-medium text-subdued">
                                        {material.functionalCategory}
                                      </span>
                                    </td>

                                    <td className="px-4 py-2 align-middle">
                                      <select
                                        value={selectedSpecification}
                                        onChange={(event) =>
                                          handleSpecificationChange(
                                            material.id,
                                            event.target.value,
                                          )
                                        }
                                        aria-label={`Specification number for ${material.name}`}
                                        className={`h-9 w-full rounded-control bg-surface px-3 text-small text-text shadow-sm transition-colors focus:outline-none focus:ring-2 ${
                                          isSpecificationEmpty
                                            ? "border border-[var(--danger)] focus:border-[var(--danger)] focus:ring-[var(--danger)]/20"
                                            : "border border-[#0e8c8c] focus:border-[#0e8c8c] focus:ring-[#0e8c8c]/50"
                                        }`}
                                      >
                                        <option value="">
                                          Select spec no...
                                        </option>

                                        {SPECIFICATION_NUMBERS.map(
                                          (specificationNumber) => (
                                            <option
                                              key={specificationNumber}
                                              value={specificationNumber}
                                            >
                                              {specificationNumber}
                                            </option>
                                          ),
                                        )}
                                      </select>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* VALIDATION MESSAGE */}

                      {!allSpecificationsSelected && (
                        <p
                          role="status"
                          className="text-small text-orange-500"
                        >
                          Please select a specification number for
                          every input material before continuing.
                        </p>
                      )}

                      {allSpecificationsSelected && (
                        <p
                          role="status"
                          className="text-small text-[#0e8c8c]"
                        >
                          All {INPUT_MATERIALS.length} material
                          specifications have been selected.
                        </p>
                      )}
                    </section>
                  )}
                </div>
              </section>

              {/* INFO */}

              {activeSection !== "input-specification" && (
                <div className="mt-5 flex items-start gap-2 rounded-control border border-border bg-muted px-4 py-3 text-small text-subdued">
                  <Info
                    className="mt-0.5 size-4 shrink-0 text-[#0e8c8c]"
                    aria-hidden="true"
                  />

                  <p>
                    The process flow and bill of materials are
                    generated from the BMR and are read-only.
                    They will be included in the protocol.
                  </p>
                </div>
              )}
            </div>

            {/* BOTTOM ACTIONS */}

            <div className="border-t border-border bg-surface px-5 py-4 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-[1100px] flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-5 py-2.5 text-small font-semibold text-text transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[#0e8c8c] focus:ring-offset-2"
                >
                  <ArrowLeft
                    className="size-4"
                    aria-hidden="true"
                  />

                  {activeSection === "process-flow"
                    ? "Back"
                    : activeSection === "bom"
                      ? "Back to Process Flow"
                      : "Back to Bill of Materials"}
                </button>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={
                    activeSection === "input-specification" &&
                    !allSpecificationsSelected
                  }
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-[#0e8c8c] px-5 py-2.5 text-small font-semibold text-white transition-all duration-300 hover:bg-[#0b7777] focus:outline-none focus:ring-2 focus:ring-[#0e8c8c] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-border-strong disabled:text-white/70"
                >
                  {activeSection === "process-flow"
                    ? "Continue to Bill of Materials"
                    : activeSection === "bom"
                      ? "Continue to Input Material Specification"
                      : "Continue to CPP + CQA"}

                  <ArrowRight
                    className="size-4"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};