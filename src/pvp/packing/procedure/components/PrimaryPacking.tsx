
import type { ReactNode } from "react";
import {
  BLISTER_MACHINES,
  type BlisterMachineId,
} from "../packingStages";

type PrimaryPackagingProps = {
  selectedMachine: BlisterMachineId;
  onMachineChange: (id: BlisterMachineId) => void;
  children: ReactNode;
};

export function PrimaryPackaging({
  selectedMachine,
  onMachineChange,
  children,
}: PrimaryPackagingProps) {
  const machine = BLISTER_MACHINES.find(
    (item) => item.id === selectedMachine,
  );

  if (!machine) return <>{children}</>;

  return (
    <div className="flex flex-col gap-4">
      <div className="mb-5 rounded-lg border border-border bg-white p-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
          <div className="min-w-0">
            <label
              htmlFor="mc-1"
              className="mb-1 block text-small font-medium text-text"
            >
              Blister machine
              <span className="ml-2 inline-flex rounded bg-[#e6f5f3] px-2 py-0.5 text-micro font-medium text-[#0e8c8c]">
                Master data
              </span>
            </label>

            <select
              id="mc-1"
              className="w-full rounded-control border border-border bg-white px-3 py-2 text-small text-text"
              value={selectedMachine}
              onChange={(event) =>
                onMachineChange(event.target.value as BlisterMachineId)
              }
            >
              {BLISTER_MACHINES.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.id} · {item.name} · {item.type}
                </option>
              ))}
            </select>
          </div>

          <div className="min-w-0">
            <label className="mb-1 block text-small font-medium text-text">
              Make / model
            </label>

            <div className="flex min-h-10 items-center rounded-control border border-border bg-muted/20 px-3 text-small text-subdued">
              {machine.model}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-small font-medium text-text">
              Controlling parameters
            </label>

            <div className="flex min-h-10 flex-wrap items-center gap-2">
              {machine.params.map((parameter) => (
                <span
                  key={parameter.key}
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/80 px-3 py-1 text-[12px]"
                >
                  <span>{parameter.name}</span>
                  <span className="text-subdued">
                    {parameter.unit}
                  </span>
                </span>
              ))}
            </div>
          </div>
        </div>

        

        <p className="mt-4 text-micro leading-5 text-subdued">
          Equipment, instruments, CPP and quality attributes follow the
          selected blister machine. Verify all limits and SOP references
          against approved validation documents.
        </p>
      </div>

      {children}
    </div>
  );
}
