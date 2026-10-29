import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
} from "lucide-react";
import { Fragment, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { AppHeader } from "../../../features/new-document/components/AppHeader";
import { AppSidebar } from "../../../features/new-document/components/AppSidebar";
import { WizardHeader } from "../../../features/new-document/components/WizardHeader";

import { useAuthStore } from "../../../features/auth/state/auth.store";
import { useDocument } from "../../../features/new-document/hooks/useDocument";
import { useDocumentSelectorData } from "../../../features/new-document/hooks/useDocumentSelectorData";
import { useStepNavigation } from "../../../features/new-document/hooks/useStepNavigation";

import { ContentUniformityPanel } from "./ContentUniformityPanel";
import { stages } from "./stages";
import {
  Block,
  ChallengeDropdown,
  MultiSelectDropdown,
  TableHeader,
} from "./SharedUI";
import {
  blocks,
  challengeIpqcTests,
  challengeOptions,
  challengeQcTests,
  compressionBlocks,
  createCompressionChallenge,
  createCompressionPoint,
  createEmptySamplingRow,
  createInitialCompression,
  diagramOptions,
  isChallengeDone,
  isOptimumPointDone,
  optimumSamplingOptions,
  physicalTests,
  qcTests,
  testOptions,
} from "./constants";
import type {
  AdditionalCqa,
  AdditionalParameter,
  CompressionBlock,
  CompressionChallenge,
  CqaLimit,
  ProcedureBlock,
  ProcedureStage,
  SamplingPlanField,
  SamplingPlanRow,
} from "./constants";

export const Procedure = () => {
  const { documentId = "" } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);

  const { context, isLoading: isLoadingContext } =
    useDocumentSelectorData(user);

  const { document: saved } = useDocument(documentId);
  const { goToStep } = useStepNavigation(documentId, "pvp");

  const [openStage, setOpenStage] = useState<string | null>("dispensing");

  // Blocks are open by default; keys in this set are minimised.
  const [minimised, setMinimised] = useState<Set<string>>(
    () =>
      new Set([
        "compression.setup",
        "compression.optimum",
        "compression.uniformity",
        "compression.composite",
        "compression.generated",
      ]),
  );

  const [compression, setCompression] = useState<CompressionState>(
    createInitialCompression,
  );

  const [activeChallengeId, setActiveChallengeId] = useState<string | null>(
    null,
  );

  const [compressionPreviewTab, setCompressionPreviewTab] = useState<
    "proc" | "samp"
  >("proc");

  const [cqaLimits, setCqaLimits] = useState<Record<string, CqaLimit>>({});
  const [additionalCpp, setAdditionalCpp] = useState<
    Record<string, AdditionalParameter[]>
  >({});
  const [additionalCqa, setAdditionalCqa] = useState<
    Record<string, AdditionalCqa[]>
  >({});

  const [samplingPlans, setSamplingPlans] = useState<
    Record<string, SamplingPlanRow>
  >(() =>
    Object.fromEntries(
      stages.map((stage) => [stage.key, createEmptySamplingRow()]),
    ),
  );

  function handleStageClick(stageKey: string) {
    setOpenStage((previous) => (previous === stageKey ? null : stageKey));
  }

  const [referencesOpen, setReferencesOpen] = useState(false);

  const [references, setReferences] = useState<{ id: string; value: string }[]>(
    [],
  );

  function addReference() {
    setReferencesOpen(true);

    setReferences((previous) => [
      ...previous,
      {
        id: `reference-${Date.now()}-${previous.length}`,
        value: "",
      },
    ]);
  }

  function updateReference(id: string, value: string) {
    setReferences((previous) =>
      previous.map((reference) =>
        reference.id === id ? { ...reference, value } : reference,
      ),
    );
  }

  function removeReference(id: string) {
    setReferences((previous) =>
      previous.filter((reference) => reference.id !== id),
    );
  }

  function toggleBlock(key: string) {
    setMinimised((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handleSamplingStageChange(stageKey: string) {
    setOpenStage(stageKey);
    setMinimised((previous) => {
      const next = new Set(previous);
      next.delete(`${stageKey}.sampling`);
      return next;
    });
  }

  function updateCqaLimit(key: string, field: keyof CqaLimit, value: string) {
    setCqaLimits((previous) => {
      const current = previous[key];

      return {
        ...previous,
        [key]: {
          type: current?.type ?? "Range",
          min: current?.min ?? "",
          max: current?.max ?? "",
          unit: current?.unit ?? "",
          ...current,
          [field]: value,
        },
      };
    });
  }

  function addAdditionalCpp(stageKey: string) {
    setAdditionalCpp((previous) => ({
      ...previous,
      [stageKey]: [...(previous[stageKey] ?? []), { name: "", limit: "" }],
    }));
  }

  function updateAdditionalCpp(
    stageKey: string,
    index: number,
    field: keyof AdditionalParameter,
    value: string,
  ) {
    setAdditionalCpp((previous) => ({
      ...previous,
      [stageKey]: (previous[stageKey] ?? []).map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function removeAdditionalCpp(stageKey: string, index: number) {
    setAdditionalCpp((previous) => ({
      ...previous,
      [stageKey]: (previous[stageKey] ?? []).filter((_, i) => i !== index),
    }));
  }

  function addAdditionalCqa(stageKey: string) {
    setAdditionalCqa((previous) => ({
      ...previous,
      [stageKey]: [
        ...(previous[stageKey] ?? []),
        { name: "", type: "Range", min: "", max: "", unit: "" },
      ],
    }));
  }

  function updateAdditionalCqa(
    stageKey: string,
    index: number,
    field: keyof AdditionalCqa,
    value: string,
  ) {
    setAdditionalCqa((previous) => ({
      ...previous,
      [stageKey]: (previous[stageKey] ?? []).map((item, i) =>
        i === index ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function removeAdditionalCqa(stageKey: string, index: number) {
    setAdditionalCqa((previous) => ({
      ...previous,
      [stageKey]: (previous[stageKey] ?? []).filter((_, i) => i !== index),
    }));
  }

  function updateSamplingPlan(
    stageKey: string,
    field: SamplingPlanField,
    value: string,
  ) {
    setSamplingPlans((previous) => ({
      ...previous,
      [stageKey]: {
        ...(previous[stageKey] ?? createEmptySamplingRow()),
        [field]: value,
      },
    }));
  }

  function updateCompression<K extends keyof CompressionState>(
    field: K,
    value: CompressionState[K],
  ) {
    setCompression((previous) => ({ ...previous, [field]: value }));
  }

  function updateChallenge(
    id: string,
    field: "name" | "customName" | "run",
    value: string,
  ) {
    setCompression((previous) => ({
      ...previous,
      challenges: previous.challenges.map((item) =>
        item.id === id ? { ...item, [field]: value } : item,
      ),
    }));
  }

  function getChallengeName(challenge: CompressionChallenge) {
    if (challenge.name === "Other challenge") {
      return challenge.customName.trim() || "Other challenge";
    }

    return challenge.name || "Unnamed challenge";
  }

  function updateChallengeSampling(
    id: string,
    field: "lhs" | "rhs",
    value: string,
  ) {
    setCompression((previous) => ({
      ...previous,
      challenges: previous.challenges.map((item) =>
        item.id === id
          ? { ...item, ipqc: { ...item.ipqc, [field]: value } }
          : item,
      ),
    }));
  }

  function updateChallengeQcQty(id: string, value: string) {
    setCompression((previous) => ({
      ...previous,
      challenges: previous.challenges.map((item) =>
        item.id === id ? { ...item, qc: { ...item.qc, qty: value } } : item,
      ),
    }));
  }

  function toggleChallengeTest(id: string, test: string, group: "ipqc" | "qc") {
    setCompression((previous) => ({
      ...previous,
      challenges: previous.challenges.map((item) => {
        if (item.id !== id) return item;

        if (group === "ipqc") {
          const tests = item.ipqc.tests.includes(test)
            ? item.ipqc.tests.filter((value) => value !== test)
            : [...item.ipqc.tests, test];

          return { ...item, ipqc: { ...item.ipqc, tests } };
        }

        const tests = item.qc.tests.includes(test)
          ? item.qc.tests.filter((value) => value !== test)
          : [...item.qc.tests, test];

        return { ...item, qc: { ...item.qc, tests } };
      }),
    }));
  }

  function selectChallenge(name: string) {
    if (!name) return;

    const existing = compression.challenges.find((c) => c.name === name);
    if (existing) {
      setActiveChallengeId(existing.id);
      return;
    }

    const id = `challenge-${Date.now()}`;
    setCompression((previous) => ({
      ...previous,
      challenges: [
        ...previous.challenges,
        { ...createCompressionChallenge(id), name },
      ],
    }));
    setActiveChallengeId(id);
  }

  function removeCompressionChallenge(id: string) {
    setCompression((previous) => ({
      ...previous,
      challenges: previous.challenges.filter((item) => item.id !== id),
    }));
    setActiveChallengeId((previous) => (previous === id ? null : previous));
  }

  function updateOptimumPoint(
    id: string,
    field: "name" | "customName" | "qcQty",
    value: string,
  ) {
    setCompression((previous) => ({
      ...previous,
      optimumPoints: previous.optimumPoints.map((point) =>
        point.id === id ? { ...point, [field]: value } : point,
      ),
    }));
  }

  function updateOptimumPointSampling(
    id: string,
    field: "lhs" | "rhs",
    value: string,
  ) {
    setCompression((previous) => ({
      ...previous,
      optimumPoints: previous.optimumPoints.map((point) =>
        point.id === id
          ? { ...point, ipqc: { ...point.ipqc, [field]: value } }
          : point,
      ),
    }));
  }

  function toggleOptimumTest(id: string, test: string, group: "ipqc" | "qc") {
    setCompression((previous) => ({
      ...previous,
      optimumPoints: previous.optimumPoints.map((point) => {
        if (point.id !== id) return point;

        if (group === "ipqc") {
          const tests = point.ipqc.tests.includes(test)
            ? point.ipqc.tests.filter((value) => value !== test)
            : [...point.ipqc.tests, test];

          return { ...point, ipqc: { ...point.ipqc, tests } };
        }

        const tests = point.tests.includes(test)
          ? point.tests.filter((value) => value !== test)
          : [...point.tests, test];

        return { ...point, tests };
      }),
    }));
  }

  function addOptimumPoint() {
    setCompression((previous) => ({
      ...previous,
      optimumPoints: [
        ...previous.optimumPoints,
        createCompressionPoint(
          `point-${Date.now()}-${previous.optimumPoints.length}`,
        ),
      ],
    }));
  }

  function removeOptimumPoint(id: string) {
    setCompression((previous) => ({
      ...previous,
      optimumPoints: previous.optimumPoints.filter((point) => point.id !== id),
    }));
  }

  function handleBack() {
    goToStep("cpp-cqa");
  }

  function handleContinue() {
    goToStep("generate");
  }

  function renderCompressionTests(
    options: string[],
    selected: string[],
    onToggle: (test: string) => void,
  ) {
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {selected.map((test) => (
            <span
              key={test}
              className="inline-flex items-center gap-2 rounded-full border border-[#0e8c8c]/30 bg-[#0e8c8c]/5 px-3 py-1 text-micro text-[#0e8c8c]"
            >
              {test}
              <button
                type="button"
                onClick={() => onToggle(test)}
                aria-label={`Remove ${test}`}
                className="font-semibold"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {options.map((test) => (
            <label
              key={test}
              className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-small"
            >
              <input
                type="checkbox"
                checked={selected.includes(test)}
                onChange={() => onToggle(test)}
                className="accent-[#0e8c8c]"
              />
              {test}
            </label>
          ))}
        </div>
      </div>
    );
  }

  function renderCompressionContent(blockId: CompressionBlock) {
    const inputClass =
      "w-full min-w-0 rounded-control border border-border bg-white px-3 py-2 text-small text-text outline-none focus:border-[#0e8c8c] focus:ring-1 focus:ring-[#0e8c8c]/20";
    const labelClass = "mb-1.5 block text-small font-medium text-text";
    const sectionClass = "space-y-4";
    ("");
    switch (blockId) {
      case "setup":
        return (
          <div className={sectionClass}>
            <div className="max-w-md">
              <label className={labelClass}>Blend loading</label>
              <select
                value={compression.loading}
                onChange={(event) =>
                  updateCompression("loading", event.target.value)
                }
                className={inputClass}
              >
                <option>Pneumatic conveying system</option>
                <option>Gravity feeding</option>
                <option>Manual loading</option>
              </select>
            </div>
          </div>
        );

      case "challenges": {
        const challenge = compression.challenges.find(
          (item) => item.id === activeChallengeId,
        );

        return (
          <div className={sectionClass}>
            {!challenge ? (
              <div className="max-w-md">
                <label className={labelClass}>Challenge study</label>
                <ChallengeDropdown
                  options={challengeOptions}
                  value=""
                  onChange={selectChallenge}
                  isComplete={(option) => {
                    const added = compression.challenges.find(
                      (item) => item.name === option,
                    );
                    return added ? isChallengeDone(added) : false;
                  }}
                />
              </div>
            ) : (
              <>
                {/* Challenge details: all four columns stay on one line */}
                <div className="grid w-full grid-cols-[minmax(0,3fr)_minmax(0,3fr)_minmax(0,2fr)_minmax(0,2fr)] items-end gap-2">
                  {/* Challenge study */}
                  <div className="min-w-0">
                    <label className={labelClass}>Challenge study</label>
                    <ChallengeDropdown
                      options={challengeOptions}
                      value={challenge.name}
                      onChange={selectChallenge}
                      isComplete={(option) => {
                        const added = compression.challenges.find(
                          (item) => item.name === option,
                        );
                        return added ? isChallengeDone(added) : false;
                      }}
                    />
                  </div>

                  {/* Specify challenge */}
                  <div className="min-w-0">
                    {challenge.name === "Other challenge" && (
                      <>
                        <label className={labelClass}>Specify challenge</label>
                        <input
                          value={challenge.customName}
                          onChange={(event) =>
                            updateChallenge(
                              challenge.id,
                              "customName",
                              event.target.value,
                            )
                          }
                          placeholder="Enter challenge name"
                          className={inputClass}
                        />
                      </>
                    )}
                  </div>

                  {/* Run time */}
                  <div className="min-w-0">
                    <label className={labelClass}>Run time (min)</label>
                    <input
                      type="number"
                      min="0"
                      value={challenge.run}
                      onChange={(event) =>
                        updateChallenge(challenge.id, "run", event.target.value)
                      }
                      placeholder="Minutes"
                      className={inputClass}
                    />
                  </div>

                  {/* Remove */}
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => removeCompressionChallenge(challenge.id)}
                      className="inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-control px-2 text-small text-subdued hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-4 shrink-0" />
                      Remove
                    </button>
                  </div>
                </div>

                {/* IPQC and QC directly below the challenge row */}
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {/* IPQC */}
                  <div className="space-y-3 rounded-lg border border-[#0e8c8c]/25 p-3">
                    <h4 className="flex items-center text-small font-semibold text-text">
                      <span className="mr-2 rounded bg-[#0e8c8c]/10 px-2 py-1 text-micro text-[#0e8c8c]">
                        IPQC
                      </span>
                      In-process check
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="min-w-0">
                        <label className={labelClass}>
                          Sample qty — LHS (tabs)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={challenge.ipqc.lhs}
                          onChange={(event) =>
                            updateChallengeSampling(
                              challenge.id,
                              "lhs",
                              event.target.value,
                            )
                          }
                          className={inputClass}
                          placeholder="Qty"
                        />
                      </div>

                      <div className="min-w-0">
                        <label className={labelClass}>
                          Sample qty — RHS (tabs)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={challenge.ipqc.rhs}
                          onChange={(event) =>
                            updateChallengeSampling(
                              challenge.id,
                              "rhs",
                              event.target.value,
                            )
                          }
                          className={inputClass}
                          placeholder="Qty"
                        />
                      </div>
                    </div>

                    <label className={labelClass}>Tests</label>
                    <MultiSelectDropdown
                      options={challengeIpqcTests}
                      selected={challenge.ipqc.tests}
                      onChange={(tests) => {
                        challengeIpqcTests.forEach((test) => {
                          const wasSelected =
                            challenge.ipqc.tests.includes(test);
                          const shouldBeSelected = tests.includes(test);

                          if (wasSelected !== shouldBeSelected) {
                            toggleChallengeTest(challenge.id, test, "ipqc");
                          }
                        });
                      }}
                    />
                  </div>

                  {/* QC */}
                  <div className="space-y-3 rounded-lg border border-border p-3">
                    <h4 className="flex items-center text-small font-semibold text-text">
                      <span className="mr-2 rounded bg-muted px-2 py-1 text-micro text-text">
                        QC
                      </span>
                      Sent to QC
                    </h4>

                    <div>
                      <label className={labelClass}>Sample qty (tabs)</label>
                      <input
                        type="number"
                        min="0"
                        value={challenge.qc.qty}
                        onChange={(event) =>
                          updateChallengeQcQty(challenge.id, event.target.value)
                        }
                        className={inputClass}
                        placeholder="Qty"
                      />
                    </div>

                    <label className={labelClass}>Tests</label>
                    <MultiSelectDropdown
                      options={challengeQcTests}
                      selected={challenge.qc.tests}
                      onChange={(tests) => {
                        challengeQcTests.forEach((test) => {
                          const wasSelected = challenge.qc.tests.includes(test);
                          const shouldBeSelected = tests.includes(test);

                          if (wasSelected !== shouldBeSelected) {
                            toggleChallengeTest(challenge.id, test, "qc");
                          }
                        });
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        );
      }

      case "optimum":
        return (
          <div className={sectionClass}>
            {/* Optimum run time */}
            <div className="max-w-lg">
              <label className={labelClass}>Run at optimum for</label>
              <div className="flex w-1/2 items-center gap-3">
                <input
                  type="number"
                  min="0"
                  value={compression.optimumRun}
                  onChange={(event) =>
                    updateCompression("optimumRun", event.target.value)
                  }
                  className={`${inputClass}`}
                />
                <span className="shrink-0 text-small text-subdued">
                  min, then until batch completion
                </span>
              </div>
            </div>

            {/* Sampling points */}
            {compression.optimumPoints.map((point, index) => (
              <div
                key={point.id}
                className="space-y-4 rounded-lg border border-border p-4"
              >
                {/* Sampling point, Specify sampling point, Remove */}
                <div className="grid w-full grid-cols-[minmax(0,3fr)_minmax(0,3fr)_minmax(0,2fr)] items-end gap-2">
                  {/* Sampling point */}
                  <div className="min-w-0">
                    <label className={labelClass}>
                      Sampling point {index + 1}
                    </label>

                    <ChallengeDropdown
                      options={optimumSamplingOptions}
                      value={point.name}
                      onChange={(value) =>
                        updateOptimumPoint(point.id, "name", value)
                      }
                      isComplete={(option) => {
                        if (option !== point.name) return false;

                        return isOptimumPointDone(point);
                      }}
                    />
                  </div>

                  {/* Specify sampling point */}
                  <div className="min-w-0">
                    {point.name === "Other sampling point" && (
                      <>
                        <label className={labelClass}>
                          Specify sampling point
                        </label>
                        <input
                          value={point.customName}
                          onChange={(event) =>
                            updateOptimumPoint(
                              point.id,
                              "customName",
                              event.target.value,
                            )
                          }
                          placeholder="Enter sampling point"
                          className={inputClass}
                        />
                      </>
                    )}
                  </div>

                  {/* Remove */}
                  <div className="min-w-0">
                    <button
                      type="button"
                      onClick={() => removeOptimumPoint(point.id)}
                      disabled={compression.optimumPoints.length === 1}
                      className="inline-flex min-h-9 w-full items-center justify-center gap-1 rounded-control px-2 text-small text-subdued hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                    >
                      <Trash2 className="size-4 shrink-0" />
                      Remove
                    </button>
                  </div>
                </div>

                {/* IPQC and QC */}
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {/* IPQC */}
                  <div className="space-y-3 rounded-lg border border-[#0e8c8c]/25 p-3">
                    <h4 className="flex items-center text-small font-semibold text-text">
                      <span className="mr-2 rounded bg-[#0e8c8c]/10 px-2 py-1 text-micro text-[#0e8c8c]">
                        IPQC
                      </span>
                      In-process check
                    </h4>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="min-w-0">
                        <label className={labelClass}>
                          Sample qty — LHS (tabs)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={point.ipqc.lhs}
                          onChange={(event) =>
                            updateOptimumPointSampling(
                              point.id,
                              "lhs",
                              event.target.value,
                            )
                          }
                          className={inputClass}
                          placeholder="Qty"
                        />
                      </div>

                      <div className="min-w-0">
                        <label className={labelClass}>
                          Sample qty — RHS (tabs)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={point.ipqc.rhs}
                          onChange={(event) =>
                            updateOptimumPointSampling(
                              point.id,
                              "rhs",
                              event.target.value,
                            )
                          }
                          className={inputClass}
                          placeholder="Qty"
                        />
                      </div>
                    </div>

                    <label className={labelClass}>Tests</label>

                    <MultiSelectDropdown
                      options={physicalTests}
                      selected={point.ipqc.tests}
                      onChange={(tests) => {
                        physicalTests.forEach((test) => {
                          const wasSelected = point.ipqc.tests.includes(test);
                          const shouldBeSelected = tests.includes(test);

                          if (wasSelected !== shouldBeSelected) {
                            toggleOptimumTest(point.id, test, "ipqc");
                          }
                        });
                      }}
                    />
                  </div>

                  {/* QC */}
                  <div className="space-y-3 rounded-lg border border-border p-3">
                    <h4 className="flex items-center text-small font-semibold text-text">
                      <span className="mr-2 rounded bg-muted px-2 py-1 text-micro text-text">
                        QC
                      </span>
                      Sent to QC
                    </h4>

                    <div>
                      <label className={labelClass}>Sample qty (tabs)</label>
                      <input
                        type="number"
                        min="0"
                        value={point.qcQty}
                        onChange={(event) =>
                          updateOptimumPoint(
                            point.id,
                            "qcQty",
                            event.target.value,
                          )
                        }
                        className={inputClass}
                        placeholder="Qty"
                      />
                    </div>

                    <label className={labelClass}>Tests</label>

                    <MultiSelectDropdown
                      options={qcTests}
                      selected={point.tests}
                      onChange={(tests) => {
                        qcTests.forEach((test) => {
                          const wasSelected = point.tests.includes(test);
                          const shouldBeSelected = tests.includes(test);

                          if (wasSelected !== shouldBeSelected) {
                            toggleOptimumTest(point.id, test, "qc");
                          }
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}

            {/* Add sampling point */}
            <button
              type="button"
              onClick={addOptimumPoint}
              className="inline-flex min-h-9 items-center gap-2 rounded-control border border-dashed border-[#0e8c8c] px-3 py-2 text-small font-medium text-[#0e8c8c] hover:bg-[#0e8c8c]/5"
            >
              <Plus className="size-4" />
              Add sampling point
            </button>
          </div>
        );
      case "uniformity":
        return <ContentUniformityPanel />;
    }
  }

  function renderBlockContent(stage: ProcedureStage, blockId: ProcedureBlock) {
    switch (blockId) {
      case "equipment":
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px] table-fixed border-collapse text-small">
        <thead className="bg-muted/30">
          <tr>
            <TableHeader>Equipment</TableHeader>
            <TableHeader>ID</TableHeader>
          </tr>
        </thead>
        <tbody>
          {stage.equipment.map((item) => (
            <tr key={item.id}>
              <td className="border-b border-border/70 px-4 py-3">
                {item.name}
              </td>
              <td className="border-b border-border/70 px-4 py-3 text-subdued">
                {item.id}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
      case "instruments":
        return (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] table-fixed border-collapse text-small">
              <colgroup>
                <col className="w-[45%]" />
                <col className="w-[20%]" />
                <col className="w-[35%]" />
              </colgroup>
              <thead className="bg-muted/30">
                <tr>
                  <TableHeader>Instrument</TableHeader>
                  <TableHeader>ID</TableHeader>
                  <TableHeader>Calibration due</TableHeader>
                </tr>
              </thead>
              <tbody>
                {stage.instruments.map((item) => (
                  <tr key={item.id}>
                    <td className="border-b border-border/70 px-4 py-3">
                      {item.name}
                    </td>
                    <td className="border-b border-border/70 px-4 py-3 text-subdued">
                      {item.id}
                    </td>
                    <td className="border-b border-border/70 px-4 py-3 text-subdued">
                      {item.calibrationDue}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "cpp":
        return (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[480px] table-fixed border-collapse text-small">
                <colgroup>
                  <col className="w-[60%]" />
                  <col className="w-[40%]" />
                </colgroup>
                <thead className="bg-muted/30">
                  <tr>
                    <TableHeader>Parameter</TableHeader>
                    <TableHeader>Limit</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {stage.cpp.map((item, index) => (
                    <tr key={`${stage.key}-cpp-${index}`}>
                      <td className="border-b border-border/70 px-4 py-3">
                        {item.name}
                      </td>
                      <td className="border-b border-border/70 px-4 py-3">
                        <div className="font-mono">{item.limit}</div>
                      </td>
                    </tr>
                  ))}

                  {(additionalCpp[stage.key] ?? []).map((item, index) => (
                    <tr
                      key={`${stage.key}-additional-cpp-${index}`}
                      className="bg-[#0e8c8c]/[0.03]"
                    >
                      <td className="border-b border-border/70 px-4 py-3 align-top">
                        <input
                          value={item.name}
                          onChange={(event) =>
                            updateAdditionalCpp(
                              stage.key,
                              index,
                              "name",
                              event.target.value,
                            )
                          }
                          placeholder="Parameter name"
                          className="w-full min-w-0 rounded-control border border-border bg-white px-3 py-2 text-small outline-none focus:border-[#0e8c8c]"
                        />
                      </td>
                      <td className="border-b border-border/70 px-4 py-3 align-top">
                        <input
                          value={item.limit}
                          onChange={(event) =>
                            updateAdditionalCpp(
                              stage.key,
                              index,
                              "limit",
                              event.target.value,
                            )
                          }
                          placeholder="Enter limit"
                          className="w-full min-w-0 rounded-control border border-border bg-white px-3 py-2 text-small outline-none focus:border-[#0e8c8c]"
                        />
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              removeAdditionalCpp(stage.key, index)
                            }
                            className="rounded-control px-3 py-1.5 text-small text-subdued hover:bg-red-50 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {stage.cpp.length === 0 &&
                    (additionalCpp[stage.key] ?? []).length === 0 && (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-4 py-4 text-small text-subdued"
                        >
                          No CPP parameters are listed for this stage. Add one
                          if required.
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => addAdditionalCpp(stage.key)}
              className="inline-flex min-h-9 items-center gap-2 rounded-control border border-dashed border-[#0e8c8c] px-3 py-2 text-small font-medium text-[#0e8c8c] hover:bg-[#0e8c8c]/5"
            >
              <Plus className="size-4" />
              Add additional CPP
            </button>
          </div>
        );

      case "cqa":
        return (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[650px] table-fixed border-collapse text-small">
                <colgroup>
                  <col className="w-[35%]" />
                  <col className="w-[65%]" />
                </colgroup>
                <thead className="bg-muted/30">
                  <tr>
                    <TableHeader>Attribute</TableHeader>
                    <TableHeader>Limit</TableHeader>
                  </tr>
                </thead>
                <tbody>
                  {stage.cqa.map((item, index) => {
                    const key = `${stage.key}-${index}`;
                    const savedLimit = cqaLimits[key];
                    const type = savedLimit?.type ?? "Range";

                    return (
                      <tr key={key}>
                        <td className="border-b border-border/70 px-4 py-3 font-medium">
                          {item.name}
                        </td>
                        <td className="border-b border-border/70 px-4 py-3">
                          {item.limit ? (
                            <>
                              <div className="font-mono">
                                {item.limit} {item.unit}
                              </div>
                              <span className="text-micro text-subdued">
                                from specification
                              </span>
                            </>
                          ) : (
                            <div className="flex flex-wrap items-center gap-2">
                              <select
                                value={type}
                                onChange={(event) =>
                                  updateCqaLimit(
                                    key,
                                    "type",
                                    event.target.value,
                                  )
                                }
                                className="rounded-control border border-border bg-white px-2 py-2 text-small outline-none focus:border-[#0e8c8c]"
                              >
                                <option value="Range">Range</option>
                                <option value="NMT">NMT</option>
                                <option value="NLT">NLT</option>
                              </select>

                              {type !== "NMT" && (
                                <input
                                  type="number"
                                  value={savedLimit?.min ?? ""}
                                  onChange={(event) =>
                                    updateCqaLimit(
                                      key,
                                      "min",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Min"
                                  className="w-24 rounded-control border border-border bg-white px-2 py-2 text-small outline-none focus:border-[#0e8c8c]"
                                />
                              )}

                              {type === "Range" && (
                                <span className="text-subdued">-</span>
                              )}

                              {type !== "NLT" && (
                                <input
                                  type="number"
                                  value={savedLimit?.max ?? ""}
                                  onChange={(event) =>
                                    updateCqaLimit(
                                      key,
                                      "max",
                                      event.target.value,
                                    )
                                  }
                                  placeholder="Max"
                                  className="w-24 rounded-control border border-border bg-white px-2 py-2 text-small outline-none focus:border-[#0e8c8c]"
                                />
                              )}

                              {item.unit || "%"}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}

                  {(additionalCqa[stage.key] ?? []).map((item, index) => (
                    <tr
                      key={`${stage.key}-additional-cqa-${index}`}
                      className="bg-[#0e8c8c]/[0.03]"
                    >
                      <td className="border-b border-border/70 px-4 py-3 align-top">
                        <input
                          value={item.name}
                          onChange={(event) =>
                            updateAdditionalCqa(
                              stage.key,
                              index,
                              "name",
                              event.target.value,
                            )
                          }
                          placeholder="Attribute"
                          className="w-full min-w-0 rounded-control border border-border bg-white px-2 py-2 text-small outline-none focus:border-[#0e8c8c]"
                        />
                      </td>
                      <td className="border-b border-border/70 px-4 py-3 align-top">
                        <div className="flex flex-wrap items-center gap-2">
                          <select
                            value={item.type}
                            onChange={(event) =>
                              updateAdditionalCqa(
                                stage.key,
                                index,
                                "type",
                                event.target.value,
                              )
                            }
                            className="rounded-control border border-border bg-white px-2 py-2 text-small outline-none focus:border-[#0e8c8c]"
                          >
                            <option value="Range">Range</option>
                            <option value="NMT">NMT</option>
                            <option value="NLT">NLT</option>
                          </select>

                          {item.type !== "NMT" && (
                            <input
                              type="number"
                              value={item.min}
                              onChange={(event) =>
                                updateAdditionalCqa(
                                  stage.key,
                                  index,
                                  "min",
                                  event.target.value,
                                )
                              }
                              placeholder="Min"
                              className="w-24 rounded-control border border-border bg-white px-2 py-2 text-small outline-none focus:border-[#0e8c8c]"
                            />
                          )}

                          {item.type === "Range" && (
                            <span className="text-subdued">-</span>
                          )}

                          {item.type !== "NLT" && (
                            <input
                              type="number"
                              value={item.max}
                              onChange={(event) =>
                                updateAdditionalCqa(
                                  stage.key,
                                  index,
                                  "max",
                                  event.target.value,
                                )
                              }
                              placeholder="Max"
                              className="w-24 rounded-control border border-border bg-white px-2 py-2 text-small outline-none focus:border-[#0e8c8c]"
                            />
                          )}

                          <input
                            value={item.unit}
                            onChange={(event) =>
                              updateAdditionalCqa(
                                stage.key,
                                index,
                                "unit",
                                event.target.value,
                              )
                            }
                            placeholder="Unit"
                            className="w-16 rounded-control border border-border bg-white px-2 py-2 text-small outline-none focus:border-[#0e8c8c]"
                          />
                        </div>
                        <div className="mt-2 flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              removeAdditionalCqa(stage.key, index)
                            }
                            className="rounded-control px-3 py-1.5 text-small text-subdued hover:bg-red-50 hover:text-red-600"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              type="button"
              onClick={() => addAdditionalCqa(stage.key)}
              className="inline-flex min-h-9 items-center gap-2 rounded-control border border-dashed border-[#0e8c8c] px-3 py-2 text-small font-medium text-[#0e8c8c] hover:bg-[#0e8c8c]/5"
            >
              <Plus className="size-4" />
              Add additional CQA
            </button>
          </div>
        );

      case "analytical":
        return (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-collapse text-small">
              <tbody>
                <tr>
                  <td className="w-[40%] border-b border-border/70 px-4 py-3 font-medium">
                    Analytical method no.
                  </td>
                  <td className="border-b border-border/70 px-4 py-3">
                    <div className="font-mono font-semibold text-text">
                      {stage.analyticalMethod}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        );

      case "sampling": {
        const row = samplingPlans[stage.key] ?? createEmptySamplingRow();
        const inputClass =
          "w-full min-w-0 rounded-control border border-border bg-white px-3 py-2 text-small text-text outline-none transition focus:border-[#0e8c8c] focus:ring-1 focus:ring-[#0e8c8c]/20";

        return (
          <div className="rounded-lg border border-border p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-small font-medium text-text">
                  Stage
                </label>
                <select
                  value={stage.key}
                  onChange={(event) =>
                    handleSamplingStageChange(event.target.value)
                  }
                  className={`${inputClass} cursor-pointer`}
                >
                  {stages.map((item) => (
                    <option key={item.key} value={item.key}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-small font-medium text-text">Test</label>
                <select
                  value={row.test}
                  onChange={(event) =>
                    updateSamplingPlan(stage.key, "test", event.target.value)
                  }
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="">Select test</option>
                  {testOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-small font-medium text-text">
                  Sample quantity
                </label>
                <input
                  value={row.sampleQuantity}
                  onChange={(event) =>
                    updateSamplingPlan(
                      stage.key,
                      "sampleQuantity",
                      event.target.value,
                    )
                  }
                  placeholder="Enter sample quantity"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-small font-medium text-text">
                  No. of samples
                </label>
                <input
                  type="number"
                  min="1"
                  value={row.numberOfSamples}
                  onChange={(event) =>
                    updateSamplingPlan(
                      stage.key,
                      "numberOfSamples",
                      event.target.value,
                    )
                  }
                  placeholder="Enter number"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-small font-medium text-text">
                  Equipment name
                </label>
                <select
                  value={row.equipmentName}
                  onChange={(event) =>
                    updateSamplingPlan(
                      stage.key,
                      "equipmentName",
                      event.target.value,
                    )
                  }
                  className={`${inputClass} cursor-pointer`}
                >
                  <option value="">Select equipment</option>
                  {stage.equipment.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name} ({item.id})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-small font-medium text-text">
                  Diagram
                </label>
                <select
                  value={row.diagram}
                  onChange={(event) =>
                    updateSamplingPlan(stage.key, "diagram", event.target.value)
                  }
                  className={`${inputClass} cursor-pointer`}
                >
                  {diagramOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
      }
    }
  }

  const compressionOpen = openStage === "compression";

  return (
    <div className="fixed inset-0 flex flex-col bg-background text-text">
      <AppHeader
        user={user}
        unit={context?.unit ?? null}
        isLoadingUnit={isLoadingContext}
      />

      <div className="min-h-0 flex-1 lg:grid lg:grid-cols-[var(--sidebar-w)_minmax(0,1fr)]">
        <AppSidebar user={user} />

        <main className="min-h-0 overflow-y-auto">
          <section className="flex min-h-full flex-col bg-surface">
            <div className="bg-background">
              <WizardHeader
                activeStepId="procedure-sampling-plan"
                completedStepIds={saved?.completed_steps ?? []}
                onStepClick={goToStep}
                title="Procedure & sampling plan"
                description="Open a stage, then open each block. Equipment, instruments and analytical method are read-only. CPP limits come from the BMR and CQA limits from the specification where available; where a limit is missing you can set it (Range / NMT / NLT)."
                identifier={saved?.draft_id ?? documentId}
                status="DRAFT"
                dosageForm={saved?.dosage_form}
                docType="pvp"
                isPvp
                validationType="manufacturing"
              />
            </div>

            <div className="flex-1 px-5 py-6 sm:px-6 lg:px-8">
              <div className={"mx-auto max-w-1100px"}>
                <div className="overflow-x-auto rounded-lg">
                  <table className="w-full table-fixed border-separate border-spacing-0 overflow-hidden rounded-lg border border-border text-left">
                    <thead>
                      <tr>
                        <th className="border-b border-border bg-white px-4 py-4 text-left">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-small font-semibold text-text">
                              Stages
                            </span>
                            <span className="text-small font-normal text-gray-400">
                              equipment · instruments · CPP & CQA · analytical
                              method · sampling plan
                            </span>
                          </div>
                        </th>
                      </tr>
                    </thead>
                 
                 
                    <tbody>
                      {stages.map((stage) => {
                        const isStageOpen = openStage === stage.key;

                        return (
                          <Fragment key={stage.key}>
                            <tr className="bg-white">
                              <td
                                className={[
                                  "p-0",
                                  isStageOpen
                                    ? "border-b border-dashed border-gray-300"
                                    : "border-b border-solid border-border",
                                ].join(" ")}
                              >
                                <button
                                  type="button"
                                  onClick={() => handleStageClick(stage.key)}
                                  aria-expanded={isStageOpen}
                                  className={[
                                    "flex min-h-[58px] w-full items-center gap-3",
                                    "border-l px-4 py-3 text-left transition-colors",
                                    "focus:outline-none focus-visible:ring-2",
                                    "focus-visible:ring-inset focus-visible:ring-[#0e8c8c]",
                                    isStageOpen
                                      ? "border-l-2 border-l-[#0e8c8c]"
                                      : "border-l border-l-transparent",
                                  ].join(" ")}
                                >
                                  <span className="font-mono text-micro font-medium text-subdued">
                                    {stage.id}
                                  </span>
                                  <span className="text-small font-semibold text-text">
                                    {stage.name}
                                  </span>
                                  <span className="ml-auto flex shrink-0 items-center">
                                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white">
                                      {isStageOpen ? (
                                        <ChevronUp
                                          className="size-4 text-subdued"
                                          aria-hidden="true"
                                        />
                                      ) : (
                                        <ChevronDown
                                          className="size-4 text-subdued"
                                          aria-hidden="true"
                                        />
                                      )}
                                    </span>
                                  </span>
                                </button>
                              </td>
                            </tr>

                            {isStageOpen && (
                              <tr>
                                <td className="border-b border-border p-0">
                                  <div className="bg-muted/10 py-4 pl-6 pr-3 sm:pl-10 sm:pr-4">
                                    <div className="flex flex-col gap-4">
                                      {blocks
                                        .filter((block) => {
                                          if (
                                            stage.key === "dispensing" &&
                                            block.id === "sampling"
                                          ) {
                                            return false;
                                          }

                                          if (
                                            stage.key ===
                                              "inspection-uncoated" &&
                                            block.id === "cpp"
                                          ) {
                                            return false;
                                          }

                                          if (
                                            stage.key === "compression" &&
                                            block.id === "sampling"
                                          ) {
                                            return false;
                                          }

                                          return true;
                                        })
                                        .map((block) => {
                                          const key = `${stage.key}.${block.id}`;

                                          return (
                                            <div key={block.id}>
                                              <Block
                                                title={block.name}
                                                source={block.source}
                                                open={!minimised.has(key)}
                                                onToggle={() =>
                                                  toggleBlock(key)
                                                }
                                              >
                                                {renderBlockContent(
                                                  stage,
                                                  block.id,
                                                )}
                                              </Block>

                                              {stage.key === "granulation" &&
                                                block.id === "sampling" && (
                                                  <div className="mt-3 flex justify-end">
                                                    <button
                                                      type="button"
                                                      onClick={() =>
                                                        navigate(
                                                          `/pvp/${documentId}/granulation`,
                                                        )
                                                      }
                                                      className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-[#0e8c8c] px-5 py-2.5 text-small font-semibold text-white transition hover:bg-[#0b7777] focus:outline-none focus:ring-2 focus:ring-[#0e8c8c] focus:ring-offset-2"
                                                    >
                                                      Continue to Granulation
                                                      Details
                                                      <ArrowRight
                                                        className="size-4"
                                                        aria-hidden="true"
                                                      />
                                                    </button>
                                                  </div>
                                                )}
                                            </div>
                                          );
                                        })}

                                      {stage.key === "compression" && (
                                        <>
                                          <div className="rounded-lg border border-[#0e8c8c]/25 bg-[#0e8c8c]/5 p-3 text-small text-text">
                                            <b>Structured procedure.</b> Fill
                                            the blocks below. The procedure text
                                            and sampling plan are generated from
                                            them. No sentences to type.
                                          </div>

                                          {compressionBlocks.map((block) => {
                                            const key = `compression.${block.id}`;

                                            return (
                                              <Block
                                                key={key}
                                                title={
                                                  <>
                                                    {block.name}
                                                    {block.id ===
                                                      "challenges" && (
                                                      <span className="rounded-full bg-[#0e8c8c]/10 px-2 py-0.5 text-micro text-[#0e8c8c]">
                                                        {
                                                          compression.challenges
                                                            .length
                                                        }
                                                      </span>
                                                    )}
                                                  </>
                                                }
                                                source={block.description}
                                                open={!minimised.has(key)}
                                                onToggle={() =>
                                                  toggleBlock(key)
                                                }
                                              >
                                                {renderCompressionContent(
                                                  block.id,
                                                )}
                                              </Block>
                                            );
                                          })}
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>

    
                  </table>

                                 
{/* Separate References table */}
<table className="mt-4 w-full table-fixed border-separate border-spacing-0 overflow-hidden rounded-lg border border-border text-left">
  <thead>
    <tr>
      <th className="border-b border-border bg-white px-4 py-4 text-left">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-small font-semibold text-text">
            References
          </span>
          <span className="text-small font-normal text-gray-400">
            Supporting documents and references
          </span>
        </div>
      </th>
    </tr>
  </thead>

  <tbody>
    <tr className="bg-white">
      <td
        className={[
          "p-0",
          referencesOpen
            ? "border-b border-dashed border-gray-300"
            : "border-b border-solid border-border",
        ].join(" ")}
      >
        <button
          type="button"
          onClick={() =>
            setReferencesOpen((previous) => !previous)
          }
          aria-expanded={referencesOpen}
          className={[
            "flex min-h-[58px] w-full items-center gap-3",
            "border-l px-4 py-3 text-left transition-colors",
            "focus:outline-none focus-visible:ring-2",
            "focus-visible:ring-inset focus-visible:ring-[#0e8c8c]",
            referencesOpen
              ? "border-l-2 border-l-[#0e8c8c]"
              : "border-l border-l-transparent",
          ].join(" ")}
        >
          <span className="font-mono text-micro font-medium text-subdued">
            REF
          </span>

          <span className="text-small font-semibold text-text">
            References
          </span>

          <span className="text-small text-gray-400">
            {references.length} added
          </span>

          <span className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-md border border-gray-300 bg-white">
            {referencesOpen ? (
              <ChevronUp className="size-4 text-subdued" />
            ) : (
              <ChevronDown className="size-4 text-subdued" />
            )}
          </span>
        </button>
      </td>
    </tr>

    {referencesOpen && (
      <tr>
        <td className="border-b border-border p-0">
          <div className="space-y-4 bg-muted/10 px-4 py-5 sm:px-8">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-small font-semibold text-text">
                  Reference documents
                </h3>
                <p className="mt-1 text-micro text-subdued">
                  Add document numbers, titles, or other references
                  associated with this procedure.
                </p>
              </div>

              <button
                type="button"
                onClick={addReference}
                className="inline-flex min-h-9 items-center justify-center gap-2 self-start rounded-control border border-dashed border-[#0e8c8c] px-3 py-2 text-small font-medium text-[#0e8c8c] hover:bg-[#0e8c8c]/5 sm:self-auto"
              >
                <Plus className="size-4" aria-hidden="true" />
                Add reference
              </button>
            </div>

            {references.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border bg-white px-4 py-8 text-center">
                <p className="text-small text-subdued">
                  No references added yet.
                </p>
                <p className="mt-1 text-micro text-subdued">
                  Select "Add reference" to create your first entry.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {references.map((reference, index) => (
                  <div
                    key={reference.id}
                    className="flex items-start gap-3 rounded-lg border border-border bg-white p-3 sm:p-4"
                  >
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={reference.id}
                        className="mb-1.5 block text-small font-medium text-text"
                      >
                        Reference {index + 1}
                      </label>

                      <input
                        id={reference.id}
                        type="text"
                        value={reference.value}
                        onChange={(event) =>
                          updateReference(
                            reference.id,
                            event.target.value,
                          )
                        }
                        placeholder="Enter reference title or document number"
                        className="w-full rounded-control border border-border bg-white px-3 py-2 text-small text-text outline-none focus:border-[#0e8c8c] focus:ring-1 focus:ring-[#0e8c8c]/20"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => removeReference(reference.id)}
                      aria-label={`Remove reference ${index + 1}`}
                      title="Remove reference"
                      className="mt-7 inline-flex size-9 shrink-0 items-center justify-center rounded-control text-subdued transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            )}

           
          </div>
        </td>
      </tr>
    )}
  </tbody>
</table>

                   
                </div>

                <p className="mt-3 text-micro leading-5 text-subdued">
                  CPP = Critical Process Parameter. CQA = Critical Quality
                  Attribute. The displayed values are frontend reference data.
                  Confirm them against the approved BMR and QC specification
                  before use.
                </p>
              </div>
            </div>

            <div className="border-t border-border bg-surface px-5 py-4 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-[1100px] flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-5 py-2.5 text-small font-semibold text-text transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[#0e8c8c] focus:ring-offset-2"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back
                </button>

                <button
                  type="button"
                  onClick={handleContinue}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control bg-[#0e8c8c] px-5 py-2.5 text-small font-semibold text-white transition-all duration-300 hover:bg-[#0b7777] focus:outline-none focus:ring-2 focus:ring-[#0e8c8c] focus:ring-offset-2"
                >
                  Continue to generate
                  <ArrowRight className="size-4" aria-hidden="true" />
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};
