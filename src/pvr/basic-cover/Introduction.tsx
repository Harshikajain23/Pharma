
import {
  Fragment,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import {
  ChevronDown,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { useStepNavigation } from "../../features/new-document/hooks/useStepNavigation";

type Batch = {
  id: string;
  label: string;
};

type BatchRow = {
  label: string;
  values: string[];
};

type CoaRow = {
  id: number;
  parameter: string;
  limit: string;
  results: string[];
};

type MaterialRow = {
  id: number;
  code: string;
  ingredient: string;
  spec: string;
  vendor: string;
  arNumbers: string[];
  issuedQty: string[];
};

const batches: Batch[] = [
  { id: "B-2611-001", label: "First batch" },
  { id: "B-2611-002", label: "Second batch" },
  { id: "B-2611-003", label: "Third batch" },
];

const initialProducts: BatchRow[] = [
  {
    label: "BMR No. with version",
    values: ["BMR-0157 v2.1", "BMR-0157 v2.1", "BMR-0157 v2.1"],
  },
  {
    label: "Batch size",
    values: ["250,000", "250,000", "250,000"],
  },
  {
    label: "Mfg. date",
    values: ["05 Sep 2026", "09 Sep 2026", "13 Sep 2026"],
  },
  {
    label: "Exp. date",
    values: ["Aug 2029", "Aug 2029", "Aug 2029"],
  },
];

const initialApi: BatchRow[] = [
  {
    label: "Vendor name",
    values: [
      "Pharma Private Limited",
      "Pharma Private Limited",
      "Pharma Private Limited",
    ],
  },
  {
    label: "Vendor batch No.",
    values: ["D-N-01", "D-N-02", "D-N-01, D-N-02"],
  },
  {
    label: "AR No.",
    values: ["RM323007", "RM323008", "RM323007, RM323008"],
  },
];

const initialCoa: CoaRow[] = [
  {
    id: 1,
    parameter: "Description",
    limit: "White crystalline powder",
    results: ["", ""],
  },
  {
    id: 2,
    parameter: "Assay (on dried basis)",
    limit: "98.5 to 101.0% w/w",
    results: ["", ""],
  },
  {
    id: 3,
    parameter: "Loss on drying",
    limit: "NMT 0.5% w/w",
    results: ["", ""],
  },
  {
    id: 4,
    parameter: "Sulphated ash",
    limit: "NMT 0.1% w/w",
    results: ["", ""],
  },
];

const initialMaterials: MaterialRow[] = [
  {
    id: 1,
    code: "RM-1102",
    ingredient: "Maize starch",
    spec: "IP",
    vendor: "",
    arNumbers: ["", "", ""],
    issuedQty: ["", "", ""],
  },
  {
    id: 2,
    code: "RM-1203",
    ingredient: "Povidone K-30",
    spec: "IP",
    vendor: "",
    arNumbers: ["", "", ""],
    issuedQty: ["", "", ""],
  },
  {
    id: 3,
    code: "RM-1305",
    ingredient: "Microcrystalline cellulose (PH 102)",
    spec: "IP",
    vendor: "",
    arNumbers: ["", "", ""],
    issuedQty: ["", "", ""],
  },
  {
    id: 4,
    code: "RM-1509",
    ingredient: "Magnesium stearate",
    spec: "IP",
    vendor: "",
    arNumbers: ["", "", ""],
    issuedQty: ["", "", ""],
  },
];

function SourceTag({ edited = false }: { edited?: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-1 text-[10px] ${
        edited
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-gray-200 bg-gray-50 text-gray-500"
      }`}
    >
      {edited ? "Edited by you" : "Read from BMR"}
    </span>
  );
}

function Field({
  value,
  onChange,
  placeholder,
  source = false,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  source?: boolean;
  className?: string;
}) {
  const [originalValue] = useState(value);
  const edited = source && value !== originalValue;

  return (
    <div className="min-w-0 space-y-1.5">
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full min-w-0 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 ${className}`}
      />
      {source && <SourceTag edited={edited} />}
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 px-5 py-4">
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {description && (
          <p className="mt-1 text-xs leading-5 text-gray-500">
            {description}
          </p>
        )}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

function BatchTable({
  rows,
  onChange,
}: {
  rows: BatchRow[];
  onChange: (rowIndex: number, batchIndex: number, value: string) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[850px] border-collapse text-left">
        <thead>
          <tr className="bg-gray-50">
            <th className="w-[190px] border-b border-gray-200 px-3 py-3 text-xs font-semibold text-gray-600">
              Content
            </th>
            {batches.map((batch) => (
              <th
                key={batch.id}
                className="border-b border-gray-200 px-3 py-3 text-xs font-semibold text-gray-600"
              >
                {batch.label}
                <span className="mt-1 block font-mono text-[10px] font-normal text-gray-400">
                  {batch.id}
                </span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr
              key={`${row.label}-${rowIndex}`}
              className="transition-colors hover:bg-gray-50/70"
            >
              <td className="border-b border-gray-100 px-3 py-3 text-sm font-medium text-gray-700">
                {row.label}
              </td>
              {batches.map((batch, batchIndex) => (
                <td
                  key={batch.id}
                  className="min-w-[200px] border-b border-gray-100 p-3"
                >
                  <Field
                    value={row.values[batchIndex] ?? ""}
                    source
                    onChange={(value) =>
                      onChange(rowIndex, batchIndex, value)
                    }
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Introduction() {
  const { documentId = "" } = useParams<{ documentId: string }>();
  const { goToStep } = useStepNavigation(documentId, "pvr");

  const [reason, setReason] = useState(
    "New product introduction at Sterling Pharma Labs, UNIT-03."
  );
  const [ccn, setCcn] = useState("");
  const [products, setProducts] = useState<BatchRow[]>(initialProducts);
  const [apiRows, setApiRows] = useState<BatchRow[]>(initialApi);
  const [coaRows, setCoaRows] = useState<CoaRow[]>(initialCoa);
  const [materials, setMaterials] = useState<MaterialRow[]>(initialMaterials);
  const [savedSections, setSavedSections] = useState<number[]>([]);
  const [lastSaved, setLastSaved] = useState("--:--:--");
  const [attempted, setAttempted] = useState(false);
  const [isReasonExpanded, setIsReasonExpanded] = useState(true);
  const [selectedTab, setSelectedTab] = useState<
    "product" | "api1" | "mat"
  >("product");

  const ccnValid = ccn.trim().length > 0;

  function saveSection(section: number) {
    setSavedSections((previous) =>
      previous.includes(section) ? previous : [...previous, section]
    );
    setLastSaved(new Date().toLocaleTimeString());
  }

  function markUnsaved(section: number) {
    setSavedSections((previous) =>
      previous.filter((item) => item !== section)
    );
  }

  function updateBatchRow(
    setter: Dispatch<SetStateAction<BatchRow[]>>,
    rowIndex: number,
    batchIndex: number,
    value: string,
    section: number
  ) {
    setter((previous) =>
      previous.map((row, index) =>
        index === rowIndex
          ? {
              ...row,
              values: row.values.map((item, column) =>
                column === batchIndex ? value : item
              ),
            }
          : row
      )
    );
    markUnsaved(section);
  }

  function updateCoa(
    id: number,
    field: "parameter" | "limit",
    value: string
  ) {
    setCoaRows((previous) =>
      previous.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
    markUnsaved(4);
  }

  function updateCoaResult(id: number, index: number, value: string) {
    setCoaRows((previous) =>
      previous.map((row) =>
        row.id === id
          ? {
              ...row,
              results: row.results.map((result, i) =>
                i === index ? value : result
              ),
            }
          : row
      )
    );
    markUnsaved(4);
  }

  function updateMaterial(
    id: number,
    field: "code" | "ingredient" | "spec" | "vendor",
    value: string
  ) {
    setMaterials((previous) =>
      previous.map((row) =>
        row.id === id ? { ...row, [field]: value } : row
      )
    );
    markUnsaved(5);
  }

  function updateMaterialAr(id: number, index: number, value: string) {
    setMaterials((previous) =>
      previous.map((row) =>
        row.id === id
          ? {
              ...row,
              arNumbers: row.arNumbers.map((ar, i) =>
                i === index ? value : ar
              ),
            }
          : row
      )
    );
    markUnsaved(5);
  }

  function updateMaterialQty(id: number, index: number, value: string) {
    setMaterials((previous) =>
      previous.map((row) =>
        row.id === id
          ? {
              ...row,
              issuedQty: row.issuedQty.map((quantity, i) =>
                i === index ? value : quantity
              ),
            }
          : row
      )
    );
    markUnsaved(5);
  }

  function addCoaParameter() {
    setCoaRows((previous) => [
      ...previous,
      {
        id: Math.max(0, ...previous.map((row) => row.id)) + 1,
        parameter: "",
        limit: "",
        results: ["", ""],
      },
    ]);
    markUnsaved(4);
  }

  function continuePage() {
    setAttempted(true);
    if (!ccnValid) return;

    [1, 2, 3, 4, 5].forEach(saveSection);
    goToStep("bom");
  }

  return (
    <main className="min-h-0 min-w-0 overflow-y-auto">
      <div className="space-y-6 px-4 pb-6 sm:px-6">
        {/* Introduction instructions */}
        <section className="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-teal-800">
            How this works
          </p>
          <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-2">
            {[
              <>
                <strong>Check each tagged value</strong> read from the executed records.
              </>,
              <>
                Enter the <strong>CCN number</strong> and the{" "}
                <strong>COA results</strong> by hand.
              </>,
              <>
                Editing a tagged value marks it <strong>edited by you</strong> for the trail.
              </>,
              <>
                Review and save each section before continuing.
              </>,
            ].map((content, index) => (
              <div key={index} className="flex gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0E8C8C] text-xs font-semibold text-white">
                  {index + 1}
                </span>
                <p>{content}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section selector cards */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[
            {
              id: "product" as const,
              title: "Product details",
              description: "BMR No., batch size and dates per batch",
              tag: "Read from BMR",
            },
            {
              id: "api1" as const,
              title: "API details · Metformin Hydrochloride IP",
              description: "AR numbers, COA results and vendor details",
              tag: "API details + COA",
            },
            {
              id: "mat" as const,
              title: "Details of input material",
              description: "Material code, vendor and AR No. per batch",
              tag: `${materials.length} materials`,
            },
          ].map((card) => (
            <button
              key={card.id}
              type="button"
              onClick={() => setSelectedTab(card.id)}
              aria-pressed={selectedTab === card.id}
              className={`rounded-xl border p-4 text-left transition ${
                selectedTab === card.id
                  ? "border-teal-600 bg-teal-50/70 ring-1 ring-teal-600"
                  : "border-gray-200 bg-white hover:border-teal-300"
              }`}
            >
              <span className="block text-sm font-semibold text-gray-900">
                {card.title}
              </span>
              <span className="mt-1 block text-xs leading-5 text-gray-500">
                {card.description}
              </span>
              <span className="mt-3 inline-flex rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] text-gray-500">
                {card.tag}
              </span>
            </button>
          ))}
        </div>

        {/* Reason for validation and CCN */}
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white">
          <button
            type="button"
            onClick={() => setIsReasonExpanded((previous) => !previous)}
            aria-expanded={isReasonExpanded}
            className="flex w-full items-center justify-between gap-4 p-5 text-left"
          >
            <div>
              <h2 className="font-semibold text-gray-900">
                Reason for validation
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Carried from the protocol, with the change control that authorised it.
              </p>
            </div>
            <ChevronDown
              size={20}
              className={`shrink-0 text-gray-500 transition-transform ${
                isReasonExpanded ? "rotate-180" : ""
              }`}
            />
          </button>

          {isReasonExpanded && (
            <div className="border-t border-gray-100 p-5">
              <div className="grid gap-5 lg:grid-cols-[2fr_1fr]">
                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700">
                    Reason for validation
                  </label>
                  <textarea
                    rows={3}
                    value={reason}
                    onChange={(event) => {
                      setReason(event.target.value);
                      markUnsaved(1);
                    }}
                    className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                  />
                  <div className="mt-2">
                    <span className="inline-flex rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] text-gray-500">
                      From PVP · PVP-0012 v1.0
                    </span>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium text-gray-700">
                    Approved CCN No. <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={ccn}
                    onChange={(event) => {
                      setCcn(event.target.value);
                      markUnsaved(1);
                    }}
                    placeholder="e.g. CCN/26/045"
                    aria-invalid={attempted && !ccnValid}
                    className={`w-full rounded-lg border px-3 py-2.5 font-mono text-sm outline-none focus:ring-2 focus:ring-teal-600/10 ${
                      attempted && !ccnValid
                        ? "border-red-400"
                        : "border-gray-200 focus:border-teal-600"
                    }`}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    The change control that approved this validation.
                  </p>
                  {attempted && !ccnValid && (
                    <p className="mt-2 text-xs text-red-600">
                      Enter the approved CCN number to continue.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => saveSection(1)}
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
                >
                  Save
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Product details */}
        {selectedTab === "product" && (
          <SectionCard
            title="Product details"
            description="One column per executed batch, read from the uploaded records."
          >
            <BatchTable
              rows={products}
              onChange={(row, column, value) =>
                updateBatchRow(setProducts, row, column, value, 2)
              }
            />
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => saveSection(2)}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
              >
                Save product details
              </button>
            </div>
          </SectionCard>
        )}

        {/* API details and COA */}
        {selectedTab === "api1" && (
          <div className="space-y-6">
            <SectionCard
              title="API details · Metformin Hydrochloride IP"
              description="Vendor details, vendor batch numbers and AR numbers per batch."
            >
              <BatchTable
                rows={apiRows}
                onChange={(row, column, value) =>
                  updateBatchRow(setApiRows, row, column, value, 3)
                }
              />
              <p className="mt-3 text-xs text-gray-500">
                When a batch uses two material lots, both values can be listed in one cell, separated by a comma.
              </p>
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => saveSection(3)}
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
                >
                  Save API details
                </button>
              </div>
            </SectionCard>

            <SectionCard
              title="API COA details"
              description="Enter the analytical limits and results from the vendor COA."
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] border-collapse text-left">
                  <thead>
                    <tr className="bg-gray-50">
                      {[
                        "Parameter",
                        "Acceptance limit",
                        "COA result 1",
                        "COA result 2",
                        "Action",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="border-b border-gray-200 px-3 py-3 text-xs font-semibold text-gray-600"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {coaRows.map((row) => (
                      <tr key={row.id} className="hover:bg-gray-50/70">
                        <td className="min-w-[170px] border-b border-gray-100 p-3">
                          <input
                            value={row.parameter}
                            onChange={(event) =>
                              updateCoa(row.id, "parameter", event.target.value)
                            }
                            placeholder="Parameter"
                            className="w-full rounded-md border border-gray-200 px-2.5 py-2 text-sm outline-none focus:border-teal-600"
                          />
                        </td>
                        <td className="min-w-[180px] border-b border-gray-100 p-3">
                          <input
                            value={row.limit}
                            onChange={(event) =>
                              updateCoa(row.id, "limit", event.target.value)
                            }
                            placeholder="Acceptance limit"
                            className="w-full rounded-md border border-gray-200 px-2.5 py-2 text-sm outline-none focus:border-teal-600"
                          />
                        </td>
                        {row.results.map((result, resultIndex) => (
                          <td
                            key={resultIndex}
                            className="min-w-[150px] border-b border-gray-100 p-3"
                          >
                            <input
                              value={result}
                              onChange={(event) =>
                                updateCoaResult(
                                  row.id,
                                  resultIndex,
                                  event.target.value
                                )
                              }
                              placeholder="Enter result"
                              className="w-full rounded-md border border-gray-200 px-2.5 py-2 text-sm outline-none focus:border-teal-600"
                            />
                          </td>
                        ))}
                        <td className="border-b border-gray-100 p-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setCoaRows((previous) =>
                                previous.filter((item) => item.id !== row.id)
                              );
                              markUnsaved(4);
                            }}
                            aria-label={`Remove ${row.parameter || "COA parameter"}`}
                            className="inline-flex size-8 items-center justify-center rounded-md text-gray-400 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {coaRows.length === 0 && (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-sm text-gray-500"
                        >
                          No COA parameters added.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={addCoaParameter}
                  className="inline-flex items-center gap-2 rounded-lg border border-dashed border-teal-600 px-3 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
                >
                  <Plus size={16} />
                  Add parameter
                </button>
                <button
                  type="button"
                  onClick={() => saveSection(4)}
                  className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
                >
                  Save COA details
                </button>
              </div>
            </SectionCard>
          </div>
        )}

        {/* Input materials */}
        {selectedTab === "mat" && (
          <SectionCard
            title="Details of input material"
            description="Excipients from the bill of materials, with vendor, AR number and issued quantity for each validation batch."
          >
           

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full min-w-[1300px] border-collapse text-left">
                <thead>
                  <tr className="bg-gray-50">
                    <th rowSpan={3} className="border-b border-r border-gray-200 px-3 py-3 text-xs font-semibold text-gray-600">
                      Material code
                    </th>
                    <th rowSpan={3} className="border-b border-r border-gray-200 px-3 py-3 text-xs font-semibold text-gray-600">
                      Ingredient
                    </th>
                    <th rowSpan={3} className="border-b border-r border-gray-200 px-3 py-3 text-xs font-semibold text-gray-600">
                      Spec.
                    </th>
                    <th rowSpan={3} className="border-b border-r border-gray-200 px-3 py-3 text-xs font-semibold text-gray-600">
                      Name of vendor
                    </th>
                    <th colSpan={6} className="border-b border-gray-200 px-3 py-3 text-center text-xs font-semibold text-gray-600">
                      Batch No.
                    </th>
                    <th rowSpan={3} className="border-b border-l border-gray-200 px-3 py-3 text-center text-xs font-semibold text-gray-600">
                      Action
                    </th>
                  </tr>
                  <tr className="bg-gray-50">
                    {batches.map((batch) => (
                      <th
                        key={batch.id}
                        colSpan={2}
                        className="border-b border-r border-gray-200 px-3 py-3 text-center text-xs font-semibold text-gray-600"
                      >
                        {batch.id}
                      </th>
                    ))}
                  </tr>
                  <tr className="bg-gray-50">
                    {batches.map((batch) => (
                      <Fragment key={batch.id}>
                        <th className="border-b border-r border-gray-200 px-3 py-3 text-center text-xs font-medium text-gray-600">
                          AR No.
                        </th>
                        <th className="border-b border-r border-gray-200 px-3 py-3 text-center text-xs font-medium text-gray-600">
                          Issued Qty.
                        </th>
                      </Fragment>
                    ))}
                  </tr>
                </thead>

                <tbody>
                  {materials.map((row, rowIndex) => (
                    <tr
                      key={row.id}
                      className="transition-colors hover:bg-gray-50/70"
                    >
                      <td className="min-w-[145px] border-b border-r border-gray-100 p-3 align-top">
                        <Field
                          value={row.code}
                          source
                          onChange={(value) =>
                            updateMaterial(row.id, "code", value)
                          }
                        />
                      </td>
                      <td className="min-w-[230px] border-b border-r border-gray-100 p-3 align-top">
                        <Field
                          value={row.ingredient}
                          source
                          onChange={(value) =>
                            updateMaterial(row.id, "ingredient", value)
                          }
                        />
                      </td>
                      <td className="min-w-[100px] border-b border-r border-gray-100 p-3 align-top">
                        <Field
                          value={row.spec}
                          onChange={(value) =>
                            updateMaterial(row.id, "spec", value)
                          }
                        />
                      </td>
                      <td className="min-w-[190px] border-b border-r border-gray-100 p-3 align-top">
                        <Field
                          value={row.vendor}
                          placeholder="Vendor name"
                          onChange={(value) =>
                            updateMaterial(row.id, "vendor", value)
                          }
                        />
                      </td>

                      {batches.map((batch, batchIndex) => (
                        <Fragment key={batch.id}>
                          <td className="min-w-[150px] border-b border-r border-gray-100 p-3 align-top">
                            <Field
                              value={row.arNumbers[batchIndex] ?? ""}
                              placeholder="Enter AR number"
                              onChange={(value) =>
                                updateMaterialAr(row.id, batchIndex, value)
                              }
                            />
                          </td>
                          <td className="min-w-[120px] border-b border-r border-gray-100 p-3 align-top">
                            <input
                              type="text"
                              value={row.issuedQty[batchIndex] ?? ""}
                              placeholder="e.g. 2.5 kg"
                              onChange={(event) =>
                                updateMaterialQty(
                                  row.id,
                                  batchIndex,
                                  event.target.value
                                )
                              }
                              className="w-full min-w-0 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-xs text-gray-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10"
                            />
                          </td>
                        </Fragment>
                      ))}

                      <td className="border-b border-gray-100 p-3 text-center align-top">
                        <button
                          type="button"
                          onClick={() => {
                            setMaterials((previous) =>
                              previous.filter((item) => item.id !== row.id)
                            );
                            markUnsaved(5);
                          }}
                          title="Remove material"
                          aria-label={`Remove material ${rowIndex + 1}`}
                          className="inline-flex size-8 items-center justify-center rounded-md text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {materials.length === 0 && (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-4 py-10 text-center text-sm text-gray-500"
                      >
                        No input materials added yet. Use Add material row to create your first entry.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setMaterials((previous) => [
                    ...previous,
                    {
                      id:
                        Math.max(0, ...previous.map((item) => item.id)) + 1,
                      code: "",
                      ingredient: "",
                      spec: "IP",
                      vendor: "",
                      arNumbers: ["", "", ""],
                      issuedQty: ["", "", ""],
                    },
                  ]);
                  markUnsaved(5);
                }}
                className="inline-flex min-h-9 items-center justify-center gap-2 self-start rounded-lg border border-dashed border-teal-600 px-3 py-2 text-sm font-medium text-teal-700 transition hover:bg-teal-50"
              >
                <Plus size={16} />
                Add material row
              </button>

              <div className="flex items-center justify-end gap-3">
                <span
                  className={`text-xs ${
                    savedSections.includes(5)
                      ? "text-teal-700"
                      : "text-gray-500"
                  }`}
                >
                  {savedSections.includes(5)
                    ? `Saved at ${lastSaved}`
                    : "Unsaved changes"}
                </span>
                <button
                  type="button"
                  onClick={() => saveSection(5)}
                  className="rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-teal-800"
                >
                  Save details
                </button>
              </div>
            </div>
          </SectionCard>
        )}
       
      </div>
    </main>
  );
}
