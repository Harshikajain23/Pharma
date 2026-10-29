import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

type UCCriterion = {
  id: number;
  type: "range" | "rsd" | "l1l2";
  min: string;
  max: string;
  nmt: string;
  l1: string;
  l2: string;
  appliesTo: "1" | "2" | "all";
};

const COMPANY_RULES = {
  under: {
    intervals: 20,
    tablets: 7,
    mode: "tablets" as const,
    first: 3,
    firstIntervals: 20,
  },
  over: {
    intervals: 40,
    tablets: 3,
    mode: "intervals" as const,
    first: 3,
    firstIntervals: 20,
  },
};

export function ContentUniformityPanel() {
  const [enabled, setEnabled] = useState(true);
  const [runTime, setRunTime] = useState("1.5");
  const [custom, setCustom] = useState(false);

  const [intervalInput, setIntervalInput] = useState("20");
  const [tabletsInput, setTabletsInput] = useState("7");

  const [splitMode, setSplitMode] = useState<"tablets" | "intervals">(
    "tablets",
  );

  const [firstSetInput, setFirstSetInput] = useState("3");
  const [firstIntervalsInput, setFirstIntervalsInput] = useState("20");

  const [scheme, setScheme] = useState<"set" | "tier">("set");
  const [weightVariation, setWeightVariation] = useState(true);
  const [weightQty, setWeightQty] = useState("30");

  const [criteria, setCriteria] = useState<UCCriterion[]>([
    {
      id: 1,
      type: "range",
      min: "85.0",
      max: "115.0",
      nmt: "6.0",
      l1: "15.0",
      l2: "25.0",
      appliesTo: "all",
    },
  ]);

  const [generated, setGenerated] = useState(false);
  const [editedProcedure, setEditedProcedure] = useState("");

  const hours = Math.max(0, Number(runTime) || 0);

  const selectedRule: "under" | "over" = hours > 2 ? "over" : "under";
  const defaultRule = COMPANY_RULES[selectedRule];

  const intervals = Math.max(
    1,
    Math.floor(custom ? Number(intervalInput) || 1 : defaultRule.intervals),
  );

  const tabletsPerInterval = Math.max(
    1,
    Math.floor(custom ? Number(tabletsInput) || 1 : defaultRule.tablets),
  );

  const mode = custom ? splitMode : defaultRule.mode;

  const firstPerInterval = Math.min(
    tabletsPerInterval,
    Math.max(
      0,
      Math.floor(Number(custom ? firstSetInput : defaultRule.first) || 0),
    ),
  );

  const firstIntervalCount = Math.min(
    intervals,
    Math.max(
      0,
      Math.floor(
        Number(custom ? firstIntervalsInput : defaultRule.firstIntervals) || 0,
      ),
    ),
  );

  const totalTablets = intervals * tabletsPerInterval;

  const firstSetCount =
    mode === "tablets"
      ? intervals * firstPerInterval
      : firstIntervalCount * tabletsPerInterval;

  const secondSetCount = Math.max(0, totalTablets - firstSetCount);

  const intervalMinutes = intervals > 0 ? (hours * 60) / intervals : 0;

  const firstLabel = scheme === "set" ? "Set I" : "Tier 1";
  const secondLabel = scheme === "set" ? "Set II" : "Tier 2";

  function applyRuleDefaults(rule: "under" | "over") {
    const d = COMPANY_RULES[rule];

    setIntervalInput(String(d.intervals));
    setTabletsInput(String(d.tablets));
    setSplitMode(d.mode);
    setFirstSetInput(String(d.first));
    setFirstIntervalsInput(String(d.firstIntervals));
    setCustom(false);
    setGenerated(false);
  }

  function handleRunTimeChange(value: string) {
    const previousRule = selectedRule;
    const nextHours = Math.max(0, Number(value) || 0);
    const nextRule = nextHours > 2 ? "over" : "under";

    setRunTime(value);

    if (nextRule !== previousRule) {
      applyRuleDefaults(nextRule);
    } else {
      setGenerated(false);
    }
  }

  function updateCriterion(
    id: number,
    field: keyof Omit<UCCriterion, "id">,
    value: string,
  ) {
    setCriteria((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    );

    setGenerated(false);
  }

  function addCriterion(type: UCCriterion["type"]) {
    setCriteria((previous) => [
      ...previous,
      {
        id: Date.now(),
        type,
        min: "85.0",
        max: "115.0",
        nmt: "6.0",
        l1: "15.0",
        l2: "25.0",
        appliesTo: "all",
      },
    ]);

    setGenerated(false);
  }

  function removeCriterion(id: number) {
    setCriteria((previous) => previous.filter((item) => item.id !== id));
    setGenerated(false);
  }

  function getCriterionText(item: UCCriterion) {
    if (item.type === "range") {
      return `individual content within ${item.min}%–${item.max}% of label claim`;
    }

    if (item.type === "rsd") {
      return `%RSD not more than ${item.nmt}%`;
    }

    return `acceptance value (AV) evaluated against L1 = ${item.l1} and L2 = ${item.l2}, according to the approved specification`;
  }

  const criterionText = criteria.map((item) => {
    const applies =
      item.appliesTo === "all"
        ? "all sets/tiers"
        : item.appliesTo === "1"
          ? firstLabel
          : secondLabel;

    return `${getCriterionText(item)} (applies to ${applies})`;
  });

  const procedureText = [
    `The compression machine run time is approximately ${hours} hour(s). The selected sampling rule is ${
      selectedRule === "under" ? "≤ 2 h" : "> 2 h"
    }. The sampling plan uses ${intervals} intervals, with approximately ${intervalMinutes.toFixed(
      1,
    )} minutes between intervals. Collect ${tabletsPerInterval} tablets from each interval, giving a total of ${totalTablets} tablets. Label each interval sample with the product name, batch number, interval number and sampling time.`,

    mode === "tablets"
      ? `Randomly select ${firstPerInterval} tablet(s) from each interval for ${firstLabel}, giving ${firstSetCount} tablets in total. Allocate the remaining ${
          tabletsPerInterval - firstPerInterval
        } tablet(s) from each interval to ${secondLabel}, giving ${secondSetCount} tablets in total.`
      : `Select ${firstIntervalCount} complete interval(s) for ${firstLabel}, giving ${firstSetCount} tablets. Allocate samples from the remaining ${
          intervals - firstIntervalCount
        } interval(s) to ${secondLabel}, giving ${secondSetCount} tablets.`,

    `${firstLabel} shall be evaluated against the approved protocol and acceptance criteria. If the initial evaluation does not meet the approved requirements, handle ${secondLabel} according to the approved protocol and investigation procedure. Reserve samples must not be treated as an automatic retest without the required authorisation.`,

    ...(criterionText.length
      ? [
          `Acceptance criteria to be confirmed against the approved product specification: ${criterionText.join(
            "; ",
          )}.`,
        ]
      : []),

    ...(weightVariation
      ? [
          `Collect ${Math.max(
            0,
            Number(weightQty) || 0,
          )} tablets for weight variation testing, if required by the approved protocol. Record results in the appropriate controlled record.`,
        ]
      : []),

    "Identify and label all samples, record sampling details in the applicable register, and transfer samples to QC with the required documentation. Verify the final sampling quantities and acceptance criteria against the approved protocol and SOP before execution.",
  ].join("\n\n");

  function generateProcedure() {
    setEditedProcedure(procedureText);
    setGenerated(true);
  }

  const inputClass =
    "w-full min-w-0 rounded-control border border-border bg-white px-3 py-2 text-small text-text outline-none focus:border-[#0e8c8c] focus:ring-1 focus:ring-[#0e8c8c]/20";

  const labelClass = "mb-1.5 block text-small font-medium text-text";
  const sectionClass = "rounded-lg border border-border p-4 space-y-4";
  const addBtn =
    "inline-flex items-center gap-2 rounded-control border border-dashed border-[#0e8c8c] px-3 py-2 text-sm font-medium text-[#0e8c8c] hover:bg-[#0e8c8c]/5";

  return (
    <div className="space-y-5">
      <div className="flex cursor-pointer items-start gap-3 p-3">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="mt-1 accent-[#0e8c8c]"
        />
        <div>
          <p className="text-small font-semibold text-text">
            Include content uniformity by stratified sampling
          </p>
        </div>
      </div>

      {enabled && (
        <>
          <section className={sectionClass}>
            <h4 className="text-small font-semibold text-text">
              1. Run Time &amp; Sampling
            </h4>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-[30%_minmax(0,1fr)]">
              <div className="space-y-3">
                <p className="text-small font-medium text-text">
                  Machine run time
                </p>

                <div className="flex items-center gap-2">
                  <div className="w-1/2">
                    <input
                      type="number"
                      min="0"
                      step="0.25"
                      value={runTime}
                      onChange={(event) =>
                        handleRunTimeChange(event.target.value)
                      }
                      className={`${inputClass} w-32 shrink-0`}
                    />
                  </div>
                  <span className="whitespace-nowrap text-small text-subdued">
                    H at optimum speed
                  </span>
                </div>
              </div>

              <div className="min-w-0 space-y-3">
                {(["under", "over"] as const).map((rule) => {
                  const isUnder = rule === "under";
                  const isSelected = selectedRule === rule;
                  const ruleDefaults = COMPANY_RULES[rule];

                  const ruleIntervals =
                    isSelected && custom ? intervals : ruleDefaults.intervals;

                  const ruleTablets =
                    isSelected && custom
                      ? tabletsPerInterval
                      : ruleDefaults.tablets;

                  const ruleMode =
                    isSelected && custom ? splitMode : ruleDefaults.mode;

                  const ruleFirst =
                    isSelected && custom
                      ? firstPerInterval
                      : ruleDefaults.first;

                  const ruleFirstIntervals =
                    isSelected && custom
                      ? firstIntervalCount
                      : ruleDefaults.firstIntervals;

                  const ruleTotal = ruleIntervals * ruleTablets;

                  return (
                    <div
                      key={rule}
                      aria-checked={isSelected}
                      role="radio"
                      className={`w-full rounded-lg border p-3 text-left transition ${
                        isSelected
                          ? "border-[#0e8c8c] bg-[#0e8c8c]/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="radio"
                          name="companySamplingRule"
                          checked={isSelected}
                          readOnly
                          tabIndex={-1}
                          className="mt-1 shrink-0 accent-[#0e8c8c]"
                        />

                        <div className="flex min-w-0 items-start gap-3">
                          <p className="shrink-0 whitespace-nowrap text-small font-semibold text-text">
                            {isUnder ? "≤ 2 h" : "> 2 h"}
                          </p>

                          <p className="min-w-0 text-micro leading-5 text-subdued">
                            {ruleIntervals} intervals × {ruleTablets} tabs ={" "}
                            {ruleTotal} ·{" "}
                            {ruleMode === "tablets" ? (
                              <>
                                {ruleFirst} random tabs / interval →{" "}
                                {firstLabel} · {ruleTablets - ruleFirst} tabs /
                                interval → {secondLabel}
                              </>
                            ) : (
                              <>
                                {ruleFirstIntervals} random intervals →{" "}
                                {firstLabel} · other{" "}
                                {ruleIntervals - ruleFirstIntervals} intervals →{" "}
                                {secondLabel}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Number of intervals</label>
                <input
                  type="number"
                  min="1"
                  value={custom ? intervalInput : intervals}
                  readOnly={!custom}
                  onChange={(event) => {
                    setIntervalInput(event.target.value);
                    setGenerated(false);
                  }}
                  className={`${inputClass} ${!custom ? "bg-muted/20" : ""}`}
                />
              </div>

              <div>
                <label className={labelClass}>Tablets per interval</label>
                <input
                  type="number"
                  min="1"
                  value={custom ? tabletsInput : tabletsPerInterval}
                  readOnly={!custom}
                  onChange={(event) => {
                    setTabletsInput(event.target.value);
                    setGenerated(false);
                  }}
                  className={`${inputClass} ${!custom ? "bg-muted/20" : ""}`}
                />
              </div>

              <div>
                <label className={labelClass}>
                  {scheme === "set" ? "Set I selection" : "Tier 1 selection"}
                </label>
                <select
                  value={mode === "tablets" ? "tab" : "int"}
                  disabled={!custom}
                  onChange={(event) => {
                    setSplitMode(
                      event.target.value === "tab" ? "tablets" : "intervals",
                    );
                    setGenerated(false);
                  }}
                  className={`${inputClass} ${!custom ? "bg-muted/20" : ""}`}
                >
                  <option value="tab">
                    Random tablets from every interval
                  </option>
                  <option value="int">
                    Random intervals (all their tablets)
                  </option>
                </select>
              </div>

              {mode === "tablets" ? (
                <div>
                  <label className={labelClass}>
                    {scheme === "set"
                      ? "Set I tablets per interval"
                      : "Tier 1 tablets per interval"}
                    <span className="ml-2 text-micro text-subdued">
                      {scheme === "set" ? "Rest to Set II" : "Rest to Tier 2"}
                    </span>
                  </label>

                  <select
                    value={custom ? firstSetInput : defaultRule.first}
                    disabled={!custom}
                    onChange={(event) => {
                      setFirstSetInput(event.target.value);
                      setGenerated(false);
                    }}
                    className={`${inputClass} ${!custom ? "bg-muted/20" : ""}`}
                  >
                    {Array.from(
                      { length: tabletsPerInterval + 1 },
                      (_, index) => (
                        <option key={index} value={index}>
                          {index}
                        </option>
                      ),
                    )}
                  </select>
                </div>
              ) : (
                <div>
                  <label className={labelClass}>
                    {scheme === "set"
                      ? "Number of Set I intervals"
                      : "Number of Tier 1 intervals"}
                    <span className="ml-2 text-micro text-subdued">
                      {scheme === "set"
                        ? "Remaining intervals to Set II"
                        : "Remaining intervals to Tier 2"}
                    </span>
                  </label>

                  <select
                    value={
                      custom ? firstIntervalsInput : defaultRule.firstIntervals
                    }
                    disabled={!custom}
                    onChange={(event) => {
                      setFirstIntervalsInput(event.target.value);
                      setGenerated(false);
                    }}
                    className={`${inputClass} ${!custom ? "bg-muted/20" : ""}`}
                  >
                    {Array.from({ length: intervals + 1 }, (_, index) => (
                      <option key={index} value={index}>
                        {index}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                if (custom) {
                  applyRuleDefaults(selectedRule);
                } else {
                  setCustom(true);
                }
              }}
              className="text-sm font-medium text-[#0e8c8c] hover:underline"
            >
              {custom ? "Reset to company rule" : "Change for this product"}
            </button>

            <p className="text-sm text-gray-500">
              {custom
                ? "Custom values for this product"
                : "Following the company rule for this run time"}
            </p>
          </section>

          <section className={sectionClass}>
            <h4 className="text-small font-semibold text-text">
              2. Sample analysis
            </h4>

            <div className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => {
                  setScheme("set");
                  setGenerated(false);
                }}
                className={`flex flex-col items-start rounded-control border px-3 py-2 text-left text-small font-medium ${
                  scheme === "set"
                    ? "border-[#0e8c8c] bg-[#0e8c8c]/5 text-[#0e8c8c]"
                    : "border-border text-subdued"
                }`}
              >
                <span>Set I / Set II</span>
                <span className="mt-1 block text-xs font-normal text-gray-600">
                  Set I to QC. If it fails, Set II (reserve) is studied as part
                  of investigation.
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setScheme("tier");
                  setGenerated(false);
                }}
                className={`flex flex-col items-start rounded-control border px-3 py-2 text-left text-small font-medium ${
                  scheme === "tier"
                    ? "border-[#0e8c8c] bg-[#0e8c8c]/5 text-[#0e8c8c]"
                    : "border-border text-subdued"
                }`}
              >
                <span>Tier 1 / Tier 2</span>
                <span className="mt-1 block text-xs font-normal text-gray-600">
                  Tier 1 to QC. If it fails, Tier 2 (reserve) is analysed and
                  judged with its own criteria.
                </span>
              </button>
            </div>
          </section>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-text">
                Acceptance criteria
              </h3>
              <p className="mt-1 text-xs text-subdued">
                Define the criteria and specify which set or tier they apply to.
              </p>
            </div>

            <div className="space-y-3">
              {criteria.map((item) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 items-start gap-3 rounded-lg border border-border p-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
                >
                  <div className="min-w-0">
                    <label className={labelClass}>Criterion</label>
                    <select
                      value={item.type}
                      onChange={(event) =>
                        updateCriterion(
                          item.id,
                          "type",
                          event.target.value as UCCriterion["type"],
                        )
                      }
                      className={inputClass}
                    >
                      <option value="range">Range (% of label claim)</option>
                      <option value="rsd">% RSD (NMT)</option>
                      <option value="l1l2">L1 &amp; L2 (AV)</option>
                    </select>
                  </div>

                  <div className="min-w-0">
                    <label className={labelClass}>Limits</label>

                    {item.type === "range" && (
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="shrink-0 text-sm text-subdued">
                          L1
                        </span>
                        <input
                          type="number"
                          value={item.min}
                          onChange={(event) =>
                            updateCriterion(item.id, "min", event.target.value)
                          }
                          placeholder="Min"
                          aria-label="L1 minimum content percentage"
                          className={`${inputClass} min-w-0 flex-1`}
                        />

                        <span className="text-subdued">–</span>

                        <span className="shrink-0 text-sm text-subdued">
                          L2
                        </span>
                        <input
                          type="number"
                          value={item.max}
                          onChange={(event) =>
                            updateCriterion(item.id, "max", event.target.value)
                          }
                          placeholder="Max"
                          aria-label="L2 maximum content percentage"
                          className={`${inputClass} min-w-0 flex-1`}
                        />
                      </div>
                    )}

                    {item.type === "rsd" && (
                      <div className="flex items-center gap-2">
                        <span className="shrink-0 text-sm text-subdued">
                          NMT
                        </span>
                        <input
                          type="number"
                          value={item.nmt}
                          onChange={(event) =>
                            updateCriterion(item.id, "nmt", event.target.value)
                          }
                          placeholder="% RSD"
                          className={inputClass}
                        />
                        <span className="text-sm text-subdued">%</span>
                      </div>
                    )}

                    {item.type === "l1l2" && (
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={item.l1}
                          onChange={(event) =>
                            updateCriterion(item.id, "l1", event.target.value)
                          }
                          aria-label="L1 acceptance value limit"
                          className={inputClass}
                        />

                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={item.l2}
                          onChange={(event) =>
                            updateCriterion(item.id, "l2", event.target.value)
                          }
                          aria-label="L2 acceptance value limit"
                          className={inputClass}
                        />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <label className={labelClass}>Applies to</label>
                    <select
                      value={item.appliesTo}
                      onChange={(event) =>
                        updateCriterion(
                          item.id,
                          "appliesTo",
                          event.target.value as UCCriterion["appliesTo"],
                        )
                      }
                      className={inputClass}
                    >
                      <option value="1">{firstLabel}</option>
                      <option value="2">{secondLabel}</option>
                      <option value="all">Both</option>
                    </select>
                  </div>

                  <div className="flex justify-end sm:pt-6">
                    <button
                      type="button"
                      onClick={() => removeCriterion(item.id)}
                      aria-label="Remove acceptance criterion"
                      className="inline-flex size-9 items-center justify-center rounded-control border border-border text-subdued hover:border-red-300 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>

                  {item.type === "l1l2" && (
                    <p className="text-xs leading-5 text-subdued sm:col-span-4">
                      Acceptance value (AV) must be assessed using the
                      applicable pharmacopoeial method and approved product
                      specification.
                    </p>
                  )}
                </div>
              ))}
            </div>

    <div className="flex flex-wrap gap-2">
  <button
    type="button"
    onClick={() => addCriterion("range")}
    className={addBtn}
  >
    <Plus className="size-4" />
    Add range
  </button>

  <button
    type="button"
    onClick={() => addCriterion("rsd")}
    className={addBtn}
  >
    <Plus className="size-4" />
    Add % RSD
  </button>

  <button
    type="button"
    onClick={() => addCriterion("l1l2")}
    className={addBtn}
  >
    <Plus className="size-4" />
    Add L1 &amp; L2
  </button>

  <div className="w-full flex justify-end mt-2">
    <button
      type="button"
      onClick={generateProcedure}
      className="inline-flex min-h-9 items-center gap-2 rounded-control bg-[#0e8c8c] px-4 py-2 text-small font-semibold text-white hover:bg-[#0b7777]"
    >
      Generate procedure
    </button>
  </div>
</div>

              
          </div>

          <section className={sectionClass}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-small font-semibold text-text">
                  4. Procedure and sampling plan
                </h4>
                <p className="mt-1 text-micro text-subdued">
                  Generate a draft from the current settings, then review it
                  before use.
                </p>
              </div>

           
            </div>

            {generated && (
              <>
                <div>
                  <label className={labelClass}>
                    Generated procedure (editable)
                  </label>
                  <textarea
                    value={editedProcedure}
                    onChange={(event) => setEditedProcedure(event.target.value)}
                    rows={8}
                    className={inputClass}
                  />
                </div>

                <div className="overflow-x-auto rounded-lg border border-border">
                  <table className="w-full min-w-[540px] border-collapse text-small">
                    <thead className="bg-muted/30">
                      <tr>
                        <th className="border-b border-border px-3 py-3 text-left">
                          Sample group
                        </th>
                        <th className="border-b border-border px-3 py-3 text-right">
                          Tablets
                        </th>
                        <th className="border-b border-border px-3 py-3 text-left">
                          Allocation
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      <tr>
                        <td className="border-b border-border/70 px-3 py-3">
                          {firstLabel}
                        </td>
                        <td className="border-b border-border/70 px-3 py-3 text-right">
                          {firstSetCount}
                        </td>
                        <td className="border-b border-border/70 px-3 py-3">
                          {mode === "tablets"
                            ? `${firstPerInterval} tablet(s) per interval`
                            : `${firstIntervalCount} complete interval(s)`}
                        </td>
                      </tr>

                      <tr>
                        <td className="border-b border-border/70 px-3 py-3">
                          {secondLabel}
                        </td>
                        <td className="border-b border-border/70 px-3 py-3 text-right">
                          {secondSetCount}
                        </td>
                        <td className="border-b border-border/70 px-3 py-3">
                          Remaining samples
                        </td>
                      </tr>

                      {weightVariation && (
                        <tr>
                          <td className="px-3 py-3">Weight variation</td>
                          <td className="px-3 py-3 text-right">
                            {Math.max(0, Number(weightQty) || 0)}
                          </td>
                          <td className="px-3 py-3">
                            Additional quantity specified above
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div>
                  <h5 className="mb-2 text-small font-semibold text-text">
                    Interval-wise sampling
                  </h5>

                  <div className="max-h-72 overflow-auto rounded-lg border border-border">
                    <table className="w-full min-w-[600px] border-collapse text-small">
                      <thead className="sticky top-0 bg-muted/50">
                        <tr>
                          <th className="border-b border-border px-3 py-2 text-left">
                            Interval
                          </th>
                          <th className="border-b border-border px-3 py-2 text-left">
                            Approx. time
                          </th>
                          <th className="border-b border-border px-3 py-2 text-right">
                            Collected
                          </th>
                          <th className="border-b border-border px-3 py-2 text-right">
                            {firstLabel}
                          </th>
                          <th className="border-b border-border px-3 py-2 text-right">
                            {secondLabel}
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        {Array.from({ length: intervals }, (_, index) => {
                          const firstCount =
                            mode === "tablets"
                              ? firstPerInterval
                              : index < firstIntervalCount
                                ? tabletsPerInterval
                                : 0;

                          const secondCount = tabletsPerInterval - firstCount;
                          const time = Math.round(
                            (index + 1) * intervalMinutes,
                          );

                          return (
                            <tr key={index}>
                              <td className="border-b border-border/60 px-3 py-2">
                                {index + 1}
                              </td>
                              <td className="border-b border-border/60 px-3 py-2">
                                {time} min
                              </td>
                              <td className="border-b border-border/60 px-3 py-2 text-right">
                                {tabletsPerInterval}
                              </td>
                              <td className="border-b border-border/60 px-3 py-2 text-right">
                                {firstCount}
                              </td>
                              <td className="border-b border-border/60 px-3 py-2 text-right">
                                {secondCount}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}

            <p className="text-micro leading-5 text-subdued">
              This is a frontend draft generator, not a validated or approved
              controlled document. Sampling quantities, pharmacopoeial criteria,
              and reserve-sample rules must be verified against the applicable
              approved protocol and product specification.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
