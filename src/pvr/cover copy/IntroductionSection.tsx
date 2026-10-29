
import { useState, type ReactNode } from "react";
import {
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Plus,
  Save,
  Trash2,
} from "lucide-react";

type Row = {
  id: number;
  [key: string]: string | number;
};

type Column = {
  key: string;
  label: string;
};

function Panel({
  title,
  caption,
  children,
  onSave,
  saved,
  defaultOpen = true,
}: {
  title: string;
  caption?: string;
  children: ReactNode;
  onSave: () => void;
  saved: boolean;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 px-4 py-4 sm:px-5">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-teal-700">
            <FileText size={18} />
          </span>

          <span className="min-w-0">
            <span className="block font-semibold text-gray-900">
              {title}
            </span>
            {caption && (
              <span className="mt-1 block text-xs text-gray-500">
                {caption}
              </span>
            )}
          </span>

          {open ? (
            <ChevronUp size={18} className="ml-auto shrink-0 text-gray-400" />
          ) : (
            <ChevronDown size={18} className="ml-auto shrink-0 text-gray-400" />
          )}
        </button>

        <button
          type="button"
          onClick={onSave}
          className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium ${
            saved
              ? "border-teal-200 bg-teal-50 text-teal-700"
              : "border-gray-200 text-gray-600 hover:bg-gray-50"
          }`}
        >
          {saved ? <Check size={15} /> : <Save size={15} />}
          <span className="hidden sm:inline">
            {saved ? "Saved" : "Save"}
          </span>
        </button>
      </div>

      {open && <div className="space-y-5 p-4 sm:p-5">{children}</div>}
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
  multiline = false,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  placeholder?: string;
}) {
  const className =
    "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100";

  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium text-gray-700">{label}</span>

      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
          className={`${className} min-h-24 resize-y`}
        />
      ) : (
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder ?? `Enter ${label.toLowerCase()}`}
          className={className}
        />
      )}
    </label>
  );
}

function EditableTable({
  columns,
  rows,
  onChange,
  onAdd,
  onRemove,
}: {
  columns: Column[];
  rows: Row[];
  onChange: (id: number, key: string, value: string) => void;
  onAdd: () => void;
  onRemove: (id: number) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full min-w-[650px] border-collapse text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="border-b border-gray-200 px-3 py-3 font-semibold text-gray-700"
                >
                  {column.label}
                </th>
              ))}
              <th className="border-b border-gray-200 px-3 py-3 text-right font-semibold text-gray-700">
                Action
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className="border-b border-gray-100 p-2"
                  >
                    <input
                      value={String(row[column.key] ?? "")}
                      onChange={(event) =>
                        onChange(row.id, column.key, event.target.value)
                      }
                      className="w-full min-w-28 rounded-md border border-gray-200 px-2.5 py-2 outline-none focus:border-teal-600"
                    />
                  </td>
                ))}

                <td className="border-b border-gray-100 px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={() => onRemove(row.id)}
                    aria-label="Remove row"
                    className="rounded-md p-2 text-gray-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}

            {rows.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No rows added.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        type="button"
        onClick={onAdd}
        className="inline-flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:border-teal-500 hover:text-teal-700"
      >
        <Plus size={16} />
        Add row
      </button>
    </div>
  );
}

const makeRow = (
  id: number,
  values: Record<string, string>,
): Row => ({ id, ...values });

export function IntroductionSection() {
  const [savedSections, setSavedSections] = useState<number[]>([]);

  const [reason, setReason] = useState(
    "New product introduction at Sterling Pharma Labs, UNIT-03.",
  );
  const [ccnNo, setCcnNo] = useState("");

  const [productRows, setProductRows] = useState<Row[]>([
    makeRow(1, {
      batchNo: "B-2611-001",
      manufacturingDate: "",
      expiryDate: "",
      bmrNo: "",
      qcDatasheet: "",
    }),
    makeRow(2, {
      batchNo: "B-2611-002",
      manufacturingDate: "",
      expiryDate: "",
      bmrNo: "",
      qcDatasheet: "",
    }),
    makeRow(3, {
      batchNo: "B-2611-003",
      manufacturingDate: "",
      expiryDate: "",
      bmrNo: "",
      qcDatasheet: "",
    }),
  ]);

  const [apiRows, setApiRows] = useState<Row[]>([
    makeRow(1, {
      material: "Metformin Hydrochloride IP",
      vendor: "",
      arNo: "",
      specification: "As per approved specification",
    }),
  ]);

  const [coaRows, setCoaRows] = useState<Row[]>([
    makeRow(1, {
      parameter: "Description",
      specification: "As per approved specification",
      result: "",
    }),
    makeRow(2, {
      parameter: "Assay",
      specification: "As per approved specification",
      result: "",
    }),
    makeRow(3, {
      parameter: "Loss on drying",
      specification: "As per approved specification",
      result: "",
    }),
  ]);

  const [materialRows, setMaterialRows] = useState<Row[]>([
    makeRow(1, {
      materialCode: "",
      materialName: "",
      specification: "",
      vendor: "",
      arNo: "",
    }),
  ]);

  function markSaved(section: number) {
    setSavedSections((previous) =>
      previous.includes(section)
        ? previous
        : [...previous, section],
    );

    // UI-only save state. Connect this function to your backend API
    // when the Introduction save endpoint is ready.
  }

  function updateRows(
    setter: React.Dispatch<React.SetStateAction<Row[]>>,
    id: number,
    key: string,
    value: string,
  ) {
    setter((previous) =>
      previous.map((row) =>
        row.id === id ? { ...row, [key]: value } : row,
      ),
    );

    setSavedSections([]);
  }

  function addRow(
    setter: React.Dispatch<React.SetStateAction<Row[]>>,
    template: Record<string, string>,
  ) {
    setter((previous) => {
      const id =
        previous.reduce((maximum, row) => Math.max(maximum, row.id), 0) + 1;

      return [...previous, makeRow(id, template)];
    });

    setSavedSections([]);
  }

  function removeRow(
    setter: React.Dispatch<React.SetStateAction<Row[]>>,
    id: number,
  ) {
    setter((previous) => previous.filter((row) => row.id !== id));
    setSavedSections([]);
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">
          Introduction
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          Review and edit the validation information for this document.
        </p>
      </div>

      <Panel
        title="Reason for validation"
        caption="Validation rationale and approved change control"
        saved={savedSections.includes(1)}
        onSave={() => markSaved(1)}
      >
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="md:col-span-2">
            <TextField
              label="Reason for validation"
              value={reason}
              onChange={(value) => {
                setReason(value);
                setSavedSections([]);
              }}
              multiline
            />
          </div>

          <TextField
            label="Approved CCN No."
            value={ccnNo}
            onChange={(value) => {
              setCcnNo(value);
              setSavedSections([]);
            }}
            placeholder="Enter approved CCN number"
          />
        </div>
      </Panel>

      <Panel
        title="Product details"
        caption="Batch details and executed BMR references"
        saved={savedSections.includes(2)}
        onSave={() => markSaved(2)}
      >
        <EditableTable
          columns={[
            { key: "batchNo", label: "Batch No." },
            { key: "manufacturingDate", label: "Manufacturing Date" },
            { key: "expiryDate", label: "Expiry Date" },
            { key: "bmrNo", label: "Executed BMR No." },
            { key: "qcDatasheet", label: "QC Datasheet" },
          ]}
          rows={productRows}
          onChange={(id, key, value) =>
            updateRows(setProductRows, id, key, value)
          }
          onAdd={() =>
            addRow(setProductRows, {
              batchNo: "",
              manufacturingDate: "",
              expiryDate: "",
              bmrNo: "",
              qcDatasheet: "",
            })
          }
          onRemove={(id) => removeRow(setProductRows, id)}
        />
      </Panel>

      <Panel
        title="API details"
        caption="Active pharmaceutical ingredient details"
        saved={savedSections.includes(3)}
        onSave={() => markSaved(3)}
      >
        <EditableTable
          columns={[
            { key: "material", label: "API / Material" },
            { key: "vendor", label: "Vendor" },
            { key: "arNo", label: "AR No." },
            { key: "specification", label: "Specification" },
          ]}
          rows={apiRows}
          onChange={(id, key, value) =>
            updateRows(setApiRows, id, key, value)
          }
          onAdd={() =>
            addRow(setApiRows, {
              material: "",
              vendor: "",
              arNo: "",
              specification: "",
            })
          }
          onRemove={(id) => removeRow(setApiRows, id)}
        />
      </Panel>

      <Panel
        title="API COA details"
        caption="Certificate of analysis parameters and results"
        saved={savedSections.includes(4)}
        onSave={() => markSaved(4)}
      >
        <EditableTable
          columns={[
            { key: "parameter", label: "Parameter" },
            { key: "specification", label: "Specification / Limits" },
            { key: "result", label: "Result" },
          ]}
          rows={coaRows}
          onChange={(id, key, value) =>
            updateRows(setCoaRows, id, key, value)
          }
          onAdd={() =>
            addRow(setCoaRows, {
              parameter: "",
              specification: "",
              result: "",
            })
          }
          onRemove={(id) => removeRow(setCoaRows, id)}
        />
      </Panel>

      <Panel
        title="Details of input material"
        caption="Material codes, specifications, vendors and AR numbers"
        saved={savedSections.includes(5)}
        onSave={() => markSaved(5)}
      >
        <EditableTable
          columns={[
            { key: "materialCode", label: "Material Code" },
            { key: "materialName", label: "Material Name" },
            { key: "specification", label: "Specification" },
            { key: "vendor", label: "Vendor" },
            { key: "arNo", label: "AR No." },
          ]}
          rows={materialRows}
          onChange={(id, key, value) =>
            updateRows(setMaterialRows, id, key, value)
          }
          onAdd={() =>
            addRow(setMaterialRows, {
              materialCode: "",
              materialName: "",
              specification: "",
              vendor: "",
              arNo: "",
            })
          }
          onRemove={(id) => removeRow(setMaterialRows, id)}
        />
      </Panel>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <strong>Important:</strong> The Save buttons currently mark a section
        as saved in the interface only. The example values are placeholders.
        Connect the fields to your executed BMR, COA and input-material APIs
        before using this form for actual validation records.
      </div>
    </div>
  );
}

export default IntroductionSection;
