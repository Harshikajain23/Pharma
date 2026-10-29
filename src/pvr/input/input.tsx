
import { useRef, useState } from "react";
import type {
  ChangeEvent,
  DragEvent,
  KeyboardEvent,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  FileText,
  FileUp,
  Info,
  LoaderCircle,
  Save,
  Trash2,
  Upload,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

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

type PvrKind = "manufacture" | "pack";

interface Batch {
  no: string;
  noAuto: boolean;
  bmr: File | null;
  qc: File | null;
}

interface OtherFile {
  id: string;
  file: File;
}

type BatchErrors = Record<string, string>;

// =========================================================
// HELPERS
// =========================================================

const createBatch = (): Batch => ({
  no: "",
  noAuto: false,
  bmr: null,
  qc: null,
});

const formatSize = (bytes: number) => {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  }

  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const isPdf = (file: File) =>
  file.type === "application/pdf" ||
  file.name.toLowerCase().endsWith(".pdf");

// =========================================================
// COMPONENT
// =========================================================

export function Input() {
  const navigate = useNavigate();
  const location = useLocation();
  const { documentId = "" } = useParams<{ documentId: string }>();

  // -------------------------------------------------------
  // SHARED APPLICATION LAYOUT
  // -------------------------------------------------------

  const user = useAuthStore((state) => state.user);

  const {
    context,
    isLoading: isLoadingContext,
  } = useDocumentSelectorData(user);

  const { document: saved } = useDocument(documentId);

  const { goToStep } = useStepNavigation(documentId, "pvr");

  // -------------------------------------------------------
  // DOCUMENT TYPE
  // -------------------------------------------------------

  const locationState = location.state as
    | { pvrKind?: string }
    | null;

  const [pvrKind] = useState<PvrKind>(() => {
    const storedKind =
      locationState?.pvrKind ??
      sessionStorage.getItem("pvrKind") ??
      "manufacture";

    return ["pack", "packing"].includes(
      storedKind.toLowerCase(),
    )
      ? "pack"
      : "manufacture";
  });

  const srcDoc = pvrKind === "pack" ? "BPR" : "BMR";

  // -------------------------------------------------------
  // BATCHES AND SUPPORTING DOCUMENTS
  // -------------------------------------------------------

  const [batches, setBatches] = useState<Batch[]>([
    createBatch(),
    createBatch(),
    createBatch(),
  ]);

  const [others, setOthers] = useState<OtherFile[]>([]);
  const [othersOpen, setOthersOpen] = useState(false);
  const [touched, setTouched] = useState(false);
  const [draggingKey, setDraggingKey] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const fileInputRefs = useRef<
    Record<string, HTMLInputElement | null>
  >({});

  // -------------------------------------------------------
  // UPDATE BATCH
  // -------------------------------------------------------

  function updateBatch(index: number, changes: Partial<Batch>) {
    setBatches((previous) =>
      previous.map((batch, i) =>
        i === index ? { ...batch, ...changes } : batch,
      ),
    );

    setNotice("");
  }

  // -------------------------------------------------------
  // FILE UPLOAD
  // -------------------------------------------------------

  function uploadFile(key: string, incomingFiles: FileList | File[]) {
    const selectedFiles = Array.from(incomingFiles);

    if (!selectedFiles.length) return;

    if (key === "others") {
      const invalidFile = selectedFiles.find((file) => !isPdf(file));

      if (invalidFile) {
        setNotice("Only PDF files are allowed.");
        return;
      }

      setOthers((previous) => [
        ...previous,
        ...selectedFiles.map((file) => ({
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
        })),
      ]);

      setNotice("");
      return;
    }

    const file = selectedFiles[0];

    if (!isPdf(file)) {
      setNotice("Only PDF files are allowed.");
      return;
    }

    const match = key.match(/^(bmr|qc)-(\d+)$/);

    if (!match) return;

    const [, field, indexString] = match;
    const index = Number(indexString);

    if (index < 0 || index >= batches.length) return;

    if (field === "bmr") {
      updateBatch(index, {
        bmr: file,
        noAuto: false,
      });
    } else {
      updateBatch(index, { qc: file });
    }

    setNotice("");
  }

  function handleFileChange(
    key: string,
    event: ChangeEvent<HTMLInputElement>,
  ) {
    if (event.target.files) {
      uploadFile(key, event.target.files);
    }

    // Allows selecting the same file again.
    event.target.value = "";
  }

  function handleDrop(
    key: string,
    event: DragEvent<HTMLDivElement>,
  ) {
    event.preventDefault();
    setDraggingKey(null);

    if (event.dataTransfer.files.length) {
      uploadFile(key, event.dataTransfer.files);
    }
  }

  function handleDropKey(
    key: string,
    event: KeyboardEvent<HTMLDivElement>,
  ) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      fileInputRefs.current[key]?.click();
    }
  }

  // -------------------------------------------------------
  // VALIDATION
  // -------------------------------------------------------

  function coreErrors(): BatchErrors {
    const errors: BatchErrors = {};

    batches.forEach((batch, index) => {
      if (!batch.bmr) {
        errors[`bmr${index}`] =
          `Upload the executed ${srcDoc} for batch ${index + 1}.`;
      }

      if (!batch.qc) {
        errors[`qc${index}`] =
          `Upload the QC datasheet for batch ${index + 1}.`;
      }

      if (!batch.no.trim()) {
        errors[`no${index}`] = "Batch number is needed.";
      }
    });

    const batchNumbers = batches
      .map((batch) => batch.no.trim().toUpperCase())
      .filter(Boolean);

    if (new Set(batchNumbers).size !== batchNumbers.length) {
      errors.dup = "Each batch needs a different batch number.";
    }

    return errors;
  }

  const errors = touched ? coreErrors() : {};

  const completedBatches = batches.filter(
    (batch) => batch.bmr && batch.qc && batch.no.trim(),
  ).length;

  const completedDocuments = (batch: Batch) =>
    Number(Boolean(batch.bmr)) + Number(Boolean(batch.qc));

  // -------------------------------------------------------
  // REMOVE FILE
  // -------------------------------------------------------

  function removeFile(index: number, field: "bmr" | "qc") {
    updateBatch(index, { [field]: null });
  }

  // -------------------------------------------------------
  // NAVIGATION
  // -------------------------------------------------------

  function handleBack() {
    goToStep("type");
  }

  function handleContinue() {
    setTouched(true);

    const validationErrors = coreErrors();

    if (Object.keys(validationErrors).length > 0) {
      setNotice("Please complete the required fields before continuing.");
      return;
    }

    if (!documentId) {
      setNotice("Document ID is missing. Please reopen the PVR document.");
      return;
    }

    setBusy(true);
    setNotice("");

    navigate(`/pvr/${documentId}/stage-output`, {
      state: {
        pvrKind,
        srcDoc,
        batches: batches.map((batch) => ({
          batchNo: batch.no.trim(),
          executedDocument: batch.bmr,
          qcDatasheet: batch.qc,
        })),
        otherDocuments: others.map((item) => item.file),
      },
    });
  }

  function handleSaveExit() {
    // This exits to the dashboard. Add your draft-save API here
    // if you want the files and form values to persist.
    navigate("/dashboard");
  }

  // -------------------------------------------------------
  // UPLOAD FIELD
  // -------------------------------------------------------

  function renderUpload(
    key: string,
    label: string,
    file: File | null,
    error?: string,
  ) {
    if (file) {
      return (
        <div className="flex min-w-0 items-center gap-3 rounded-control border border-border bg-surface p-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-control bg-muted text-[#0e8c8c]">
            <FileText size={18} />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-small font-semibold text-text">
              {file.name}
            </p>
            <p className="mt-1 text-micro text-subdued">
              {label} · PDF · {formatSize(file.size)}
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              const match = key.match(/^(bmr|qc)-(\d+)$/);

              if (match) {
                removeFile(
                  Number(match[2]),
                  match[1] as "bmr" | "qc",
                );
              }
            }}
            className="shrink-0 text-small font-medium text-subdued transition hover:text-danger"
          >
            Remove
          </button>
        </div>
      );
    }

    return (
      <div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => fileInputRefs.current[key]?.click()}
          onKeyDown={(event) => handleDropKey(key, event)}
          onDragOver={(event) => {
            event.preventDefault();
            setDraggingKey(key);
          }}
          onDragLeave={() => setDraggingKey(null)}
          onDrop={(event) => handleDrop(key, event)}
          className={`flex min-h-[82px] cursor-pointer items-center justify-center gap-3 rounded-control border border-dashed px-3 py-4 transition ${
            error
              ? "border-danger bg-red-50"
              : draggingKey === key
                ? "border-[#0e8c8c] bg-teal-50"
                : "border-border-strong bg-muted/40 hover:border-[#0e8c8c] hover:bg-muted"
          }`}
        >
          <FileUp
            size={20}
            className={error ? "text-danger" : "text-subdued"}
          />

          <div className="text-small">
            <p className="font-semibold text-text">{label}</p>
            <p className="mt-1 text-subdued">
              <span className="font-medium text-[#0e8c8c]">Browse</span>
              {" "}or drop a PDF
            </p>
          </div>
        </div>

        <input
          ref={(element) => {
            fileInputRefs.current[key] = element;
          }}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          onChange={(event) => handleFileChange(key, event)}
        />

        {error && (
          <p className="mt-1.5 text-small text-danger">{error}</p>
        )}
      </div>
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

            <div className="">
              <WizardHeader
                activeStepId="inputs"
                completedStepIds={saved?.completed_steps ?? []}
                onStepClick={goToStep}
                title=""
                description={``}
                identifier={saved?.draft_id ?? documentId}
                status="DRAFT"
                dosageForm={saved?.dosage_form}
                docType="pvr"
                isPvr
              />
            </div>

            {/* PAGE CONTENT */}

            <div className="px-5 py-6 sm:px-6 lg:px-8 ">
              <div className="mx-auto max-w-[1100px]">
                {/* DRAFT NOTICE */}

                <div className="mb-6 flex items-start gap-3 rounded-control border border-border bg-muted/40 px-4 py-3">
                  <FileText
                    size={18}
                    className="mt-0.5 shrink-0 text-subdued"
                  />

                  <p className="text-small leading-6 text-subdued">
                    <span className="font-semibold text-text">
                      New document
                    </span>
                    {" "}— Working draft — not yet a controlled record.
                  </p>
                </div>

                {/* VALIDATION BATCHES */}

                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold text-text">
                      Validation batches
                      <span className="ml-1 text-danger">*</span>
                    </h2>

                    <p className="mt-1.5 max-w-3xl text-small leading-6 text-subdued">
                      Upload the executed {srcDoc} and the QC datasheet
                      for each of the three validation batches.
                    </p>
                  </div>

                  <span className="rounded-full border border-border bg-muted px-3 py-1.5 text-small text-subdued">
                    {completedBatches}/3 batches complete
                  </span>
                </div>

                {/* BATCH CARDS */}

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                  {batches.map((batch, index) => {
                    const documentCount = completedDocuments(batch);

                    const hasError = Boolean(
                      touched &&
                        (errors[`bmr${index}`] ||
                          errors[`qc${index}`] ||
                          errors[`no${index}`]),
                    );

                    return (
                      <article
                        key={index}
                        className={`min-w-0 rounded-control border bg-surface p-4 shadow-sm ${
                          hasError
                            ? "border-danger"
                            : "border-border-strong"
                        }`}
                      >
                        {/* BATCH HEADING */}

                        <div className="mb-4 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#e4f3f3] text-small font-semibold text-[#0e8c8c]">
                              {index + 1}
                            </span>

                            <h3 className="text-small font-semibold text-text">
                              Batch {index + 1}
                            </h3>
                          </div>

                          <span
                            className={`whitespace-nowrap rounded-full px-2 py-1 text-micro font-medium ${
                              documentCount === 2 && batch.no.trim()
                                ? "bg-teal-50 text-[#0e8c8c]"
                                : "bg-muted text-subdued"
                            }`}
                          >
                            {documentCount}/2 documents
                          </span>
                        </div>

                        {/* BATCH NUMBER */}

                        <div className="mb-4">
                          <label
                            htmlFor={`batch-number-${index}`}
                            className="mb-1.5 block text-small font-semibold text-text"
                          >
                            Batch No.

                            {batch.noAuto && (
                              <span className="ml-2 font-normal text-[#0e8c8c]">
                                Read from {srcDoc}
                              </span>
                            )}
                          </label>

                          <input
                            id={`batch-number-${index}`}
                            value={batch.no}
                            onChange={(event) =>
                              updateBatch(index, {
                                no: event.target.value,
                                noAuto: false,
                              })
                            }
                            placeholder={`Read from the ${srcDoc} after upload`}
                            className={`h-10 w-full rounded-control border bg-surface px-3 font-mono text-small text-text outline-none transition focus:ring-2 focus:ring-[#0e8c8c]/20 ${
                              touched && errors[`no${index}`]
                                ? "border-danger"
                                : "border-border-strong focus:border-[#0e8c8c]"
                            }`}
                          />

                          {touched && errors[`no${index}`] && (
                            <p className="mt-1 text-small text-danger">
                              {errors[`no${index}`]}
                            </p>
                          )}
                        </div>

                        {/* DOCUMENT UPLOADS */}

                        <div className="space-y-3">
                          {renderUpload(
                            `bmr-${index}`,
                            `Executed ${srcDoc}`,
                            batch.bmr,
                            touched ? errors[`bmr${index}`] : undefined,
                          )}

                          {renderUpload(
                            `qc-${index}`,
                            "QC datasheet",
                            batch.qc,
                            touched ? errors[`qc${index}`] : undefined,
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>

                {/* DUPLICATE BATCH VALIDATION */}

                {touched && errors.dup && (
                  <p className="mt-3 rounded-control border border-danger bg-red-50 px-4 py-3 text-small text-danger">
                    {errors.dup}
                  </p>
                )}

                {/* OTHER SUPPORTING DOCUMENTS */}

                <div className="mt-7 max-w-3xl overflow-hidden rounded-control border border-border-strong bg-surface">
                  <button
                    type="button"
                    aria-expanded={othersOpen}
                    onClick={() => setOthersOpen((open) => !open)}
                    className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-4 text-left transition hover:bg-muted/50"
                  >
                    <span className="flex items-center gap-2 text-small font-semibold text-text">
                      {othersOpen ? (
                        <ChevronDown size={17} />
                      ) : (
                        <ChevronRight size={17} />
                      )}

                      Other supporting documents

                      {others.length > 0 && (
                        <span className="font-normal text-subdued">
                          ({others.length})
                        </span>
                      )}
                    </span>

                    <span className="text-micro text-subdued">
                      Optional
                    </span>
                  </button>

                  {othersOpen && (
                    <div className="space-y-3 border-t border-border p-4">
                      {others.map((item) => (
                        <div
                          key={item.id}
                          className="flex min-w-0 items-center gap-3 rounded-control border border-border p-3"
                        >
                          <FileText
                            size={19}
                            className="shrink-0 text-[#0e8c8c]"
                          />

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-small font-medium text-text">
                              {item.file.name}
                            </p>

                            <p className="mt-1 text-micro text-subdued">
                              PDF · {formatSize(item.file.size)}
                            </p>
                          </div>

                          <button
                            type="button"
                            aria-label={`Remove ${item.file.name}`}
                            onClick={() =>
                              setOthers((previous) =>
                                previous.filter(
                                  (file) => file.id !== item.id,
                                ),
                              )
                            }
                            className="rounded-control p-2 text-subdued transition hover:bg-red-50 hover:text-danger"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}

                      {/* SUPPORTING DOCUMENT DROP ZONE */}

                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() =>
                          fileInputRefs.current.others?.click()
                        }
                        onKeyDown={(event) =>
                          handleDropKey("others", event)
                        }
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDraggingKey("others");
                        }}
                        onDragLeave={() => setDraggingKey(null)}
                        onDrop={(event) => handleDrop("others", event)}
                        className={`flex min-h-[110px] cursor-pointer flex-col items-center justify-center rounded-control border border-dashed px-4 py-5 text-center transition ${
                          draggingKey === "others"
                            ? "border-[#0e8c8c] bg-teal-50"
                            : "border-border-strong hover:border-[#0e8c8c] hover:bg-muted/50"
                        }`}
                      >
                        <Upload
                          size={21}
                          className="mb-2 text-subdued"
                        />

                        <p className="text-small text-subdued">
                          Drag PDFs here, or{" "}
                          <span className="font-semibold text-[#0e8c8c]">
                            browse
                          </span>
                        </p>

                        <p className="mt-1 text-micro text-subdued">
                          Multiple files allowed
                        </p>
                      </div>

                      <input
                        ref={(element) => {
                          fileInputRefs.current.others = element;
                        }}
                        type="file"
                        accept="application/pdf,.pdf"
                        multiple
                        className="hidden"
                        onChange={(event) =>
                          handleFileChange("others", event)
                        }
                      />
                    </div>
                  )}
                </div>

                {/* STATUS MESSAGE */}

                {notice && (
                  <p
                    role="alert"
                    className="mt-5 rounded-control border border-border bg-muted/50 px-4 py-3 text-small text-text"
                  >
                    {notice}
                  </p>
                )}
              </div>
            </div>

            {/* FOOTER ACTIONS */}

            <div className="border-t border-border bg-surface px-5 py-4 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-[1100px] flex-col-reverse gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                {/* BACK */}

       

                {/* CONTINUE */}

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={busy}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-[#0e8c8c] px-5 py-2.5 text-small font-semibold text-white transition hover:bg-[#0b7777] focus:outline-none focus:ring-2 focus:ring-[#0e8c8c] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {busy ? (
                    <LoaderCircle
                      size={16}
                      className="animate-spin"
                    />
                  ) : (
                    <ArrowRight size={16} />
                  )}

                  Read documents &amp; continue
                </button>

                {/* SAVE AND EXIT */}

                <button
                  type="button"
                  onClick={handleSaveExit}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-5 py-2.5 text-small font-semibold text-text transition hover:bg-muted"
                >
                  <Save size={16} />
                  Save &amp; exit
                </button>
              </div>

              <p className="mx-auto mt-3 flex max-w-[1100px] items-start gap-2 text-small leading-5 text-subdued">
                <Info size={15} className="mt-0.5 shrink-0" />

                Handwritten entries are intended to be read with OCR.
                Check and approve every extracted value on the Stage
                output step.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default Input;
