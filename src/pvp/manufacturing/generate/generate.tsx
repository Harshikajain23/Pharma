
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Loader2,
  RefreshCw,
  Send,
  Sparkles,
  Plus,
  AlertCircle,
  Pencil,
} from "lucide-react";
import { useState } from "react";
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

type GenerationStatus =
  | "idle"
  | "working"
  | "ready"
  | "submitted";

interface SummaryRowProps {
  label: string;
  children: React.ReactNode;
  onEdit?: () => void;
  locked?: boolean;
}

interface PvpSummary {
  product: string;
  batchSize: string;
  bmrNo: string;
  fpgName: string;
  ppName: string;
  otherDocuments: string[];
  batchType: string;
  headerSize: string;
  footerSize: string;
  footerTemplate: string;
  reasonForValidation: string;
  ccnNo: string;
  fpgNo: string;
  ppNo: string;
  manufacturingLicense: string;
  stages: string[];
  batchYield: string[];
}

// =========================================================
// COMPONENT
// =========================================================

export const Generate = () => {
  const { documentId = "" } = useParams();
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);

  const { context, isLoading: isLoadingContext } =
    useDocumentSelectorData(user);

  const { goToStep } = useStepNavigation(documentId, "pvp");

  const { document: saved } = useDocument(documentId);

  // =========================================================
  // STATE
  // =========================================================

  const [generationStatus, setGenerationStatus] =
    useState<GenerationStatus>("idle");

  const [generatedAt, setGeneratedAt] = useState("");

  const [error, setError] = useState<string | null>(null);

  // =========================================================
  // DOCUMENT SUMMARY
  // Replace these defaults with your saved PVP data.
  // =========================================================

  const summary: PvpSummary = {
    product: "",
    batchSize: "",
    bmrNo: "",
    fpgName: "",
    ppName: "",
    otherDocuments: [],
    batchType: "",
    headerSize: "0.5",
    footerSize: "0.75",
    footerTemplate: "",
    reasonForValidation: "",
    ccnNo: "",
    fpgNo: "",
    ppNo: "",
    manufacturingLicense: "",
    stages: [],
    batchYield: [],
  };

  // =========================================================
  // NAVIGATION
  // =========================================================

  function handleBack() {
    navigate(`/pvp/${documentId}/procedure`);
  }

  function handleEdit(step: number) {
    goToStep(step);
  }

  // =========================================================
  // GENERATE PVP
  // =========================================================

  async function handleGenerate() {
    if (
      !documentId ||
      generationStatus === "working" ||
      generationStatus === "submitted"
    ) {
      return;
    }

    try {
      setGenerationStatus("working");
      setError(null);

      // Replace with the actual endpoint used by your backend.
      await httpClient.post(
        `/api/pvp/documents/${encodeURIComponent(documentId)}/generate`,
      );

      setGeneratedAt(
        new Date().toLocaleString(),
      );

      setGenerationStatus("ready");
    } catch (err) {
      console.error("Failed to generate PVP:", err);

      setError(
        "Failed to generate the PVP. Please try again.",
      );

      setGenerationStatus("idle");
    }
  }

  // =========================================================
  // SUBMIT FOR REVIEW
  // =========================================================

  async function handleSubmit() {
    if (
      !documentId ||
      generationStatus !== "ready"
    ) {
      return;
    }

    try {
      setError(null);

      // Replace with your actual submit endpoint.
      await httpClient.post(
        `/api/pvp/documents/${encodeURIComponent(documentId)}/submit`,
      );

      setGenerationStatus("submitted");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error("Failed to submit PVP:", err);

      setError(
        "Failed to submit the PVP for review. Please try again.",
      );
    }
  }

  // =========================================================
  // START ANOTHER DOCUMENT
  // =========================================================

  function handleRestart() {
    navigate("/new-document");
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
          <section className="bg-background">
            {/* WIZARD HEADER */}

            <WizardHeader
              activeStepId="generate-submit"
              completedStepIds={saved?.completed_steps ?? []}
              onStepClick={goToStep}
              title="Generate & Submit"
              description={
                generationStatus === "submitted"
                  ? "Your document has been submitted for review."
                  : "Check the inputs, generate the PVP, then submit it for review. Once submitted, the document is locked until a reviewer returns it."
              }
              identifier={saved?.draft_id ?? documentId}
              status={
                generationStatus === "submitted"
                  ? "SUBMITTED"
                  : "DRAFT"
              }
              dosageForm={saved?.dosage_form}
              docType="pvp"
              isPvp
              validationType="manufacturing"
            />

            {/* CONTENT */}

            <div className="bg-background px-5 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-[1100px] space-y-6">

                {/* ERROR */}

                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-control border border-danger/30 bg-danger/5 px-4 py-3 text-small text-danger"
                  >
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <p>{error}</p>
                  </div>
                )}

                {/* =================================================
                    SUBMITTED SUCCESS STATE
                ================================================= */}

                {generationStatus === "submitted" ? (
                  <section className="flex flex-col items-center gap-4 rounded-control border border-border bg-surface px-6 py-12 text-center sm:px-10">

                    <div className="flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <CheckCircle2 className="size-7" />
                    </div>

                    <div className="space-y-2">
                      <h1 className="text-h2 font-semibold">
                        Submitted for review
                      </h1>

                      <p className="mx-auto max-w-[560px] text-small leading-6 text-subdued">
                        <span className="font-semibold text-text">
                          {saved?.draft_id ?? documentId}
                        </span>{" "}
                        has been submitted for Production
                        review. The document is locked while
                        under review. You will be notified
                        when its review status changes or
                        when it is returned with comments.
                      </p>
                    </div>

                    <div className="mt-3 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">

                      <button
                        type="button"
                        onClick={() =>
                          navigate("/reviewer-dashboard")
                        }
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-5 py-2.5 text-small font-semibold transition hover:bg-muted"
                      >
                        Go to dashboard
                      </button>

                      <button
                        type="button"
                        onClick={handleRestart}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-primary px-5 py-2.5 text-small font-semibold text-white transition hover:bg-primary-dark"
                      >
                        <Plus className="size-4" />
                        Start another document
                      </button>
                    </div>
                  </section>
                ) : (
                  <>
                    {/* =================================================
                        PAGE HEADING
                    ================================================= */}

                    

                    {/* =================================================
                        SUMMARY
                    ================================================= */}

                    <section className="overflow-hidden rounded-control border border-border bg-surface">

                      <div className="border-b border-border px-5 py-4">
                        <h2 className="text-h3 font-semibold">
                          Summary
                        </h2>
                      </div>

                      <SummaryRow
                        label="Document"
                        onEdit={() => handleEdit(0)}
                      >
                        {saved?.dosage_form || "Tablet"}{" "}
                        · Process Validation Protocol ·{" "}
                        <span className="font-mono">
                          {saved?.draft_id ?? documentId}
                        </span>
                      </SummaryRow>

                      <SummaryRow
                        label="Product"
                        onEdit={() => handleEdit(1)}
                      >
                        {summary.product || "Not loaded"}
                        <p className="mt-1 text-small text-subdued">
                          Batch size: {summary.batchSize || "—"}
                          {" · "}Bulk BMR: {summary.bmrNo || "—"}
                        </p>
                      </SummaryRow>

                      <SummaryRow
                        label="Source documents"
                        onEdit={() => handleEdit(1)}
                      >
                        <p>
                          FPG: {summary.fpgName || "Not attached"}
                        </p>
                        <p>
                          PP: {summary.ppName || "Not attached"}
                        </p>

                        {summary.otherDocuments.map((name) => (
                          <p key={name}>{name}</p>
                        ))}
                      </SummaryRow>

                      <SummaryRow
                        label="Batch & page setup"
                        onEdit={() => handleEdit(1)}
                      >
                        {summary.batchType || "—"} batch
                        {" · "}Header {summary.headerSize}"
                        {" · "}Footer {summary.footerSize}"
                        {" · "}Footer template{" "}
                        {summary.footerTemplate || "—"}
                      </SummaryRow>

                      <SummaryRow
                        label="Introduction"
                        onEdit={() => handleEdit(1)}
                      >
                        Reason: {summary.reasonForValidation || "—"}
                        {summary.ccnNo && (
                          <span> · CCN {summary.ccnNo}</span>
                        )}
                      </SummaryRow>

                      <SummaryRow
                        label="Process description"
                        onEdit={() => handleEdit(2)}
                      >
                        FPG No. {summary.fpgNo || "—"}
                        {" · "}PP No. {summary.ppNo || "—"}
                        {" · "}Mfg. Lic.{" "}
                        {summary.manufacturingLicense || "—"}
                      </SummaryRow>

                      <SummaryRow
                        label="Stages"
                        onEdit={() => handleEdit(4)}
                      >
                        {summary.stages.length ? (
                          <ul className="list-inside list-disc space-y-1">
                            {summary.stages.map((stage) => (
                              <li key={stage}>{stage}</li>
                            ))}
                          </ul>
                        ) : (
                          "No stages loaded"
                        )}
                      </SummaryRow>

                      <SummaryRow
                        label="Batch yield"
                        onEdit={() => handleEdit(4)}
                        locked={false}
                      >
                        {summary.batchYield.length ? (
                          <ul className="space-y-1">
                            {summary.batchYield.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          "No yield data loaded"
                        )}
                      </SummaryRow>
                    </section>

                    {/* =================================================
                        GENERATED PVP
                    ================================================= */}

                    <section className="overflow-hidden rounded-control border border-border bg-surface">

                      <div className="flex flex-col gap-2 border-b border-border px-5 py-4 sm:flex-row sm:items-center">

                        <div className="flex items-center gap-2">
                          <FileText className="size-5 text-primary" />

                          <h2 className="text-h3 font-semibold">
                            Generated PVP
                          </h2>
                        </div>

                        {generationStatus === "ready" && (
                          <span className="text-micro text-subdued sm:ml-auto">
                            Generated {generatedAt}
                          </span>
                        )}
                      </div>

                      {/* BEFORE GENERATION */}

                      {generationStatus === "idle" && (
                        <div className="flex flex-col items-center gap-4 px-5 py-10 text-center">

                          <div className="flex size-12 items-center justify-center rounded-full bg-muted text-primary">
                            <Sparkles className="size-6" />
                          </div>

                          <p className="max-w-[440px] text-small leading-6 text-subdued">
                            The PVP will be built from your saved
                            inputs. You can review the generated
                            pages before submitting the document.
                          </p>

                          <button
                            type="button"
                            onClick={handleGenerate}
                            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-control bg-primary px-5 py-3 text-small font-semibold text-white transition hover:bg-primary-dark"
                          >
                            <Sparkles className="size-4" />
                            Generate PVP
                          </button>
                        </div>
                      )}

                      {/* GENERATING */}

                      {generationStatus === "working" && (
                        <div className="flex min-h-[240px] flex-col items-center justify-center gap-4 px-5 py-10 text-center">

                          <Loader2 className="size-9 animate-spin text-primary" />

                          <div>
                            <h3 className="text-base font-semibold">
                              Generating PVP...
                            </h3>

                            <p className="mt-1 text-small text-subdued">
                              Please wait while the document
                              is generated.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* GENERATED DOCUMENT */}

                      {generationStatus === "ready" && (
                        <>
                          <div className="border-b border-border bg-muted px-5 py-4">
                            <div className="flex items-start gap-3">
                              <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />

                              <div>
                                <p className="text-sm font-semibold">
                                  PVP generated successfully
                                </p>

                                <p className="mt-1 text-small text-subdued">
                                  Review the document before
                                  submitting it for approval.
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Replace this section with your actual
                              generated document/PDF preview. */}

                          <div className="p-5 sm:p-8">
                            <div className="flex min-h-[320px] flex-col items-center justify-center rounded-control border border-dashed border-border-strong bg-muted p-6 text-center">

                              <FileText className="size-12 text-subdued" />

                              <h3 className="mt-4 text-base font-semibold">
                                PVP document preview
                              </h3>

                              <p className="mt-2 max-w-[440px] text-small leading-6 text-subdued">
                                Connect your generated document
                                preview here to display the cover
                                page, index, precautions, packing
                                style, process stages, and change
                                history.
                              </p>
                            </div>
                          </div>

                          {/* GENERATED DOCUMENT ACTIONS */}

                          <div className="flex flex-col gap-3 border-t border-border px-5 py-4 sm:flex-row sm:items-center">

                            <button
                              type="button"
                              onClick={handleBack}
                              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-4 py-2 text-small font-semibold transition hover:bg-muted"
                            >
                              <ArrowLeft className="size-4" />
                              Back
                            </button>

                            <div className="flex-1" />

                            <button
                              type="button"
                              onClick={handleGenerate}
                              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-4 py-2 text-small font-semibold transition hover:bg-muted"
                            >
                              <RefreshCw className="size-4" />
                              Regenerate
                            </button>

                            <button
                              type="button"
                              onClick={handleSubmit}
                              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-primary px-4 py-2 text-small font-semibold text-white transition hover:bg-primary-dark"
                            >
                              <Send className="size-4" />
                              Submit for review
                            </button>
                          </div>
                        </>
                      )}

            {/* BOTTOM BACK BUTTON */}
            <div className="border-t border-border bg-surface px-5 py-4 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-[1100px]">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={generationStatus === "working"}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-5 py-2.5 text-small font-semibold text-text transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back
                </button>
              </div>
            </div>
       
                    </section>
                  </>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

// =========================================================
// SUMMARY ROW
// =========================================================

function SummaryRow({
  label,
  children,
  onEdit,
  locked = false,
}: SummaryRowProps) {
  return (
    <div className="grid gap-2 border-b border-border px-5 py-4 last:border-b-0 sm:grid-cols-[180px_minmax(0,1fr)_auto] sm:items-start">

      <span className="text-small font-medium text-subdued">
        {label}
      </span>

      <div className="min-w-0 break-words text-sm leading-6">
        {children}
      </div>

      {!locked && onEdit && (
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex w-fit items-center gap-1 rounded-control px-2 py-1 text-small font-medium text-primary transition hover:bg-muted"
        >
         
          Edit
        </button>
      )}
    </div>
  );
}
