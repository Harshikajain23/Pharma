
import { useState } from "react";

type ChallengeLevel = {
  Low: string;
  High: string;
};

type ChallengeLevelsState = {
  speed: ChallengeLevel;
  seal: ChallengeLevel;
};

type ChallengeStudy = {
  id: number;
  name?: string;
  condition: string;
  runTime: string;
  ipqcQty: string;
  checks: string[];
  qcQty: string;
  qcTests: string[];
  samplingPoint: string;
};

const REPACKING_ID = 100;

const availableChecks = [
  {
    name: "Cutting",
    criteria: "All blister should have proper cut and no physical defects",
  },
  { name: "Sealing", criteria: "Blister are properly sealed" },
  {
    name: "Knurling",
    criteria: "Knurling (Sealing pattern) should be proper",
  },
  {
    name: "Embossing details",
    criteria:
      "Embossing details on the blisters should be clear, readable and legible",
  },
  {
    name: "Printed matter",
    criteria:
      "No any Discoloration, Ink spread / smudge of printed text matter",
  },
];

const qcTestOptions = [
  { name: "Description", criteria: "As per Packed Product Specification." },
  { name: "Assay", criteria: "As per Packed Product Specification." },
];

const conditionOptions = [
  { value: "Low|Low", label: "Low speed – Low temperature" },
  { value: "Low|High", label: "Low speed – High temperature" },
  { value: "Low|Optimum", label: "Low speed – Optimum temperature" },
  { value: "High|Low", label: "High speed – Low temperature" },
  { value: "High|High", label: "High speed – High temperature" },
  { value: "High|Optimum", label: "High speed – Optimum temperature" },
  { value: "Optimum|Low", label: "Optimum speed – Low temperature" },
  { value: "Optimum|High", label: "Optimum speed – High temperature" },
  {
    value: "Optimum|Optimum",
    label: "Optimum speed – Optimum temperature",
  },
];

const createEmptyStudy = (
  id: number,
  condition: string,
): ChallengeStudy => ({
  id,
  condition,
  runTime: "",
  ipqcQty: "",
  checks: [],
  qcQty: "",
  qcTests: [],
  samplingPoint: "Prior to cartoning process",
});

const initialStudies: ChallengeStudy[] = [
  createEmptyStudy(1, "Low|Low"),
  createEmptyStudy(2, "Optimum|Low"),
];

const Chevron = ({ open }: { open: boolean }) => (
  <svg
    className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ChallengeLevels = () => {
  const [levels, setLevels] = useState<ChallengeLevelsState>({
    speed: { Low: "", High: "" },
    seal: { Low: "", High: "" },
  });

  const [studies, setStudies] = useState<ChallengeStudy[]>(initialStudies);
  const [nextId, setNextId] = useState(initialStudies.length + 1);

  const [repackingStudies, setRepackingStudies] = useState<ChallengeStudy[]>(
    [],
  );
  const [nextRepackingId, setNextRepackingId] = useState(REPACKING_ID + 1);

  const [collapsed, setCollapsed] = useState<number[]>([]);

  const [showNameInput, setShowNameInput] = useState(false);
  const [newChallengeName, setNewChallengeName] = useState("");

  const parameters = [
    {
      key: "speed" as const,
      name: "Machine Speed",
      unit: "SPM",
      cppRange: "25 SPM to 50 SPM",
    },
    {
      key: "seal" as const,
      name: "Sealing Temperature",
      unit: "°C",
      cppRange: "150 °C ± 20 °C",
    },
  ];

  const handleLevelChange = (
    key: keyof ChallengeLevelsState,
    level: keyof ChallengeLevel,
    value: string,
  ) => {
    setLevels((previous) => ({
      ...previous,
      [key]: { ...previous[key], [level]: value },
    }));
  };

  const updateStudy = (
    id: number,
    field: keyof ChallengeStudy,
    value: string | string[],
  ) => {
    setStudies((previous) =>
      previous.map((study) =>
        study.id === id ? { ...study, [field]: value } : study,
      ),
    );
  };

  const updateRepackingStudy = (
    id: number,
    field: keyof ChallengeStudy,
    value: string | string[],
  ) => {
    setRepackingStudies((previous) =>
      previous.map((study) =>
        study.id === id ? { ...study, [field]: value } : study,
      ),
    );
  };

  const toggleCollapsed = (id: number) => {
    setCollapsed((previous) =>
      previous.includes(id)
        ? previous.filter((item) => item !== id)
        : [...previous, id],
    );
  };

  const toggleAllStudies = (items: ChallengeStudy[]) => {
    const ids = items.map((study) => study.id);

    if (ids.length === 0) return;

    setCollapsed((previous) => {
      const allAreCollapsed = ids.every((id) => previous.includes(id));

      if (allAreCollapsed) {
        return previous.filter((id) => !ids.includes(id));
      }

      return [...new Set([...previous, ...ids])];
    });
  };

  const allCollapsed = (items: ChallengeStudy[]) =>
    items.length > 0 && items.every((study) => collapsed.includes(study.id));

 const copyValuesFromTopmost = (currentStudyId: number) => {
  setStudies((previous) => {
    const topmostStudy = previous[0];

    if (!topmostStudy) return previous;

    return previous.map((study) => {
      if (study.id !== currentStudyId) return study;

      return {
        ...study,
        runTime: topmostStudy.runTime,
        ipqcQty: topmostStudy.ipqcQty,
        samplingPoint: topmostStudy.samplingPoint,
        checks: [...topmostStudy.checks],
        qcQty: topmostStudy.qcQty,
        qcTests: [...topmostStudy.qcTests],
      };
    });
  });
};
  const addStudy = (name?: string) => {
    const unusedCondition = conditionOptions.find(
      (option) => !studies.some((study) => study.condition === option.value),
    );

    if (!unusedCondition) return;

    setStudies((previous) => [
      ...previous,
      { ...createEmptyStudy(nextId, unusedCondition.value), name },
    ]);

    setNextId((previous) => previous + 1);
  };

  const confirmAddStudy = () => {
    const name = newChallengeName.trim();

    if (!name) return;

    addStudy(name);
    setNewChallengeName("");
    setShowNameInput(false);
  };

  const cancelAddStudy = () => {
    setNewChallengeName("");
    setShowNameInput(false);
  };

  const removeStudy = (id: number) => {
    setStudies((previous) => previous.filter((study) => study.id !== id));
    setCollapsed((previous) => previous.filter((item) => item !== id));
  };

  const addRepackingStudy = () => {
    const unusedCondition = conditionOptions.find(
      (option) =>
        !repackingStudies.some((study) => study.condition === option.value),
    );

    if (!unusedCondition) return;

    setRepackingStudies((previous) => [
      ...previous,
      createEmptyStudy(nextRepackingId, unusedCondition.value),
    ]);

    setNextRepackingId((previous) => previous + 1);
  };

  const removeRepackingStudy = (id: number) => {
    setRepackingStudies((previous) =>
      previous.filter((study) => study.id !== id),
    );

    setCollapsed((previous) => previous.filter((item) => item !== id));
  };

  const filledRunTimes = studies.filter(
    (study) => study.runTime.trim() !== "",
  ).length;

  const filledRepackingRunTimes = repackingStudies.filter(
    (study) => study.runTime.trim() !== "",
  ).length;

  const renderStudyFields = (
    study: ChallengeStudy,
    isRepacking = false,
  ) => {
    const isCollapsed = collapsed.includes(study.id);

    const update = (field: keyof ChallengeStudy, value: string | string[]) => {
      if (isRepacking) {
        updateRepackingStudy(study.id, field, value);
      } else {
        updateStudy(study.id, field, value);
      }
    };

    const idPrefix = isRepacking
      ? `repacking-${study.id}`
      : `study-${study.id}`;

    return (
      <div className="space-y-4 p-4">
        <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="min-w-0">
            <label
              htmlFor={`${idPrefix}-condition`}
              className="mb-1 block text-small font-medium text-subdued"
            >
              Challenge study
            </label>

            <select
              id={`${idPrefix}-condition`}
              value={study.condition}
              onChange={(event) => update("condition", event.target.value)}
              aria-label={study.name || "Challenge study"}
              className="h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-small text-text outline-none focus:border-[#0e8c8c]"
            >
              {study.name && (
                <option value={study.condition}>{study.name}</option>
              )}

              {conditionOptions.map((option) => {
                const usedElsewhere = isRepacking
                  ? repackingStudies.some(
                      (item) =>
                        item.id !== study.id &&
                        item.condition === option.value,
                    )
                  : studies.some(
                      (item) =>
                        item.id !== study.id &&
                        item.condition === option.value,
                    );

                return (
                  <option
                    key={option.value}
                    value={option.value}
                    disabled={usedElsewhere}
                  >
                    {option.label}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="min-w-0">
            <label
              htmlFor={`${idPrefix}-unit`}
              className="mb-1 block text-small font-medium text-subdued"
            >
              Unit
            </label>

            <input
              id={`${idPrefix}-unit`}
              type="text"
              value="SPM / °C"
              readOnly
              className="h-10 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-small text-text outline-none"
            />
          </div>

          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-1">
              <label
                htmlFor={`${idPrefix}-runtime`}
                className="text-small font-medium text-subdued"
              >
                Run time (min)
              </label>

              {!isRepacking && (
                <button
                  type="button"
                  onClick={() => copyValuesFromTopmost(study.id)}
                  className="text-small font-medium text-[#0e8c8c] hover:underline"
                >
                  Copy to all
                </button>
              )}
            </div>

            <input
              id={`${idPrefix}-runtime`}
              type="number"
              min="0"
              step="any"
              value={study.runTime}
              onChange={(event) => update("runTime", event.target.value)}
              placeholder="Minutes"
              className="h-10 w-full rounded-md border border-gray-300 px-3 font-mono text-small text-text outline-none focus:border-[#0e8c8c]"
            />
          </div>

          <div className="flex min-w-0 gap-2">
            <button
              type="button"
              onClick={() =>
                isRepacking
                  ? removeRepackingStudy(study.id)
                  : removeStudy(study.id)
              }
              className="h-10 flex-1 rounded-md border border-red-200 px-3 text-small font-medium text-red-600 hover:bg-red-50"
            >
              Remove
            </button>

            <button
              type="button"
              onClick={() => toggleCollapsed(study.id)}
              aria-expanded={!isCollapsed}
              aria-label={
                isCollapsed ? "Expand challenge study" : "Collapse challenge study"
              }
              className="flex h-10 w-10 ml-10 items-center justify-center rounded-md border border-gray-200 px-3 text-text hover:bg-gray-50"
            >
              <Chevron open={!isCollapsed} />
            </button>
          </div>
        </div>

        {!isCollapsed && (
  <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
    {/* IPQC */}
    <div className="min-w-0 rounded-lg border border-gray-200 p-4">
      <h5 className="mb-4 text-small font-semibold text-text">
        <span className="mr-2 rounded bg-teal-50 px-2 py-1 text-micro font-medium text-teal-700">
          IPQC
        </span>
        In-process check
      </h5>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Sample Quantity */}
        <div className="min-w-0">
          <label
            htmlFor={`${idPrefix}-ipqc-qty`}
            className="mb-1 block text-small font-medium text-subdued"
          >
            Sample qty (blisters)
          </label>

          <input
            id={`${idPrefix}-ipqc-qty`}
            type="number"
            min="0"
            value={study.ipqcQty}
            onChange={(event) => update("ipqcQty", event.target.value)}
            placeholder="Qty"
            className="h-9 w-full rounded-md border border-gray-300 px-3 font-mono text-small text-text outline-none focus:border-[#0e8c8c]"
          />

          <p className="mt-1 text-micro leading-5 text-subdued">
            Blisters held at a time on the sealing plate
          </p>
        </div>

        {/* Sampling Point */}
        <div className="min-w-0">
          <label
            htmlFor={`${idPrefix}-sampling-point`}
            className="mb-1 block text-small font-medium text-subdued"
          >
            Sampling point
          </label>

          <select
            id={`${idPrefix}-sampling-point`}
            value={
              study.samplingPoint ??
              (isRepacking
                ? "At the start after machine setting"
                : "Prior to cartoning process")
            }
            onChange={(event) =>
              update("samplingPoint", event.target.value)
            }
            className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-small text-text outline-none focus:border-[#0e8c8c]"
          >
            <option value="Prior to cartoning process">
              Prior to cartoning process
            </option>
            <option value="At the start after machine setting">
              At the start after machine setting
            </option>
          </select>
        </div>

        {/* Checks - Full Width */}
        <div className="min-w-0 sm:col-span-2">
          <label
            htmlFor={`${idPrefix}-checks-select`}
            className="mb-1 block text-small font-medium text-subdued"
          >
            Checks
          </label>

          <select
            id={`${idPrefix}-checks-select`}
            value=""
            onChange={(event) => {
              const selected = event.target.value;

              if (selected && !study.checks.includes(selected)) {
                update("checks", [...study.checks, selected]);
              }
            }}
            className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-small text-text outline-none focus:border-[#0e8c8c]"
          >
            <option value="">Select a check</option>

            {availableChecks.map((check) => (
              <option
                key={check.name}
                value={check.name}
                disabled={study.checks.includes(check.name)}
              >
                {check.name}
              </option>
            ))}
          </select>

          <div className="mt-3 space-y-2">
            {study.checks.map((selectedName) => {
              const check = availableChecks.find(
                (item) => item.name === selectedName,
              );

              if (!check) return null;

              return (
                <div
                  key={check.name}
                  className="flex min-w-0 items-start gap-2 rounded-md border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-small font-semibold text-text">
                      {check.name}
                    </p>
                    <p className="mt-1 break-words text-micro leading-5 text-subdued">
                      {check.criteria}
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label={`Remove ${check.name}`}
                    onClick={() =>
                      update(
                        "checks",
                        study.checks.filter((item) => item !== check.name),
                      )
                    }
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-base leading-none text-subdued hover:bg-red-100 hover:text-red-600"
                  >
                    ×
                  </button>
                </div>
              );
            })}

            {study.checks.length === 0 && (
              <p className="rounded-md border border-dashed border-gray-300 p-3 text-micro text-subdued">
                No checks selected. Select a check from the dropdown above.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>

    {/* QC */}
    <div className="min-w-0 rounded-lg border border-gray-200 p-4">
      <h5 className="mb-4 text-small font-semibold text-text">
        <span className="mr-2 rounded bg-blue-50 px-2 py-1 text-micro font-medium text-blue-700">
          QC
        </span>
        Sent to QC
      </h5>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Sample Quantity */}
        <div className="min-w-0">
          <label
            htmlFor={`${idPrefix}-qc-qty`}
            className="mb-1 block text-small font-medium text-subdued"
          >
            Sample qty (tabs)
          </label>

          <input
            id={`${idPrefix}-qc-qty`}
            type="number"
            min="0"
            value={study.qcQty}
            onChange={(event) => update("qcQty", event.target.value)}
            placeholder="Qty"
            className="h-9 w-full rounded-md border border-gray-300 px-3 font-mono text-small text-text outline-none focus:border-[#0e8c8c]"
          />
        </div>

        {/* Sampling Point */}
        <div className="min-w-0">
          <label
            htmlFor={`${idPrefix}-qc-sampling-point`}
            className="mb-1 block text-small font-medium text-subdued"
          >
            Sampling point
          </label>

          <input
            id={`${idPrefix}-qc-sampling-point`}
            type="text"
            value="At the start after machine setting"
            readOnly
            className="h-9 w-full rounded-md border border-gray-200 bg-gray-50 px-3 text-small text-text outline-none"
          />
        </div>

        {/* Tests - Full Width */}
        <div className="min-w-0 sm:col-span-2">
          <label
            htmlFor={`${idPrefix}-qc-tests`}
            className="mb-1 block text-small font-medium text-subdued"
          >
            Tests
          </label>

          <select
            id={`${idPrefix}-qc-tests`}
            value=""
            onChange={(event) => {
              const selected = event.target.value;

              if (selected && !study.qcTests.includes(selected)) {
                update("qcTests", [...study.qcTests, selected]);
              }
            }}
            className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-small text-text outline-none focus:border-[#0e8c8c]"
          >
            <option value="">Select a QC test</option>

            {qcTestOptions.map((test) => (
              <option
                key={test.name}
                value={test.name}
                disabled={study.qcTests.includes(test.name)}
              >
                {test.name}
              </option>
            ))}
          </select>

          <div className="mt-3 space-y-2">
            {study.qcTests.map((selectedName) => {
              const test = qcTestOptions.find(
                (item) => item.name === selectedName,
              );

              if (!test) return null;

              return (
                <div
                  key={test.name}
                  className="flex min-w-0 items-start gap-2 rounded-md border border-gray-200 bg-gray-50 p-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="break-words text-small font-semibold text-text">
                      {test.name}
                    </p>
                    <p className="mt-1 break-words text-micro leading-5 text-subdued">
                      {test.criteria}
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label={`Remove ${test.name}`}
                    onClick={() =>
                      update(
                        "qcTests",
                        study.qcTests.filter((item) => item !== test.name),
                      )
                    }
                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-base leading-none text-subdued hover:bg-red-100 hover:text-red-600"
                  >
                    ×
                  </button>
                </div>
              );
            })}

            {study.qcTests.length === 0 && (
              <p className="rounded-md border border-dashed border-gray-300 p-3 text-micro text-subdued">
                No tests selected. Select a QC test above.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  </div>
)}
      </div>
    );
  };

  return (
    <section className="rounded-xl border border-border bg-white p-5 text-text">
      {/* Challenge levels */}
      <div className="mb-4">
        <h3 className="text-small font-semibold text-text">
          Challenge levels
        </h3>

        <p className="mt-2 text-micro leading-5 text-subdued">
          Enter the low and high value of each parameter the BPM-02 controls.
          Every challenge study below runs at these values, and studies at
          optimum show the word Optimum. CPP ranges from the BPR are shown for
          reference.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[650px] table-fixed border-collapse text-small">
          <colgroup>
            <col className="w-[26%]" />
            <col className="w-[21%]" />
            <col className="w-[21%]" />
            <col className="w-[32%]" />
          </colgroup>

          <thead>
            <tr className="bg-muted/30">
              <th className="border-b border-border px-4 py-3 text-left font-semibold text-subdued">
                Parameter
              </th>
              <th className="border-b border-border px-4 py-3 text-left font-semibold text-subdued">
                Low
              </th>
              <th className="border-b border-border px-4 py-3 text-left font-semibold text-subdued">
                High
              </th>
              <th className="border-b border-border px-4 py-3 text-left font-semibold text-subdued">
                CPP range <span className="text-micro">(BPR)</span>
              </th>
            </tr>
          </thead>

          <tbody>
            {parameters.map((parameter) => (
              <tr key={parameter.key} className="hover:bg-muted/30">
                <td className="border-b border-border px-4 py-4 text-text">
                  {parameter.name}
                </td>

                {(["Low", "High"] as const).map((level) => (
                  <td
                    key={level}
                    className="border-b border-border px-2 py-2"
                  >
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        step="any"
                        aria-label={`${parameter.name}, ${level}`}
                        value={levels[parameter.key][level]}
                        onChange={(event) =>
                          handleLevelChange(
                            parameter.key,
                            level,
                            event.target.value,
                          )
                        }
                        className="h-9 min-w-0 flex-1 rounded-md border border-border-strong bg-white px-2 font-mono text-small text-text outline-none focus:border-[#0e8c8c]"
                      />

                      <span className="w-7 shrink-0 text-micro text-subdued">
                        {parameter.unit}
                      </span>
                    </div>
                  </td>
                ))}

                <td className="border-b border-border px-4 py-4 font-sans text-micro text-subdued">
                  {parameter.cppRange}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* At each speed */}
      <div className="mt-4 rounded-lg border border-border p-4">
        <h4 className="text-small font-semibold text-text">
          At each speed
        </h4>

        <p className="mt-2 text-micro leading-5 text-subdued">
          Camera challenge test, pin hole and splice detector challenge test at
          each speed.
        </p>

        <p className="mt-3 text-small leading-5 text-text">
          <span className="font-semibold">Acceptance criteria</span>
          <br />
          All the blisters of the challenge test should be rejected.
        </p>

        <p className="mt-3 text-micro text-subdued">
          Sample qty NA · Sampling point NA
        </p>
      </div>

      {/* Blister packing */}
      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-small font-semibold text-text">
              Blister packing
            </h4>

            <p className="mt-1 text-micro text-subdued">
              Challenge studies for different speed and temperature conditions.
            </p>
          </div>

          <span className="rounded-full border border-border px-3 py-1 text-micro text-subdued">
            {filledRunTimes} of {studies.length} run times filled
          </span>
        </div>

        {/* Additional challenges */}
        <div className="mt-4 rounded-lg border border-dashed border-border-strong p-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h5 className="text-small font-semibold text-text">
                Challenge studies
              </h5>

              <p className="mt-1 text-micro leading-5 text-subdued">
                Add and configure blister packing challenge studies.
              </p>
            </div>

            <span className="rounded-full border border-border px-3 py-1 text-micro text-subdued">
              {studies.length} added
            </span>
          </div>

          <div className="space-y-3">
            {studies.map((study) => (
              <article
                key={study.id}
                className="overflow-hidden rounded-lg border border-border bg-white"
              >
                {renderStudyFields(study)}
              </article>
            ))}

            {studies.length === 0 && (
              <p className="rounded-md border border-dashed border-border bg-white px-4 py-5 text-center text-micro text-subdued">
                No challenge studies yet. Add one to configure a blister
                packing study.
              </p>
            )}
          </div>

          {showNameInput && (
            <div className="mt-4 rounded-md border border-border bg-white p-4">
              <label
                htmlFor="new-challenge-name"
                className="mb-1 block text-small font-medium text-subdued"
              >
                Challenge name
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  id="new-challenge-name"
                  type="text"
                  autoFocus
                  value={newChallengeName}
                  onChange={(event) => setNewChallengeName(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") confirmAddStudy();
                    if (event.key === "Escape") cancelAddStudy();
                  }}
                  placeholder="e.g. Low speed – High temperature challenge"
                  className="h-10 min-w-0 flex-1 rounded-md border border-border-strong bg-white px-3 text-small text-text outline-none focus:border-[#0e8c8c]"
                />

                <button
                  type="button"
                  onClick={confirmAddStudy}
                  disabled={!newChallengeName.trim()}
                  className="h-10 rounded-md bg-[#0e8c8c] px-4 text-small font-medium text-white hover:bg-[#0e8c8c]/90 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Add
                </button>

                <button
                  type="button"
                  onClick={cancelAddStudy}
                  className="h-10 rounded-md px-3 text-small font-medium text-subdued hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setShowNameInput(true)}
              disabled={
                showNameInput || studies.length >= conditionOptions.length
              }
              className="inline-flex min-h-9 items-center gap-2 rounded-md border border-dashed border-[#0e8c8c] px-3 py-2 text-small font-medium text-[#0e8c8c] hover:bg-[#0e8c8c]/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              + Add additional challenge
            </button>

            <span className="text-micro text-subdued">
              {Math.max(0, conditionOptions.length - studies.length)} more
              unique conditions available
            </span>
          </div>
        </div>
      </div>

      {/* Re-packing */}
      <div className="mt-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h4 className="text-small font-semibold text-text">
              Re-packing
            </h4>

            <p className="mt-1 text-micro text-subdued">
              Sampled for QC as per the sampling plan
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-border px-3 py-1 text-micro text-subdued">
              {filledRepackingRunTimes} of {repackingStudies.length} run times
              filled
            </span>

            <button
              type="button"
              onClick={() => toggleAllStudies(repackingStudies)}
              aria-expanded={!allCollapsed(repackingStudies)}
              className="rounded-lg border border-teal-200 px-3 py-1.5 text-small font-medium text-teal-700 hover:bg-teal-50"
            >
              {allCollapsed(repackingStudies) ? "Expand All" : "Close All"}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {repackingStudies.map((study) => (
            <article
              key={study.id}
              className="overflow-hidden rounded-lg border border-border bg-white"
            >
              {renderStudyFields(study, true)}
            </article>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={addRepackingStudy}
            disabled={repackingStudies.length >= conditionOptions.length}
            className="rounded-md border border-border-strong px-4 py-2 text-small font-medium text-text hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            + Add challenge study
          </button>

          <span className="text-micro text-subdued">
            {conditionOptions.length - repackingStudies.length} more conditions
            available for Re-packing
          </span>
        </div>
      </div>
    </section>
  );
};
