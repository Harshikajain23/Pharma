import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Info,
  Pencil,
} from "lucide-react";
import { useParams } from "react-router-dom";

import { useAuthStore } from "../../../features/auth/state/auth.store";
import { AppHeader } from "../../../features/new-document/components/AppHeader";
import { AppSidebar } from "../../../features/new-document/components/AppSidebar";
import { WizardHeader } from "../../../features/new-document/components/WizardHeader";
import { useDocumentSelectorData } from "../../../features/new-document/hooks/useDocumentSelectorData";
import { useStepNavigation } from "../../../features/new-document/hooks/useStepNavigation";

export function PreviewPage() {
  const { documentId = "preview-demo" } = useParams();

  const user = useAuthStore((state) => state.user);

  const { context, isLoading: isLoadingContext } =
    useDocumentSelectorData(user);

  const { goToStep } = useStepNavigation(documentId, "bpr");

  return (
    <div className="min-h-screen bg-background text-text">
      {/* =====================================================
          TOP NAVBAR
      ===================================================== */}

      <AppHeader
        user={user}
        unit={context?.unit ?? null}
        isLoadingUnit={isLoadingContext}
      />

      {/* =====================================================
          SIDEBAR + MAIN CONTENT
      ===================================================== */}

      <div className="lg:grid lg:h-[calc(100vh-var(--topbar-h))] lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)] lg:overflow-hidden">
        {/* ===================================================
            SIDEBAR
        =================================================== */}

        <AppSidebar user={user} />

        {/* ===================================================
            MAIN PREVIEW AREA
        =================================================== */}

        <main className="min-w-0 min-h-0 lg:h-full lg:overflow-y-auto">
          <div className="mx-auto space-y-5">

            {/* =================================================
                BPR WIZARD HEADER
            ================================================= */}

            <WizardHeader
              activeStepId="preview"
              completedStepIds={[]}
              onStepClick={goToStep}
              title="Page-1 preview"
              description="Check the BPR letterhead, fonts, header and footer before continuing to the Cover page."
              identifier={documentId}
              status="DRAFT"
              isBpr
            />

            {/* =================================================
                WARNING
            ================================================= */}

            <div className="mx-8 rounded-panel border border-draft-fg/30 bg-draft-bg p-4">
              <div className="flex items-start gap-2">
                <AlertCircle
                  className="mt-0.5 size-4 shrink-0 text-draft-fg"
                  aria-hidden="true"
                />

                <div>
                  <p className="text-small font-semibold text-draft-fg">
                    This will print with missing details
                  </p>

                  <ul className="mt-1.5 list-disc space-y-1 pl-4 text-small text-draft-fg">
                    <li>Manufacturer address is not configured</li>
                    <li>Template number is not configured</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* =================================================
                INFORMATION
            ================================================= */}

            <div className="mx-8 flex items-start gap-2 rounded-panel border border-border bg-muted p-4">
              <Info
                className="mt-0.5 size-4 shrink-0 text-primary"
                aria-hidden="true"
              />

              <p className="text-small text-subdued">
                This is a frontend-only BPR preview. The real PDF will be
                connected when the BPR backend is available.
              </p>
            </div>

            {/* =================================================
                DOCUMENT PREVIEW
            ================================================= */}

            <BprDocumentPreview documentId={documentId} />

            {/* =================================================
                FORMATTING SUMMARY
            ================================================= */}

            <FormattingSummary />

            {/* =================================================
                STICKY FOOTER
            ================================================= */}

            <div className="sticky bottom-0 flex flex-wrap items-center justify-between gap-3 border-t bg-surface p-3.5 shadow-auth">
              <div className="flex items-center gap-2 text-small text-subdued">
                <CheckCircle2
                  className="size-4 text-success"
                  aria-hidden="true"
                />

                Preview generated from the latest saved core inputs
              </div>

              <div className="flex flex-wrap items-center gap-2">

                {/* EDIT CORE INPUTS */}

                <button
                  type="button"
                  onClick={() => goToStep("inputs")}
                  className="inline-flex items-center gap-2 rounded-control border border-border px-4 py-2 text-small font-semibold transition hover:bg-primary/10"
                >
                  <Pencil className="size-4" aria-hidden="true" />

                  Edit Core inputs
                </button>

                {/* CONTINUE */}

                <button
                  type="button"
                  onClick={() => goToStep("cover")}
                  className="inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-small font-semibold text-white transition hover:bg-primary-dark"
                >
                  Proceed to Cover page

                  <ArrowRight
                    className="size-4"
                    aria-hidden="true"
                  />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* =========================================================
   BPR DOCUMENT PREVIEW
========================================================= */

function BprDocumentPreview({
  documentId,
}: {
  documentId: string;
}) {
  return (
    <div className="mx-8 rounded-panel border border-border bg-muted p-6">
      <div className="mx-auto min-h-[700px] max-w-[800px] rounded border border-border bg-white p-10 shadow-sm">

        {/* =================================================
            DOCUMENT HEADER
        ================================================= */}

        <div className="border-b-2 border-black pb-5 text-center">
          <div className="text-xl font-bold">
            BATCH PACKING RECORD
          </div>

          <div className="mt-2 text-small">
            PAGE 1 — PREVIEW
          </div>
        </div>

        {/* =================================================
            DOCUMENT IDENTIFICATION
        ================================================= */}

        <div className="mt-8 grid grid-cols-2 gap-6 text-small">

          <DocumentField
            label="Product"
          />

          <DocumentField
            label="BPR Number"
            value={documentId}
          />

          <DocumentField
            label="Batch Size"
          />

          <DocumentField
            label="Packaging Date"
          />

          <DocumentField
            label="Dosage Form"
          />

          <DocumentField
            label="MPC Number"
          />
        </div>

        {/* =================================================
            PACKING INFORMATION
        ================================================= */}

        <div className="mt-10">
          <div className="text-sm font-bold uppercase">
            Packing Information
          </div>

          <div className="mt-4 space-y-3">
            <div className="h-4 w-full rounded bg-gray-100" />

            <div className="h-4 w-11/12 rounded bg-gray-100" />

            <div className="h-4 w-10/12 rounded bg-gray-100" />
          </div>
        </div>

        {/* =================================================
            PACKING PROCESS TABLE
        ================================================= */}

        <div className="mt-12">
          <div className="mb-3 text-sm font-bold">
            Packaging Process
          </div>

          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <th className="border border-black p-2 text-left">
                  Process
                </th>

                <th className="border border-black p-2 text-left">
                  Description
                </th>

                <th className="border border-black p-2 text-left">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="border border-black p-3">
                  Dispensing
                </td>

                <td className="border border-black p-3">
                  Material verification
                </td>

                <td className="border border-black p-3">
                  —
                </td>
              </tr>

              <tr>
                <td className="border border-black p-3">
                  Primary Packing
                </td>

                <td className="border border-black p-3">
                  Primary packaging operation
                </td>

                <td className="border border-black p-3">
                  —
                </td>
              </tr>

              <tr>
                <td className="border border-black p-3">
                  Secondary Packing
                </td>

                <td className="border border-black p-3">
                  Secondary packaging operation
                </td>

                <td className="border border-black p-3">
                  —
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* =================================================
            SIGNATURE SECTION
        ================================================= */}

        <div className="mt-12">
          <div className="text-sm font-bold">
            Verification
          </div>

          <div className="mt-4 grid grid-cols-2 gap-6 text-xs">
            <div className="border border-black p-4">
              <div className="font-semibold">
                Prepared By
              </div>

              <div className="mt-8 border-b border-black" />
            </div>

            <div className="border border-black p-4">
              <div className="font-semibold">
                Checked By
              </div>

              <div className="mt-8 border-b border-black" />
            </div>
          </div>
        </div>

        {/* =================================================
            DOCUMENT FOOTER
        ================================================= */}

        <div className="mt-16 flex justify-between border-t pt-4 text-xs text-gray-500">
          <span>
            Template: BPR-001
          </span>

          <span>
            Page 1 of 1
          </span>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DOCUMENT FIELD
========================================================= */

function DocumentField({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div>
      <strong>{label}:</strong>

      <div className="mt-1 flex h-8 items-center rounded border px-2">
        {value || ""}
      </div>
    </div>
  );
}

/* =========================================================
   FORMATTING SUMMARY
========================================================= */

function FormattingSummary() {
  const items = [
    {
      label: "Font",
      value: "Arial · 10pt",
    },
    {
      label: "Line spacing",
      value: "1.15",
    },
    {
      label: "Header / footer",
      value: "1.0 inch",
    },
    {
      label: "Template No.",
      value: "BPR-001",
    },
  ];

  return (
    <dl className="mx-8 grid grid-cols-2 gap-4 rounded-panel border border-border bg-surface p-4 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label}>
          <dt className="text-micro uppercase tracking-wide text-subdued">
            {item.label}
          </dt>

          <dd className="mt-1 text-small font-semibold">
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}