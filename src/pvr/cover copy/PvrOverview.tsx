
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppHeader } from "../../features/new-document/components/AppHeader";
import { AppSidebar } from "../../features/new-document/components/AppSidebar";
import { WizardHeader } from "../../features/new-document/components/WizardHeader";
import { useAuthStore } from "../../features/auth/state/auth.store";
import { useDocument } from "../../features/new-document/hooks/useDocument";
import { useDocumentSelectorData } from "../../features/new-document/hooks/useDocumentSelectorData";
import { useStepNavigation } from "../../features/new-document/hooks/useStepNavigation";
import { httpClient } from "../../shared/api/httpClient";

import IntroductionSection from "./IntroductionSection";

type SectionId = "basic-details" | "cover-page" | "introduction";

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

const emptyDetails: PvpBasicDetails = {
  objective: "",
  scope: "",
  rationale: "",
  responsibility: "",
  introduction: "",
  reason_for_validation: "",
  ccn_no: "",
  purpose: "",
};

const sections: { id: SectionId; label: string }[] = [
  { id: "basic-details", label: "Basic Details" },
  { id: "cover-page", label: "Cover Page" },
  { id: "introduction", label: "Introduction" },
];

export default function PvrOverview() {
  const { documentId = "" } = useParams();
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);
  const { context, isLoading: isLoadingContext } =
    useDocumentSelectorData(user);
  const { document: saved } = useDocument(documentId);
  const { goToStep } = useStepNavigation(documentId, "pvr");

  const sliderRef = useRef<HTMLDivElement>(null);
  const panelRefs = useRef<
    Record<SectionId, HTMLElement | null>
  >({
    "basic-details": null,
    "cover-page": null,
    introduction: null,
  });

  const [activeSection, setActiveSection] =
    useState<SectionId>("basic-details");

  const [sliderHeight, setSliderHeight] = useState<number>();
  const [details, setDetails] =
    useState<PvpBasicDetails>(emptyDetails);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadDetails() {
      try {
        setLoading(true);
        setError("");

        const response =
          await httpClient.get<PvpBasicDetails>(
            `/api/pvp/documents/${encodeURIComponent(
              documentId
            )}/basic-details`
          );

        if (!cancelled) {
          setDetails({
            ...emptyDetails,
            ...response.data,
          });
        }
      } catch (err) {
        console.error("Failed to load basic details:", err);

        if (!cancelled) {
          setError("Failed to load basic details.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDetails();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  function changeSection(section: SectionId) {
    const slider = sliderRef.current;
    const index = sections.findIndex((s) => s.id === section);

    setActiveSection(section);

    if (slider) {
      slider.scrollTo({
        left: index * slider.clientWidth,
        behavior: "smooth",
      });
    }
  }

  function handleScroll() {
    const slider = sliderRef.current;
    if (!slider || !slider.clientWidth) return;

    const index = Math.round(
      slider.scrollLeft / slider.clientWidth
    );

    const section = sections[index];
    if (section) setActiveSection(section.id);
  }

  useEffect(() => {
    const updateHeight = () => {
      const panel = panelRefs.current[activeSection];
      if (panel) setSliderHeight(panel.scrollHeight);
    };

    const frame = requestAnimationFrame(updateHeight);
    window.addEventListener("resize", updateHeight);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updateHeight);
    };
  }, [activeSection, loading, details]);

  async function saveBasicDetails() {
    try {
      setSaving(true);
      setError("");

      await httpClient.put(
        `/api/pvp/documents/${encodeURIComponent(
          documentId
        )}/basic-details`,
        details
      );

      return true;
    } catch (err) {
      console.error("Failed to save basic details:", err);
      setError("Failed to save basic details. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function continueToIntroduction() {
    const ok = await saveBasicDetails();
    if (ok) changeSection("introduction");
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background text-text">
      <AppHeader
        user={user}
        unit={context?.unit ?? null}
        isLoadingUnit={isLoadingContext}
      />

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
        <AppSidebar user={user} />

        <main className="min-h-0 min-w-0 overflow-y-auto">
          <WizardHeader
            activeStepId="introduction"
            completedStepIds={saved?.completed_steps ?? []}
            onStepClick={goToStep}
            title="PVR preview & introduction"
            description="Review the basic details, inspect the cover page, and complete the introduction."
            identifier={saved?.draft_id ?? documentId}
            status="DRAFT"
            dosageForm={saved?.dosage_form}
            docType="pvr"
            isPvr
          />

          <div className="px-5 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-[1100px] space-y-5">
              {error && (
                <div className="rounded-control border border-danger/30 bg-danger/5 px-4 py-3 text-sm text-danger">
                  {error}
                </div>
              )}

              {/* Section selector */}
              <div className="grid grid-cols-3 gap-3">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    type="button"
                    onClick={() => changeSection(section.id)}
                    className={`min-h-12 rounded-control border px-3 py-3 text-sm font-semibold transition ${
                      activeSection === section.id
                        ? "border-primary bg-muted text-primary shadow-sm"
                        : "border-border bg-surface text-subdued hover:border-primary/40 hover:text-text"
                    }`}
                  >
                    {section.label}
                  </button>
                ))}
              </div>

              {/* Three-panel horizontal slider */}
              <div
                ref={sliderRef}
                onScroll={handleScroll}
                className="flex w-full snap-x snap-mandatory items-start overflow-x-auto overflow-y-hidden"
                style={{
                  scrollbarWidth: "none",
                  msOverflowStyle: "none",
                  height: sliderHeight
                    ? `${sliderHeight}px`
                    : undefined,
                }}
              >
                {/* PANEL 1: BASIC DETAILS */}
                <section
                  ref={(node) => {
                    panelRefs.current["basic-details"] = node;
                  }}
                  className="w-full min-w-full shrink-0 snap-start space-y-5 pr-1"
                >
                  <div>
                    <h2 className="text-h3 font-semibold">
                      Basic details
                    </h2>
                    <p className="mt-1 text-sm text-subdued">
                      Review and edit the protocol details.
                    </p>
                  </div>

                  {loading ? (
                    <div className="flex min-h-[250px] items-center justify-center gap-2">
                      <Loader2 className="size-4 animate-spin" />
                      Loading basic details...
                    </div>
                  ) : (
                    <div className="space-y-5 rounded-control border border-border bg-surface p-5">
                      {(
                        [
                          ["objective", "Objective"],
                          ["scope", "Scope"],
                          ["rationale", "Rationale"],
                          ["responsibility", "Responsibility"],
                          ["introduction", "Introduction"],
                          [
                            "reason_for_validation",
                            "Reason for validation",
                          ],
                          ["purpose", "Purpose"],
                        ] as const
                      ).map(([key, label]) => (
                        <div key={key}>
                          <label
                            htmlFor={`detail-${key}`}
                            className="block text-sm font-semibold"
                          >
                            {label}
                          </label>
                          <textarea
                            id={`detail-${key}`}
                            rows={3}
                            value={details[key]}
                            onChange={(event) =>
                              setDetails((previous) => ({
                                ...previous,
                                [key]: event.target.value,
                              }))
                            }
                            className="mt-2 w-full resize-y rounded-control border border-border-strong bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      ))}

                      <div>
                        <label
                          htmlFor="detail-ccn"
                          className="block text-sm font-semibold"
                        >
                          CCN No. (if any)
                        </label>
                        <input
                          id="detail-ccn"
                          value={details.ccn_no}
                          onChange={(event) =>
                            setDetails((previous) => ({
                              ...previous,
                              ccn_no: event.target.value,
                            }))
                          }
                          className="mt-2 min-h-10 w-full rounded-control border border-border-strong bg-surface px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  )}
                </section>

                {/* PANEL 2: COVER PAGE */}
                <section
                  ref={(node) => {
                    panelRefs.current["cover-page"] = node;
                  }}
                  className="w-full min-w-full shrink-0 snap-start space-y-4 px-1"
                >
                  <div>
                    <h2 className="text-h3 font-semibold">
                      Cover page
                    </h2>
                    <p className="mt-1 text-sm text-subdued">
                      Read-only preview of the generated document.
                    </p>
                  </div>

                  <div className="overflow-auto rounded-control border border-border bg-muted p-5 sm:p-8">
                    <div className="mx-auto min-h-[500px] w-full max-w-[800px] border border-gray-200 bg-white p-8 text-gray-900 shadow-sm sm:p-12">
                      <div className="flex min-h-[400px] flex-col items-center justify-center text-center">
                        <h2 className="text-xl font-bold">
                          VALIDATION REPORT
                        </h2>
                        <p className="mt-3 text-sm">
                          {saved?.dosage_form ?? "Product"}
                        </p>
                        <p className="mt-8 text-sm text-gray-500">
                          Connect the backend-generated cover
                          preview here to display the final
                          printed version.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>

                {/* PANEL 3: INTRODUCTION */}
                <section
                  ref={(node) => {
                    panelRefs.current.introduction = node;
                  }}
                  className="w-full min-w-full shrink-0 snap-start space-y-5 pl-1"
                >
                  <div>
                    <h2 className="text-h3 font-semibold">
                      Introduction
                    </h2>
                    <p className="mt-1 text-sm text-subdued">
                      Review batch records, API and COA details,
                      and input materials.
                    </p>
                  </div>

                  <IntroductionSection
                    documentId={documentId}
                    onSaved={() => {
                      requestAnimationFrame(() => {
                        const panel =
                          panelRefs.current.introduction;
                        if (panel) {
                          setSliderHeight(panel.scrollHeight);
                        }
                      });
                    }}
                  />
                </section>
              </div>

              {/* Bottom navigation */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
                <button
                  type="button"
                  disabled={activeSection === "basic-details" || saving}
                  onClick={() => {
                    if (activeSection === "introduction") {
                      changeSection("cover-page");
                    } else {
                      changeSection("basic-details");
                    }
                  }}
                  className="inline-flex min-h-10 items-center gap-2 rounded-control border border-border-strong px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <ArrowLeft className="size-4" />
                  Previous
                </button>

                {activeSection === "basic-details" ? (
                  <button
                    type="button"
                    disabled={loading || saving}
                    onClick={continueToIntroduction}
                    className="inline-flex min-h-10 items-center gap-2 rounded-control bg-primary px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save & continue"}
                    <ArrowRight className="size-4" />
                  </button>
                ) : activeSection === "cover-page" ? (
                  <button
                    type="button"
                    onClick={() => changeSection("introduction")}
                    className="inline-flex min-h-10 items-center gap-2 rounded-control bg-primary px-5 py-2 text-sm font-semibold text-white"
                  >
                    Continue to Introduction
                    <ArrowRight className="size-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => goToStep("bom")}
                    className="inline-flex min-h-10 items-center gap-2 rounded-control bg-primary px-5 py-2 text-sm font-semibold text-white"
                  >
                    Continue to BOM
                    <ArrowRight className="size-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
