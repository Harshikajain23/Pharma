
import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Info,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { AppHeader } from "../../features/new-document/components/AppHeader";
import { AppSidebar } from "../../features/new-document/components/AppSidebar";
import { WizardHeader } from "../../features/new-document/components/WizardHeader";

import { useAuthStore } from "../../features/auth/state/auth.store";
import { useDocument } from "../../features/new-document/hooks/useDocument";
import { useDocumentSelectorData } from "../../features/new-document/hooks/useDocumentSelectorData";
import { useStepNavigation } from "../../features/new-document/hooks/useStepNavigation";

type PvrKind = "manufacture" | "pack";

interface PreviewBatch {
  batchNo?: string;
  no?: string;
  mfg?: string;
  exp?: string;
  executedDocument?: string | File | null;
  qcDatasheet?: string | File | null;
  bmr?: string | File | null;
  qc?: string | File | null;
}

interface ReportTable {
  headers: string[];
  rows: string[][];
}

interface ReportSection {
  number: string;
  title: string;
  content?: string;
  table?: ReportTable;
}

interface ReportIndexItem {
  number: string;
  title: string;
}

interface PvrReport {
  companyName?: string;
  reportTitle?: string;
  documentReference?: string;
  product?: string;
  generic?: string;
  labelClaim?: string;
  batchSize?: string;
  shelfLife?: string;
  index?: ReportIndexItem[];
  sections?: ReportSection[];
}

interface PvrNavigationState {
  pvrKind?: PvrKind;
  srcDoc?: string;
  batches?: PreviewBatch[];
  report?: PvrReport;
}

const getFileName = (
  file?: string | File | null,
): string => {
  if (!file) return "—";
  return typeof file === "string" ? file : file.name;
};

const getBatchNumber = (batch: PreviewBatch) =>
  batch.batchNo ?? batch.no ?? "—";

const getExecutedDocument = (batch: PreviewBatch) =>
  batch.executedDocument ?? batch.bmr ?? null;

const getQcDocument = (batch: PreviewBatch) =>
  batch.qcDatasheet ?? batch.qc ?? null;

function PreviewTable({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left text-[13px]">
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

function Cell({
  children,
  header = false,
  colSpan,
}: {
  children: React.ReactNode;
  header?: boolean;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={`border border-slate-300 px-3 py-2 align-top ${
        header
          ? "bg-slate-100 font-semibold text-slate-800"
          : "text-slate-700"
      }`}
    >
      {children || "—"}
    </td>
  );
}

function EmptyPreview({ message }: { message: string }) {
  return (
    <div className="flex min-h-32 items-center justify-center rounded border border-dashed border-slate-300 bg-white px-5 py-8 text-center text-sm text-slate-500">
      {message}
    </div>
  );
}

export default function Cover() {
  const navigate = useNavigate();
  const location = useLocation();
  const { documentId = "" } = useParams<{ documentId: string }>();

  const user = useAuthStore((state) => state.user);

  const {
    context,
    isLoading: isLoadingContext,
  } = useDocumentSelectorData(user);

  const { document: saved } = useDocument(documentId);
  const { goToStep } = useStepNavigation(documentId, "pvr");

  // Data is currently received through navigation state.
  // Connect the PVR preview API here when its endpoint is available.
  const state = (location.state ?? {}) as PvrNavigationState;

  const pvrKind: PvrKind =
    state.pvrKind ??
    (sessionStorage.getItem("pvrKind") === "pack"
      ? "pack"
      : "manufacture");

  const srcDoc =
    state.srcDoc ?? (pvrKind === "pack" ? "BPR" : "BMR");

  const batches = state.batches ?? [];
  const report = state.report;

  const handleBack = () => {
    goToStep("inputs");
  };

  const handleContinue = () => {
    navigate(`/pvr/${documentId}/process-flow`, {
      state: {
        ...state,
        pvrKind,
        srcDoc,
        batches,
        report,
      },
    });
  };

  const sectionHeading =
    "mb-2 mt-6 text-sm font-bold text-slate-900";

  const reportSection =
    "mb-5 whitespace-pre-wrap text-[13px] leading-6 text-slate-800";

  return (
    <div className="fixed inset-0 flex flex-col bg-background text-text">
      <AppHeader
        user={user}
        unit={context?.unit ?? null}
        isLoadingUnit={isLoadingContext}
      />

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
        <AppSidebar user={user} />

        <main className="min-w-0 overflow-y-auto">
          <section className="bg-surface">
            <WizardHeader
              activeStepId="cover-preview"
              completedStepIds={saved?.completed_steps ?? []}
              onStepClick={goToStep}
              title="Cover + preview"
              description="Everything read from the uploaded documents, laid out as it will print — cover, index and the report up to 5.1 Product details. Check it before moving on."
              identifier={saved?.draft_id ?? documentId}
              status="DRAFT"
              dosageForm={saved?.dosage_form}
              docType="pvr"
              isPvr
            />

            <div className="px-5 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-[1100px]">
                {/* Draft notice */}

                <div className="mb-6 flex items-start gap-3 rounded-control border border-border bg-muted/40 px-4 py-3">
                  <FileText
                    size={18}
                    className="mt-0.5 shrink-0 text-subdued"
                  />

                  <p className="text-small leading-6 text-subdued">
                    <span className="font-semibold text-text">
                      New document
                    </span>{" "}
                    — Working draft — not yet a controlled record.
                  </p>
                </div>

                {/* Validation batches */}

                <section className="mb-6 overflow-hidden rounded-control border border-border-strong bg-surface">
                 
                     <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
                      <h2 className="text-base font-semibold text-text">
                        Validation batches
                      </h2>

                      <p className="mt-1 text-small text-subdued">
                        read from the executed BMRs
                      </p>
                    

                   
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[760px] text-left text-small">
                      <thead className="bg-muted/50 text-subdued">
                        <tr>
                          <th className="px-5 py-3 font-semibold">
                            Batch
                          </th>
                          <th className="px-4 py-3 font-semibold">
                            Batch No.
                          </th>
                          <th className="px-4 py-3 font-semibold">
                            Mfg. date
                          </th>
                          <th className="px-4 py-3 font-semibold">
                            Exp. date
                          </th>
                          <th className="px-4 py-3 font-semibold">
                            Executed BMR
                          </th>
                          <th className="px-4 py-3 font-semibold">
                            QC datasheet
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {batches.map((batch, index) => (
                          <tr
                            key={`${getBatchNumber(batch)}-${index}`}
                            className="border-t border-border"
                          >
                            <td className="px-5 py-4 font-semibold text-text">
                              Batch {index + 1}
                            </td>

                            <td className="px-4 py-4 font-mono text-text">
                              {getBatchNumber(batch)}
                            </td>

                            <td className="px-4 py-4 font-mono text-subdued">
                              {batch.mfg || "—"}
                            </td>

                            <td className="px-4 py-4 font-mono text-subdued">
                              {batch.exp || "—"}
                            </td>

                            <td className="max-w-[180px] px-4 py-4">
                              <span className="block truncate text-subdued">
                                {getFileName(
                                  getExecutedDocument(batch),
                                )}
                              </span>
                            </td>

                            <td className="max-w-[180px] px-4 py-4">
                              <span className="block truncate text-subdued">
                                {getFileName(getQcDocument(batch))}
                              </span>
                            </td>
                          </tr>
                        ))}

                        {batches.length === 0 && (
                          <tr>
                            <td
                              colSpan={6}
                              className="px-5 py-8 text-center text-subdued"
                            >
                              No validation batches are available.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </section>

                {/* Backend-driven report preview */}

                <section className="overflow-hidden rounded-control border border-border-strong bg-surface">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                    <div>
                      <h2 className="text-base font-semibold text-text">
                        Preview
                      </h2>

                    
                    </div>

                    <span className="rounded-full border border-border bg-muted px-3 py-1.5 text-small text-subdued">
                      Read-only
                    </span>
                  </div>

                  <div className="bg-slate-100 p-3 sm:p-6 lg:p-8">
                    <div className="mx-auto max-w-[800px] space-y-6">
                      {/* Cover page */}

                      <article className="min-h-[700px] bg-white p-6 text-slate-800 shadow-sm sm:p-10 lg:p-12">
                        <div className="border-b-2 border-slate-700 pb-4 text-center">
                          <h1 className="text-xl font-bold tracking-wide">
                            {report?.companyName || "—"}
                          </h1>

                          <p className="mt-2 text-xs text-slate-500">
                            {report?.reportTitle || "—"}
                          </p>
                        </div>

                        <div className="py-14 text-center">
                          <h2 className="text-2xl font-bold">
                            {report?.reportTitle || "—"}
                          </h2>

                          <p className="mt-4 text-lg font-semibold">
                            {report?.product || "—"}
                          </p>

                          <p className="mt-2 text-sm text-slate-600">
                            {report?.generic || "—"}
                          </p>
                        </div>

                        <PreviewTable>
                          {[
                            [
                              "Document reference",
                              report?.documentReference,
                            ],
                            ["Product name", report?.product],
                            ["Generic name", report?.generic],
                            ["Label claim", report?.labelClaim],
                            ["Batch size", report?.batchSize],
                            [
                              "Validation batches",
                              batches.map(getBatchNumber).join(", "),
                            ],
                          ].map(([label, value]) => (
                            <tr key={label}>
                              <Cell header>{label}</Cell>
                              <Cell>{value || "—"}</Cell>
                            </tr>
                          ))}
                        </PreviewTable>

                        <div className="mt-12 border-t border-slate-300 pt-3 text-center text-xs text-slate-500">
                          {report?.documentReference || "—"}
                        </div>
                      </article>

                      {/* Index */}

                      <article className="min-h-[420px] bg-white p-6 shadow-sm sm:p-10 lg:p-12">
                        <div className="border-b border-slate-300 pb-3">
                          <h2 className="text-lg font-bold text-slate-900">
                            INDEX
                          </h2>
                        </div>

                        {report?.index?.length ? (
                          <table className="mt-5 w-full text-left text-[13px]">
                            <tbody>
                              {report.index.map((item, index) => (
                                <tr
                                  key={`${item.number}-${index}`}
                                  className="border-b border-slate-200"
                                >
                                  <td className="w-20 py-3 font-semibold">
                                    {item.number}
                                  </td>
                                  <td className="py-3">{item.title}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div className="mt-5">
                            <EmptyPreview message="The index will appear here when supplied by the backend." />
                          </div>
                        )}
                      </article>

                      {/* Report body */}

                      <article className="min-h-[700px] bg-white p-6 shadow-sm sm:p-10 lg:p-12">
                        <div className="mb-5 border-b border-slate-300 pb-3 text-center">
                          <h2 className="text-sm font-bold">
                            {report?.reportTitle || "—"}
                          </h2>

                          <p className="mt-1 text-xs text-slate-500">
                            {report?.product || "—"}
                          </p>
                        </div>

                        {report?.sections?.length ? (
                          report.sections.map((section, index) => (
                            <section
                              key={`${section.number}-${index}`}
                            >
                              <h3 className={sectionHeading}>
                                {section.number} {section.title}
                              </h3>

                              {section.content && (
                                <p className={reportSection}>
                                  {section.content}
                                </p>
                              )}

                              {section.table && (
                                <div className="mb-5 overflow-x-auto">
                                  <table className="w-full border-collapse text-left text-[13px]">
                                    <thead>
                                      <tr>
                                        {section.table.headers.map(
                                          (header, headerIndex) => (
                                            <th
                                              key={`${header}-${headerIndex}`}
                                              className="border border-slate-300 bg-slate-100 px-3 py-2 font-semibold text-slate-800"
                                            >
                                              {header}
                                            </th>
                                          ),
                                        )}
                                      </tr>
                                    </thead>

                                    <tbody>
                                      {section.table.rows.map(
                                        (row, rowIndex) => (
                                          <tr key={rowIndex}>
                                            {row.map((value, cellIndex) => (
                                              <td
                                                key={cellIndex}
                                                className="border border-slate-300 px-3 py-2 align-top text-slate-700"
                                              >
                                                {value || "—"}
                                              </td>
                                            ))}
                                          </tr>
                                        ),
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                              )}
                            </section>
                          ))
                        ) : (
                          <EmptyPreview message="Report sections will appear here when supplied by the backend." />
                        )}

                        <div className="mt-8 border-t border-slate-300 pt-3 text-center text-xs text-slate-500">
                          {report?.documentReference || "—"}
                        </div>
                      </article>
                    </div>
                  </div>

                  {/* Preview information */}

                  <div className="flex items-start gap-3 border-t border-border bg-muted/30 px-5 py-4">
                    <Info
                      size={17}
                      className="mt-0.5 shrink-0 text-subdued"
                    />

                    <p className="text-small leading-6 text-subdued">
                      The report preview displays the data supplied by
                      the backend. Batch details are read from the
                      executed BMR records. Missing data is shown as
                      unavailable.
                    </p>
                  </div>
                </section>
              </div>
            </div>

            {/* Footer actions */}

            <div className="border-t border-border bg-surface px-5 py-4 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-[1100px] flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-5 py-2.5 text-small font-semibold text-text transition hover:bg-muted"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleContinue}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-[#0e8c8c] px-5 py-2.5 text-small font-semibold text-white transition hover:bg-[#0b7777] focus:outline-none focus:ring-2 focus:ring-[#0e8c8c]"
                >
                  Continue to process flow
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
