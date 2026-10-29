
import { Fragment, useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Download,
  FileText,
  Info,
  Maximize2,
  Minimize2,
  Pencil,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useParams } from "react-router-dom";

import { AppHeader } from "../../features/new-document/components/AppHeader";
import { AppSidebar } from "../../features/new-document/components/AppSidebar";
import { WizardHeader } from "../../features/new-document/components/WizardHeader";

import { useDocument } from "../../features/new-document/hooks/useDocument";
import { useStepNavigation } from "../../features/new-document/hooks/useStepNavigation";

type BatchDetails = {
  arNo: string;
  issuedQty: string;
};

type BatchNumber = "10001" | "10002" | "10003";

type MaterialField =
  | "material"
  | "code"
  | "ingredients"
  | "spec"
  | "vendor";

type BomRow = {
  id: string;
  material: string;
  code: string;
  ingredients: string;
  spec: string;
  vendor: string;
  batches: Record<BatchNumber, BatchDetails>;
};

const BATCH_NUMBERS: BatchNumber[] = ["10001", "10002", "10003"];

const MATERIAL_FIELDS: {
  field: MaterialField;
  label: string;
}[] = [
  { field: "material", label: "Material" },
  { field: "code", label: "Code" },
  { field: "ingredients", label: "Ingredients" },
  { field: "spec", label: "Spec." },
  { field: "vendor", label: "Name of Vendor" },
];

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL ?? ""
).replace(/\/$/, "");

// Adjust these routes to match your backend.
const getBomDataUrl = (documentId: string) =>
  `${API_BASE_URL}/api/pvr/documents/${encodeURIComponent(documentId)}/bom/data`;

const getBomDocxUrl = (documentId: string) =>
  `${API_BASE_URL}/api/pvr/documents/${encodeURIComponent(documentId)}/bom/docx`;

const getBomPdfUrl = (documentId: string) =>
  `${API_BASE_URL}/api/pvr/documents/${encodeURIComponent(documentId)}/bom/pdf`;

function createEmptyRow(): BomRow {
  return {
    id: crypto.randomUUID(),
    material: "",
    code: "",
    ingredients: "",
    spec: "",
    vendor: "",
    batches: {
      "10001": { arNo: "", issuedQty: "" },
      "10002": { arNo: "", issuedQty: "" },
      "10003": { arNo: "", issuedQty: "" },
    },
  };
}

function normalizeBomRow(
  row: Partial<BomRow>,
  index: number
): BomRow {
  const batches = row.batches;

  return {
    id: row.id || `bom-row-${index + 1}`,
    material: row.material ?? "",
    code: row.code ?? "",
    ingredients: row.ingredients ?? "",
    spec: row.spec ?? "",
    vendor: row.vendor ?? "",
    batches: {
      "10001": {
        arNo: batches?.["10001"]?.arNo ?? "",
        issuedQty: batches?.["10001"]?.issuedQty ?? "",
      },
      "10002": {
        arNo: batches?.["10002"]?.arNo ?? "",
        issuedQty: batches?.["10002"]?.issuedQty ?? "",
      },
      "10003": {
        arNo: batches?.["10003"]?.arNo ?? "",
        issuedQty: batches?.["10003"]?.issuedQty ?? "",
      },
    },
  };
}

function cloneRows(rows: BomRow[]): BomRow[] {
  return structuredClone(rows);
}

function BomTable({
  documentId,
  onContinue,
}: {
  documentId: string;
  onContinue: () => void;
}) {
  const [rows, setRows] = useState<BomRow[]>([]);
  const [originalRows, setOriginalRows] = useState<BomRow[]>([]);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");
  const [zoom, setZoom] = useState(100);
  const [fullScreen, setFullScreen] = useState(false);

  const searchTerm = searchQuery.trim().toLowerCase();

  const isDirty =
    JSON.stringify(rows) !== JSON.stringify(originalRows);

  // Fetch BOM data.
  useEffect(() => {
    let cancelled = false;

    async function fetchBom() {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const response = await axios.get(getBomDataUrl(documentId));

        if (cancelled) return;

        const data = response.data;

        const fetchedRows: Partial<BomRow>[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.rows)
            ? data.rows
            : [];

        const normalizedRows = fetchedRows.map(normalizeBomRow);

        setRows(normalizedRows);
        setOriginalRows(cloneRows(normalizedRows));
      } catch (err) {
        if (cancelled) return;

        console.error("Failed to fetch BOM data:", err);

        setError(
          axios.isAxiosError(err) && err.response?.status
            ? `Unable to fetch BOM data (HTTP ${err.response.status}). Check the JSON API endpoint.`
            : "Unable to fetch BOM data. Check that the backend is running and the API URL is correct."
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    if (!documentId) {
      setError("Document ID is missing.");
      setLoading(false);
    } else {
      void fetchBom();
    }

    return () => {
      cancelled = true;
    };
  }, [documentId, retryKey]);

  function startEditing() {
    setOriginalRows(cloneRows(rows));
    setEditing(true);
    setError("");
    setMessage("");
  }

  function cancelEditing() {
    setRows(cloneRows(originalRows));
    setEditing(false);
    setError("");
    setMessage("");
  }

  function resetChanges() {
    setRows(cloneRows(originalRows));
    setMessage("Changes reset to the last loaded or saved version.");
    setError("");
  }

  function updateField(
    rowIndex: number,
    field: MaterialField,
    value: string
  ) {
    setRows((previous) =>
      previous.map((row, index) =>
        index === rowIndex ? { ...row, [field]: value } : row
      )
    );
  }

  function updateBatch(
    rowIndex: number,
    batch: BatchNumber,
    field: keyof BatchDetails,
    value: string
  ) {
    setRows((previous) =>
      previous.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              batches: {
                ...row.batches,
                [batch]: {
                  ...row.batches[batch],
                  [field]: value,
                },
              },
            }
          : row
      )
    );
  }

  function addRow() {
    setRows((previous) => [...previous, createEmptyRow()]);
    setMessage("");
  }

  function removeRow(rowIndex: number) {
    setRows((previous) =>
      previous.filter((_, index) => index !== rowIndex)
    );
    setMessage("");
  }

  function isCellChanged(
    row: BomRow,
    field: MaterialField
  ): boolean {
    const original = originalRows.find(
      (item) => item.id === row.id
    );

    // Newly added rows are considered changed.
    if (!original) return true;

    return row[field] !== original[field];
  }

  function isBatchCellChanged(
    row: BomRow,
    batch: BatchNumber,
    field: keyof BatchDetails
  ): boolean {
    const original = originalRows.find(
      (item) => item.id === row.id
    );

    if (!original) return true;

    return (
      row.batches[batch][field] !==
      original.batches[batch][field]
    );
  }

  function highlightText(value: string) {
    if (!searchTerm || !value) {
      return value || "\u00A0";
    }

    const escaped = searchTerm.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    const parts = value.split(
      new RegExp(`(${escaped})`, "gi")
    );

    return parts.map((part, index) =>
      part.toLowerCase() === searchTerm ? (
        <mark
          key={index}
          className="rounded bg-yellow-200 px-0.5 text-gray-900"
        >
          {part}
        </mark>
      ) : (
        <Fragment key={index}>{part}</Fragment>
      )
    );
  }

  function countMatches(value: string): number {
    if (!searchTerm || !value) return 0;

    const escaped = searchTerm.replace(
      /[.*+?^${}()|[\]\\]/g,
      "\\$&"
    );

    return (
      value.match(new RegExp(escaped, "gi"))?.length ?? 0
    );
  }

  const searchMatches = rows.reduce((total, row) => {
    const values = [
      row.material,
      row.code,
      row.ingredients,
      row.spec,
      row.vendor,
      ...BATCH_NUMBERS.flatMap((batch) => [
        row.batches[batch].arNo,
        row.batches[batch].issuedQty,
      ]),
    ];

    return (
      total +
      values.reduce(
        (count, value) => count + countMatches(value),
        0
      )
    );
  }, 0);

  async function saveChanges() {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      await axios.put(getBomDataUrl(documentId), { rows });

      setOriginalRows(cloneRows(rows));
      setEditing(false);
      setMessage("BOM changes saved successfully.");
    } catch (err) {
      console.error("Failed to save BOM:", err);

      setError(
        axios.isAxiosError(err) && err.response?.status
          ? `Unable to save BOM changes (HTTP ${err.response.status}).`
          : "Unable to save BOM changes. Check the backend connection."
      );
    } finally {
      setSaving(false);
    }
  }

  async function downloadFile(
    fileType: "docx" | "pdf"
  ) {
    const isPdf = fileType === "pdf";

    try {
      if (isPdf) {
        setDownloadingPdf(true);
      } else {
        setDownloading(true);
      }

      setError("");
      setMessage("");

      const response = await axios.get(
        isPdf
          ? getBomPdfUrl(documentId)
          : getBomDocxUrl(documentId),
        {
          responseType: "blob",
          headers: {
            Accept: isPdf
              ? "application/pdf"
              : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
          },
        }
      );

      const blob = new Blob([response.data], {
        type: isPdf
          ? "application/pdf"
          : "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });

      if (!blob.size) {
        throw new Error("The backend returned an empty file.");
      }

      const disposition = response.headers["content-disposition"];
      const match = disposition?.match(
        /filename="?([^";]+)"?/i
      );

      const filename =
        match?.[1] || (isPdf ? "BOM.pdf" : "BOM.docx");

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (err) {
      console.error(`Failed to download BOM ${fileType}:`, err);

      setError(
        isPdf
          ? "Unable to download the PDF. Confirm that the backend PDF endpoint exists."
          : "Unable to download the DOCX. Check the backend DOCX endpoint."
      );
    } finally {
      setDownloading(false);
      setDownloadingPdf(false);
    }
  }

  const inputClass =
    "w-full min-w-24 rounded border border-gray-300 bg-white px-2 py-2 text-sm text-gray-900 outline-none focus:border-teal-600 focus:ring-1 focus:ring-teal-600 disabled:border-transparent disabled:bg-transparent disabled:opacity-100";

  if (loading) {
    return (
      <section className="flex min-h-[420px] flex-col items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white text-gray-500">
        <RefreshCw
          size={28}
          className="animate-spin text-teal-700"
        />
        <p className="text-sm">Loading Bill of Materials...</p>
      </section>
    );
  }

  return (
    <section
      className={
        fullScreen
          ? "fixed inset-0 z-50 flex flex-col overflow-auto bg-white"
          : "overflow-hidden rounded-xl border border-gray-200 bg-white"
      }
    >
      {/* Document header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-teal-50 p-2">
            <FileText size={20} className="text-teal-700" />
          </div>

          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Bill of Materials
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {editing
                ? "Edit material and batch details below."
                : "Review, search, and download the BOM."}
            </p>
          </div>
        </div>

        <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
          {editing ? "Editing" : "Draft"}
        </span>
      </div>

      {/* Viewer toolbar */}
      {!editing && (
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-200 bg-gray-50 px-5 py-3">
          <div className="flex min-w-48 flex-1 items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2">
            <Search
              size={16}
              className="shrink-0 text-gray-500"
            />

            <input
              type="search"
              value={searchQuery}
              onChange={(event) =>
                setSearchQuery(event.target.value)
              }
              placeholder="Search document"
              aria-label="Search BOM document"
              className="w-full min-w-0 bg-transparent text-sm outline-none"
            />

            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search"
                className="text-gray-500 hover:text-gray-900"
              >
                <X size={15} />
              </button>
            )}

            <span className="whitespace-nowrap text-xs text-gray-500">
              {searchTerm
                ? `${searchMatches} match${searchMatches === 1 ? "" : "es"}`
                : ""}
            </span>
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-gray-300 bg-white p-1">
            <button
              type="button"
              title="Zoom out"
              aria-label="Zoom out"
              onClick={() =>
                setZoom((value) => Math.max(50, value - 10))
              }
              disabled={zoom <= 50}
              className="rounded p-2 hover:bg-gray-100 disabled:opacity-40"
            >
              <ZoomOut size={16} />
            </button>

            <span className="min-w-12 text-center text-sm tabular-nums">
              {zoom}%
            </span>

            <button
              type="button"
              title="Zoom in"
              aria-label="Zoom in"
              onClick={() =>
                setZoom((value) => Math.min(150, value + 10))
              }
              disabled={zoom >= 150}
              className="rounded p-2 hover:bg-gray-100 disabled:opacity-40"
            >
              <ZoomIn size={16} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setZoom(100)}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-100"
          >
            Fit width
          </button>

          <button
            type="button"
            onClick={() => setFullScreen((value) => !value)}
            aria-label={
              fullScreen ? "Exit full screen" : "Full screen"
            }
            title={
              fullScreen ? "Exit full screen" : "Full screen"
            }
            className="rounded-lg border border-gray-300 bg-white p-2 hover:bg-gray-100"
          >
            {fullScreen ? (
              <Minimize2 size={16} />
            ) : (
              <Maximize2 size={16} />
            )}
          </button>
        </div>
      )}

      {/* Status messages */}
      {error && (
        <div
          role="alert"
          className="mx-5 mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          <span>{error}</span>

          {!editing && (
            <button
              type="button"
              onClick={() => setRetryKey((key) => key + 1)}
              className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 font-medium hover:bg-red-100"
            >
              <RefreshCw size={14} />
              Retry
            </button>
          )}
        </div>
      )}

      {message && (
        <p
          role="status"
          className="mx-5 mt-4 rounded-lg bg-teal-50 p-3 text-sm text-teal-800"
        >
          {message}
        </p>
      )}

      {/* BOM document viewer */}
      <div className="min-w-0 flex-1 overflow-auto bg-gray-50 p-4">
        <div
          className="mx-auto w-full overflow-x-auto rounded-lg bg-white shadow-sm"
          style={{ zoom: `${zoom}%` }}
        >
          <table className="w-full min-w-[1450px] border-collapse text-left text-sm">
            <thead>
              <tr className="bg-gray-100 text-gray-800">
                <th
                  rowSpan={3}
                  className="border border-gray-300 px-3 py-3 text-center"
                >
                  Sr. No.
                </th>

                <th
                  rowSpan={3}
                  className="border border-gray-300 px-3 py-3"
                >
                  Material
                </th>

                <th
                  rowSpan={3}
                  className="border border-gray-300 px-3 py-3"
                >
                  Code
                </th>

                <th
                  rowSpan={3}
                  className="border border-gray-300 px-3 py-3"
                >
                  Ingredients
                </th>

                <th
                  rowSpan={3}
                  className="border border-gray-300 px-3 py-3"
                >
                  Spec.
                </th>

                <th
                  rowSpan={3}
                  className="border border-gray-300 px-3 py-3"
                >
                  Name of Vendor
                </th>

                <th
                  colSpan={6}
                  className="border border-gray-300 px-3 py-2 text-center"
                >
                  Batch No.
                </th>

                {editing && (
                  <th
                    rowSpan={3}
                    className="border border-gray-300 px-3 py-3 text-center"
                  >
                    Action
                  </th>
                )}
              </tr>

              <tr className="bg-gray-100 text-gray-800">
                {BATCH_NUMBERS.map((batch) => (
                  <th
                    key={batch}
                    colSpan={2}
                    className="border border-gray-300 px-3 py-3 text-center"
                  >
                    {batch}
                  </th>
                ))}
              </tr>

              <tr className="bg-gray-50 text-gray-700">
                {BATCH_NUMBERS.map((batch) => (
                  <Fragment key={batch}>
                    <th className="border border-gray-300 px-3 py-3">
                      AR No.
                    </th>
                    <th className="border border-gray-300 px-3 py-3">
                      Issued Qty.
                    </th>
                  </Fragment>
                ))}
              </tr>
            </thead>

            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="border border-gray-300 px-3 py-2 text-center text-gray-600">
                    {index + 1}
                  </td>

                  {MATERIAL_FIELDS.map(({ field, label }) => (
                    <td
                      key={field}
                      className={`border border-gray-300 p-2 ${
                        editing && isCellChanged(row, field)
                          ? "bg-amber-50"
                          : ""
                      }`}
                    >
                      {editing ? (
                        <input
                          type="text"
                          aria-label={`${label}, row ${index + 1}`}
                          className={inputClass}
                          value={row[field]}
                          disabled={saving}
                          onChange={(event) =>
                            updateField(
                              index,
                              field,
                              event.target.value
                            )
                          }
                          title={
                            isCellChanged(row, field)
                              ? `Changed from original: ${
                                  originalRows.find(
                                    (item) => item.id === row.id
                                  )?.[field] ?? "blank"
                                }`
                              : undefined
                          }
                        />
                      ) : (
                        <span
                          className={`block min-h-8 min-w-24 whitespace-pre-wrap px-2 py-2 text-sm ${
                            searchTerm &&
                            countMatches(row[field]) > 0
                              ? "bg-yellow-50"
                              : ""
                          }`}
                        >
                          {highlightText(row[field])}
                        </span>
                      )}
                    </td>
                  ))}

                  {BATCH_NUMBERS.map((batch) => (
                    <Fragment key={batch}>
                      <td
                        className={`border border-gray-300 p-2 ${
                          editing &&
                          isBatchCellChanged(row, batch, "arNo")
                            ? "bg-amber-50"
                            : ""
                        }`}
                      >
                        {editing ? (
                          <input
                            type="text"
                            aria-label={`${batch} AR No., row ${index + 1}`}
                            className={inputClass}
                            value={row.batches[batch].arNo}
                            disabled={saving}
                            onChange={(event) =>
                              updateBatch(
                                index,
                                batch,
                                "arNo",
                                event.target.value
                              )
                            }
                            title={
                              isBatchCellChanged(
                                row,
                                batch,
                                "arNo"
                              )
                                ? `Changed from original: ${
                                    originalRows.find(
                                      (item) => item.id === row.id
                                    )?.batches[batch].arNo ?? "blank"
                                  }`
                                : undefined
                            }
                          />
                        ) : (
                          <span className="block min-h-8 min-w-24 px-2 py-2 text-sm">
                            {highlightText(row.batches[batch].arNo)}
                          </span>
                        )}
                      </td>

                      <td
                        className={`border border-gray-300 p-2 ${
                          editing &&
                          isBatchCellChanged(
                            row,
                            batch,
                            "issuedQty"
                          )
                            ? "bg-amber-50"
                            : ""
                        }`}
                      >
                        {editing ? (
                          <input
                            type="text"
                            aria-label={`${batch} Issued Qty., row ${index + 1}`}
                            className={inputClass}
                            value={row.batches[batch].issuedQty}
                            disabled={saving}
                            onChange={(event) =>
                              updateBatch(
                                index,
                                batch,
                                "issuedQty",
                                event.target.value
                              )
                            }
                            title={
                              isBatchCellChanged(
                                row,
                                batch,
                                "issuedQty"
                              )
                                ? `Changed from original: ${
                                    originalRows.find(
                                      (item) => item.id === row.id
                                    )?.batches[batch].issuedQty ??
                                    "blank"
                                  }`
                                : undefined
                            }
                          />
                        ) : (
                          <span className="block min-h-8 min-w-24 px-2 py-2 text-sm">
                            {highlightText(
                              row.batches[batch].issuedQty
                            )}
                          </span>
                        )}
                      </td>
                    </Fragment>
                  ))}

                  {editing && (
                    <td className="border border-gray-300 p-2 text-center">
                      <button
                        type="button"
                        aria-label={`Delete row ${index + 1}`}
                        title="Delete row"
                        disabled={saving}
                        onClick={() => removeRow(index)}
                        className="rounded-md p-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}

              {rows.length === 0 && (
                <tr>
                  <td
                    colSpan={editing ? 13 : 12}
                    className="border border-gray-300 px-4 py-12 text-center text-gray-500"
                  >
                    {error
                      ? "BOM data could not be loaded."
                      : "No BOM rows found. Click Edit BOM to add material rows."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Editing controls */}
      {editing && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-200 px-5 py-4">
          <button
            type="button"
            onClick={addRow}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-400 px-4 py-2 text-sm font-medium text-gray-700 transition hover:border-teal-600 hover:bg-teal-50 hover:text-teal-700 disabled:opacity-50"
          >
            <Plus size={16} />
            Add Material Row
          </button>

          <button
            type="button"
            onClick={resetChanges}
            disabled={saving || !isDirty}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <RefreshCw size={15} />
            Reset changes
          </button>

          <span className="text-xs text-gray-500">
            <Info size={13} className="mr-1 inline" />
            Amber cells have been changed.
          </span>
        </div>
      )}

      {/* Document status */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 bg-gray-50 px-5 py-3">
        <div className="flex items-center gap-2 text-sm">
          {editing ? (
            <>
              <Pencil
                size={16}
                className={
                  isDirty ? "text-amber-600" : "text-gray-500"
                }
              />
              <span
                className={
                  isDirty ? "text-amber-700" : "text-gray-600"
                }
              >
                {isDirty ? "Unsaved changes" : "No changes yet"}
              </span>
            </>
          ) : (
            <>
              <Check size={16} className="text-teal-700" />
              <span className="text-gray-600">
                Latest loaded version
              </span>
            </>
          )}

          <span className="text-gray-400">·</span>

          <span className="text-gray-500">
            {rows.length} material rows
          </span>
        </div>

        {editing && (
          <button
            type="button"
            onClick={cancelEditing}
            disabled={saving}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-white disabled:opacity-50"
          >
            Discard changes
          </button>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-5 py-4">
        <button
          type="button"
          onClick={() => {
            if (editing) {
              cancelEditing();
            } else if (fullScreen) {
              setFullScreen(false);
            } else {
              window.history.back();
            }
          }}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          <ArrowLeft size={16} />
          {editing ? "Cancel" : fullScreen ? "Exit viewer" : "Back"}
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void downloadFile("pdf")}
            disabled={downloadingPdf || downloading || saving}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            {downloadingPdf ? "Downloading PDF..." : "Download PDF"}
          </button>

          <button
            type="button"
            onClick={() => void downloadFile("docx")}
            disabled={downloading || downloadingPdf || saving}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Download size={16} />
            {downloading ? "Downloading..." : "Download DOCX"}
          </button>

          {!editing && (
            <button
              type="button"
              onClick={startEditing}
              disabled={!!error}
              className="inline-flex items-center gap-2 rounded-lg border border-teal-700 px-4 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Pencil size={16} />
              Edit BOM
            </button>
          )}

          {editing && (
            <button
              type="button"
              onClick={() => void saveChanges()}
              disabled={saving || !isDirty}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          )}

          <button
            type="button"
            onClick={onContinue}
            disabled={editing || !!error || saving}
            title={
              editing
                ? "Save or cancel editing before continuing"
                : "Continue to CPP & CQA"
            }
            className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Continue to CPP &amp; CQA
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
}

export default function Bom() {
  const { documentId = "" } = useParams<{
    documentId: string;
  }>();

  const { document: saved } = useDocument(documentId);
  const { goToStep } = useStepNavigation(documentId, "pvr");

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden bg-background text-text">
      <AppHeader />

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
        <aside className="min-h-0 overflow-y-auto">
          <AppSidebar />
        </aside>

        <main className="min-h-0 min-w-0 overflow-y-auto">
          <div className="space-y-6">
            <WizardHeader
              activeStepId="bom"
              completedStepIds={saved?.completed_steps ?? []}
              onStepClick={goToStep}
              title="Bill of Materials"
              description="Review and edit the Bill of Materials and download the Word document."
              identifier={saved?.draft_id ?? documentId}
              status="DRAFT"
              dosageForm={saved?.dosage_form}
              docType="pvr"
              isPvr
            />

            <div className="px-4 pb-6 sm:px-6">
              <BomTable
                documentId={documentId}
                onContinue={() => goToStep("cpp-cqa")}
              />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
