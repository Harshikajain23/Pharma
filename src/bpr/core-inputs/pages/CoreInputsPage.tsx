import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Info,
  Loader2,
  Lock,
  ShieldCheck,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";

import { getDocumentPreviewRoute, ROUTES } from "../../../app/routing/routes";
import { getApiErrorMessage } from "../../../shared/api/apiError";
import { useAuthStore } from "../../../features/auth/state/auth.store";
import { setCoreInputs } from "../../../features/new-document/api/documents.api";

import type {
  BatchType,
  CommercialMode,
  CreateBmrDocumentResponse,
  SetCoreInputsResponse,
} from "../../../features/new-document/api/documents.types";

import { AppHeader } from "../../../features/new-document/components/AppHeader";
import { AppSidebar } from "../../../features/new-document/components/AppSidebar";
import { DocumentStepper } from "../../../features/new-document/components/DocumentStepper";
import { SelectionStrip } from "../../../features/new-document/components/SelectionStrip";
import { useDocument } from "../../../features/new-document/hooks/useDocument";
import { useDocumentSelectorData } from "../../../features/new-document/hooks/useDocumentSelectorData";
import { useStepNavigation } from "../../../features/new-document/hooks/useStepNavigation";
import { BPR_STEPS } from "../../../features/new-document/model/documentSelector.config";

import {
  FileUploadCard,
  type FileUploadStatus,
} from "../components/FileUploadCard";

import {
  clearCoreInputsDraft,
  loadCoreInputsDraft,
  saveCoreInputsDraft,
  type CoreInputsDraft,
} from "../storage/coreInputsDraft";

type CoreInputsLocationState = {
  document?: CreateBmrDocumentResponse;
};

type FileField = "mpc" | "pp" | "otherDoc1" | "otherDoc2" | "otherDoc3";

interface CoreInputsFormState {
  mpc: File | null;
  pp: File | null;
  otherDoc1: File | null;
  otherDoc2: File | null;
  otherDoc3: File | null;
  batchSize: string;
  batchType: BatchType | "";
  commercialMode: CommercialMode | "";
  headerFooterSize: string;
  footerSize: string;
  footerTemplateNo: string;
}

type CoreInputsErrors = Partial<
  Record<keyof CoreInputsFormState | "form", string>
>;

type FileAttachState = {
  status: FileUploadStatus;
  progress: number;
};

const MAX_PDF_SIZE_BYTES = 20 * 1024 * 1024;

const INITIAL_FORM_STATE: CoreInputsFormState = {
  mpc: null,
  pp: null,
  otherDoc1: null,
  otherDoc2: null,
  otherDoc3: null,
  batchSize: "",
  batchType: "",
  commercialMode: "",
  headerFooterSize: "",
  footerSize: "",
  footerTemplateNo: "",
};

/**
 * Represents a file that already exists on the server.
 * It is only used for frontend validation/display.
 */
const PLACEHOLDER_FILE = new File([], "stored.pdf", {
  type: "application/pdf",
});

const BATCH_TYPE_OPTIONS = [
  { value: "exhibit", label: "Exhibit" },
  { value: "scale_up", label: "Scale up" },
  { value: "commercial", label: "Commercial" },
];

const COMMERCIAL_MODE_OPTIONS = [
  { value: "revision", label: "Revision" },
  { value: "validation", label: "Validation" },
];

/**
 * BPR header/footer sizes.
 */
const HEADER_FOOTER_SIZE_OPTIONS = [
  { value: "0.5", label: '0.5" (compact)' },
  { value: "0.75", label: '0.75" (standard)' },
  { value: "1.0", label: '1.0" (large)' },
];

export function CoreInputsPage() {
  const { documentId = "" } = useParams();

  const location = useLocation();
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);

  const { context, isLoading: isLoadingContext } =
    useDocumentSelectorData(user);

  const state = location.state as CoreInputsLocationState | null;

  const document = state?.document;

  const { document: saved } = useDocument(documentId);

  const { goToStep } = useStepNavigation(documentId);

  /*
   * Restore the BPR draft if the user previously left this page.
   */
  const [form, setForm] = useState<CoreInputsFormState>(() =>
    mergeDraft(INITIAL_FORM_STATE, loadCoreInputsDraft(documentId)),
  );

  /*
   * Files already stored on the server.
   */
  const savedFiles = useMemo(
    () =>
      new Map((saved?.files ?? []).map((file) => [file.field, file.filename])),
    [saved],
  );

  /*
   * Populate fields from the saved BPR document.
   */
  const prefilledRef = useRef(false);

  useEffect(() => {
    if (!saved || prefilledRef.current) {
      return;
    }

    prefilledRef.current = true;

    setForm((current) => ({
      ...current,

      batchSize:
        current.batchSize ||
        (saved.batch_size != null
          ? formatIndianNumber(String(saved.batch_size))
          : ""),

      batchType: current.batchType || ((saved.batch_type as BatchType) ?? ""),

      commercialMode:
        current.commercialMode ||
        ((saved.commercial_mode as CommercialMode) ?? ""),

      headerFooterSize:
        current.headerFooterSize ||
        (saved.header_footer_size != null
          ? String(saved.header_footer_size)
          : ""),

      footerSize:
        current.footerSize ||
        (saved.footer_size != null
          ? String(saved.footer_size)
          : saved.header_footer_size != null
            ? String(saved.header_footer_size)
            : ""),

      footerTemplateNo:
        current.footerTemplateNo || (saved.footer_template_no ?? ""),
    }));
  }, [saved]);

  /*
   * Autosave text fields.
   * Files cannot be persisted in localStorage.
   */
  const submittedRef = useRef(false);

  useEffect(() => {
    if (!documentId || submittedRef.current) {
      return;
    }

    saveCoreInputsDraft(documentId, toDraft(form));
  }, [documentId, form]);

  const [touched, setTouched] = useState<
    Partial<Record<keyof CoreInputsFormState, boolean>>
  >({});

  const [fileIssues, setFileIssues] = useState<
    Partial<Record<FileField, string>>
  >({});

  const [fileAttachState, setFileAttachState] = useState<
    Partial<Record<FileField, FileAttachState>>
  >({});

  const [submitAttempted, setSubmitAttempted] = useState(false);

  const [apiError, setApiError] = useState<string | null>(null);

  const [success, setSuccess] = useState<SetCoreInputsResponse | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const submitInFlightRef = useRef(false);

  const uploadTimersRef = useRef<Partial<Record<FileField, number>>>({});

  useEffect(() => {
    return () => {
      Object.values(uploadTimersRef.current).forEach((timerId) => {
        if (timerId) {
          window.clearTimeout(timerId);
        }
      });
    };
  }, []);

  const errors = useMemo(
    () => validateCoreInputs(form, documentId, fileIssues, savedFiles),
    [documentId, fileIssues, form, savedFiles],
  );

  const hasUploadingFile = Object.values(fileAttachState).some(
    (stateValue) => stateValue?.status === "uploading",
  );

  const visibleErrors = getVisibleErrors(errors, touched, submitAttempted);

  const batchSizeWarning = getBatchSizeWarning(form.batchSize);

  const canSubmit =
    Object.keys(errors).length === 0 &&
    !hasUploadingFile &&
    !isSubmitting &&
    !success;

  const primaryReason = getPrimaryDisabledReason(errors, hasUploadingFile);

  function setFile(field: FileField, file: File | null) {
    window.clearTimeout(uploadTimersRef.current[field]);

    setTouched((current) => ({
      ...current,
      [field]: true,
    }));

    setApiError(null);

    if (!file) {
      setForm((current) => ({
        ...current,
        [field]: null,
      }));

      setFileIssues((current) => ({
        ...current,
        [field]: undefined,
      }));

      setFileAttachState((current) => ({
        ...current,
        [field]: {
          status: "idle",
          progress: 0,
        },
      }));

      return;
    }

    const validationMessage = getFileRejectionMessage(field, file);

    if (validationMessage) {
      setForm((current) => ({
        ...current,
        [field]: null,
      }));

      setFileIssues((current) => ({
        ...current,
        [field]: validationMessage,
      }));

      setFileAttachState((current) => ({
        ...current,
        [field]: {
          status: "idle",
          progress: 0,
        },
      }));

      return;
    }

    setForm((current) => ({
      ...current,
      [field]: file,
    }));

    setFileIssues((current) => ({
      ...current,
      [field]: undefined,
    }));

    setFileAttachState((current) => ({
      ...current,
      [field]: {
        status: "uploading",
        progress: field === "mpc" ? 62 : 48,
      },
    }));

    uploadTimersRef.current[field] = window.setTimeout(() => {
      setFileAttachState((current) => ({
        ...current,
        [field]: {
          status: "attached",
          progress: 100,
        },
      }));
    }, 500);
  }

  function handleFieldChange(
    field: keyof Pick<
      CoreInputsFormState,
      | "batchSize"
      | "batchType"
      | "commercialMode"
      | "headerFooterSize"
      | "footerSize"
      | "footerTemplateNo"
    >,
  ) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = event.target.value;

      setForm((current) => ({
        ...current,
        [field]: value,

        ...(field === "batchType" && value !== "commercial"
          ? { commercialMode: "" }
          : null),
      }));

      setTouched((current) => ({
        ...current,
        [field]: true,
      }));

      setApiError(null);
    };
  }

  function handleBatchSizeChange(event: ChangeEvent<HTMLInputElement>) {
    const formatted = formatIndianNumber(event.target.value);

    setForm((current) => ({
      ...current,
      batchSize: formatted,
    }));

    setTouched((current) => ({
      ...current,
      batchSize: true,
    }));

    setApiError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSubmitAttempted(true);
    setApiError(null);

    const nextErrors = validateCoreInputs(
      form,
      documentId,
      fileIssues,
      savedFiles,
    );

    if (
      Object.keys(nextErrors).length > 0 ||
      hasUploadingFile ||
      submitInFlightRef.current
    ) {
      return;
    }

    const batchType = form.batchType;

    const batchSize = parseWholeNumber(form.batchSize);

    const headerFooterSize = parseDecimal(form.headerFooterSize);

    const footerSize = parseDecimal(form.footerSize);

    /*
     * BPR uses MPC, not MFC.
     */
    const mpc = form.mpc;
    const pp = form.pp;

    const hasMpc = Boolean(mpc) || savedFiles.has("mpc");

    const hasPp = Boolean(pp) || savedFiles.has("pp");

    if (
      !hasMpc ||
      !hasPp ||
      !batchType ||
      batchSize === null ||
      headerFooterSize === null ||
      footerSize === null
    ) {
      return;
    }

    submitInFlightRef.current = true;
    setIsSubmitting(true);

    try {
      /*
       * TEMPORARY:
       * This still uses the existing BMR API because you don't
       * currently have a BPR backend endpoint.
       *
       * When the BPR backend is available, this should become
       * setBprCoreInputs({
       *   ...
       *   mpc,
       * })
       */
      const response = await setCoreInputs({
        documentId,

        /*
         * Existing API expects "mfc".
         * We pass the BPR MPC file into that field temporarily.
         */
        mfc: mpc,

        pp,

        otherDoc1: form.otherDoc1,
        otherDoc2: form.otherDoc2,
        otherDoc3: form.otherDoc3,

        batchSize,
        batchType,

        commercialMode: batchType === "commercial" ? form.commercialMode : "",

        headerFooterSize,
        footerSize,

        footerTemplateNo: form.footerTemplateNo.trim(),

        user: user?.username ?? user?.id,
      });

      submittedRef.current = true;

      clearCoreInputsDraft(documentId);

      setSuccess(response);

      window.setTimeout(() => {
        navigate(getDocumentPreviewRoute(response.document_id), {
          state: {
            coreInputs: response,
            document,
          },
        });
      }, 450);
    } catch (requestError) {
      setApiError(
        getApiErrorMessage(
          requestError,
          "Unable to save BPR core inputs. Please try again.",
        ),
      );
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  }

  /*
   * Returns the active file, or a dummy file representing
   * the file already stored on the server.
   */
  function getDisplayFile(field: FileField): File | null {
    if (form[field]) {
      return form[field];
    }

    const savedName = savedFiles.get(field);

    if (savedName) {
      return new File([" "], savedName, {
        type: "application/pdf",
      });
    }

    return null;
  }

  return (
    <div className="min-h-screen bg-background text-text">
      <AppHeader
        user={user}
        unit={context?.unit ?? null}
        isLoadingUnit={isLoadingContext}
      />

      <div className="lg:grid lg:h-[calc(100vh-var(--topbar-h))] lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)] lg:overflow-hidden">
        <AppSidebar user={user} />

        <main className="min-w-0 min-h-0 lg:h-full lg:overflow-y-auto">
          <section className="mx-auto bg-surface shadow-sm">
            <div className="bg-surface px-4 py-4 sm:px-6 lg:px-8">
              <DocumentStepper
                steps={BPR_STEPS}
                activeStepId="inputs"
                completedStepIds={saved?.completed_steps ?? []}
                onStepClick={goToStep}
              />
            </div>

            <SelectionStrip
              dosageForm={saved?.dosage_form}
              docType={saved?.doc_type}
              identifier={saved?.bpr_number ?? saved?.draft_id}
            />

            <form onSubmit={handleSubmit} noValidate>
              <div
                className={`px-5 py-5 sm:px-6 ${
                  isSubmitting ? "pointer-events-none opacity-55" : ""
                }`}
                aria-busy={isSubmitting}
              >
                <div className="space-y-5">
                  <div className="flex items-center gap-2 text-small text-subdued">
                    <FileText
                      className="size-4 text-subdued"
                      aria-hidden="true"
                    />

                    <span>
                      New document - working draft - not yet a controlled
                      record.
                    </span>
                  </div>

                  <div className="space-y-3" aria-live="polite">
                    {apiError ? (
                      <StatusBanner
                        tone="error"
                        title="Could not save BPR core inputs"
                        message={apiError}
                      />
                    ) : null}

                    {success ? (
                      <StatusBanner
                        tone="success"
                        title="BPR core inputs saved"
                        message="Moving to the page-1 preview step."
                      />
                    ) : null}

                    {visibleErrors.form ? (
                      <StatusBanner
                        tone="error"
                        title="Document unavailable"
                        message={visibleErrors.form}
                      />
                    ) : null}
                  </div>

                  {/* MPC */}

                  <FileUploadCard
                    label="MPC - Master Packing Card"
                    description="The scanned Master Packing Card. We read it on the next step to build the cover page."
                    helperText="The scanned Master Packing Card. We read it on the next step to build the cover page."
                    file={getDisplayFile("mpc")}
                    error={visibleErrors.mpc}
                    isRequired
                    disabled={isSubmitting || Boolean(success)}
                    status={getUploadStatus(
                      fileAttachState.mpc,
                      getDisplayFile("mpc"),
                    )}
                    progress={fileAttachState.mpc?.progress}
                    onChange={(file) => setFile("mpc", file)}
                  />

                  {/* Product Permission */}

                  <FileUploadCard
                    label="Product Permission"
                    description="Authorization to manufacture this product. Required before a BPR can be started."
                    helperText={
                      !getDisplayFile("pp") && getDisplayFile("mpc")
                        ? "Required - authorization on file."
                        : "Authorization to manufacture this product. Required before a BPR can be started."
                    }
                    file={getDisplayFile("pp")}
                    error={visibleErrors.pp}
                    isRequired
                    disabled={isSubmitting || Boolean(success)}
                    status={getUploadStatus(
                      fileAttachState.pp,
                      getDisplayFile("pp"),
                    )}
                    progress={fileAttachState.pp?.progress}
                    onChange={(file) => setFile("pp", file)}
                  />

                  <OptionalDocuments
                    form={form}
                    visibleErrors={visibleErrors}
                    disabled={isSubmitting || Boolean(success)}
                    fileAttachState={fileAttachState}
                    setFile={setFile}
                    getDisplayFile={getDisplayFile}
                  />

                  {/* Batch size */}

                  <TextField
                    id="batch-size"
                    label="Batch size"
                    value={form.batchSize}
                    error={visibleErrors.batchSize}
                    placeholder="1,80,000"
                    isRequired
                    disabled={isSubmitting || Boolean(success)}
                    helper="Everything scales to this in numbers."
                    onBlur={() =>
                      setTouched((current) => ({
                        ...current,
                        batchSize: true,
                      }))
                    }
                    onChange={handleBatchSizeChange}
                  />

                  {/* Batch type */}

                  <SelectField
                    id="batch-type"
                    label="Batch type"
                    value={form.batchType}
                    options={BATCH_TYPE_OPTIONS}
                    placeholder="Select a batch type..."
                    error={visibleErrors.batchType}
                    isRequired
                    disabled={isSubmitting || Boolean(success)}
                    helper="Sample values - list is per-client configuration."
                    onBlur={() =>
                      setTouched((current) => ({
                        ...current,
                        batchType: true,
                      }))
                    }
                    onChange={handleFieldChange("batchType")}
                  />

                  {/* Commercial mode */}

                  {form.batchType === "commercial" ? (
                    <SelectField
                      id="commercial-mode"
                      label="Commercial mode"
                      value={form.commercialMode}
                      options={COMMERCIAL_MODE_OPTIONS}
                      placeholder="Select commercial mode..."
                      error={visibleErrors.commercialMode}
                      isRequired
                      disabled={isSubmitting || Boolean(success)}
                      helper="Required for commercial batches only."
                      onBlur={() =>
                        setTouched((current) => ({
                          ...current,
                          commercialMode: true,
                        }))
                      }
                      onChange={handleFieldChange("commercialMode")}
                    />
                  ) : null}

                  {/* Header / Footer */}

                  <div className="grid gap-5 sm:grid-cols-2">
                    <SelectField
                      id="header-size"
                      label="Header size"
                      value={form.headerFooterSize}
                      options={HEADER_FOOTER_SIZE_OPTIONS}
                      placeholder="Select a size..."
                      error={visibleErrors.headerFooterSize}
                      isRequired
                      disabled={isSubmitting || Boolean(success)}
                      helper="Distance the header sits from the top edge, in inches."
                      onBlur={() =>
                        setTouched((current) => ({
                          ...current,
                          headerFooterSize: true,
                        }))
                      }
                      onChange={handleFieldChange("headerFooterSize")}
                    />

                    <SelectField
                      id="footer-size"
                      label="Footer size"
                      value={form.footerSize}
                      options={HEADER_FOOTER_SIZE_OPTIONS}
                      placeholder="Select a size..."
                      error={visibleErrors.footerSize}
                      isRequired
                      disabled={isSubmitting || Boolean(success)}
                      helper="Distance the footer sits from the bottom edge, in inches."
                      onBlur={() =>
                        setTouched((current) => ({
                          ...current,
                          footerSize: true,
                        }))
                      }
                      onChange={handleFieldChange("footerSize")}
                    />
                  </div>

                  {/* Footer template */}

                  <TextField
                    id="footer-template-no"
                    label="Footer template no."
                    value={form.footerTemplateNo}
                    error={visibleErrors.footerTemplateNo}
                    placeholder="F-QA-014"
                    isRequired
                    disabled={isSubmitting || Boolean(success)}
                    helper="The controlled footer template stamped on every page."
                    onBlur={() =>
                      setTouched((current) => ({
                        ...current,
                        footerTemplateNo: true,
                      }))
                    }
                    onChange={handleFieldChange("footerTemplateNo")}
                  />

                  {batchSizeWarning ? (
                    <StatusBanner
                      tone="warning"
                      title="Batch size check"
                      message={batchSizeWarning}
                    />
                  ) : null}
                </div>
              </div>

              {/* Bottom actions */}

              <div className="border-t border-border bg-surface px-5 py-4 sm:px-6">
                <div className="flex flex-col gap-3">
                  {isSubmitting ? (
                    <div
                      className="inline-flex min-h-10 items-center gap-3 text-small font-semibold text-text"
                      role="status"
                    >
                      <Loader2
                        className="size-4 animate-spin text-primary"
                        aria-hidden="true"
                      />
                      Saving BPR core inputs... Do not close this tab.
                    </div>
                  ) : (
                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                      <button
                        type="submit"
                        className="inline-flex min-h-10 items-center justify-center rounded-control bg-primary px-5 py-2.5 text-small font-semibold text-white transition hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-muted disabled:text-subdued"
                        disabled={!canSubmit}
                      >
                        {success ? "Saved" : "Generate page-1 preview"}
                      </button>

                      <Link
                        className="inline-flex min-h-10 items-center justify-center rounded-control border border-primary bg-white px-5 py-2.5 text-small font-semibold text-primary-dark transition hover:bg-accent-soft focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                        to={ROUTES.statusBoard}
                      >
                        Save & exit
                      </Link>
                    </div>
                  )}

                  {primaryReason && !success ? (
                    <p className="inline-flex items-start gap-2 text-small text-subdued">
                      <Info
                        className="mt-0.5 size-4 shrink-0 text-subdued"
                        aria-hidden="true"
                      />

                      {primaryReason}
                    </p>
                  ) : (
                    <p className="inline-flex items-start gap-2 text-small text-subdued">
                      <Info
                        className="mt-0.5 size-4 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      BPR core inputs are saved here; OCR is not run on this
                      screen.
                    </p>
                  )}
                </div>
              </div>
            </form>
          </section>
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   OPTIONAL DOCUMENTS
========================================================= */

function OptionalDocuments({
  form,
  visibleErrors,
  disabled,
  fileAttachState,
  setFile,
  getDisplayFile,
}: {
  form: CoreInputsFormState;
  visibleErrors: CoreInputsErrors;
  disabled: boolean;
  fileAttachState: Partial<Record<FileField, FileAttachState>>;
  setFile: (field: FileField, file: File | null) => void;
  getDisplayFile: (field: FileField) => File | null;
}) {
  return (
    <details className="rounded-control border border-dashed border-border bg-muted/60 p-4">
      <summary className="cursor-pointer text-small font-semibold text-text">
        Other supporting documents
      </summary>

      <div className="mt-4 grid gap-4">
        <FileUploadCard
          label="Other document 1"
          description="Optional PDF."
          file={getDisplayFile("otherDoc1")}
          error={visibleErrors.otherDoc1}
          disabled={disabled}
          status={getUploadStatus(
            fileAttachState.otherDoc1,
            getDisplayFile("otherDoc1"),
          )}
          progress={fileAttachState.otherDoc1?.progress}
          onChange={(file) => setFile("otherDoc1", file)}
        />

        <FileUploadCard
          label="Other document 2"
          description="Optional PDF."
          file={getDisplayFile("otherDoc2")}
          error={visibleErrors.otherDoc2}
          disabled={disabled}
          status={getUploadStatus(
            fileAttachState.otherDoc2,
            getDisplayFile("otherDoc2"),
          )}
          progress={fileAttachState.otherDoc2?.progress}
          onChange={(file) => setFile("otherDoc2", file)}
        />

        <FileUploadCard
          label="Other document 3"
          description="Optional PDF."
          file={getDisplayFile("otherDoc3")}
          error={visibleErrors.otherDoc3}
          disabled={disabled}
          status={getUploadStatus(
            fileAttachState.otherDoc3,
            getDisplayFile("otherDoc3"),
          )}
          progress={fileAttachState.otherDoc3?.progress}
          onChange={(file) => setFile("otherDoc3", file)}
        />
      </div>
    </details>
  );
}

/* =========================================================
   TEXT FIELD
========================================================= */

function TextField({
  id,
  label,
  value,
  error,
  helper,
  placeholder,
  isRequired,
  disabled,
  onBlur,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  error?: string;
  helper: string;
  placeholder?: string;
  isRequired?: boolean;
  disabled?: boolean;
  onBlur: () => void;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-text">
        {label}

        {isRequired ? <span className="ml-1 text-danger">*</span> : null}
      </label>

      <input
        id={id}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={`min-h-10 w-full rounded-control border bg-surface px-3 py-2 text-sm text-text shadow-sm transition placeholder:text-subdued/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-muted disabled:text-subdued ${
          error
            ? "border-danger focus:border-danger focus:ring-danger/20"
            : "border-border"
        }`}
        onBlur={onBlur}
        onChange={onChange}
      />

      {error ? (
        <p
          id={errorId}
          className="flex items-start gap-1.5 text-small text-danger-ink"
        >
          <AlertCircle
            className="mt-0.5 size-3.5 shrink-0 text-danger"
            aria-hidden="true"
          />

          {error}
        </p>
      ) : (
        <p className="text-micro leading-5 text-subdued">{helper}</p>
      )}
    </div>
  );
}

/* =========================================================
   SELECT FIELD
========================================================= */

function SelectField({
  id,
  label,
  value,
  options,
  placeholder,
  error,
  helper,
  isRequired,
  disabled,
  onBlur,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  options: Array<{
    value: string;
    label: string;
  }>;
  placeholder: string;
  error?: string;
  helper: string;
  isRequired?: boolean;
  disabled?: boolean;
  onBlur: () => void;
  onChange: (event: ChangeEvent<HTMLSelectElement>) => void;
}) {
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold text-text">
        {label}

        {isRequired ? <span className="ml-1 text-danger">*</span> : null}
      </label>

      <select
        id={id}
        value={value}
        disabled={disabled}
        aria-invalid={Boolean(error)}
        aria-describedby={errorId}
        className={`min-h-10 w-full rounded-control border bg-surface px-3 py-2 text-sm text-text shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:bg-muted disabled:text-subdued ${
          error
            ? "border-danger focus:border-danger focus:ring-danger/20"
            : "border-border"
        }`}
        onBlur={onBlur}
        onChange={onChange}
      >
        <option value="">{placeholder}</option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      {error ? (
        <p
          id={errorId}
          className="flex items-start gap-1.5 text-small text-danger-ink"
        >
          <AlertCircle
            className="mt-0.5 size-3.5 shrink-0 text-danger"
            aria-hidden="true"
          />

          {error}
        </p>
      ) : (
        <p className="text-micro leading-5 text-subdued">{helper}</p>
      )}
    </div>
  );
}

/* =========================================================
   DISABLED TEMPLATE
========================================================= */

function DisabledTemplateBlock() {
  return (
    <div
      className="rounded-control border border-dashed border-border bg-surface p-4 opacity-75 cursor-not-allowed"
      title="Planned for a future release."
    >
      <p className="inline-flex items-center gap-2 text-micro font-semibold uppercase tracking-overline text-subdued">
        <Lock className="size-3.5" aria-hidden="true" />
        Not in this release - richer header/footer template
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {["Document no.", "Effective date", "Page x of y", "Supersedes"].map(
          (label) => (
            <label
              key={label}
              className="space-y-1 text-micro font-medium text-subdued"
            >
              <span>{label}</span>

              <input
                disabled
                className="min-h-10 w-full rounded-control border border-border bg-muted px-3 py-2"
              />
            </label>
          ),
        )}
      </div>
    </div>
  );
}

/* =========================================================
   STATUS BANNER
========================================================= */

function StatusBanner({
  tone,
  title,
  message,
}: {
  tone: "success" | "error" | "warning";
  title: string;
  message: string;
}) {
  const Icon =
    tone === "success"
      ? CheckCircle2
      : tone === "error"
        ? AlertCircle
        : ShieldCheck;

  const classes = {
    success: "border-success/25 bg-approved-bg text-approved-fg",
    error: "border-danger/20 bg-danger-soft text-danger-ink",
    warning: "border-draft-fg/25 bg-draft-bg text-draft-fg",
  }[tone];

  return (
    <div
      className={`flex items-start gap-3 rounded-control border px-4 py-3 ${classes}`}
      role="status"
    >
      <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />

      <div className="text-small leading-5">
        <p className="font-semibold">{title}</p>

        <p className="mt-0.5">{message}</p>
      </div>
    </div>
  );
}

/* =========================================================
   DRAFT
========================================================= */

function toDraft(form: CoreInputsFormState): CoreInputsDraft {
  return {
    batchSize: form.batchSize,
    batchType: form.batchType,
    commercialMode: form.commercialMode,
    headerFooterSize: form.headerFooterSize,
    footerSize: form.footerSize,
    footerTemplateNo: form.footerTemplateNo,
  };
}

function mergeDraft(
  base: CoreInputsFormState,
  draft: CoreInputsDraft | null,
): CoreInputsFormState {
  if (!draft) {
    return base;
  }

  return {
    ...base,
    batchSize: draft.batchSize,
    batchType: draft.batchType as BatchType | "",
    commercialMode: draft.commercialMode as CommercialMode | "",
    headerFooterSize: draft.headerFooterSize,
    footerSize: draft.footerSize,
    footerTemplateNo: draft.footerTemplateNo,
  };
}

/* =========================================================
   VALIDATION
========================================================= */

function validateCoreInputs(
  form: CoreInputsFormState,
  documentId: string,
  fileIssues: Partial<Record<FileField, string>>,
  savedFiles: Map<string, string>,
): CoreInputsErrors {
  const errors: CoreInputsErrors = {};

  if (!documentId.trim()) {
    errors.form =
      "Document ID is missing. Return to New document and create or select a draft.";
  }

  validateFileField(
    errors,
    fileIssues,
    "mpc",
    form.mpc ?? (savedFiles.has("mpc") ? PLACEHOLDER_FILE : null),
    "Attach the MPC as a PDF.",
  );

  validateFileField(
    errors,
    fileIssues,
    "pp",
    form.pp ?? (savedFiles.has("pp") ? PLACEHOLDER_FILE : null),
    "BPR core inputs are saved here. OCR is not run on this screen.",
  );

  validateFileField(errors, fileIssues, "otherDoc1", form.otherDoc1);

  validateFileField(errors, fileIssues, "otherDoc2", form.otherDoc2);

  validateFileField(errors, fileIssues, "otherDoc3", form.otherDoc3);

  const batchSize = parseWholeNumber(form.batchSize);

  if (!form.batchSize.trim()) {
    errors.batchSize = "Enter the production batch size.";
  } else if (batchSize === null) {
    errors.batchSize = "Batch size must be a whole number - no decimals.";
  }

  if (!form.batchType) {
    errors.batchType = "Select a batch type.";
  }

  if (form.batchType === "commercial" && !form.commercialMode) {
    errors.commercialMode = "Select a commercial mode.";
  }

  if (!form.headerFooterSize) {
    errors.headerFooterSize = "Select the header size.";
  } else if (parseDecimal(form.headerFooterSize) === null) {
    errors.headerFooterSize = "Enter a valid header size.";
  }

  if (!form.footerSize) {
    errors.footerSize = "Select the footer size.";
  } else if (parseDecimal(form.footerSize) === null) {
    errors.footerSize = "Enter a valid footer size.";
  }

  if (!form.footerTemplateNo.trim()) {
    errors.footerTemplateNo =
      "Enter the footer template number (e.g. F-QA-014).";
  }

  return errors;
}

function validateFileField(
  errors: CoreInputsErrors,
  fileIssues: Partial<Record<FileField, string>>,
  field: FileField,
  file: File | null,
  requiredMessage?: string,
) {
  if (fileIssues[field]) {
    errors[field] = fileIssues[field];
    return;
  }

  if (!file && requiredMessage) {
    errors[field] = requiredMessage;
  }
}

/* =========================================================
   FILE VALIDATION
========================================================= */

function getFileRejectionMessage(field: FileField, file: File) {
  if (!isPdf(file)) {
    if (field === "mpc") {
      return `The MPC must be a PDF. You attached ${file.name}. Re-attach the scanned MPC as a PDF.`;
    }

    if (field === "pp") {
      return `The Product Permission must be a PDF. You attached ${file.name}. Re-attach it as a PDF.`;
    }

    return `${file.name} must be a PDF. Remove it or attach a PDF.`;
  }

  if (file.size > MAX_PDF_SIZE_BYTES) {
    return `${file.name} is ${formatRoundedMb(
      file.size,
    )} MB. The limit is 20 MB - compress or re-scan and try again.`;
  }

  return null;
}

function isPdf(file: File) {
  return (
    file.type === "application/pdf" ||
    file.name.toLowerCase().trim().endsWith(".pdf")
  );
}

/* =========================================================
   NUMBER HELPERS
========================================================= */

function parseDecimal(value: string): number | null {
  const normalized = value.replace(/,/g, "").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}

function parseWholeNumber(value: string) {
  const normalized = value.replace(/,/g, "").trim();

  if (!normalized) {
    return null;
  }

  const numberValue = Number(normalized);

  if (
    !Number.isFinite(numberValue) ||
    numberValue <= 0 ||
    !Number.isInteger(numberValue)
  ) {
    return null;
  }

  return numberValue;
}

function formatIndianNumber(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (!digits) {
    return "";
  }

  const lastThree = digits.slice(-3);
  const rest = digits.slice(0, -3);

  if (rest) {
    const groupedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");

    return `${groupedRest},${lastThree}`;
  }

  return lastThree;
}

function getBatchSizeWarning(value: string) {
  const parsed = parseWholeNumber(value);

  if (parsed !== null && parsed >= 5_000_000) {
    return `Batch size ${parsed.toLocaleString()} is unusually large - confirm this is correct.`;
  }

  return null;
}

/* =========================================================
   UPLOAD STATUS
========================================================= */

function getUploadStatus(
  state: FileAttachState | undefined,
  file: File | null,
): FileUploadStatus {
  if (state?.status) {
    return state.status;
  }

  return file ? "attached" : "idle";
}

/* =========================================================
   VISIBLE ERRORS
========================================================= */

function getVisibleErrors(
  errors: CoreInputsErrors,
  touched: Partial<Record<keyof CoreInputsFormState, boolean>>,
  submitAttempted: boolean,
) {
  if (submitAttempted) {
    return errors;
  }

  return Object.fromEntries(
    Object.entries(errors).filter(
      ([field]) =>
        field === "form" || touched[field as keyof CoreInputsFormState],
    ),
  ) as CoreInputsErrors;
}

/* =========================================================
   DISABLED REASON
========================================================= */

function getPrimaryDisabledReason(
  errors: CoreInputsErrors,
  hasUploadingFile: boolean,
) {
  if (hasUploadingFile) {
    return "Finish attaching the selected PDF before continuing.";
  }

  if (errors.form) {
    return errors.form;
  }

  if (errors.pp) {
    return "Attach the Product Permission to continue. A BPR cannot proceed without authorization on file.";
  }

  if (errors.mpc) {
    return "Attach the MPC as a PDF (max 20 MB) to continue.";
  }

  if (
    errors.batchSize ||
    errors.batchType ||
    errors.commercialMode ||
    errors.headerFooterSize ||
    errors.footerTemplateNo
  ) {
    return "Complete the required fields to continue.";
  }

  if (errors.otherDoc1 || errors.otherDoc2 || errors.otherDoc3) {
    return "Attach valid PDFs for optional supporting documents, or remove them.";
  }

  return null;
}

function formatRoundedMb(bytes: number) {
  return Math.round(bytes / (1024 * 1024)).toLocaleString();
}
