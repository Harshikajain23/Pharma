import {
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { ChevronDown, Plus, ArrowLeft, ArrowRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { AppHeader } from "../../features/new-document/components/AppHeader";
import { AppSidebar } from "../../features/new-document/components/AppSidebar";
import { WizardHeader } from "../../features/new-document/components/WizardHeader";
import { useDocument } from "../../features/new-document/hooks/useDocument";
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
  },
  {
    id: 2,
    code: "RM-1203",
    ingredient: "Povidone K-30",
    spec: "IP",
    vendor: "",
    arNumbers: ["", "", ""],
  },
  {
    id: 3,
    code: "RM-1305",
    ingredient: "Microcrystalline cellulose (PH 102)",
    spec: "IP",
    vendor: "",
    arNumbers: ["", "", ""],
  },
  {
    id: 4,
    code: "RM-1509",
    ingredient: "Magnesium stearate",
    spec: "IP",
    vendor: "",
    arNumbers: ["", "", ""],
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
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={`w-full min-w-0 rounded-md border border-gray-200 bg-white px-2.5 py-2 text-sm text-gray-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 ${className}`}
      />
      {source && <SourceTag edited={edited} />}
    </div>
  );
}

function Panel({
  title,
  caption,
  children,
  onSave,
  saved,
}: {
  title: string;
  caption?: string;
  children: ReactNode;
  onSave: () => void;
  saved: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 px-5 py-4">
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
          {caption && (
            <p className="mt-1 text-xs leading-5 text-gray-500">{caption}</p>
          )}
        </div>
        <ChevronDown size={17} className="shrink-0 text-gray-400" />
      </div>

      <div className="p-5">{children}</div>

      <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-3">
        <span
          className={`text-xs ${
            saved ? "text-teal-700" : "text-gray-500"
          }`}
        >
          {saved ? "Saved locally" : "Unsaved changes"}
        </span>
        <button
          type="button"
          onClick={onSave}
          className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100"
        >
          Save
        </button>
      </div>
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
              key={row.label}
              className="border-b border-gray-100 last:border-0"
            >
              <td className="px-3 py-3 text-xs font-medium text-gray-700">
                {row.label}
              </td>
              {row.values.map((value, batchIndex) => (
                <td key={batchIndex} className="px-3 py-3 align-top">
                  <Field
                    value={value}
                    source
                    onChange={(next) =>
                      onChange(rowIndex, batchIndex, next)
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
  const navigate = useNavigate();

  const { document: saved } = useDocument(documentId);
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
  const [isProductExpanded, setIsProductExpanded] = useState(true);
  const [isApiExpanded, setIsApiExpanded] = useState(true);
  const [isCoaExpanded, setIsCoaExpanded] = useState(true);
  const [isMaterialsExpanded, setIsMaterialsExpanded] = useState(true);

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

  function continuePage() {
    setAttempted(true);

    if (!ccnValid) return;

    // These section saves are local UI state, not API persistence.
    [1, 2, 3, 4, 5].forEach((section) => saveSection(section));

    // Change "bom" if the next step has a different configured step ID.
    goToStep("bom");
  }

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
              activeStepId="introduction"
              completedStepIds={saved?.completed_steps ?? []}
              onStepClick={goToStep}
              title="Introduction"
              description="Values read from the three executed batch records carry a source tag and stay editable, and the report prints this section from what you confirm here."
              identifier={saved?.draft_id ?? documentId}
              status="DRAFT"
              dosageForm={saved?.dosage_form}
              docType="pvr"
              isPvr
            />

            <div className="space-y-6 px-4 pb-28 sm:px-6">
             
              

             <section className="rounded-xl border border-teal-100 bg-teal-50/60 p-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-teal-800">
                How this works
            </p>

            <div className="grid gap-3 text-sm text-gray-700 md:grid-cols-3">
                <div className="flex gap-2">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0E8C8C] text-xs font-semibold text-white">
                    1
                </span>
                <p>
                    <strong>Check each tagged value</strong> read from the executed records.
                </p>
                </div>

            <div className="flex gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0E8C8C] text-xs font-semibold text-white">
                2
            </span>
            <p>
                Enter the <strong>CCN number</strong> and the <strong>COA results</strong> by hand.
            </p>
            </div>

            <div className="flex gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0E8C8C] text-xs font-semibold text-white">
                3
            </span>
            <p>
                Editing a tagged value marks it <strong>edited by you</strong> for the trail.
            </p>
            </div>
        </div>
        </section>

              

<div className="rounded-xl border border-gray-200 bg-white">
  <button
    type="button"
    onClick={() => setIsReasonExpanded((prev) => !prev)}
    aria-expanded={isReasonExpanded}
    className="flex w-full items-center justify-between gap-4 p-5 text-left"
  >
    <div className="flex gap-3">
      <h2 className="font-semibold text-gray-900">
        Reason for validation
      </h2>
      <span className="mt-1 text-sm text-gray-500">
        Carried from the protocol, with the change control that authorised it
      </span>
    </div>

    <ChevronDown
      size={20}
      className={`shrink-0 text-gray-500 transition-transform duration-200 ${
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
                ? "border-red-400 focus:border-red-400"
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
</div>

            
<div className="rounded-xl border border-gray-200 bg-white">
  <button
    type="button"
    onClick={() => setIsProductExpanded((prev) => !prev)}
    aria-expanded={isProductExpanded}
    className="flex w-full items-center justify-between gap-4 p-5 text-left"
  >
    <div className="flex gap-3">
      <h2 className="font-semibold text-gray-900">
        Product details
      </h2>
      <span className="mt-1 text-sm text-gray-500">
        One column per executed batch, read from the uploaded records
      </span>
    </div>

    <ChevronDown
      size={20}
      className={`shrink-0 text-gray-500 transition-transform duration-200 ${
        isProductExpanded ? "rotate-180" : ""
      }`}
    />
  </button>

  {isProductExpanded && (
    <div className="border-t border-gray-100 p-5">
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
          Save
        </button>
      </div>
    </div>
  )}
</div>

            
<div className="rounded-xl border border-gray-200 bg-white">
  <button
    type="button"
    onClick={() => setIsApiExpanded((prev) => !prev)}
    aria-expanded={isApiExpanded}
    className="flex w-full items-center justify-between gap-4 p-5 text-left"
  >
    <div className="flex gap-3">
      <h2 className="font-semibold text-gray-900">
        API details
      </h2>
      <span className="mt-1 text-sm text-gray-500">
        Metformin Hydrochloride IP · Values read from BMR
      </span>
    </div>

    <ChevronDown
      size={20}
      className={`shrink-0 text-gray-500 transition-transform duration-200 ${
        isApiExpanded ? "rotate-180" : ""
      }`}
    />
  </button>

  {isApiExpanded && (
    <div className="border-t border-gray-100 p-5">
      <BatchTable
        rows={apiRows}
        onChange={(row, column, value) =>
          updateBatchRow(setApiRows, row, column, value, 3)
        }
      />

      <span className="mt-3 block text-xs text-gray-500">
        When a batch uses two material lots, both values are listed
        in one cell, separated by a comma.
      </span>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => saveSection(3)}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Save
        </button>
      </div>
    </div>
  )}
</div>


           
<div className="rounded-xl border border-gray-200 bg-white">
  <button
    type="button"
    onClick={() => setIsCoaExpanded((prev) => !prev)}
    aria-expanded={isCoaExpanded}
    className="flex w-full items-center justify-between gap-4 p-5 text-left"
  >
    <div className="flex gap-3">
      <h2 className="font-semibold text-gray-900">
        API COA details
      </h2>
      <span className="mt-1 text-sm text-gray-500">
        One result column per AR number. Enter limits and results from the vendor COA.
      </span>
    </div>

    <ChevronDown
      size={20}
      className={`shrink-0 text-gray-500 transition-transform duration-200 ${
        isCoaExpanded ? "rotate-180" : ""
      }`}
    />
  </button>

  {isCoaExpanded && (
    <div className="border-t border-gray-100 p-5">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] border-collapse text-left">
          <thead>
            <tr className="bg-gray-50">
              {[
                "Sr.",
                "Analytical parameter",
                "Limit",
                "AR RM323007",
                "AR RM323008",
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
            {coaRows.map((row, index) => (
              <tr
                key={row.id}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="px-3 py-3 text-center text-xs text-gray-500">
                  {index + 1}
                </td>

                <td className="min-w-[210px] px-3 py-3">
                  <Field
                    value={row.parameter}
                    onChange={(value) =>
                      updateCoa(row.id, "parameter", value)
                    }
                  />
                </td>

                <td className="min-w-[220px] px-3 py-3">
                  <Field
                    value={row.limit}
                    onChange={(value) =>
                      updateCoa(row.id, "limit", value)
                    }
                  />
                </td>

                {row.results.map((result, resultIndex) => (
                  <td
                    key={resultIndex}
                    className="min-w-[160px] px-3 py-3"
                  >
                    <Field
                      value={result}
                      placeholder="Result"
                      onChange={(value) =>
                        updateCoaResult(row.id, resultIndex, value)
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={() => {
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
        }}
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900"
      >
        <Plus size={16} /> Add parameter
      </button>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => saveSection(4)}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Save
        </button>
      </div>
    </div>
  )}
</div>


           
<div className="rounded-xl border border-gray-200 bg-white">
  <button
    type="button"
    onClick={() => setIsMaterialsExpanded((prev) => !prev)}
    aria-expanded={isMaterialsExpanded}
    className="flex w-full items-center justify-between gap-4 p-5 text-left"
  >
    <div className="flex gap-3">
      <h2 className="font-semibold text-gray-900">
        Details of input material
      </h2>
      <span className="mt-1 text-sm text-gray-500">
        Excipients from the bill of materials, with the AR number dispensed in each batch
      </span>
    </div>

    <ChevronDown
      size={20}
      className={`shrink-0 text-gray-500 transition-transform duration-200 ${
        isMaterialsExpanded ? "rotate-180" : ""
      }`}
    />
  </button>

  {isMaterialsExpanded && (
    <div className="border-t border-gray-100 p-5">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1100px] border-collapse text-left">
          <thead>
            <tr className="bg-gray-50">
              {[
                "Material code",
                "Ingredient",
                "Spec.",
                "Name of vendor",
                ...batches.map((batch) => `AR No. · ${batch.id}`),
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
            {materials.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-100 last:border-0"
              >
                <td className="min-w-[130px] px-3 py-3">
                  <Field
                    value={row.code}
                    source
                    onChange={(value) =>
                      updateMaterial(row.id, "code", value)
                    }
                  />
                </td>

                <td className="min-w-[220px] px-3 py-3">
                  <Field
                    value={row.ingredient}
                    source
                    onChange={(value) =>
                      updateMaterial(row.id, "ingredient", value)
                    }
                  />
                </td>

                <td className="min-w-[90px] px-3 py-3">
                  <Field
                    value={row.spec}
                    onChange={(value) =>
                      updateMaterial(row.id, "spec", value)
                    }
                  />
                </td>

                <td className="min-w-[180px] px-3 py-3">
                  <Field
                    value={row.vendor}
                    placeholder="Vendor"
                    onChange={(value) =>
                      updateMaterial(row.id, "vendor", value)
                    }
                  />
                </td>

                {row.arNumbers.map((ar, index) => (
                  <td
                    key={index}
                    className="min-w-[150px] px-3 py-3"
                  >
                    <Field
                      value={ar}
                      placeholder="AR No."
                      onChange={(value) =>
                        updateMaterialAr(row.id, index, value)
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={() => {
          setMaterials((previous) => [
            ...previous,
            {
              id: Math.max(0, ...previous.map((row) => row.id)) + 1,
              code: "",
              ingredient: "",
              spec: "",
              vendor: "",
              arNumbers: ["", "", ""],
            },
          ]);
          markUnsaved(5);
        }}
        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-900"
      >
        <Plus size={16} /> Add material row
      </button>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => saveSection(5)}
          className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          Save
        </button>
      </div>
    </div>
  )}
</div>

            </div>
          </div>
        </main>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 shadow-[0_-4px_16px_rgba(0,0,0,0.04)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] text-gray-500">
              Last saved: {lastSaved}
            </span>
            <span
              className={`text-xs ${
                ccnValid ? "text-teal-700" : "text-amber-700"
              }`}
            >
              {ccnValid
                ? "Approved CCN number entered."
                : "Approved CCN No. is missing. Enter it to continue."}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ArrowLeft size={15} /> Back to Input
            </button>

            <button
              type="button"
              disabled={!ccnValid}
              onClick={continuePage}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Save and continue <ArrowRight size={15} />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
