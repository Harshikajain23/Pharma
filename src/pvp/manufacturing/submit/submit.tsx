
import { ArrowLeft, ArrowRight, FileText } from "lucide-react";
import { useParams } from "react-router-dom";

import { AppHeader } from "../../../features/new-document/components/AppHeader";
import { AppSidebar } from "../../../features/new-document/components/AppSidebar";
import { WizardHeader } from "../../../features/new-document/components/WizardHeader";

import { useAuthStore } from "../../../features/auth/state/auth.store";
import { useDocument } from "../../../features/new-document/hooks/useDocument";
import { useDocumentSelectorData } from "../../../features/new-document/hooks/useDocumentSelectorData";
import { useStepNavigation } from "../../../features/new-document/hooks/useStepNavigation";

// =========================================================
// COMPONENT
// =========================================================

export const Submit = () => {
  const { documentId = "" } = useParams();

  const user = useAuthStore((state) => state.user);

  const { context, isLoading: isLoadingContext } =
    useDocumentSelectorData(user);

  const { document: saved } = useDocument(documentId);

  const { goToStep } = useStepNavigation(documentId, "pvp");

  // =========================================================
  // HANDLERS
  // =========================================================

  function handleBack() {
    goToStep("procedure-sampling-plan");
  }

  function handleGenerate() {
    // PVP generation API will be connected here.
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="fixed inset-0 flex flex-col bg-background text-text">
      {/* HEADER */}

      <AppHeader
        user={user}
        unit={context?.unit ?? null}
        isLoadingUnit={isLoadingContext}
      />

      {/* BODY */}

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
        <AppSidebar user={user} />

        <main className="overflow-y-auto">
          <section className="bg-surface">
            {/* WIZARD HEADER */}

            <div className="bg-background">
              <WizardHeader
                activeStepId="generate-submit"
                completedStepIds={saved?.completed_steps ?? []}
                onStepClick={goToStep}
                title="Generate & submit"
                description="Check the inputs, generate the PVP, then submit it for review. Once submitted, the document is locked until a reviewer returns it."
                identifier={saved?.draft_id ?? documentId}
                status="DRAFT"
                dosageForm={saved?.dosage_form}
                docType="pvp"
                isPvp
                validationType="manufacturing"
              />
            </div>

            {/* CONTENT */}

            <div className="px-5 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-[1100px]">
                {/* SUMMARY */}

                <div className="overflow-hidden rounded-control border border-border-strong bg-surface shadow-sm">
                  <div className="flex h-12 items-center border-b border-border px-4">
                    <h2 className="text-small font-semibold text-text">
                      Summary
                    </h2>
                  </div>

                  <div className="divide-y divide-border">
                    {/* DOCUMENT */}

                    <SummarySection title="Document">
                      <SummaryRow label="Type" value="—" />
                      <SummaryRow label="Document" value="—" />
                      <SummaryRow label="Document number" value="—" />
                    </SummarySection>

                    {/* PRODUCT */}

                    <SummarySection title="Product">
                      <SummaryRow label="Product" value="—" />
                      <SummaryRow label="Batch size" value="—" />
                      <SummaryRow label="Bulk BMR" value="—" />
                    </SummarySection>

                    {/* SOURCE DOCUMENTS */}

                    <SummarySection title="Source documents">
                      <SummaryRow label="FPG" value="Not attached" />
                      <SummaryRow label="PP" value="Not attached" />
                    </SummarySection>

                    {/* BATCH AND PAGE SETUP */}

                    <SummarySection title="Batch & page set-up">
                      <SummaryRow label="Page set-up" value="—" />
                      <SummaryRow label="Header" value="—" />
                      <SummaryRow label="Footer" value="—" />
                      <SummaryRow label="Footer template" value="—" />
                    </SummarySection>

                    {/* INTRODUCTION */}

                    <SummarySection title="Introduction">
                      <SummaryRow label="Reason" value="—" />
                      <SummaryRow label="CCN" value="—" />
                    </SummarySection>

                    {/* PROCESS DESCRIPTION */}

                    <SummarySection title="Process description">
                      <SummaryRow label="FPG No." value="—" />
                      <SummaryRow label="PP No." value="—" />
                      <SummaryRow label="Mfg. Lic." value="—" />
                    </SummarySection>

                    {/* STAGES */}

                    <SummarySection title="Stages">
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Dispensing",
                          "Granulation",
                          "Compression",
                          "Inspection (uncoated)",
                          "Coating",
                          "Inspection (coated)",
                        ].map((stage) => (
                          <span
                            key={stage}
                            className="rounded-control border border-border bg-muted px-3 py-1.5 text-small text-text"
                          >
                            {stage}
                          </span>
                        ))}
                      </div>
                    </SummarySection>

                    {/* BATCH YIELD */}

                    <SummarySection title="Batch yield">
                      <SummaryRow
                        label="Actual yield limit"
                        value="___ – ___ %"
                      />
                      <SummaryRow
                        label="Batch yield limit"
                        value="___ – ___ %"
                      />
                    </SummarySection>
                  </div>
                </div>

                {/* GENERATED PVP */}

                <div className="mt-6 overflow-hidden rounded-control border border-border-strong bg-surface shadow-sm">
                  <div className="border-b border-border px-4 py-4">
                    <h2 className="text-small font-semibold text-text">
                      Generated PVP
                    </h2>

                    <p className="mt-1 text-small leading-5 text-subdued">
                      The PVP is built from the inputs above. You can check
                      every page before submitting.
                    </p>
                  </div>

                  <div className="flex flex-col items-center px-5 py-12 text-center">
                    <div className="flex size-12 items-center justify-center rounded-xl bg-[#0e8c8c]/10 text-[#0e8c8c]">
                      <FileText className="size-6" />
                    </div>

                    <p className="mt-4 text-small font-medium text-text">
                      No PVP generated yet
                    </p>

                    <p className="mt-1 max-w-md text-small leading-5 text-subdued">
                      Generate the PVP to preview the document before
                      submitting it for review.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM ACTIONS */}

            <div className="border-t border-border bg-surface px-5 py-4 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-[1100px] flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-5 py-2.5 text-small font-semibold text-text transition hover:bg-muted"
                >
                  <ArrowLeft className="size-4" />
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleGenerate}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-[#0e8c8c] px-5 py-2.5 text-small font-semibold text-white transition hover:bg-[#0b7777]"
                >
                  Generate PVP
                  <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

// =========================================================
// SUMMARY SECTION
// =========================================================

const SummarySection = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="px-4 py-4">
    <h3 className="mb-3 text-small font-semibold text-text">{title}</h3>
    <div className="space-y-2">{children}</div>
  </div>
);

// =========================================================
// SUMMARY ROW
// =========================================================

const SummaryRow = ({
  label,
  value,
}: {
  label: string;
  value: string;
}) => (
  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:gap-3">
    <span className="w-full shrink-0 text-small text-subdued sm:w-44">
      {label}
    </span>
    <span className="text-small text-text">{value}</span>
  </div>
);
