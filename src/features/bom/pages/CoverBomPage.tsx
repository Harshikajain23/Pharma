
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Download,
  Loader2,
  Pencil,
  RefreshCw,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { getApiErrorMessage } from "../../../shared/api/apiError";
import { useAuthStore } from "../../auth/state/auth.store";
import { AppHeader } from "../../new-document/components/AppHeader";
import { AppSidebar } from "../../new-document/components/AppSidebar";
import { WizardHeader } from "../../new-document/components/WizardHeader";
import { useDocument } from "../../new-document/hooks/useDocument";
import { useStepNavigation } from "../../new-document/hooks/useStepNavigation";

import { generateBom, getBom, getCoverBomDocx } from "../api/bom.api";
import type { BomResponse } from "../api/bom.types";
import {
  BomEditTable,
  type BomFieldChange,
} from "../components/BomEditTable";
import { CoverBomDocument } from "../components/CoverBomDocument";

import {
  acceptCoverBom,
  getCorrections,
  raiseCorrection,
  reopenCorrection,
  resolveCorrection,
  type CorrectionsState,
  type NewCorrection,
} from "../api/corrections.api";

import {
  CorrectionDialog,
  type CorrectionTarget,
} from "../components/CorrectionDialog";
import { CorrectionsPanel } from "../components/CorrectionsPanel";

const POLL_INTERVAL_MS = 5000;
const REQUEST_TIMEOUT_MS = 10000;

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error("The document request timed out."));
    }, timeoutMs);

    promise.then(
      (value) => {
        window.clearTimeout(timeout);
        resolve(value);
      },
      (error: unknown) => {
        window.clearTimeout(timeout);
        reject(error);
      },
    );
  });
}

export function CoverBomPage() {
  const { documentId = "" } = useParams();

  const user = useAuthStore((state) => state.user);
  const { goToStep } = useStepNavigation(documentId);
  const { document: documentState } = useDocument(documentId);

  const [bom, setBom] = useState<BomResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [corrections, setCorrections] =
    useState<CorrectionsState | null>(null);
  const [correcting, setCorrecting] =
    useState<CorrectionTarget | null>(null);
  const [busyCorrection, setBusyCorrection] =
    useState<number | null>(null);
  const [acceptWarning, setAcceptWarning] = useState(false);
  const [editingBom, setEditingBom] = useState(false);
  const [savingBom, setSavingBom] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [isDemo, setIsDemo] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const pollRef = useRef<number | null>(null);

  const stopPolling = useCallback(() => {
    if (pollRef.current !== null) {
      window.clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  // Load the real BOM, with a timeout and demo fallback.
  const load = useCallback(async () => {
    try {
      const next = await withTimeout(
        getBom(documentId),
        REQUEST_TIMEOUT_MS,
      );

      setBom(next);
      setError(null);

      if (next.status === "extraction_failed") {
        stopPolling();
        setIsDemo(true);
        setIsLoading(false);
        return next;
      }

      if (next.status === "extracted") {
        stopPolling();
        setIsDemo(false);
        setIsLoading(false);

        setCorrections(
          await getCorrections(documentId).catch(() => null),
        );

        return next;
      }

      if (
        next.status === "extracting" ||
        next.status === "core_inputs_set"
      ) {
        setIsDemo(false);
        setIsLoading(false);
        return next;
      }

      // An unexpected status should not leave the user
      // stuck on the progress bar.
      console.warn("Unexpected BOM status:", next.status);
      stopPolling();
      setIsDemo(true);
      setIsLoading(false);

      return next;
    } catch (caught) {
      console.warn(
        "Could not load the real Cover + BOM. Showing demo data.",
        caught,
      );

      stopPolling();
      setBom(null);
      setError(null);
      setIsDemo(true);
      setIsLoading(false);

      return null;
    }
  }, [documentId, stopPolling]);

  const startPolling = useCallback(() => {
    stopPolling();

    pollRef.current = window.setInterval(() => {
      void load();
    }, POLL_INTERVAL_MS);
  }, [load, stopPolling]);

  const startExtraction = useCallback(async () => {
    setIsStarting(true);
    setError(null);

    try {
      await withTimeout(
        generateBom(documentId),
        REQUEST_TIMEOUT_MS,
      );

      const next = await load();

      if (next?.status === "extracting") {
        setIsDemo(false);
        startPolling();
      }
    } catch (caught) {
      console.warn(
        "BOM extraction could not be started. Showing demo data.",
        caught,
      );

      setBom(null);
      setError(null);
      setIsDemo(true);
      setIsLoading(false);
      stopPolling();
    } finally {
      setIsStarting(false);
    }
  }, [documentId, load, startPolling, stopPolling]);

  const retryDemo = useCallback(async () => {
    setIsLoading(true);

    const current = await load();

    if (!current) {
      return;
    }

    if (current.status === "extraction_failed") {
      await startExtraction();
    } else if (current.status === "core_inputs_set") {
      await startExtraction();
    } else if (current.status === "extracting") {
      setIsDemo(false);
      startPolling();
    }
  }, [load, startExtraction, startPolling]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const current = await load();

      if (cancelled || !current) {
        return;
      }

      if (current.status === "extracting") {
        startPolling();
      } else if (current.status === "core_inputs_set") {
        await startExtraction();
      }
    })();

    return () => {
      cancelled = true;
      stopPolling();
    };
  }, [load, startExtraction, startPolling, stopPolling]);

  const saveBomEdits = useCallback(
    async (changes: BomFieldChange[]) => {
      if (changes.length === 0) {
        setEditingBom(false);
        return;
      }

      setSavingBom(true);

      try {
        let state: CorrectionsState | null = corrections;

        for (const item of changes) {
          state = await raiseCorrection(documentId, {
            target: `BOM · Sr ${item.sr_no ?? item.row_index + 1} · ${item.label}`,
            target_kind: "bom",
            target_key: item.material_code,
            row_index: item.row_index,
            current_value: item.from,
            proposed_value: item.to,
            reason: "Edited in the BOM table",
          });
        }

        setCorrections(state);
        setEditingBom(false);
      } catch (caught) {
        setError(
          getApiErrorMessage(caught, "Could not save the BOM changes."),
        );
      } finally {
        setSavingBom(false);
      }
    },
    [corrections, documentId],
  );

  const downloadCoverBomDocx = useCallback(async () => {
    setDownloading(true);

    try {
      const blob = await getCoverBomDocx(documentId);
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `BMR-${documentId}-cover-bom.docx`;

      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.URL.revokeObjectURL(url);
    } catch (caught) {
      setError(
        getApiErrorMessage(caught, "Could not download the document."),
      );
    } finally {
      setDownloading(false);
    }
  }, [documentId]);

  const addCorrection = useCallback(
    async (correction: NewCorrection) => {
      setCorrections(await raiseCorrection(documentId, correction));
      setCorrecting(null);
    },
    [documentId],
  );

  const changeCorrection = useCallback(
    async (id: number, action: "resolve" | "reopen") => {
      setBusyCorrection(id);

      try {
        setCorrections(
          action === "resolve"
            ? await resolveCorrection(documentId, id)
            : await reopenCorrection(documentId, id),
        );
      } finally {
        setBusyCorrection(null);
      }
    },
    [documentId],
  );

  const accept = useCallback(
    async (acknowledge = false) => {
      try {
        await acceptCoverBom(documentId, acknowledge);
        setAcceptWarning(false);
        goToStep("stages");
      } catch (caught) {
        if (corrections?.has_unresolved && !acknowledge) {
          setAcceptWarning(true);
          return;
        }

        setError(
          getApiErrorMessage(
            caught,
            "Could not accept the cover and BOM.",
          ),
        );
      }
    },
    [corrections, documentId, goToStep],
  );

  const status = bom?.status;
  const showRealDocument = status === "extracted" && bom !== null;

  return (
    <div className="min-h-screen bg-background text-text">
      <AppHeader
        user={user}
        unit={user?.unitId ? { id: user.unitId } : null}
      />

      <div className="lg:grid lg:h-[calc(100vh-var(--topbar-h))] lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)] lg:overflow-hidden">
        <AppSidebar user={user} />

        <main className="min-w-0 min-h-0 lg:h-full lg:overflow-y-auto">
          <div className="mx-auto space-y-5">
            <WizardHeader
              activeStepId="cover-bom"
              completedStepIds={documentState?.completed_steps ?? []}
              onStepClick={goToStep}
              title="Cover + BOM"
              status="DRAFT"
              dosageForm={documentState?.dosage_form}
              docType={documentState?.doc_type}
            />

            {/* Preserve the existing wizard and show the appropriate content. */}
            {isDemo ? (
              <DemoCoverBom onRetry={() => void retryDemo()} />
            ) : showRealDocument && bom ? (
              <>
                {bom.warnings.length > 0 ? (
                  <div className="mx-8 rounded-panel border border-draft-fg/30 bg-draft-bg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle
                        className="mt-0.5 size-4 shrink-0 text-draft-fg"
                        aria-hidden="true"
                      />

                      <div>
                        <p className="text-small font-semibold text-draft-fg">
                          {bom.warnings.length} thing
                          {bom.warnings.length === 1 ? "" : "s"} to check
                        </p>

                        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-small text-draft-fg">
                          {bom.warnings.map((warning) => (
                            <li key={warning}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ) : null}

                {editingBom ? (
                  <BomEditTable
                    ingredients={bom.ingredients}
                    onSave={(changes) => void saveBomEdits(changes)}
                    onCancel={() => setEditingBom(false)}
                    saving={savingBom}
                  >
                    {corrections && corrections.corrections.length > 0 ? (
                      <CorrectionsPanel
                        corrections={corrections.corrections}
                        onResolve={(id) =>
                          void changeCorrection(id, "resolve")
                        }
                        onReopen={(id) =>
                          void changeCorrection(id, "reopen")
                        }
                        busyId={busyCorrection}
                      />
                    ) : null}
                  </BomEditTable>
                ) : (
                  <>
                    <CoverBomDocument documentId={documentId} />

                    {corrections && corrections.corrections.length > 0 ? (
                      <CorrectionsPanel
                        corrections={corrections.corrections}
                        onResolve={(id) =>
                          void changeCorrection(id, "resolve")
                        }
                        onReopen={(id) =>
                          void changeCorrection(id, "reopen")
                        }
                        busyId={busyCorrection}
                      />
                    ) : null}

                    {acceptWarning && corrections ? (
                      <div className="mx-8 rounded-card border border-draft-fg/30 bg-draft-bg p-5">
                        <p className="text-small font-semibold text-draft-fg">
                          Continue with {corrections.open_count} correction
                          {corrections.open_count === 1 ? "" : "s"} still open?
                        </p>

                        <p className="mt-1 text-small text-draft-fg">
                          The document moves on carrying these observations.
                          They stay on the record, and the audit trail will
                          show that you chose to proceed.
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void accept(true)}
                            className="h-[34px] rounded-control bg-primary px-3.5 text-small font-semibold text-white transition hover:bg-primary-dark"
                          >
                            Accept with corrections open
                          </button>

                          <button
                            type="button"
                            onClick={() => setAcceptWarning(false)}
                            className="h-[34px] rounded-control border border-border bg-surface px-3.5 text-small font-semibold transition hover:bg-primary/10"
                          >
                            Go back and resolve them
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t bg-surface p-3.5 shadow-auth">
                      <div className="flex items-center gap-2 text-small text-subdued">
                        <CheckCircle2
                          className="size-4 text-success"
                          aria-hidden="true"
                        />
                        Latest generated version loaded
                        {corrections?.open_count
                          ? ` · ${corrections.open_count} correction(s) open`
                          : ` · ${bom.ingredients.length} ingredients`}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => void downloadCoverBomDocx()}
                          disabled={downloading}
                          className="inline-flex items-center gap-2 rounded-control border border-border px-4 py-2 text-small font-semibold transition hover:bg-primary/10 disabled:opacity-50"
                        >
                          {downloading ? (
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
                          Download DOCX
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingBom(true)}
                          className="inline-flex items-center gap-2 rounded-control border border-border px-4 py-2 text-small font-semibold transition hover:bg-primary/10"
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                          Edit BOM
                        </button>

                        <button
                          type="button"
                          onClick={() => void accept(false)}
                          className="inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-small font-semibold text-white transition hover:bg-primary-dark"
                        >
                          Proceed to Select Stages
                          <ArrowRight className="size-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </>
            ) : isLoading || isStarting || status === "extracting" ? (
              <ExtractingPanel />
            ) : (
              <DemoCoverBom onRetry={() => void retryDemo()} />
            )}
          </div>
        </main>
      </div>

      {correcting ? (
        <CorrectionDialog
          target={correcting}
          onCancel={() => setCorrecting(null)}
          onAdd={addCorrection}
        />
      ) : null}
    </div>
  );
}

function DemoCoverBom({ onRetry }: { onRetry: () => void }) {
  const demoRows = [
    ["1", "RM-1001", "Active Pharmaceutical Ingredient", "Pharma Grade", "10", "kg"],
    ["2", "RM-1002", "Microcrystalline Cellulose", "Pharma Grade", "5", "kg"],
    ["3", "RM-1003", "Starch", "Pharma Grade", "2", "kg"],
    ["4", "RM-1004", "Magnesium Stearate", "Pharma Grade", "0.5", "kg"],
  ];

  return (
    <div className="mx-8 space-y-5 pb-6">
      <section className="overflow-hidden rounded-panel border border-border bg-surface">
        <div className="border-b border-border p-4">
          <p className="text-small font-semibold">Cover Page</p>
          <p className="mt-1 text-small text-subdued">
            Sample document · Demo preview
          </p>
        </div>

        <div className="overflow-x-auto bg-gray-100 p-4 sm:p-6">
          <div className="mx-auto min-w-[600px] max-w-[850px] bg-white p-8 text-black shadow-md sm:p-10">
            <div className="border border-black">
              <div className="border-b border-black p-5 text-center">
                <p className="font-bold">Brainy Neurals Test Pharma Ltd.</p>
                <p className="mt-2 text-sm font-semibold uppercase">
                  Batch Manufacturing Record
                </p>
                <p className="mt-1 text-xs">Department: Production</p>
              </div>

              <table className="w-full border-collapse text-xs">
                <tbody>
                  {[
                    ["Product Name", "Sample Pharmaceutical Tablets"],
                    ["BMR Number", "BMR-DEMO-001"],
                    ["Batch Number", "BATCH-DEMO-001"],
                    ["Batch Size", "100,000 Tablets"],
                    ["Dosage Form", "Tablet"],
                    ["Revision Number", "00"],
                    ["Effective Date", "To be assigned"],
                  ].map(([label, value]) => (
                    <tr key={label}>
                      <td className="w-1/3 border border-black bg-gray-100 p-2 font-semibold">
                        {label}
                      </td>
                      <td className="border border-black p-2">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <h3 className="mt-6 text-center text-sm font-bold">
                Approval &amp; Authorization
              </h3>

              <table className="mt-3 w-full border-collapse text-xs">
                <thead>
                  <tr>
                    {["Role", "Name", "Department", "Signature & Date"].map(
                      (heading) => (
                        <th
                          key={heading}
                          className="border border-black bg-gray-100 p-2 text-left font-semibold"
                        >
                          {heading}
                        </th>
                      ),
                    )}
                  </tr>
                </thead>
                <tbody>
                  {["Prepared By", "Reviewed By", "Approved By"].map((role) => (
                    <tr key={role}>
                      <td className="border border-black p-3 font-semibold">
                        {role}
                      </td>
                      {[1, 2, 3].map((cell) => (
                        <td
                          key={cell}
                          className="h-10 border border-black p-2"
                        />
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>

              <p className="mt-3 border-t border-black pt-2 text-center text-xs">
                Demo document — not for production use
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden rounded-panel border border-border bg-surface">
        <div className="border-b border-border p-4">
          <p className="text-small font-semibold">Bill of Materials (BOM)</p>
          <p className="mt-1 text-small text-subdued">
            Sample formulation · Demo data only
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-small">
            <thead>
              <tr className="bg-muted">
                {[
                  "Sr. No.",
                  "Material Code",
                  "Ingredient / Material",
                  "Specification",
                  "Quantity",
                  "Unit",
                ].map((heading) => (
                  <th
                    key={heading}
                    className="border-b border-border p-3 text-left font-semibold"
                  >
                    {heading}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {demoRows.map((row) => (
                <tr key={row[0]} className="hover:bg-muted/50">
                  {row.map((cell, index) => (
                    <td key={index} className="border-b border-border p-3">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border p-4">
          <p className="text-small text-subdued">
            This illustrative information was not retrieved from the backend.
            Do not use it as an actual pharmaceutical manufacturing record.
          </p>
        </div>
      </section>

      <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t bg-surface p-3.5 shadow-auth">
        <p className="text-small text-subdued">
          Demo preview · No real document data loaded
        </p>

        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-2 rounded-control border border-border px-4 py-2 text-small font-semibold transition hover:bg-primary/10"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Retry loading
        </button>
      </div>
    </div>
  );
}

function ExtractingPanel() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setProgress((previous) => {
        if (previous >= 90) return previous;
        return Math.min(previous + Math.random() * 8 + 2, 90);
      });
    }, 700);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div className="mx-8 rounded-panel border border-border bg-surface p-10 text-center">
      <Loader2
        className="mx-auto size-6 animate-spin text-primary"
        aria-hidden="true"
      />

      <p className="mt-3 text-small font-semibold">Work in progress...</p>

      <p className="mt-1 text-small text-subdued">
        Processing your document. Please wait while the Cover Page and BOM are
        prepared.
      </p>

      <div className="mx-auto mt-6 max-w-xl">
        <div className="mb-2 flex items-center justify-between text-small text-subdued">
          <span>Progress</span>
          <span>{Math.floor(progress)}%</span>
        </div>

        <div
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-label="Document processing progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.floor(progress)}
        >
          <div
            className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function ErrorPanel({
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
            Extraction failed
          </p>

          <p className="mt-1 break-words text-small text-subdued">
            {message}
          </p>

          <button
            type="button"
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-2 rounded-control border border-border bg-surface px-3 py-1.5 text-small font-semibold transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      </div>
    </div>
  );
}
