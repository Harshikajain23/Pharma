
import {
  ArrowLeft,
  ArrowRight,
  Info,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppHeader } from "../../../features/new-document/components/AppHeader";
import { AppSidebar } from "../../../features/new-document/components/AppSidebar";
import { WizardHeader } from "../../../features/new-document/components/WizardHeader";

import { useAuthStore } from "../../../features/auth/state/auth.store";
import { useDocumentSelectorData } from "../../../features/new-document/hooks/useDocumentSelectorData";
import { useStepNavigation } from "../../../features/new-document/hooks/useStepNavigation";

import { httpClient } from "../../../shared/api/httpClient";

// =========================================================
// TYPES
// =========================================================

interface PvpBasicDetails {
  objective: string;
  scope: string;
  rationale: string;
  responsibility: string;
  introduction: string;
  reason_for_validation: string;
  ccn_no: string;
  purpose: string;
}

// =========================================================
// DEFAULT VALUES
// =========================================================

const emptyBasicDetails: PvpBasicDetails = {
  objective: "",
  scope: "",
  rationale: "",
  responsibility: "",
  introduction: "",
  reason_for_validation: "",
  ccn_no: "",
  purpose: "",
};

// =========================================================
// COMPONENT
// =========================================================

export const Preview = () => {
  const { documentId = "" } = useParams();
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);

  const { context, isLoading: isLoadingContext } =
    useDocumentSelectorData(user);

  // IMPORTANT: Explicitly select the Packing workflow.
  const { goToStep } = useStepNavigation(
    documentId,
    "pvp",
    "packing",
  );

  // =========================================================
  // ACTIVE SECTION
  // =========================================================

  const [activeSection, setActiveSection] = useState<
    "cover-page" | "basic-details"
  >("cover-page");

  // =========================================================
  // SLIDER REFS
  // =========================================================

  const sliderRef = useRef<HTMLDivElement | null>(null);
  const coverPageRef = useRef<HTMLElement | null>(null);
  const basicDetailsRef = useRef<HTMLElement | null>(null);

  const [sliderHeight, setSliderHeight] = useState<
    number | undefined
  >(undefined);

  // =========================================================
  // BASIC DETAILS
  // =========================================================

  const [objective, setObjective] = useState("");
  const [scope, setScope] = useState("");
  const [rationale, setRationale] = useState("");
  const [responsibility, setResponsibility] = useState("");
  const [introduction, setIntroduction] = useState("");
  const [reasonForValidation, setReasonForValidation] =
    useState("");
  const [ccnNo, setCcnNo] = useState("");
  const [purpose, setPurpose] = useState("");

  // =========================================================
  // LOADING / SAVING
  // =========================================================

  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // =========================================================
  // LOAD PVP BASIC DETAILS
  // =========================================================

  useEffect(() => {
    if (!documentId) {
      setError("Missing PVP document ID.");
      setIsLoadingDetails(false);
      return;
    }

    let cancelled = false;

    async function loadBasicDetails() {
      try {
        setIsLoadingDetails(true);
        setError(null);

        const response = await httpClient.get<PvpBasicDetails>(
          `/api/pvp/documents/${encodeURIComponent(
            documentId,
          )}/basic-details`,
        );

        if (cancelled) return;

        const data = response.data ?? emptyBasicDetails;

        setObjective(data.objective ?? "");
        setScope(data.scope ?? "");
        setRationale(data.rationale ?? "");
        setResponsibility(data.responsibility ?? "");
        setIntroduction(data.introduction ?? "");
        setReasonForValidation(
          data.reason_for_validation ?? "",
        );
        setCcnNo(data.ccn_no ?? "");
        setPurpose(data.purpose ?? "");
      } catch (err) {
        console.error(
          "Failed to load PVP Packing basic details:",
          err,
        );

        if (!cancelled) {
          setError(
            "Failed to load basic details. Check the PVP API and document ID, then try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoadingDetails(false);
        }
      }
    }

    void loadBasicDetails();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  // =========================================================
  // UPDATE SLIDER HEIGHT
  // =========================================================

  useEffect(() => {
    const updateSliderHeight = () => {
      const activePanel =
        activeSection === "cover-page"
          ? coverPageRef.current
          : basicDetailsRef.current;

      if (!activePanel) return;

      setSliderHeight(activePanel.scrollHeight);
    };

    const frame = requestAnimationFrame(updateSliderHeight);

    window.addEventListener("resize", updateSliderHeight);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateSliderHeight);
    };
  }, [activeSection, isLoadingDetails, error]);

  // =========================================================
  // HANDLE SECTION CHANGE
  // =========================================================

  function handleSectionChange(
    section: "cover-page" | "basic-details",
  ) {
    setActiveSection(section);

    const slider = sliderRef.current;
    if (!slider) return;

    slider.scrollTo({
      left: section === "cover-page" ? 0 : slider.clientWidth,
      behavior: "smooth",
    });
  }

  // =========================================================
  // UPDATE ACTIVE SECTION WHEN SCROLLING
  // =========================================================

  function handleHorizontalScroll() {
    const slider = sliderRef.current;
    if (!slider || slider.clientWidth === 0) return;

    const newSection =
      slider.scrollLeft >= slider.clientWidth / 2
        ? "basic-details"
        : "cover-page";

    setActiveSection((current) =>
      current === newSection ? current : newSection,
    );
  }

  // =========================================================
  // VALIDATION
  // =========================================================

  const canContinue =
    !isLoadingDetails &&
    !isSaving &&
    !error &&
    Boolean(reasonForValidation.trim()) &&
    Boolean(objective.trim()) &&
    Boolean(scope.trim()) &&
    Boolean(rationale.trim()) &&
    Boolean(responsibility.trim()) &&
    Boolean(introduction.trim()) &&
    Boolean(purpose.trim());

  // =========================================================
  // SAVE BASIC DETAILS
  // =========================================================

  async function saveBasicDetails(): Promise<boolean> {
    if (!documentId) {
      setError("Missing PVP document ID.");
      return false;
    }

    try {
      setIsSaving(true);
      setError(null);

      const payload: PvpBasicDetails = {
        objective: objective.trim(),
        scope: scope.trim(),
        rationale: rationale.trim(),
        responsibility: responsibility.trim(),
        introduction: introduction.trim(),
        reason_for_validation: reasonForValidation.trim(),
        ccn_no: ccnNo.trim(),
        purpose: purpose.trim(),
      };

      await httpClient.put(
        `/api/pvp/documents/${encodeURIComponent(
          documentId,
        )}/basic-details`,
        payload,
      );

      return true;
    } catch (err) {
      console.error(
        "Failed to save PVP Packing basic details:",
        err,
      );

      setError(
        "Failed to save basic details. Please check the backend and try again.",
      );

      return false;
    } finally {
      setIsSaving(false);
    }
  }

  // =========================================================
  // NAVIGATION
  // =========================================================

  function handleBack() {
    if (isSaving) return;

    navigate(
      `/pvp/${encodeURIComponent(documentId)}/selectpacking`,
    );
  }

  async function handleContinue() {
    if (!canContinue || !documentId) return;

    const savedSuccessfully = await saveBasicDetails();

    if (!savedSuccessfully) return;

    // Use the Packing route map rather than the manufacturing route.
    goToStep("process-flow-bompacking");
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
              activeStepId="preview-basic-details-packing"
              completedStepIds={[]}
              onStepClick={goToStep}
              title="Preview & basic details"
              description="The cover page is read-only. Basic details are loaded from the PVP backend and can be edited here."
              identifier={documentId || null}
              status="DRAFT"
              docType="pvp"
              isPvp
              validationType="packing"
            />

            {/* PAGE CONTENT */}

            <div className="bg-background px-5 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-[1100px] space-y-8">
                {/* ERROR */}

                {error && (
                  <div
                    role="alert"
                    className="rounded-control border border-danger/30 bg-danger/5 px-4 py-3 text-small text-danger"
                  >
                    {error}
                  </div>
                )}

                {/* SECTION SELECTOR */}

                <section className="space-y-5">
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleSectionChange("cover-page")
                      }
                      aria-pressed={activeSection === "cover-page"}
                      className={`min-h-12 rounded-control border px-5 py-3 text-small font-semibold transition-all duration-300 ${
                        activeSection === "cover-page"
                          ? "border-primary bg-muted text-primary shadow-sm"
                          : "border-border bg-surface text-subdued hover:border-primary/40 hover:bg-muted hover:text-text"
                      }`}
                    >
                      Cover Page
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleSectionChange("basic-details")
                      }
                      aria-pressed={
                        activeSection === "basic-details"
                      }
                      className={`min-h-12 rounded-control border px-5 py-3 text-small font-semibold transition-all duration-300 ${
                        activeSection === "basic-details"
                          ? "border-primary bg-muted text-primary shadow-sm"
                          : "border-border bg-surface text-subdued hover:border-primary/40 hover:bg-muted hover:text-text"
                      }`}
                    >
                      Basic Details
                    </button>
                  </div>

                  {/* HORIZONTAL SLIDER */}

                  <div
                    ref={sliderRef}
                    onScroll={handleHorizontalScroll}
                    className="flex w-full snap-x snap-mandatory items-start overflow-x-auto overflow-y-hidden transition-[height] duration-300"
                    style={{
                      scrollbarWidth: "none",
                      msOverflowStyle: "none",
                      height: sliderHeight
                        ? `${sliderHeight}px`
                        : undefined,
                    }}
                  >
                    {/* COVER PAGE */}

                    <section
                      ref={coverPageRef}
                      className="w-full min-w-full shrink-0 snap-start space-y-4 pr-1"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-h3 font-semibold">
                            Cover page
                          </h2>

                          <span className="rounded-sm border border-primary/20 bg-muted px-2 py-0.5 text-micro text-primary">
                            Read-only
                          </span>
                        </div>

                        <p className="mt-1 text-small text-subdued">
                          This preview will be generated by the
                          backend for the final printed document.
                        </p>
                      </div>

                      <div className="overflow-auto rounded-control border border-border bg-muted shadow-sm">
                        <div className="flex items-center justify-center p-6">
                          <div className="w-full max-w-[850px] rounded-control border border-border bg-white p-8 shadow-sm">
                            <div className="flex min-h-[300px] items-center justify-center text-center text-small text-subdued">
                              Cover preview is not connected yet.
                              Connect the backend cover-preview
                              endpoint to display the generated
                              document here.
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    {/* BASIC DETAILS */}

                    <section
                      ref={basicDetailsRef}
                      className="w-full min-w-full shrink-0 snap-start space-y-5 pl-1"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-h3 font-semibold">
                            Basic details
                          </h2>

                          <span className="rounded-sm border border-primary/20 bg-muted px-2 py-0.5 text-micro text-primary">
                            Editable
                          </span>
                        </div>

                        <p className="mt-1 text-small text-subdued">
                          Edit the details below. Changes are saved
                          to the backend when you continue.
                        </p>
                      </div>

                      {isLoadingDetails ? (
                        <div className="flex min-h-[300px] items-center justify-center rounded-control border border-border bg-muted">
                          <div className="flex items-center gap-2 text-small text-subdued">
                            <Loader2 className="size-4 animate-spin text-primary" />
                            Loading basic details...
                          </div>
                        </div>
                      ) : (
                        <>
                          <EditableTextarea
                            id="objective"
                            label="Objective"
                            value={objective}
                            onChange={setObjective}
                          />

                          <EditableTextarea
                            id="scope"
                            label="Scope"
                            value={scope}
                            onChange={setScope}
                          />

                          <EditableTextarea
                            id="rationale"
                            label="Rationale"
                            value={rationale}
                            onChange={setRationale}
                          />

                          <EditableTextarea
                            id="responsibility"
                            label="Responsibility"
                            value={responsibility}
                            onChange={setResponsibility}
                          />

                          <EditableTextarea
                            id="introduction"
                            label="Introduction"
                            value={introduction}
                            onChange={setIntroduction}
                          />

                          <EditableTextarea
                            id="reason-for-validation"
                            label="Reason for validation"
                            required
                            value={reasonForValidation}
                            onChange={setReasonForValidation}
                          />

                          <section>
                            <label
                              htmlFor="ccn-no"
                              className="block text-sm font-semibold text-text"
                            >
                              CCN No.{" "}
                              <span className="font-normal text-subdued">
                                (if any)
                              </span>
                            </label>

                            <input
                              id="ccn-no"
                              type="text"
                              value={ccnNo}
                              onChange={(event) =>
                                setCcnNo(event.target.value)
                              }
                              placeholder="Enter CCN number"
                              className={inputClass}
                            />

                            <p className={helperClass}>
                              Enter the change control note number
                              if one applies.
                            </p>
                          </section>

                          <EditableTextarea
                            id="purpose"
                            label="Purpose"
                            value={purpose}
                            onChange={setPurpose}
                          />
                        </>
                      )}
                    </section>
                  </div>
                </section>

                {/* INFO */}

                <div className="flex items-start gap-2 rounded-control border border-border bg-muted px-4 py-3 text-small text-subdued">
                  <Info
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />

                  <p>
                    Basic details are saved to the PVP backend
                    when you continue. The cover preview above is
                    a placeholder until the backend preview API
                    is integrated.
                  </p>
                </div>
              </div>
            </div>

            {/* BOTTOM ACTIONS */}

            <div className="border-t border-border bg-surface px-5 py-4 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-[1100px] flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={isSaving}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-5 py-2.5 text-small font-semibold text-text transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ArrowLeft
                    className="size-4"
                    aria-hidden="true"
                  />
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleContinue}
                  disabled={!canContinue}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-primary px-5 py-2.5 text-small font-semibold text-white transition-all duration-300 hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-border-strong disabled:text-white/70"
                >
                  {isSaving ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      Continue to process flow &amp; BOM
                      <ArrowRight
                        className="size-4"
                        aria-hidden="true"
                      />
                    </>
                  )}
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
// EDITABLE TEXTAREA
// =========================================================

interface EditableTextareaProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

function EditableTextarea({
  id,
  label,
  value,
  onChange,
  required = false,
}: EditableTextareaProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-text"
      >
        {label}

        {required && (
          <span className="ml-1 text-danger">*</span>
        )}
      </label>

      <textarea
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={4}
        required={required}
        placeholder={`Enter ${label.toLowerCase()}...`}
        className="mt-2 w-full resize-y rounded-control border border-border-strong bg-surface px-3 py-2.5 text-small text-text shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

// =========================================================
// STYLES
// =========================================================

const inputClass =
  "mt-2 min-h-10 w-full rounded-control border border-border-strong bg-surface px-3 py-2.5 text-small text-text shadow-sm transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";

const helperClass =
  "mt-1.5 text-micro leading-5 text-subdued";
