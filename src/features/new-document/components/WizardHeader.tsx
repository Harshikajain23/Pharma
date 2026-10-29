
import { DocumentStepper } from "./DocumentStepper";
import { SelectionStrip } from "./SelectionStrip";

import {
  DOCUMENT_SELECTOR_STEPS,
  BPR_STEPS,
  PVP_STEPS,
  PVR_STEPS,
  PVP_PACKING_STEPS,
} from "../model/documentSelector.config";

interface WizardHeaderProps {
  activeStepId: string;
  completedStepIds: string[];
  onStepClick: (stepId: string) => void;
  title: string;
  description?: string;
  identifier?: string | null;
  status?: string | null;
  dosageForm?: string | null;
  docType?: string | null;
  isBpr?: boolean;
  isPvp?: boolean;
  isPvr?: boolean;
  validationType?: "manufacturing" | "packing";
}

export function WizardHeader({
  activeStepId,
  completedStepIds,
  onStepClick,
  title,
  description,
  identifier,
  status,
  dosageForm,
  docType,
  isBpr = false,
  isPvp = false,
  isPvr = false,
  validationType = "manufacturing",
}: WizardHeaderProps) {
  // Select the correct steps for the current document workflow.
  const steps = isBpr
    ? BPR_STEPS
    : isPvr
      ? PVR_STEPS
      : isPvp
        ? validationType === "packing"
          ? PVP_PACKING_STEPS
          : PVP_STEPS
        : DOCUMENT_SELECTOR_STEPS;

  const total = steps.length;

  const stepNumber =
    steps.findIndex((step) => step.id === activeStepId) + 1;

  console.log("PVP WIZARD DEBUG:", {
  isPvp,
  validationType,
  activeStepId,
  selectedStepIds: steps.map((step) => step.id),
  stepNumber,
});

  return (
    <div className="rounded-panel">
      {/* Stepper */}
      <div className="bg-surface px-4 py-4 sm:px-6 lg:px-8">
        <DocumentStepper
          steps={steps}
          activeStepId={activeStepId}
          completedStepIds={completedStepIds}
          onStepClick={onStepClick}
        />
      </div>

      {/* Selected document information */}
      <SelectionStrip
        dosageForm={dosageForm}
        docType={docType}
      />

      {/* Page heading */}
      {(title?.trim() || description?.trim()) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-transparent p-5">
          <div className="min-w-0">
            {stepNumber > 0 && (
              <p className="text-micro font-semibold uppercase tracking-overline text-primary">
                Step {stepNumber} of {total}
              </p>
            )}

            {title?.trim() && (
              <h1 className="mt-1 text-h1 font-semibold">
                {title}
              </h1>
            )}

            {description?.trim() && (
              <p className="mt-1.5 w-3/4 text-small text-subdued text-justify">
                {description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
