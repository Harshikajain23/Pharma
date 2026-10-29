
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  Info,
  Loader2,
  Pencil,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";

import { getApiErrorMessage } from "../../../shared/api/apiError";
import { useAuthStore } from "../../auth/state/auth.store";
import { AppHeader } from "../../new-document/components/AppHeader";
import { AppSidebar } from "../../new-document/components/AppSidebar";
import { WizardHeader } from "../../new-document/components/WizardHeader";
import { useDocument } from "../../new-document/hooks/useDocument";
import { useStepNavigation } from "../../new-document/hooks/useStepNavigation";
import { DocumentViewer } from "../../../shared/document/DocumentViewer";
import {
  getDocumentPreview,
  getPageOnePdf,
} from "../api/preview.api";
import type { PreviewResponse } from "../api/preview.types";

export function PreviewPage() {
  const { documentId = "" } = useParams();

  const user = useAuthStore((state) => state.user);
  const { goToStep } = useStepNavigation(documentId);
  const { document: documentState } = useDocument(documentId);

  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDemoPreview, setIsDemoPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setIsDemoPreview(false);

    try {
      const data = await getDocumentPreview(documentId);
      setPreview(data);
    } catch (caught) {
      console.warn(
        "Backend preview unavailable. Showing demo preview.",
        caught,
      );

      setPreview(null);
      setIsDemoPreview(true);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }, [documentId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleDownload = useCallback(async () => {
    if (isDemoPreview) return;

    setIsDownloading(true);
    setError(null);

    try {
      const blob = await getPageOnePdf(documentId);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `BMR-${documentId}-page-1-preview.pdf`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(url);
    } catch (caught) {
      setError(
        getApiErrorMessage(caught, "Could not download the preview."),
      );
    } finally {
      setIsDownloading(false);
    }
  }, [documentId, isDemoPreview]);

  return (
    <div className="min-h-screen bg-background text-text">
      <AppHeader
        user={user}
        unit={user?.unitId ? { id: user.unitId } : null}
      />

      <div className="lg:grid lg:h-[calc(100vh-var(--topbar-h))] lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)] lg:overflow-hidden">
        <AppSidebar user={user} />

        <main className="min-h-0 min-w-0 lg:h-full lg:overflow-y-auto">
          <div className="mx-auto space-y-5 pb-5">
            <WizardHeader
              activeStepId="preview"
              completedStepIds={documentState?.completed_steps ?? []}
              onStepClick={goToStep}
              title="Page-1 preview"
              description="Check the letterhead, fonts and header/footer now — it is far cheaper to fix here than after the MFC has been read."
              identifier={
                documentState?.bmr_number ??
                documentState?.draft_id ??
                documentId
              }
              status="DRAFT"
              dosageForm={documentState?.dosage_form}
              docType={documentState?.doc_type}
            />

            {isLoading && <LoadingState />}

            {!isLoading && error && (
              <ErrorState
                message={error}
                onRetry={() => void load()}
              />
            )}

            {!isLoading && preview && !isDemoPreview && (
              <>
                {preview.warnings.length > 0 && (
                  <div className="mx-8 rounded-panel border border-draft-fg/30 bg-draft-bg p-4">
                    <div className="flex items-start gap-2">
                      <AlertCircle
                        className="mt-0.5 size-4 shrink-0 text-draft-fg"
                        aria-hidden="true"
                      />

                      <div>
                        <p className="text-small font-semibold text-draft-fg">
                          This will print with missing details
                        </p>

                        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-small text-draft-fg">
                          {preview.warnings.map((warning) => (
                            <li key={warning}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                <div className="mx-8 flex items-start gap-2 rounded-panel border border-border bg-muted p-4">
                  <Info
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />

                  <p className="text-small text-subdued">
                    This is the real page 1 from the document builder.
                    Fields marked <strong>From MFC</strong> and the body
                    fill in at the next step. This screen is for checking
                    the letterhead, logo and header/footer, so no OCR has
                    run yet.
                  </p>
                </div>

                <DocumentViewer
                  docKey={documentId}
                  load={() => getPageOnePdf(documentId)}
                  fileName={`BMR-${documentId}-page-1-preview.pdf`}
                  loadingLabel="Rendering page 1…"
                  errorTitle="Could not render page 1"
                />

                <FormattingSummary preview={preview} />

                <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t bg-surface p-3.5 shadow-auth">
                  <div className="flex items-center gap-2 text-small text-subdued">
                    <CheckCircle2
                      className="size-4 text-success"
                      aria-hidden="true"
                    />
                    Preview generated from the latest saved core inputs
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleDownload()}
                      disabled={isDownloading}
                      className="inline-flex items-center gap-2 rounded-control border border-border px-4 py-2 text-small font-semibold transition hover:bg-primary/10 disabled:opacity-50"
                    >
                      {isDownloading ? (
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        <Download
                          className="size-4"
                          aria-hidden="true"
                        />
                      )}
                      Download Preview
                    </button>

                    <button
                      type="button"
                      onClick={() => goToStep("inputs")}
                      className="inline-flex items-center gap-2 rounded-control border border-border px-4 py-2 text-small font-semibold transition hover:bg-primary/10"
                    >
                      <Pencil className="size-4" aria-hidden="true" />
                      Edit Core inputs
                    </button>

                    <button
                      type="button"
                      onClick={() => goToStep("cover-bom")}
                      className="inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-small font-semibold text-white transition hover:bg-primary-dark"
                    >
                      Proceed to Cover + BOM
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {!isLoading && isDemoPreview && (
              <DemoPreview
                documentId={documentId}
                onEdit={() => goToStep("inputs")}
                onContinue={() => goToStep("cover-bom")}
                onRetry={() => void load()}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function FormattingSummary({
  preview,
}: {
  preview: PreviewResponse;
}) {
  const { formatting } = preview;

  const items = [
    {
      label: "Font",
      value: `${formatting.font_name} · ${formatting.font_size}pt`,
    },
    {
      label: "Line spacing",
      value: String(formatting.line_spacing),
    },
    {
      label: "Header / footer",
      value: `${formatting.header_size}`,
    },
    {
      label: "Template No.",
      value: formatting.template_no ?? "Not set",
    },
  ];

  return (
    <dl className="mx-8 grid grid-cols-2 gap-4 rounded-panel border border-border bg-surface p-4 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-micro uppercase tracking-wide text-subdued">
            {item.label}
          </dt>
          <dd className="mt-1 text-small font-semibold">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function LoadingState() {
  return (
    <div className="mx-8 flex items-center justify-center gap-2 rounded-panel border border-border bg-surface p-16 text-subdued">
      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      <span className="text-small">Rendering page 1…</span>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="mx-8 rounded-panel border border-danger/30 bg-danger-soft p-5">
      <div className="flex items-start gap-2">
        <AlertCircle
          className="mt-0.5 size-4 shrink-0 text-danger"
          aria-hidden="true"
        />

        <div className="flex-1">
          <p className="text-small font-semibold text-danger">
            Could not complete the action
          </p>

          <p className="mt-1 text-small text-subdued">{message}</p>

          <button
            type="button"
            onClick={onRetry}
            className="mt-3 rounded-control border border-border bg-surface px-3 py-1.5 text-small font-semibold transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Retry
          </button>
        </div>
      </div>
    </div>
  );
}


function DemoPreview({
  documentId,
}: {
  documentId: string;
}) {
  const department = "Production";

  return (
    <div className="space-y-5 px-4 pb-6 sm:px-8">
  
    

      

      {/* Dummy cover page */}
      <section className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="flex items-center gap-3 border-b border-gray-200 px-4 py-3">
          <h2 className="font-semibold">Cover page</h2>
          <span className="ml-auto text-xs text-gray-500">
            Read-only · prints as page 1
          </span>
        </div>

        <div className="overflow-x-auto bg-gray-100 p-3 sm:p-6">
          <div className="mx-auto min-w-[640px] max-w-[850px] bg-white p-8 text-black shadow-md sm:p-10">
            {/* Letterhead */}
            <div className="border border-black">
              <div className="flex min-h-24 items-center justify-center border-b border-black px-4 py-4 text-center">
                <div className="leading-tight">
                  <p className="font-bold">
                    Brainy Neurals Test Pharma Ltd.
                  </p>

                  <p className="mt-1 text-sm font-semibold uppercase">
                    Process Validation Protocol
                  </p>

                  <p className="mt-1 text-xs">
                    <strong>Department Name:</strong> {department}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 text-xs">
                <CoverField
                  label="Product Name:"
                  value="DICLOFENAC SODIUM, THIAMINE NITRATE, PYRIDOXINE HCL, CYANOCOBALAMIN ER TABLETS"
                />
                <CoverField label="Batch Size:" value="3,00,000" />
                <CoverField label="PVP No.:" value="PVP82-00" />
                <CoverField label="Revision No.:" value="00" />
                <CoverField label="Effective Date:" value="" />
                <CoverField label="Page:" value="1 of ___" />
              </div>
            </div>

            {/* Product details */}
            <h3 className="mb-3 mt-6 text-center text-sm font-bold">
              Process Validation Protocol
            </h3>

            <table className="w-full table-fixed border-collapse text-[10px]">
              <tbody>
                <CoverRow
                  label="Name of Product"
                  value="DICLOFENAC SODIUM, THIAMINE NITRATE, PYRIDOXINE HCL, CYANOCOBALAMIN ER TABLETS"
                  wide
                />

                <CoverRow
                  label="Generic Name of Product"
                  value="DICLOFENAC SODIUM, THIAMINE NITRATE, PYRIDOXINE HYDROCHLORIDE, CYANOCOBALAMIN EXTENDED RELEASE TABLETS (100MG+100MG+100MG+1MG)"
                  wide
                />

                <CoverRow
                  label="Label claim"
                  value="Each extended release film coated tablet contains: Diclofenac Sodium BP 100 mg, Thiamine Nitrate Ph.Eur. 100 mg, Pyridoxine Hydrochloride Ph.Eur. 100 mg, Cyanocobalamin Ph.Eur. 1 mg, Excipients q.s."
                  wide
                />

                <CoverRow
                  label="Process Validation Protocol No."
                  value="PVP82-00"
                  label2="Final Product Guideline No."
                  value2="FPG-507-00"
                />

                <CoverRow
                  label="Product Permission No."
                  value="PP-DS-507"
                  label2="Mfg. Lic. No."
                  value2="G/28/1284"
                />

                <CoverRow
                  label="Batch size"
                  value="3,00,000"
                  label2="Batch type"
                  value2=""
                />

                <CoverRow
                  label="Reason for validation"
                  value="New product validation"
                  label2="CCN No."
                  value2="CCN-2026-0418"
                />

                <CoverRow
                  label="Revision No."
                  value="00"
                  label2="Shelf Life"
                  value2="24 Months (Proposed)"
                />

                <CoverRow
                  label="Effective Date"
                  value=""
                  label2="Supersedes"
                  value2="NIL"
                />

                <CoverRow
                  label="Batch No."
                  value=""
                  label2="Market"
                  value2="Export"
                />

                <CoverRow
                  label="Mfg. date"
                  value=""
                  label2="Date of Started"
                  value2=""
                />

                <CoverRow
                  label="Exp. date"
                  value=""
                  label2="Date of Completed"
                  value2=""
                />

                <CoverRow
                  label="Product description"
                  value="Light orange to orange, capsule shape, biconvex, film coated tablets plain on both sides."
                  wide
                />
              </tbody>
            </table>

            {/* Approval table */}
            <h3 className="mb-3 mt-6 text-sm font-bold">
              Approval &amp; Authorization
            </h3>

            <table className="w-full table-fixed border-collapse text-[10px]">
              <thead>
                <tr>
                  {[
                    "",
                    "Name",
                    "Department",
                    "Designation",
                    "Signature & date",
                  ].map((heading, index) => (
                    <th
                      key={`${heading}-${index}`}
                      className="border border-black bg-gray-100 p-2 text-left font-semibold"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {[
                  "Prepared By",
                  "Reviewed By",
                  "Reviewed By",
                  "Approved By",
                  "Authorized By",
                ].map((role, index) => (
                  <tr key={`${role}-${index}`}>
                    <td className="border border-black p-2 font-semibold">
                      {role}
                    </td>

                    {[1, 2, 3, 4].map((cell) => (
                      <td
                        key={cell}
                        className="h-9 border border-black p-2"
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-2 border-t border-black pt-1 text-center text-[10px] text-gray-600">
              Template No. 3
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CoverField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-h-9 gap-2 border-b border-r border-black p-2">
      <span className="shrink-0 font-semibold">{label}</span>
      <span className="min-w-0 break-words">
        {value || "\u00A0"}
      </span>
    </div>
  );
}

function CoverRow({
  label,
  value,
  label2,
  value2,
  wide = false,
}: {
  label: string;
  value: string;
  label2?: string;
  value2?: string;
  wide?: boolean;
}) {
  if (wide) {
    return (
      <tr>
        <td className="w-1/4 border border-black bg-gray-100 p-2 font-semibold">
          {label}
        </td>

        <td colSpan={3} className="border border-black p-2">
          {value}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td className="border border-black bg-gray-100 p-2 font-semibold">
        {label}
      </td>

      <td className="border border-black p-2">
        {value || "\u00A0"}
      </td>

      <td className="border border-black bg-gray-100 p-2 font-semibold">
        {label2}
      </td>

      <td className="border border-black p-2">
        {value2 || "\u00A0"}
      </td>
    </tr>
  );
}


function DemoField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border border-gray-400 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
