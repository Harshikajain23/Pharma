import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  SquarePen,
  WandSparkles,
  SlidersHorizontal,
} from "lucide-react";
const PACKAGING_STAGES = [
  { id: "dispensing", number: "01", name: "Dispensing of Packing Material" },
  { id: "primary", number: "02", name: "Primary Packing" },
  { id: "secondary", number: "03", name: "Secondary Packing" },
];
const STAGE_PARAMETERS = [
  { key: "temp", name: "Temperature", unit: "°C" },
  { key: "rh", name: "Relative humidity", unit: "%RH" },
  { key: "dp", name: "Differential pressure", unit: "Pa" },
];
type ParameterMode = "limit" | "record";
type RangeType = "range" | "nmt" | "nlt";
interface ParameterState {
  on: boolean;
  mode: ParameterMode;
  ltype: RangeType;
  min: string;
  max: string;
}
interface StageState {
  selected: boolean;
  collapsed: boolean;
  reviewed: boolean;
  parameters: Record<string, ParameterState>;
}
type StageStateMap = Record<string, StageState>;
function createDefaultParameters(): Record<string, ParameterState> {
  return Object.fromEntries(
    STAGE_PARAMETERS.map((parameter) => [
      parameter.key,
      {
        on: true,
        mode: "limit" as ParameterMode,
        ltype: "range" as RangeType,
        min: "",
        max: "",
      },
    ]),
  );
}
function createInitialStageState(): StageStateMap {
  return Object.fromEntries(
    PACKAGING_STAGES.map((stage) => [
      stage.id,
      {
        selected: false,
        collapsed: false,
        reviewed: false,
        parameters: createDefaultParameters(),
      },
    ]),
  );
}
export function SelectForm({ documentId }: { documentId: string }) {
  const [stages, setStages] = useState<StageStateMap>(createInitialStageState);
  const navigate = useNavigate();
  /* ========================================================= SELECT / UNSELECT STAGE ========================================================= */ const toggleStage =
    (stageId: string) => {
      setStages((current) => {
        const stage = current[stageId];
        return {
          ...current,
          [stageId]: {
            ...stage,
            selected: !stage.selected,
            reviewed: !stage.selected ? stage.reviewed : false,
            collapsed: stage.selected ? stage.collapsed : false,
          },
        };
      });
    };
  /* ========================================================= EXPAND / COLLAPSE ========================================================= */ const toggleCollapse =
    (stageId: string) => {
      setStages((current) => {
        const stage = current[stageId];
        if (!stage.selected) {
          return current;
        }
        return {
          ...current,
          [stageId]: { ...stage, collapsed: !stage.collapsed },
        };
      });
    };
  /* ========================================================= PARAMETER CHANGE ========================================================= */ const updateParameter =
    (
      stageId: string,
      parameterKey: string,
      changes: Partial<ParameterState>,
    ) => {
      setStages((current) => {
        const stage = current[stageId];
        return {
          ...current,
          [stageId]: {
            ...stage,
            reviewed: false,
            parameters: {
              ...stage.parameters,
              [parameterKey]: { ...stage.parameters[parameterKey], ...changes },
            },
          },
        };
      });
    };
  /* ========================================================= CONTINUE TO BPR STAGE INPUT ========================================================= */ const continueToStageParams =
    (stageId: string) => {
      const stage = PACKAGING_STAGES.find((item) => item.id === stageId);
      console.log("=================================");
      console.log("BPR CONTINUE CLICKED");
      console.log("stageId:", stageId);
      console.log("documentId:", documentId);
      console.log("stage:", stage);
      console.log("=================================");
      if (!stage) {
        console.error("Could not find packaging stage:", stageId);
        return;
      }
      if (!documentId) {
        console.error("BPR documentId is missing");
        return;
      }
      setStages((current) => ({
        ...current,
        [stageId]: {
          ...current[stageId],
          reviewed: true,
          selected: true,
          collapsed: true,
        },
      }));
      const targetUrl =
        `/documents/${encodeURIComponent(documentId)}` +
        `/stage-input` +
        `?stage=${encodeURIComponent(stage.name)}` +
        `&type=bpr`;
      console.log("Navigating BPR to:", targetUrl);
      navigate(targetUrl);
    };
  /* ========================================================= SELECTED COUNT ========================================================= */ const selectedCount =
    useMemo(
      () =>
        PACKAGING_STAGES.filter((stage) => stages[stage.id]?.selected).length,
      [stages],
    );
  return (
    <div className="min-w-0 space-y-5">
      {" "}
      {/* ===================================================== HEADER ===================================================== */}{" "}
      <div className="flex items-center justify-between">
        {" "}
        <div className="flex items-center gap-5">
          {" "}
          <h2 className="text-h2 font-semibold"> Packaging stages </h2>{" "}
          <p className="text-small text-subdued">
            {" "}
            Tablet · process order fixed{" "}
          </p>{" "}
        </div>{" "}
        <p className="text-small text-subdued">
          {" "}
          {selectedCount} of {PACKAGING_STAGES.length} selected{" "}
        </p>{" "}
      </div>{" "}
      {/* ===================================================== PACKAGING STAGES ===================================================== */}{" "}
      <div className="min-w-0 overflow-hidden rounded-panel border border-border bg-surface">
        {" "}
        {PACKAGING_STAGES.map((stage) => {
          const stageState = stages[stage.id];
          return (
            <StageRow
              key={stage.id}
              stage={stage}
              state={stageState}
              onToggleStage={() => toggleStage(stage.id)}
              onExpand={() => toggleCollapse(stage.id)}
              onParameterChange={(parameterKey, changes) =>
                updateParameter(stage.id, parameterKey, changes)
              }
              onCollapse={() =>
                setStages((current) => ({
                  ...current,
                  [stage.id]: { ...current[stage.id], collapsed: true },
                }))
              }
              onContinue={() => continueToStageParams(stage.id)}
            />
          );
        })}{" "}
      </div>{" "}
      {/* ===================================================== BATCH YIELD RECONCILIATION ===================================================== */}{" "}
      <BatchYieldReconciliation />{" "}
      {/* ===================================================== STICKY FOOTER ===================================================== */}{" "}
      <div className="sticky bottom-0 z-20 flex flex-wrap items-center justify-between gap-3 border-t bg-surface p-3.5 shadow-auth">
        {" "}
        <button
          type="button"
          onClick={() =>
            navigate(`/bpr/${encodeURIComponent(documentId)}/cover`)
          }
          className="inline-flex items-center gap-2 rounded-control border border-border px-4 py-2 text-small font-semibold transition hover:bg-muted"
        >
          {" "}
          <ArrowLeft className="size-4" aria-hidden="true" /> Back to Cover{" "}
        </button>{" "}
        <div className="flex flex-wrap items-center gap-3">
          {" "}
          {selectedCount === 0 ? (
            <span className="inline-flex items-center gap-1.5 text-small text-danger">
              {" "}
              Select at least one stage.{" "}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 text-small text-subdued">
              {" "}
              <SlidersHorizontal className="size-4" aria-hidden="true" /> Open
              each stage's <b className="font-semibold"> Continue </b> to set
              its equipments and instruments.{" "}
            </span>
          )}{" "}
          <button
            type="button"
            disabled={selectedCount === 0}
            className="inline-flex items-center gap-2 rounded-control bg-primary px-4 py-2 text-small font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-border-strong"
          >
            {" "}
            Continue to Generate &amp; Submit{" "}
            <ArrowRight className="size-4" aria-hidden="true" />{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
    </div>
  );
}
/* ========================================================= STAGE ROW ========================================================= */ function StageRow({
  stage,
  state,
  onToggleStage,
  onExpand,
  onParameterChange,
  onCollapse,
  onContinue,
}: {
  stage: (typeof PACKAGING_STAGES)[number];
  state: StageState;
  onToggleStage: () => void;
  onExpand: () => void;
  onParameterChange: (
    parameterKey: string,
    changes: Partial<ParameterState>,
  ) => void;
  onCollapse: () => void;
  onContinue: () => void;
}) {
  /* * This is separate from parameter.on. * * parameter.on * = whether the parameter is enabled * * selectedParameter * = which parameter card the user is currently on */ const [
    selectedParameter,
    setSelectedParameter,
  ] = useState<string | null>(null);
  return (
    <div
      className={`border-b border-border last:border-b-0 ${state.selected && !state.collapsed ? "bg-accent-soft/50" : ""}`}
    >
      {" "}
      {/* ===================================================== STAGE HEADER ===================================================== */}{" "}
      <div className="relative flex min-h-16 items-center gap-4 px-4">
        {" "}
        {state.selected && (
          <span
            className="absolute inset-y-2 left-0 w-0.5 rounded-r bg-primary"
            aria-hidden="true"
          />
        )}{" "}
        <span className="w-8 shrink-0 text-small font-mono font-semibold text-subdued">
          {" "}
          {stage.number}{" "}
        </span>{" "}
        <span className="relative size-5 shrink-0">
          {" "}
          <input
            type="checkbox"
            checked={state.selected}
            onChange={onToggleStage}
            className="size-5 cursor-pointer appearance-none rounded border-2 border-gray-400 bg-white checked:border-[#0e8c8c] checked:bg-[#0e8c8c]"
          />{" "}
          {state.selected && (
            <Check
              className="pointer-events-none absolute inset-0 m-auto size-3.5 text-white"
              strokeWidth="3"
            />
          )}{" "}
        </span>{" "}
        <button
          type="button"
          onClick={onExpand}
          disabled={!state.selected}
          className="flex min-h-16 flex-1 cursor-pointer items-center text-left disabled:cursor-not-allowed"
        >
          {" "}
          <span
            className={`text-small font-semibold ${!state.selected ? "text-subdued" : "text-text"}`}
          >
            {" "}
            {stage.name}{" "}
          </span>{" "}
        </button>{" "}
        <div className="flex items-center gap-2">
          {" "}
          {state.selected && (
            <>
              {" "}
              {state.reviewed ? (
                <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#15803D]/25 bg-[#E2F4E9] px-2 py-1 text-micro font-medium text-[#15803D]">
                  {" "}
                  <Check className="size-3.5" aria-hidden="true" />{" "}
                  Reviewed{" "}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-sm border border-[#B57614]/30 bg-[#FBEEDA] px-2 py-1 text-micro font-medium text-[#B57614]">
                  {" "}
                  <SquarePen className="size-3.5" aria-hidden="true" /> Review
                  params{" "}
                </span>
              )}{" "}
            </>
          )}{" "}
          <button
            type="button"
            onClick={onExpand}
            disabled={!state.selected}
            aria-expanded={state.selected && !state.collapsed}
            title={
              state.selected
                ? "Set parameters"
                : "Select this stage to set parameters"
            }
            className="flex size-8 items-center justify-center rounded-control border border-border bg-surface transition hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-50"
          >
            {" "}
            <ChevronDown
              className={`size-4 text-subdued transition ${!state.collapsed ? "rotate-180" : ""}`}
              aria-hidden="true"
            />{" "}
          </button>{" "}
        </div>{" "}
      </div>{" "}
      {/* ===================================================== OPTIONS ===================================================== */}{" "}
      {state.selected && !state.collapsed && (
        <div className="border-t border-dashed border-border-strong bg-background px-5 py-2">
          {" "}
          <div className="space-y-2 bg-background p-2">
            {" "}
            {STAGE_PARAMETERS.map((parameter) => {
              const parameterState = state.parameters[parameter.key];
              return (
                <div
                  key={parameter.key}
                  onClick={() => setSelectedParameter(parameter.key)}
                  className={`rounded-control border border-border bg-white px-4 py-2 ${selectedParameter === parameter.key ? "border-l-4 border-l-[#0e8c8c]" : ""}`}
                >
                  {" "}
                  <ParameterField
                    name={parameter.name}
                    unit={parameter.unit}
                    state={parameterState}
                    onChange={(changes) =>
                      onParameterChange(parameter.key, changes)
                    }
                  />{" "}
                </div>
              );
            })}{" "}
          </div>{" "}
          {/* ================================================= OPTIONS FOOTER ================================================= */}{" "}
          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            {" "}
            <p className="text-small font-medium text-subdued">
              {" "}
              {
                Object.values(state.parameters).filter(
                  (parameter) => parameter.on,
                ).length
              }{" "}
              of {STAGE_PARAMETERS.length} parameters active{" "}
            </p>{" "}
            <div className="ml-auto flex items-center gap-2.5">
              {" "}
              <button
                type="button"
                onClick={onCollapse}
                className="inline-flex h-9 items-center rounded-control border border-border px-3 text-small font-semibold text-subdued transition hover:bg-muted"
              >
                {" "}
                Collapse{" "}
              </button>{" "}
              <button
                type="button"
                onClick={onContinue}
                className="inline-flex h-9 items-center gap-1.5 rounded-control bg-primary px-3 text-small font-semibold text-white transition hover:bg-primary-dark"
              >
                {" "}
                <ArrowRight className="size-4" aria-hidden="true" /> Continue to
                stage params{" "}
              </button>{" "}
            </div>{" "}
          </div>{" "}
        </div>
      )}{" "}
    </div>
  );
}
/* ========================================================= PARAMETER FIELD ========================================================= */ function ParameterField({
  name,
  unit,
  state,
  onChange,
}: {
  name: string;
  unit: string;
  state: ParameterState;
  onChange: (changes: Partial<ParameterState>) => void;
}) {
  return (
    <div className="ml-10 flex items-center gap-6">
      {" "}
      <div className="flex min-w-[250px] shrink-0 items-center gap-2">
        {" "}
        <label className="flex cursor-pointer items-center">
          {" "}
          <input
            type="checkbox"
            checked={state.on}
            onChange={(event) => onChange({ on: event.target.checked })}
            className="sr-only"
          />{" "}
          <span
            className={`flex size-5 items-center justify-center rounded border-2 ${state.on ? "border-[#0e8c8c] bg-[#0e8c8c]" : "border-gray-400 bg-white"}`}
          >
            {" "}
            {state.on && (
              <span className="h-3 w-1.5 rotate-45 border-b-2 border-r-2 border-white" />
            )}{" "}
          </span>{" "}
        </label>{" "}
        <span className="text-small font-semibold"> {name} </span>{" "}
        <span className="text-small text-subdued"> {unit} </span>{" "}
      </div>{" "}
      <div
        className={`flex items-center gap-2 ${!state.on ? "pointer-events-none opacity-40" : ""}`}
      >
        {" "}
        {/* LIMIT / RECORD ONLY */}{" "}
        <div className="flex items-center rounded-control border border-border">
          {" "}
          <button
            type="button"
            disabled={!state.on}
            onClick={() => onChange({ mode: "limit" })}
            className={`inline-flex h-10 items-center justify-center gap-1.5 px-3 text-small ${state.mode === "limit" ? "bg-white font-semibold text-[#0e8c8c] shadow-sm" : "bg-transparent text-subdued"}`}
          >
            {" "}
            <SlidersHorizontal
              className="size-3.5 shrink-0"
              aria-hidden="true"
            />{" "}
            <span>Limit</span>{" "}
          </button>{" "}
          <button
            type="button"
            disabled={!state.on}
            onClick={() => onChange({ mode: "record" })}
            className={`inline-flex h-10 items-center justify-center gap-1.5 px-3 text-small ${state.mode === "record" ? "bg-white font-semibold text-[#0e8c8c] shadow-sm" : "bg-transparent text-subdued"}`}
          >
            {" "}
            <WandSparkles
              className="size-3.5 shrink-0"
              aria-hidden="true"
            />{" "}
            <span>Record only</span>{" "}
          </button>{" "}
        </div>{" "}
        {/* LIMIT SETTINGS */}{" "}
        {state.mode === "limit" && (
          <>
            {" "}
            <select
              value={state.ltype}
              disabled={!state.on}
              onChange={(event) =>
                onChange({ ltype: event.target.value as RangeType })
              }
              className="h-10 rounded-control border border-border bg-white px-3 text-small disabled:cursor-not-allowed"
            >
              {" "}
              <option value="range"> Range min-max </option>{" "}
              <option value="nmt"> NMT Max </option>{" "}
              <option value="nlt"> NLT Min </option>{" "}
            </select>{" "}
            {/* RANGE */}{" "}
            {state.ltype === "range" && (
              <div className="flex items-center gap-2">
                {" "}
                <input
                  type="number"
                  placeholder="min"
                  value={state.min}
                  disabled={!state.on}
                  onChange={(event) => onChange({ min: event.target.value })}
                  className="h-10 w-24 rounded-control border border-border bg-white px-3 text-small disabled:bg-gray-100"
                />{" "}
                <span className="text-subdued"> – </span>{" "}
                <input
                  type="number"
                  placeholder="max"
                  value={state.max}
                  disabled={!state.on}
                  onChange={(event) => onChange({ max: event.target.value })}
                  className="h-10 w-24 rounded-control border border-border bg-white px-3 text-small disabled:bg-gray-100"
                />{" "}
              </div>
            )}{" "}
            {/* NMT */}{" "}
            {state.ltype === "nmt" && (
              <input
                type="number"
                placeholder="max"
                value={state.max}
                disabled={!state.on}
                onChange={(event) => onChange({ max: event.target.value })}
                className="h-10 w-24 rounded-control border border-border bg-white px-3 text-small disabled:bg-gray-100"
              />
            )}{" "}
            {/* NLT */}{" "}
            {state.ltype === "nlt" && (
              <input
                type="number"
                placeholder="min"
                value={state.min}
                disabled={!state.on}
                onChange={(event) => onChange({ min: event.target.value })}
                className="h-10 w-24 rounded-control border border-border bg-white px-3 text-small disabled:bg-gray-100"
              />
            )}{" "}
          </>
        )}{" "}
        {/* RECORD ONLY */}{" "}
        {state.mode === "record" && (
          <span className="text-small text-subdued">
            {" "}
            Recorded during the run, no limit{" "}
          </span>
        )}{" "}
      </div>{" "}
    </div>
  );
}
/* ========================================================= BATCH YIELD RECONCILIATION ========================================================= */ function BatchYieldReconciliation() {
  const [activeParameters, setActiveParameters] = useState<string[]>([
    "Actual yield limit",
    "Batch yield limit",
  ]);
  const toggleParameter = (name: string) => {
    setActiveParameters((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    );
  };
  return (
    <section className="rounded-panel border border-border bg-surface p-5">
      {" "}
      <h3 className="text-h3 font-semibold">
        {" "}
        Batch yield reconciliation{" "}
      </h3>{" "}
      <div className="mt-5 space-y-4">
        {" "}
        <YieldField
          title="Actual yield limit"
          active={activeParameters.includes("Actual yield limit")}
          onActiveChange={() => toggleParameter("Actual yield limit")}
        />{" "}
        <YieldField
          title="Batch yield limit"
          active={activeParameters.includes("Batch yield limit")}
          onActiveChange={() => toggleParameter("Batch yield limit")}
        />{" "}
      </div>{" "}
      <div className="mt-6 border-t border-border pt-4">
        {" "}
        <p className="text-small font-medium">
          {" "}
          {activeParameters.length} of 2 parameters active{" "}
        </p>{" "}
      </div>{" "}
    </section>
  );
}
/* ========================================================= YIELD FIELD ========================================================= */ function YieldField({
  title,
  active,
  onActiveChange,
}: {
  title: string;
  active: boolean;
  onActiveChange: () => void;
}) {
  const [mode, setMode] = useState<ParameterMode>("limit");
  const [rangeType, setRangeType] = useState<RangeType>("range");
  return (
    <div className="ml-10 flex items-center gap-6">
      {" "}
      <div className="flex min-w-[250px] shrink-0 items-center gap-2">
        {" "}
        <label className="flex cursor-pointer items-center">
          {" "}
          <input
            type="checkbox"
            checked={active}
            onChange={onActiveChange}
            className="sr-only"
          />{" "}
          <span
            className={`flex size-5 items-center justify-center rounded border-2 ${active ? "border-[#0e8c8c] bg-[#0e8c8c]" : "border-gray-400 bg-white"}`}
          >
            {" "}
            {active && (
              <span className="h-3 w-1.5 rotate-45 border-b-2 border-r-2 border-white" />
            )}{" "}
          </span>{" "}
        </label>{" "}
        <span className="text-small font-semibold"> {title} </span>{" "}
        <span className="text-small text-subdued"> % </span>{" "}
      </div>{" "}
      <div
        className={`flex items-center gap-2 ${!active ? "pointer-events-none opacity-40" : ""}`}
      >
        {" "}
        <div className="flex items-center rounded-control border border-border">
          {" "}
          <button
            type="button"
            disabled={!active}
            onClick={() => setMode("limit")}
            className={`h-10 px-3 text-small ${mode === "limit" ? "bg-white font-semibold text-[#0e8c8c] shadow-sm" : "bg-transparent text-subdued"}`}
          >
            {" "}
            Limit{" "}
          </button>{" "}
          <button
            type="button"
            disabled={!active}
            onClick={() => setMode("record")}
            className={`h-10 px-3 text-small ${mode === "record" ? "bg-white font-semibold text-[#0e8c8c] shadow-sm" : "bg-transparent text-subdued"}`}
          >
            {" "}
            Record only{" "}
          </button>{" "}
        </div>{" "}
        {mode === "limit" && (
          <>
            {" "}
            <select
              value={rangeType}
              disabled={!active}
              onChange={(event) =>
                setRangeType(event.target.value as RangeType)
              }
              className="h-10 rounded-control border border-border bg-white px-3 text-small disabled:cursor-not-allowed"
            >
              {" "}
              <option value="range"> Range min-max </option>{" "}
              <option value="nmt"> NMT Max </option>{" "}
              <option value="nlt"> NLT Min </option>{" "}
            </select>{" "}
            {rangeType === "range" && (
              <div className="flex items-center gap-0">
                {" "}
                <input
                  type="number"
                  placeholder="min"
                  disabled={!active}
                  className="h-10 w-24 rounded-control border border-border bg-white px-3 text-small disabled:bg-gray-100"
                />{" "}
                <span className="text-subdued px-1"> – </span>{" "}
                <input
                  type="number"
                  placeholder="max"
                  disabled={!active}
                  className="h-10 w-24 rounded-control border border-border bg-white px-3 text-small disabled:bg-gray-100"
                />{" "}
              </div>
            )}{" "}
            {rangeType === "nmt" && (
              <input
                type="number"
                placeholder="max"
                disabled={!active}
                className="h-10 w-24 rounded-control border border-border bg-white px-3 text-small disabled:bg-gray-100"
              />
            )}{" "}
            {rangeType === "nlt" && (
              <input
                type="number"
                placeholder="min"
                disabled={!active}
                className="h-10 w-24 rounded-control border border-border bg-white px-3 text-small disabled:bg-gray-100"
              />
            )}{" "}
          </>
        )}{" "}
        {mode === "record" && (
          <span className="text-small text-subdued">
            {" "}
            Recorded during the run, no limit{" "}
          </span>
        )}{" "}
      </div>{" "}
    </div>
  );
}
