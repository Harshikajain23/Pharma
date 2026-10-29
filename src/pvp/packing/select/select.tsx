
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

import {
  PVP_STEPS,
  PVP_PACKING_STEPS,
} from "../../../features/new-document/model/documentSelector.config";

interface SelectedBpr {
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

  // Keep the correct workflow even if React Router state is missing.
  const validationType: "manufacturing" | "packing" =
    location.state?.validationType === "packing" ||
    location.pathname.toLowerCase().endsWith("/selectpacking")
      ? "packing"
      : "manufacturing";

  const isPacking = validationType === "packing";

  const user = useAuthStore((state) => state.user);

  const { context, isLoading: isLoadingContext } =
    useDocumentSelectorData(user);

  const { document: saved } = useDocument(documentId);

  // IMPORTANT: Pass validationType so Packing uses Packing routes.
  const { goToStep } = useStepNavigation(
    documentId,
    "pvp",
    validationType,
  );

  const [selectedBpr, setSelectedBpr] = useState<SelectedBpr | null>(null);

  const [qcDocuments, setQcDocuments] = useState<(File | null)[]>([
    null, // GRS
    null, // SFS
    null, // FPS
  ]);

  const [buDocuments, setBuDocuments] = useState<File[]>([]);
  const [supportingDocuments, setSupportingDocuments] = useState<File[]>([]);

  const [hasBu, setHasBu] = useState("");
  const [headerSize, setHeaderSize] = useState("");
  const [footerSize, setFooterSize] = useState("");
  const [footerTemplateNo, setFooterTemplateNo] = useState("");
  const [reasonForValidation, setReasonForValidation] = useState("");
  const [ccnNo, setCcnNo] = useState("");

  // Receive the selected BPR from the BPR selection page.
  useEffect(() => {
    const bprFromSelection = location.state?.selectedBpr as
      | SelectedBpr
      | undefined;

    if (!bprFromSelection) return;

    setSelectedBpr(bprFromSelection);

    // Clear only the temporary selected-BPR state while preserving
    // the current workflow.
    navigate(location.pathname, {
      replace: true,
      state: { validationType },
    });
  }, [location.pathname, location.state, navigate, validationType]);

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

  function removeFile(
    index: number,
    setter: Dispatch<SetStateAction<File[]>>,
  ) {
    setter((current) => current.filter((_, fileIndex) => fileIndex !== index));
  }

  // Navigate to the appropriate preview page.
  function handleContinue() {
    if (!documentId) return;

    if (isPacking) {
      navigate(
        `/pvp/${encodeURIComponent(documentId)}/previewpacking`,
        { state: { validationType: "packing" } },
      );
      return;
    }

    navigate(`/pvp/${encodeURIComponent(documentId)}/preview`);
  }

  const canContinue =
    Boolean(selectedBpr?.document_id) &&
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
            {/* Wizard stepper */}
            <div className="bg-surface px-4 py-4 sm:px-6 lg:px-8">
              <DocumentStepper
                steps={isPacking ? PVP_PACKING_STEPS : PVP_STEPS}
                activeStepId={
                  isPacking ? "select-packing" : "select-document"
                }
                completedStepIds={saved?.completed_steps ?? []}
                onStepClick={goToStep}
              />
            </div>

            {/* Selected document information */}
            <SelectionStrip
              dosageForm={saved?.dosage_form ?? "tablet"}
              docType="pvp"
              identifier={saved?.draft_id}
            />

            <div className="px-5 py-5 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-[1100px] space-y-7">
                <div className="flex items-start gap-2 text-small text-subdued">
                  <FileText
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span>
                    New document - working draft - not yet a controlled record.
                  </span>
                </div>

                {/* Select BPR */}
                <section className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-text">
                      Select BPR
                      <span className="ml-1 text-danger">*</span>
                    </label>

                    <p className="mt-1.5 text-small text-subdued">
                      Choose the BPR this validation protocol is built on.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/pvp/${encodeURIComponent(documentId)}/selectbpr`,
                        { state: { validationType } },
                      )
                    }
                    className="flex w-full items-center gap-3 rounded-control border border-border-strong bg-surface px-4 py-3 text-left shadow-sm transition hover:border-primary/60 hover:bg-accent-soft/20"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-small font-semibold text-text">
                        {selectedBpr?.display_id ?? "Select BPR"}
                      </span>

                      <span className="mt-0.5 block truncate text-micro text-subdued">
                        {selectedBpr
                          ? `${selectedBpr.product_name ?? "Product"} · Version ${selectedBpr.version}`
                          : "Select a BPR from the available BPR list"}
                      </span>
                    </span>

                    <ArrowRight
                      className="size-4 shrink-0 text-subdued"
                      aria-hidden="true"
                    />
                  </button>
                </section>

                {/* QC documents */}
                <section className="space-y-3">
                  <div>
                    <h2 className="text-h3 font-semibold">
                      QC - Quality control documents
                    </h2>
                    <p className="mt-1 text-small text-subdued">
                      The approved QC / specification documents for this product.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    {[
                     
                      { label: "FPS - FINISHED PRODUCT SPECIFICATION", required: false },
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
                            if (!file) return;

                            if (
                              file.type !== "application/pdf" &&
                              !file.name.toLowerCase().endsWith(".pdf")
                            ) {
                              event.target.value = "";
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

                

                

               
              

                {/* Supporting documents */}
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
                          if (!file) return;

                          if (
                            file.type !== "application/pdf" &&
                            !file.name.toLowerCase().endsWith(".pdf")
                          ) {
                            event.target.value = "";
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

            {/* Bottom actions */}
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

interface MultiplePdfUploadProps {
  files: File[];
  onAdd: (event: ChangeEvent<HTMLInputElement>) => void;
  onRemove: (index: number) => void;
}

function MultiplePdfUpload({
  files,
  onAdd,
  onRemove,
}: MultiplePdfUploadProps) {
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

function formatFileSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "PDF";

  const mb = bytes / (1024 * 1024);

  if (mb >= 1) {
    return `${mb.toFixed(mb >= 10 ? 0 : 1)} MB`;
  }

  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

const inputClass =
  "mt-2 min-h-10 w-full rounded-control border border-border-strong bg-surface px-3 py-2.5 text-small text-text shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";
