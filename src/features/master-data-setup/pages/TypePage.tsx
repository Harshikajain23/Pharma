import { useState } from "react";
import { DocumentOptionCard } from "../../new-document/components/DocumentOptionCard";
import {
  DOCUMENT_TYPE_OPTIONS,
  DOSAGE_FORM_OPTIONS,
} from "../../new-document/model/documentSelector.config";
import { SetupShell } from "../components/SetupShell";
import { StepFooter } from "../components/StepFooter";
import { STEPS } from "../model/setup.model";

export function TypePage() {
  const [dosageFormId, setDosageFormId] = useState<string | null>(null);
  const [documentTypeId, setDocumentTypeId] = useState<string | null>(null);

  const dosage = DOSAGE_FORM_OPTIONS.find(
    (option) => option.id === dosageFormId,
  );

  const docType = DOCUMENT_TYPE_OPTIONS.find(
    (option) => option.id === documentTypeId,
  );

  const ready = Boolean(
    dosage?.available && docType?.available,
  );

  return (
    <SetupShell
      step="type"
      title="Type"
      description="Choose the dosage form and document type this master-data set configures."
    >
      <section className="space-y-6 rounded-panel border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="text-h3 font-semibold">
            Dosage form
          </h2>

          <div
            className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            role="radiogroup"
            aria-label="Dosage form"
          >
            {DOSAGE_FORM_OPTIONS.map((option) => (
              <DocumentOptionCard
                key={option.id}
                option={option}
                groupName="dosage-form"
                isSelected={dosageFormId === option.id}
                isDisabled={!option.available}
                onSelect={setDosageFormId}
              />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-h3 font-semibold">
            Document type
          </h2>

          <div
            className="mt-3 grid gap-3 md:grid-cols-2"
            role="radiogroup"
            aria-label="Document type"
          >
            {DOCUMENT_TYPE_OPTIONS.map((option) => (
              <DocumentOptionCard
                key={option.id}
                option={option}
                groupName="document-type"
                isSelected={documentTypeId === option.id}
                isDisabled={!option.available}
                onSelect={setDocumentTypeId}
              />
            ))}
          </div>
        </div>
      </section>

      <StepFooter
        note={
          ready
            ? `${dosage?.label} · ${docType?.label} selected.`
            : "Choose an available dosage form and document type to continue."
        }
        continueTo={STEPS[1].route}
        continueLabel="Continue"
        disabled={!ready}
        disabledReason="Choose an available dosage form and document type."
      />
    </SetupShell>
  );
}
