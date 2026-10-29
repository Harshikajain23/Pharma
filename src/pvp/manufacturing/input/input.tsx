import { ArrowLeft, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

import { AppHeader } from "../../../features/new-document/components/AppHeader";
import { AppSidebar } from "../../../features/new-document/components/AppSidebar";
import { WizardHeader } from "../../../features/new-document/components/WizardHeader";

import { useAuthStore } from "../../../features/auth/state/auth.store";
import { useDocument } from "../../../features/new-document/hooks/useDocument";
import { useDocumentSelectorData } from "../../../features/new-document/hooks/useDocumentSelectorData";
import { useStepNavigation } from "../../../features/new-document/hooks/useStepNavigation";

// =========================================================
// TYPES
// =========================================================

interface InputMaterial {
  id: number;
  name: string;
  functionalCategory: string;
}

// =========================================================
// MASTER DATA
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

// =========================================================
// INPUT MATERIALS
// TEMPORARY DATA UNTIL API IS CREATED
// =========================================================

const INPUT_MATERIALS: InputMaterial[] = [
  {
    id: 1,
    name: "Starch IP",
    functionalCategory: "Diluent",
  },
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
  {
    id: 4,
    name: "Atenolol IP",
    functionalCategory: "Active",
  },
  {
    id: 5,
    name: "Ethyl Cellulose IP",
    functionalCategory: "Binder",
  },
  {
    id: 6,
    name: "Acetone BP",
    functionalCategory: "Solvent",
  },
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

export const Input = () => {
  const { documentId = "" } = useParams();

  const user = useAuthStore((state) => state.user);

  const { context, isLoading: isLoadingContext } =
    useDocumentSelectorData(user);

  const { document: saved } = useDocument(documentId);

  const { goToStep } = useStepNavigation(documentId, "pvp");

  // =========================================================
  // SPECIFICATION SELECTIONS
  // =========================================================

  const [selectedSpecifications, setSelectedSpecifications] = useState<
    Record<number, string>
  >({});

  // =========================================================
  // COUNTER
  // =========================================================

  const selectedCount = Object.values(selectedSpecifications).filter(
    Boolean,
  ).length;

  const allSpecificationsSelected =
    selectedCount === INPUT_MATERIALS.length;

  // =========================================================
  // HANDLERS
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

  function handleBack() {
    goToStep("process-flow-bom");
  }

  function handleContinue() {
    if (!allSpecificationsSelected) {
      return;
    }

    // API save will be added here later.
    goToStep("cpp-cqa");
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="fixed inset-0 flex flex-col bg-background text-text">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <AppHeader
        user={user}
        unit={context?.unit ?? null}
        isLoadingUnit={isLoadingContext}
      />

      {/* =====================================================
          BODY
      ===================================================== */}

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <AppSidebar user={user} />

        {/* ===================================================
            MAIN
        =================================================== */}

        <main className="overflow-y-auto">
          <section className="bg-surface">
            {/* =================================================
                WIZARD HEADER
            ================================================= */}

            <div className="bg-background">
              <WizardHeader
                activeStepId="material-specification"
                completedStepIds={saved?.completed_steps ?? []}
                onStepClick={goToStep}
                title="Input material specification"
                description="The input materials are sourced from the BMR, and their functional categories come from the MFC. These fields are read-only. Select the specification number for each material from the master data."
                identifier={saved?.draft_id ?? documentId}
                status="DRAFT"
                dosageForm={saved?.dosage_form}
                docType="pvp"
                isPvp
                validationType="manufacturing"
              />
            </div>

            {/* =================================================
                CONTENT
            ================================================= */}

            <div className="px-5 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-[1100px]">
                {/* =================================================
                    TABLE CARD
                ================================================= */}

                <div className="overflow-hidden rounded-control border border-border-strong bg-surface shadow-sm">
                  {/* =================================================
                      TABLE SUMMARY
                  ================================================= */}

                  <div className="flex h-12 items-center justify-between border-b border-border bg-surface px-4">
                    <h2 className="m-0 text-small font-semibold text-text">
                      Input material specification
                    </h2>

                    <span className="text-small text-subdued">
                      {INPUT_MATERIALS.length} materials · {selectedCount}/
                      {INPUT_MATERIALS.length} spec no. set
                    </span>
                  </div>

                  {/* =================================================
                      TABLE
                  ================================================= */}

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[850px] border-collapse">
                      {/* =================================================
                          TABLE HEADER
                      ================================================= */}

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
                                <span className="ml-1 text-danger">*</span>
                              </span>

                              <span className="inline-flex rounded-full border border-border-strong bg-muted px-2.5 py-0.5 text-micro font-normal text-subdued">
                                Master data
                              </span>
                            </div>
                          </th>
                        </tr>
                      </thead>

                      {/* =================================================
                          TABLE BODY
                      ================================================= */}

                      <tbody>
                        {INPUT_MATERIALS.map((material) => {
                          const selectedSpecification =
                            selectedSpecifications[material.id] ?? "";

                          const isSpecificationEmpty =
                            !selectedSpecification;

                          return (
                            <tr
                              key={material.id}
                              className="h-12 border-b border-border last:border-b-0"
                            >
                              {/* SERIAL NUMBER */}

                              <td className="px-4 py-2 align-middle text-small text-subdued">
                                {material.id}
                              </td>

                              {/* MATERIAL NAME */}

                              <td className="px-4 py-2 align-middle">
                                <span className="text-small font-medium text-text">
                                  {material.name}
                                </span>
                              </td>

                              {/* FUNCTIONAL CATEGORY */}

                              <td className="px-4 py-2 align-middle">
                                <span className="inline-flex rounded-full px-2.5 py-1 text-micro font-medium text-subdued">
                                  {material.functionalCategory}
                                </span>
                              </td>

                              {/* SPECIFICATION NUMBER */}

                              <td className="px-4 py-2 align-middle">
                                <select
                                  value={selectedSpecification}
                                  onChange={(event) =>
                                    handleSpecificationChange(
                                      material.id,
                                      event.target.value,
                                    )
                                  }
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

                {/* =================================================
                    VALIDATION MESSAGE
                ================================================= */}

                {!allSpecificationsSelected && (
                  <p className="mt-3 text-small text-orange-500">
                    Please select a specification number for every input
                    material before continuing.
                  </p>
                )}
              </div>
            </div>

            {/* =====================================================
                BOTTOM ACTIONS
            ===================================================== */}

            <div className="border-t border-border bg-surface px-5 py-4 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-[1100px] flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                {/* BACK */}

                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-5 py-2.5 text-small font-semibold text-text transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[#0e8c8c] focus:ring-offset-2"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back
                </button>

                {/* CONTINUE */}

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!allSpecificationsSelected}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-[#0e8c8c] px-5 py-2.5 text-small font-semibold text-white transition-all duration-300 hover:bg-[#0b7777] focus:outline-none focus:ring-2 focus:ring-[#0e8c8c] focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-border-strong disabled:text-white/70"
                >
                  Continue to CPP + CQA
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


