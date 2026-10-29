import {
  ArrowLeft,
  ArrowRight,
  FileText,
  Loader2,
  Search,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppHeader } from "../../../features/new-document/components/AppHeader";
import { AppSidebar } from "../../../features/new-document/components/AppSidebar";

import { useAuthStore } from "../../../features/auth/state/auth.store";
import { useDocumentSelectorData } from "../../../features/new-document/hooks/useDocumentSelectorData";

import { httpClient } from "../../../shared/api/httpClient";

interface DashboardItem {
  document_id: string;
  display_id: string;
  version: string;
  product_name: string | null;
  dosage_form: string | null;
  doc_type: string | null;
  batch_size: number | null;
  batch_type: string | null;
  status: string;
  resume_step: string;
  state: string;
  state_label: string;
  bucket: string | null;
  is_overdue: boolean;
  days_in_step: number | null;
  step_limit_days: number | null;
  pending_roles: string[];
  pending_with: string | null;
  prepared_by: string | null;
  is_mine: boolean;
  review_round: number;
  note: string | null;
  permissions: {
    can_edit: boolean;
    can_delete: boolean;
    can_cancel: boolean;
    can_review: boolean;
    can_approve: boolean;
    can_correct: boolean;
  };
  created_at: string | null;
  updated_at: string | null;
}

interface DashboardResponse {
  role: string;
  buckets: {
    key: string;
    label: string;
    sub: string;
    count: number;
  }[];
  overdue_count: number;
  retained_count: number;
  active_count: number;
  sla_days: Record<string, number>;
  can_create: boolean;
  items: DashboardItem[];
}

const DOSAGE_FORMS = [
  {
    id: "tablet",
    backendValue: "tablet",
    label: "Tablet",
  },
  {
    id: "capsule",
    backendValue: "capsule",
    label: "Capsule",
  },
  {
    id: "cream",
    backendValue: "cream",
    label: "Cream",
  },
  {
    id: "ointment",
    backendValue: "ointment",
    label: "Ointment",
  },
  {
    id: "powder",
    backendValue: "powder",
    label: "Powder",
  },
  {
    id: "oral-liquid",
    backendValue: "oral-liquid",
    label: "Oral Liquid",
  },
];

export const SelectBpr = () => {
  const { documentId = "" } = useParams();
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);

  const { context, isLoading: isLoadingContext } =
    useDocumentSelectorData(user);

  const [documents, setDocuments] = useState<DashboardItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter state
  const [dosageForm, setDosageForm] = useState("");
  const [bprName, setBprName] = useState("");
  const [bprId, setBprId] = useState("");

  // Selected BPR
  const [selectedBpr, setSelectedBpr] =
    useState<DashboardItem | null>(null);

  // Load BPR documents
  useEffect(() => {
    let cancelled = false;

    async function loadBprs() {
      try {
        setIsLoading(true);
        setError("");

        const response =
          await httpClient.get<DashboardResponse>(
            "/api/bpr/dashboard",
          );

        if (cancelled) return;

        const bprItems = (response.data.items ?? []).filter(
          (item) => item.doc_type?.toLowerCase() === "bpr",
        );

        setDocuments(bprItems);
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to load BPR dashboard:", err);

        setError(
          "Unable to load BPRs from the backend. Please try again.",
        );
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadBprs();

    return () => {
      cancelled = true;
    };
  }, []);

  // Filter BPR documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      // Dosage form is mandatory
      if (!dosageForm) return false;

      if (
        (document.dosage_form ?? "").toLowerCase() !==
        dosageForm.toLowerCase()
      ) {
        return false;
      }

      // Optional BPR name search
      if (bprName.trim()) {
        const searchName = bprName.trim().toLowerCase();
        const productName =
          document.product_name?.toLowerCase() ?? "";

        if (!productName.includes(searchName)) {
          return false;
        }
      }

      // Optional BPR ID search
      if (bprId.trim()) {
        const searchId = bprId.trim().toLowerCase();
        const displayId = document.display_id.toLowerCase();

        if (!displayId.includes(searchId)) {
          return false;
        }
      }

      return true;
    });
  }, [documents, dosageForm, bprName, bprId]);

  // Handlers
  function handleDosageChange(value: string) {
    setDosageForm(value);
    setBprName("");
    setBprId("");
    setSelectedBpr(null);
  }

  function handleSelect(document: DashboardItem) {
    setSelectedBpr(document);
  }

  function handleConfirmSelection() {
    if (!selectedBpr || !documentId) return;

    navigate(`/bpr/${encodeURIComponent(documentId)}/select`, {
      state: {
        selectedBpr,
        selectedDocument: selectedBpr,
        validationType: "packing",
      },
    });
  }

  function handleBack() {
    navigate(`/pvp/${encodeURIComponent(documentId)}/selectpacking`);
  }

  return (
    <div className="fixed flex min-h-screen w-full flex-col bg-background text-text">
      <AppHeader
        user={user}
        unit={context?.unit ?? null}
        isLoadingUnit={isLoadingContext}
      />

      <div className="lg:grid lg:h-[calc(100vh-var(--topbar-h))] lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)] lg:overflow-hidden">
        <AppSidebar user={user} />

        <main className="min-h-0 min-w-0 lg:h-full lg:overflow-y-auto">
          <section className="mx-auto bg-surface shadow-sm">
            {/* Header */}
            <div className="border-b border-border bg-surface px-5 py-5 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-[1100px]">
                <button
                  type="button"
                  onClick={handleBack}
                  className="mb-4 inline-flex items-center gap-2 text-small font-semibold text-subdued transition hover:text-text"
                >
                  <ArrowLeft
                    className="size-4"
                    aria-hidden="true"
                  />
                  Back to BPR selection
                </button>

                <h1 className="text-h2 font-semibold text-text">
                  Select BPR
                </h1>

                <p className="mt-1.5 max-w-2xl text-small text-subdued">
                  Select the Batch Packaging Record that you want to
                  use in this workflow.
                </p>
              </div>
            </div>

            {/* Content */}
            <div className="px-5 py-5 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-[1100px] space-y-6">
                {/* Filters */}
                <section className="rounded-card border border-border bg-surface p-5 shadow-sm">
                  <div className="mb-5">
                    <h2 className="text-h3 font-semibold text-text">
                      Find BPR
                    </h2>

                    <p className="mt-1 text-small text-subdued">
                      Select a dosage form. You can optionally
                      search by BPR Name or BPR ID.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-3">
                    {/* Dosage form */}
                    <div>
                      <label
                        htmlFor="dosage-form"
                        className="block text-sm font-semibold text-text"
                      >
                        Dosage Form
                        <span className="ml-1 text-danger">*</span>
                      </label>

                      <select
                        id="dosage-form"
                        value={dosageForm}
                        onChange={(event) =>
                          handleDosageChange(event.target.value)
                        }
                        className={selectClass}
                      >
                        <option value="">
                          Select dosage form...
                        </option>

                        {DOSAGE_FORMS.map((form) => (
                          <option
                            key={form.id}
                            value={form.backendValue}
                          >
                            {form.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* BPR name */}
                    <div>
                      <label
                        htmlFor="bpr-name"
                        className="block text-sm font-semibold text-text"
                      >
                        BPR Name
                        <span className="ml-1 font-normal text-subdued">
                          (Optional)
                        </span>
                      </label>

                      <input
                        id="bpr-name"
                        type="text"
                        value={bprName}
                        onChange={(event) =>
                          setBprName(event.target.value)
                        }
                        disabled={!dosageForm}
                        placeholder="Enter BPR name"
                        className={`${selectClass} disabled:cursor-not-allowed disabled:bg-muted disabled:text-subdued`}
                      />
                    </div>

                    {/* BPR ID */}
                    <div>
                      <label
                        htmlFor="bpr-id"
                        className="block text-sm font-semibold text-text"
                      >
                        BPR ID
                        <span className="ml-1 font-normal text-subdued">
                          (Optional)
                        </span>
                      </label>

                      <input
                        id="bpr-id"
                        type="text"
                        value={bprId}
                        onChange={(event) =>
                          setBprId(event.target.value)
                        }
                        disabled={!dosageForm}
                        placeholder="Enter BPR ID"
                        className={`${selectClass} disabled:cursor-not-allowed disabled:bg-muted disabled:text-subdued`}
                      />
                    </div>
                  </div>
                </section>

                {/* Available BPRs */}
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h2 className="text-h3 font-semibold text-text">
                        Available BPRs
                      </h2>

                      <p className="mt-1 text-small text-subdued">
                        Select one BPR from the results below.
                      </p>
                    </div>

                    {dosageForm && !isLoading && !error && (
                      <span className="rounded-pill bg-muted px-3 py-1 text-micro font-semibold text-subdued">
                        {filteredDocuments.length} result
                        {filteredDocuments.length === 1 ? "" : "s"}
                      </span>
                    )}
                  </div>

                  {/* No dosage form */}
                  {!dosageForm ? (
                    <div className="rounded-card border border-dashed border-border bg-muted px-5 py-12 text-center">
                      <Search
                        className="mx-auto size-7 text-subdued"
                        aria-hidden="true"
                      />

                      <p className="mt-3 text-small font-medium text-text">
                        Select a dosage form
                      </p>

                      <p className="mt-1 text-micro text-subdued">
                        Choose a dosage form above to preview
                        matching BPRs.
                      </p>
                    </div>
                  ) : isLoading ? (
                    /* Loading */
                    <div className="rounded-card border border-border bg-surface px-5 py-12 text-center">
                      <Loader2
                        className="mx-auto size-6 animate-spin text-primary"
                        aria-hidden="true"
                      />

                      <p className="mt-3 text-small font-medium text-text">
                        Loading BPRs...
                      </p>
                    </div>
                  ) : error ? (
                    /* Error */
                    <div className="rounded-card border border-danger/30 bg-danger/5 px-5 py-10 text-center">
                      <p className="text-small font-medium text-text">
                        {error}
                      </p>

                      <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="mt-4 inline-flex min-h-9 items-center justify-center rounded-control bg-primary px-4 py-2 text-small font-semibold text-white hover:bg-primary-dark"
                      >
                        Try again
                      </button>
                    </div>
                  ) : filteredDocuments.length === 0 ? (
                    /* No results */
                    <div className="rounded-card border border-dashed border-border bg-muted px-5 py-12 text-center">
                      <FileText
                        className="mx-auto size-7 text-subdued"
                        aria-hidden="true"
                      />

                      <p className="mt-3 text-small font-medium text-text">
                        No matching BPRs found
                      </p>

                      <p className="mt-1 text-micro text-subdued">
                        Try changing the dosage form, BPR Name,
                        or BPR ID.
                      </p>
                    </div>
                  ) : (
                    /* Results table */
                    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left">
                          <thead>
                            <tr className="border-b border-border bg-muted">
                              <th className="px-4 py-3 text-micro font-semibold uppercase tracking-overline text-subdued">
                                BPR ID
                              </th>

                              <th className="px-4 py-3 text-micro font-semibold uppercase tracking-overline text-subdued">
                                Product / BPR Name
                              </th>

                              <th className="px-4 py-3 text-micro font-semibold uppercase tracking-overline text-subdued">
                                Version
                              </th>

                              <th className="px-4 py-3 text-micro font-semibold uppercase tracking-overline text-subdued">
                                Dosage Form
                              </th>

                              <th className="px-4 py-3 text-micro font-semibold uppercase tracking-overline text-subdued">
                                Batch
                              </th>

                              <th className="px-4 py-3 text-micro font-semibold uppercase tracking-overline text-subdued">
                                State
                              </th>

                              <th className="px-4 py-3 text-right text-micro font-semibold uppercase tracking-overline text-subdued">
                                Action
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {filteredDocuments.map((document) => {
                              const isSelected =
                                selectedBpr?.document_id ===
                                document.document_id;

                              const dosageLabel =
                                DOSAGE_FORMS.find(
                                  (form) =>
                                    form.backendValue.toLowerCase() ===
                                    (document.dosage_form ?? "").toLowerCase(),
                                )?.label ??
                                document.dosage_form ??
                                "-";

                              return (
                                <tr
                                  key={document.document_id}
                                  className={`border-b border-border last:border-b-0 transition ${
                                    isSelected
                                      ? "bg-accent-soft/30"
                                      : "hover:bg-muted/50"
                                  }`}
                                >
                                  <td className="px-4 py-4">
                                    <span className="text-small font-semibold text-text">
                                      {document.display_id}
                                    </span>
                                  </td>

                                  <td className="max-w-[350px] px-4 py-4">
                                    <p className="line-clamp-2 text-small text-text">
                                      {document.product_name ?? "-"}
                                    </p>
                                  </td>

                                  <td className="px-4 py-4 text-small text-text">
                                    {document.version}
                                  </td>

                                  <td className="px-4 py-4 text-small text-text">
                                    {dosageLabel}
                                  </td>

                                  <td className="px-4 py-4">
                                    <div className="text-small text-text">
                                      {document.batch_size != null
                                        ? document.batch_size.toLocaleString()
                                        : "-"}
                                    </div>

                                    {document.batch_type && (
                                      <div className="mt-0.5 text-micro text-subdued">
                                        {document.batch_type}
                                      </div>
                                    )}
                                  </td>

                                  <td className="px-4 py-4">
                                    <span className="rounded-pill bg-muted px-2.5 py-1 text-micro font-semibold text-subdued">
                                      {document.state_label ||
                                        document.state ||
                                        "-"}
                                    </span>
                                  </td>

                                  <td className="px-4 py-4 text-right">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleSelect(document)
                                      }
                                      className={`inline-flex items-center gap-1.5 rounded-control px-3 py-2 text-micro font-semibold transition ${
                                        isSelected
                                          ? "bg-primary text-white"
                                          : "border border-border-strong bg-surface text-text hover:border-primary/60 hover:bg-accent-soft/20"
                                      }`}
                                    >
                                      {isSelected ? "Selected" : "Select"}

                                      <ArrowRight
                                        className="size-3.5"
                                        aria-hidden="true"
                                      />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </section>

                {/* Selected BPR */}
                {selectedBpr && (
                  <section className="rounded-card border border-primary/30 bg-accent-soft/20 p-4">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-micro font-semibold uppercase tracking-overline text-primary-dark">
                          Selected BPR
                        </p>

                        <p className="mt-1 text-small font-semibold text-text">
                          {selectedBpr.display_id}
                        </p>

                        <p className="mt-1 truncate text-micro text-subdued">
                          {selectedBpr.product_name ?? "Product"}{" "}
                          · Version {selectedBpr.version}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={handleConfirmSelection}
                        className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-control bg-primary px-5 py-2.5 text-small font-semibold text-white transition hover:bg-primary-dark"
                      >
                        Use this BPR

                        <ArrowRight
                          className="size-4"
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  </section>
                )}
              </div>
            </div>

            {/* Bottom actions */}
            <div className="border-t border-border bg-surface px-5 py-4 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-[1100px]">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-5 py-2.5 text-small font-semibold text-text transition hover:bg-muted"
                >
                  <ArrowLeft
                    className="size-4"
                    aria-hidden="true"
                  />
                  Back
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

const selectClass =
  "mt-2 min-h-10 w-full rounded-control border border-border-strong bg-surface px-3 py-2.5 text-small text-text shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20";
