import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { useState, type ReactNode } from "react";

type MultiSelectDropdownProps = {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
};

export function MultiSelectDropdown({
  options,
  selected,
  onChange,
}: MultiSelectDropdownProps) {
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
          <span className="hidden group-open:inline">
            {selected.length} items selected
          </span>
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
                onChange={(event) =>
                  onChange(
                    event.target.checked
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

export function TableHeader({ children }: { children: string }) {
  return (
    <th className="border-b border-border px-4 py-3 text-left text-micro font-semibold text-text">
      {children}
    </th>
  );
}

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
            {source}
          </span>
        )}
      </div>
      {open && (
        <div className="border-t border-border/60 p-3 sm:p-4">{children}</div>
      )}
    </div>
  );
}

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
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-md border border-border bg-white px-3 py-2 text-left text-sm"
      >
        <span className="flex items-center gap-2">
          {value || "Select challenge"}
          {value && isComplete(value) && (
            <Check
              className="size-4 shrink-0 text-green-600"
              aria-label="Completed"
            />
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
                <Check
                  className="ml-2 size-4 text-green-600"
                  aria-label="Completed"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}