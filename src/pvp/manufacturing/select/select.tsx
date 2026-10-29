import { ArrowRight, FileText, Info, Plus, X } from "lucide-react";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { AppHeader } from "../../../features/new-document/components/AppHeader";
import { AppSidebar } from "../../../features/new-document/components/AppSidebar";
import { DocumentStepper } from "../../../features/new-document/components/DocumentStepper";
import { SelectionStrip } from "../../../features/new-document/components/SelectionStrip";

import { useAuthStore } from "../../../features/auth/state/auth.store";
import { useDocument } from "../../../features/new-document/hooks/useDocument";
import { useDocumentSelectorData } from "../../../features/new-document/hooks/useDocumentSelectorData";
import { useStepNavigation } from "../../../features/new-document/hooks/useStepNavigation";

import { PVP_STEPS } from "../../../features/new-document/model/documentSelector.config";

interface SelectedBmr {
  document_id: string;
  display_id: string;
  version: string;
  product_name: string | null;
  dosage_form: string | null;
  status: string;
  state: string;
  state_label: string;
}

export const Select = () => {
  const { documentId = "" } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const user = useAuthStore((state) => state.user);

  const { context, isLoading: isLoadingContext } =
    useDocumentSelectorData(user);

  const { document: saved } = useDocument(documentId);

  const { goToStep } = useStepNavigation(documentId, "pvp");

  // =========================================================
  // BMR SELECTION
  // =========================================================

  const [selectedBmr, setSelectedBmr] = useState<SelectedBmr | null>(null);

  // =========================================================
  // OTHER FORM STATE
  // =========================================================

  const [qcDocuments, setQcDocuments] = useState<(File | null)[]>([
    null, // GRS - required
    null, // SFS - optional
    null, // FPS - optional
  ]);

  const [buDocuments, setBuDocuments] = useState<File[]>([]);
  const [supportingDocuments, setSupportingDocuments] = useState<File[]>([]);

  const [hasBu, setHasBu] = useState("");

  const [headerSize, setHeaderSize] = useState("");
  const [footerSize, setFooterSize] = useState("");
  const [footerTemplateNo, setFooterTemplateNo] = useState("");
  const [reasonForValidation, setReasonForValidation] = useState("");
  const [ccnNo, setCcnNo] = useState("");

  // =========================================================
  // RECEIVE SELECTED BMR FROM SELECT-BMR PAGE
  // =========================================================

  useEffect(() => {
    const bmrFromSelection = location.state?.selectedBmr as
      | SelectedBmr
      | undefined;

    if (!bmrFromSelection) {
      return;
    }

    setSelectedBmr(bmrFromSelection);

    navigate(location.pathname, {
      replace: true,
      state: null,
    });
  }, [location, navigate]);

  // =========================================================
  // FILE HANDLING
  // =========================================================

  function addFiles(
    event: ChangeEvent<HTMLInputElement>,
    setter: Dispatch<SetStateAction<File[]>>,
  ) {
    const files = Array.from(event.target.files ?? []);

    const pdfFiles = files.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf"),
    );

    setter((current) => [...current, ...pdfFiles]);

    event.target.value = "";
  }

  function removeFile(index: number, setter: Dispatch<SetStateAction<File[]>>) {
    setter((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }

  // =========================================================
  // CONTINUE
  // =========================================================

  function handleContinue() {
    if (!documentId) {
      return;
    }

    navigate(`/pvp/${documentId}/previewpacking`);
  }

  // =========================================================
  // VALIDATION
  // =========================================================

  const canContinue =
    Boolean(selectedBmr?.document_id) &&
    Boolean(qcDocuments[0]) &&
    Boolean(hasBu) &&
    Boolean(headerSize) &&
    Boolean(footerSize) &&
    Boolean(footerTemplateNo.trim()) &&
    Boolean(reasonForValidation.trim());

  return (
    <div className="fixed flex min-h-screen w-full flex-col bg-background text-text">
      <AppHeader
        user={user}
        unit={context?.unit ?? null}
        isLoadingUnit={isLoadingContext}
      />

      <div className="lg:grid lg:h-[calc(100vh-var(--topbar-h))] lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)] lg:overflow-hidden">
        <AppSidebar user={user} />

        <main className="min-w-0 min-h-0 lg:h-full lg:overflow-y-auto">
          <section className="mx-auto bg-surface shadow-sm">
            {/* =====================================================
                STEPPER
            ===================================================== */}

            <div className="bg-surface px-4 py-4 sm:px-6 lg:px-8">
              <DocumentStepper
                steps={PVP_STEPS}
                activeStepId="select-document"
                completedStepIds={saved?.completed_steps ?? []}
                onStepClick={goToStep}
              />
            </div>

            {/* =====================================================
                SELECTION STRIP
            ===================================================== */}

            <SelectionStrip
              dosageForm={saved?.dosage_form ?? "tablet"}
              docType="pvp"
              identifier={saved?.draft_id}
            />

            {/* =====================================================
                PAGE CONTENT
            ===================================================== */}

            <div className="px-5 py-5 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-[1100px] space-y-7">
                {/* =================================================
                    DRAFT NOTICE
                ================================================= */}

                <div className="flex items-start gap-2 text-small text-subdued">
                  <FileText
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />

                  <span>
                    New document - working draft - not yet a controlled record.
                  </span>
                </div>

                {/* =================================================
                    SELECT BMR
                ================================================= */}

                <section className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-text">
                      Select BMR
                      <span className="ml-1 text-danger">*</span>
                    </label>

                    <p className="mt-1.5 text-small text-subdued">
                      Choose the BMR this validation protocol is built on.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/pvp/${documentId}/selectbmr`)}
                    className="flex w-full items-center gap-3 rounded-control border border-border-strong bg-surface px-4 py-3 text-left shadow-sm transition hover:border-primary/60 hover:bg-accent-soft/20"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-small font-semibold text-text">
                        {selectedBmr ? selectedBmr.display_id : "Select BMR"}
                      </span>

                      <span className="mt-0.5 block truncate text-micro text-subdued">
                        {selectedBmr
                          ? `${selectedBmr.product_name ?? "Product"} · Version ${selectedBmr.version}`
                          : "Select a BMR from the available BMR list"}
                      </span>
                    </span>

                    <ArrowRight
                      className="size-4 shrink-0 text-subdued"
                      aria-hidden="true"
                    />
                  </button>
                </section>

                {/* =================================================
                    QC DOCUMENTS
                ================================================= */}

                <section className="space-y-3">
                  <div>
                    <h2 className="text-h3 font-semibold">
                      QC - Quality control documents
                    </h2>

                    <p className="mt-1 text-small text-subdued">
                      The approved QC / specification documents for this
                      product.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                      {
                        label: "GRS - GRANULES SPECIFICATION",
                        required: true,
                      },
                      {
                        label: "SFS - SEMI-FINISHED PRODUCT SPECIFICATION",
                        required: false,
                      },
                      {
                        label: "FPS - FINISHED PRODUCT SPECIFICATION",
                        required: false,
                      },
                    ].map((document, index) => (
                      <label
                        key={document.label}
                        className={`block cursor-pointer rounded-control border border-dashed bg-muted p-5 text-center transition hover:border-primary/60 hover:bg-accent-soft/30 ${
                          document.required && !qcDocuments[index]
                            ? "border-danger/50"
                            : "border-border"
                        }`}
                      >
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="sr-only"
                          onChange={(event) => {
                            const file = event.target.files?.[0];

                            if (!file) {
                              return;
                            }

                            setQcDocuments((current) => {
                              const updated = [...current];
                              updated[index] = file;
                              return updated;
                            });

                            event.target.value = "";
                          }}
                        />

                        <FileText
                          className="mx-auto size-5 text-subdued"
                          aria-hidden="true"
                        />

                        <span className="mt-2 block text-small font-semibold text-text">
                          {document.label}

                          {document.required && (
                            <span className="ml-1 text-danger">*</span>
                          )}
                        </span>

                        {qcDocuments[index] ? (
                          <span className="mt-1 block truncate text-micro text-success">
                            {qcDocuments[index]?.name}
                          </span>
                        ) : (
                          <span className="mt-1 block text-micro text-subdued">
                            Upload PDF
                          </span>
                        )}

                        {document.required && !qcDocuments[index] && (
                          <span className="mt-1 block text-micro text-danger">
                            Required
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                </section>

                {/* =================================================
                    BU
                ================================================= */}

                <section className="space-y-3">
                  <div>
                    <h2 className="text-h3 font-semibold">
                      Does this document have a BU?
                      <span className="ml-1 text-danger">*</span>
                    </h2>
                  </div>

                  <div className="flex gap-3">
                    {["Yes", "No"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => setHasBu(option.toLowerCase())}
                        className={`min-w-24 rounded-control border px-5 py-2.5 text-small font-semibold transition ${
                          hasBu === option.toLowerCase()
                            ? "border-primary bg-accent-soft text-primary-dark"
                            : "border-border-strong bg-surface text-text hover:border-primary/60"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>

                  {hasBu === "no" ? (
                    <div className="rounded-control border border-border bg-muted p-4">
                      <p className="mb-3 text-small text-subdued">
                        If the document has no BU, upload it separately.
                      </p>

                      <MultiplePdfUpload
                        files={buDocuments}
                        onAdd={(event) => addFiles(event, setBuDocuments)}
                        onRemove={(index) => removeFile(index, setBuDocuments)}
                      />
                    </div>
                  ) : null}
                </section>

                {/* =================================================
                    OTHER SUPPORTING DOCUMENTS
                ================================================= */}

                <section className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-h3 font-semibold">
                      Other supporting documents
                    </h2>

                    <span className="text-micro text-subdued">(Optional)</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="flex min-h-10 flex-1 cursor-pointer items-center rounded-control border border-dashed border-border bg-muted px-4 py-2.5 transition hover:border-primary/60 hover:bg-accent-soft/30">
                      <input
                        type="file"
                        accept="application/pdf,.pdf"
                        className="sr-only"
                        onChange={(event) => {
                          const file = event.target.files?.[0];

                          if (!file) {
                            return;
                          }

                          setSupportingDocuments([file]);
                          event.target.value = "";
                        }}
                      />

                      <FileText
                        className="mr-2 size-4 shrink-0 text-subdued"
                        aria-hidden="true"
                      />

                      <span className="truncate text-small text-subdued">
                        {supportingDocuments[0]?.name ??
                          "Upload supporting document (PDF)"}
                      </span>
                    </label>

                    {supportingDocuments.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setSupportingDocuments([])}
                        className="inline-flex size-10 shrink-0 items-center justify-center rounded-control border border-border text-subdued hover:bg-muted hover:text-text"
                        aria-label="Remove supporting document"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                </section>

                {/* =================================================
                    HEADER / FOOTER
                ================================================= */}

                <div className="grid gap-6 md:grid-cols-2">
                  {/* Header size */}

                  <div>
                    <label
                      htmlFor="header-size"
                      className="block text-sm font-semibold text-text"
                    >
                      Header size
                      <span className="ml-1 text-danger">*</span>
                    </label>

                    <select
                      id="header-size"
                      value={headerSize}
                      onChange={(event) => setHeaderSize(event.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select a size...</option>

                      <option value="0.5">0.5&quot; (compact)</option>

                      <option value="0.75">0.75&quot; (standard)</option>

                      <option value="1.0">1.0&quot; (large)</option>
                    </select>

                    <p className={helperClass}>
                      Distance the header sits from the top edge, in inches.
                    </p>
                  </div>

                  {/* Footer size */}

                  <div>
                    <label
                      htmlFor="footer-size"
                      className="block text-sm font-semibold text-text"
                    >
                      Footer size
                      <span className="ml-1 text-danger">*</span>
                    </label>

                    <select
                      id="footer-size"
                      value={footerSize}
                      onChange={(event) => setFooterSize(event.target.value)}
                      className={selectClass}
                    >
                      <option value="">Select a size...</option>

                      <option value="0.5">0.5&quot; (compact)</option>

                      <option value="0.75">0.75&quot; (standard)</option>

                      <option value="1.0">1.0&quot; (large)</option>
                    </select>

                    <p className={helperClass}>
                      Distance the footer sits from the bottom edge, in inches.
                    </p>
                  </div>
                </div>

                {/* =================================================
                    FOOTER TEMPLATE
                ================================================= */}

                <section>
                  <label
                    htmlFor="footer-template"
                    className="block text-sm font-semibold text-text"
                  >
                    Footer template no.
                    <span className="ml-1 text-danger">*</span>
                  </label>

                  <input
                    id="footer-template"
                    type="text"
                    value={footerTemplateNo}
                    onChange={(event) =>
                      setFooterTemplateNo(event.target.value)
                    }
                    placeholder="Enter footer template number"
                    className={inputClass}
                  />

                  <p className={helperClass}>
                    The controlled footer template stamped on every page.
                  </p>
                </section>

                {/* =================================================
                    INFO
                ================================================= */}

                <div className="flex items-start gap-2 rounded-control border border-border bg-muted px-4 py-3 text-small text-subdued">
                  <Info
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />

                  <p>
                    Core inputs are saved here; OCR is not run on this screen.
                  </p>
                </div>
              </div>
            </div>

            {/* =====================================================
                BOTTOM ACTIONS
            ===================================================== */}

            <div className="border-t border-border bg-surface px-5 py-4 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-[1100px] flex-col-reverse gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="inline-flex min-h-10 items-center justify-center rounded-control border border-border-strong bg-surface px-5 py-2.5 text-small font-semibold text-text transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                >
                  Save &amp; exit
                </button>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!canContinue}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-primary px-5 py-2.5 text-small font-semibold text-white transition hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-subdued"
                >
                  Continue to preview
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

/* =========================================================
   MULTIPLE PDF UPLOAD
========================================================= */

interface MultiplePdfUploadProps {
  files: File[];
  onAdd: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
}

function MultiplePdfUpload({ files, onAdd, onRemove }: MultiplePdfUploadProps) {
  return (
    <div className="space-y-3">
      <label className="block cursor-pointer rounded-control border border-dashed border-border bg-muted p-6 text-center transition hover:border-primary/60 hover:bg-accent-soft/30">
        <input
          type="file"
          accept="application/pdf,.pdf"
          multiple
          className="sr-only"
          onChange={onAdd}
        />

        <Plus className="mx-auto size-5 text-subdued" aria-hidden="true" />

        <span className="mt-2 block text-small text-subdued">
          Drag PDFs here, or{" "}
          <span className="font-semibold text-primary-dark">browse</span>
        </span>

        <span className="mt-1 block text-micro font-medium text-subdued">
          PDF - max 20 MB each · multiple allowed
        </span>
      </label>

      {files.length === 0 ? (
        <p className="text-micro text-subdued">0 documents added.</p>
      ) : (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div
              key={`${file.name}-${file.size}-${index}`}
              className="flex items-center gap-3 rounded-control border border-border bg-surface px-3 py-2.5"
            >
              <FileText
                className="size-4 shrink-0 text-subdued"
                aria-hidden="true"
              />

              <div className="min-w-0 flex-1">
                <p className="truncate text-small font-medium text-text">
                  {file.name}
                </p>

                <p className="text-micro text-subdued">
                  {formatFileSize(file.size)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onRemove(index)}
                className="inline-flex size-8 shrink-0 items-center justify-center rounded-control text-subdued transition hover:bg-muted hover:text-text"
                aria-label={`Remove ${file.name}`}
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* =========================================================
   FILE SIZE
========================================================= */

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "PDF";
  }

  const mb = bytes / (1024 * 1024);

  if (mb >= 1) {
    return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/* =========================================================
   STYLES
========================================================= */

const inputClass =
  "mt-2 min-h-10 w-full rounded-control border border-border-strong bg-surface px-3 py-2.5 text-small text-text shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const selectClass =
  "mt-2 min-h-10 w-full rounded-control border border-border-strong bg-surface px-3 py-2.5 text-small text-text shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const helperClass = "mt-1.5 text-micro leading-5 text-subdued";
