import { Check, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { useState, type ReactNode } from "react";

/* ───────── shared class names ───────── */

export const inputClass =
  "w-full min-w-0 rounded-control border border-border bg-white px-3 py-2 text-small text-text outline-none focus:border-[#0e8c8c] focus:ring-1 focus:ring-[#0e8c8c]/20";
export const smallInputClass =
  "rounded-control border border-border bg-white px-2 py-2 text-small outline-none focus:border-[#0e8c8c]";
export const labelClass = "mb-1.5 block text-small font-medium text-text";
export const cellClass = "border-b border-border/70 px-4 py-3";

/* ───────── table header ───────── */

export function TableHeader({ children }: { children: ReactNode }) {
  return (
    <th className="border-b border-border px-4 py-3 text-left text-micro font-semibold text-text">
      {children}
    </th>
  );
}

/* ───────── collapsible block ───────── */

export function Block({
  title,
  source,
  open,
  onToggle,
  children,
}: {
  title: ReactNode;
  source?: string;
  open: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-md border border-border/60 bg-white">
      <div className="flex min-h-[44px] items-center gap-3 bg-muted/40 px-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          title={open ? "Minimise" : "Expand"}
          className="flex size-7 shrink-0 items-center justify-center rounded-sm border border-border bg-white hover:bg-muted"
        >
          {open ? (
            <ChevronUp className="size-4 text-subdued" aria-hidden="true" />
          ) : (
            <ChevronDown className="size-4 text-subdued" aria-hidden="true" />
          )}
        </button>
        <span className="flex items-center gap-2 text-small font-semibold text-text">
          {title}
        </span>
        {source && (
          <span className="ml-auto font-mono text-micro text-subdued">
            from {source}
          </span>
        )}
      </div>
      {open && (
        <div className="border-t border-border/60 p-3 sm:p-4">{children}</div>
      )}
    </div>
  );
}

/* ───────── small helpers ───────── */

export function CountBadge({ count }: { count: number }) {
  return (
    <span className="rounded-full bg-[#0e8c8c]/10 px-2 py-0.5 text-micro text-[#0e8c8c]">
      {count}
    </span>
  );
}

export function AddButton({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void;
  children: ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-9 items-center gap-2 rounded-control border border-dashed border-[#0e8c8c] px-3 py-2 text-small font-medium text-[#0e8c8c] hover:bg-[#0e8c8c]/5 disabled:opacity-40"
    >
      <Plus className="size-4" aria-hidden="true" />
      {children}
    </button>
  );
}

export function RemoveButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-control px-2 text-small text-subdued hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
    >
      <Trash2 className="size-4 shrink-0" aria-hidden="true" />
      Remove
    </button>
  );
}

/* IPQC / QC panel used inside every challenge study */
export function SamplingPanel({
  kind,
  qtyLabel,
  qty,
  onQty,
  options,
  selected,
  onTests,
}: {
  kind: "IPQC" | "QC";
  qtyLabel: string;
  qty: string;
  onQty: (v: string) => void;
  options: string[];
  selected: string[];
  onTests: (v: string[]) => void;
}) {
  const ipqc = kind === "IPQC";
  return (
    <div
      className={`space-y-3 rounded-lg border p-3 ${
        ipqc ? "border-[#0e8c8c]/25" : "border-border"
      }`}
    >
      <h4 className="flex items-center text-small font-semibold text-text">
        <span
          className={`mr-2 rounded px-2 py-1 text-micro ${
            ipqc ? "bg-[#0e8c8c]/10 text-[#0e8c8c]" : "bg-muted text-text"
          }`}
        >
          {kind}
        </span>
        {ipqc ? "In-process check" : "Sent to QC"}
      </h4>

      <div>
        <label className={labelClass}>{qtyLabel}</label>
        <input
          type="number"
          min="0"
          value={qty}
          placeholder="Qty"
          className={inputClass}
          onChange={(e) => onQty(e.target.value)}
        />
      </div>

      <label className={labelClass}>Tests</label>
      <MultiSelectDropdown options={options} selected={selected} onChange={onTests} />
    </div>
  );
}

/* ───────── Range / NMT / NLT limit editor ───────── */

export type LimitValue = { type: string; min: string; max: string };

export function LimitInput({
  value,
  unit,
  onChange,
}: {
  value?: LimitValue;
  unit?: string;
  onChange: (field: keyof LimitValue, v: string) => void;
}) {
  const type = value?.type ?? "Range";
  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={type}
        onChange={(e) => onChange("type", e.target.value)}
        className={smallInputClass}
      >
        <option value="Range">Range</option>
        <option value="NMT">NMT</option>
        <option value="NLT">NLT</option>
      </select>

      {type !== "NMT" && (
        <input
          type="number"
          value={value?.min ?? ""}
          placeholder="Min"
          onChange={(e) => onChange("min", e.target.value)}
          className={`w-24 ${smallInputClass}`}
        />
      )}
      {type === "Range" && <span className="text-subdued">-</span>}
      {type !== "NLT" && (
        <input
          type="number"
          value={value?.max ?? ""}
          placeholder="Max"
          onChange={(e) => onChange("max", e.target.value)}
          className={`w-24 ${smallInputClass}`}
        />
      )}
      {unit && <span className="text-small text-subdued">{unit}</span>}
    </div>
  );
}

/* ───────── multi select ───────── */

export function MultiSelectDropdown({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}) {
  return (
    <div className="w-full space-y-2">
      <div className="min-h-12 rounded-lg border border-border bg-white p-3">
        {selected.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selected.map((item) => (
              <span
                key={item}
                className="inline-flex items-center rounded-full border border-[#0e8c8c]/30 bg-[#0e8c8c]/10 px-2.5 py-1 text-xs font-medium text-[#0e8c8c]"
              >
                {item}
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs text-subdued">No tests selected</span>
        )}
      </div>

      <details className="group relative w-full">
        <summary className="flex min-h-9 cursor-pointer list-none items-center justify-between rounded-control border border-border bg-white px-3 py-2 text-small text-text">
          <span className="group-open:hidden">Select tests</span>
          <span className="hidden group-open:inline">{selected.length} items selected</span>
          <ChevronDown className="size-4 shrink-0" />
        </summary>

        <div className="absolute left-0 top-full z-30 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-border bg-white p-2 shadow-lg">
          {options.map((option) => (
            <label
              key={option}
              className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-small hover:bg-gray-50"
            >
              <input
                type="checkbox"
                checked={selected.includes(option)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...selected, option]
                      : selected.filter((item) => item !== option),
                  )
                }
                className="accent-[#0e8c8c]"
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}

/* ───────── challenge dropdown (with completed tick) ───────── */

export function ChallengeDropdown({
  options,
  value,
  onChange,
  isComplete,
}: {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  isComplete: (option: string) => boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="flex w-full items-center justify-between rounded-md border border-border bg-white px-3 py-2 text-left text-sm"
      >
        <span className="flex items-center gap-2">
          {value || "Select challenge"}
          {value && isComplete(value) && (
            <Check className="size-4 shrink-0 text-green-600" aria-label="Completed" />
          )}
        </span>
        <ChevronDown className="size-4 shrink-0" />
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border border-border bg-white py-1 shadow-lg">
          {options.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => {
                onChange(option);
                setOpen(false);
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-gray-100"
            >
              <span>{option}</span>
              {isComplete(option) && (
                <Check className="ml-2 size-4 text-green-600" aria-label="Completed" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}