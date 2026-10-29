export type LimitType = "Range" | "NMT" | "NLT";
export type ProcedureBlock =
  | "equipment"
  | "instruments"
  | "cpp"
  | "cqa"
  | "analytical"
  | "sampling";

export type CompressionBlock =
  | "setup"
  | "challenges"
  | "optimum"
  | "uniformity"
  | "composite"
  | "generated";

export interface Equipment {
  name: string;
  id: string;
}

export interface Instrument {
  name: string;
  id: string;
  calibrationDue: string;
}

export interface Parameter {
  name: string;
  limit: string;
}

export interface QualityAttribute {
  name: string;
  limit: string;
  unit: string;
}

export interface ProcedureStage {
  id: string;
  key: string;
  name: string;
  equipment: Equipment[];
  instruments: Instrument[];
  cpp: Parameter[];
  cqa: QualityAttribute[];
  analyticalMethod: string;
  samplingPlan: string[];
}

export interface CqaLimit {
  type: LimitType;
  min: string;
  max: string;
  unit: string;
}

export interface AdditionalParameter {
  name: string;
  limit: string;
}

export interface AdditionalCqa {
  name: string;
  type: LimitType;
  min: string;
  max: string;
  unit: string;
}

export interface SamplingPlanRow {
  test: string;
  sampleQuantity: string;
  numberOfSamples: string;
  equipmentName: string;
  diagram: string;
}

export type SamplingPlanField = keyof SamplingPlanRow;

export interface CompressionSampling {
  lhs: string;
  rhs: string;
  tests: string[];
}

export interface CompressionQc {
  qty: string;
  tests: string[];
}

export interface CompressionChallenge {
  id: string;
  name: string;
  customName: string;
  run: string;
  ipqc: CompressionSampling;
  qc: CompressionQc;
}

export interface CompressionPoint {
  id: string;
  name: string;
  customName: string;
  ipqc: CompressionSampling;
  qcQty: string;
  tests: string[];
}

export interface CompressionState {
  loading: string;
  challenges: CompressionChallenge[];
  optimumRun: string;
  optimumPoints: CompressionPoint[];
  compositeEnabled: boolean;
  compositeQty: string;
  compositeSop: string;
  aqlEnabled: boolean;
}

export const blocks: { id: ProcedureBlock; name: string; source: string }[] = [
  { id: "equipment", name: "Equipment", source: "from BMR" },
  { id: "instruments", name: "Instrument", source: "from BMR" },
  { id: "cpp", name: "CPP", source: "limit from BMR" },
  { id: "cqa", name: "CQA", source: "limit from specification" },
  { id: "analytical", name: "Analytical method", source: "from QC" },
  { id: "sampling", name: "Sampling plan & diagram", source: "" },
];

export const compressionBlocks: {
  id: CompressionBlock;
  name: string;
  description?: string;
}[] = [
  { id: "setup", name: "Set-up", description: "blend loading" },
  { id: "challenges", name: "Challenge studies" },
  { id: "optimum", name: "Optimum run & in-process sampling" },
  {
    id: "uniformity",
    name: "Content uniformity — stratified sampling",
  },
 
];

export const challengeOptions = [
  "Low hardness",
  "High hardness",
  "Low Speed",
  "High Speed",
  "Other challenge",
];

export const optimumSamplingOptions = [
  "Initial",
  "Middle",
  "End",
  "Other sampling point",
];

export const diagramOptions = [
  "10-point blender",
  "Start-middle-end",
  "Hourly draw",
  "5-point grid",
  "Diagonal draw",
  "Custom",
];

export const testOptions = [
  "Blend uniformity",
  "Bulk density",
  "LOD",
  "Assay",
  "Average weight",
  "Hardness",
  "Friability",
  "Disintegration time",
  "Visual inspection",
  "Weight variation",
];

export const physicalTests = [
  "Appearance",
  "Average weight",
  "Thickness",
  "Hardness",
  "Friability",
  "Disintegration",
  "Weight variation",
];

export const qcTests = [
  "Assay",
  "Content uniformity",
  "Dissolution",
  "Related substances",
  "Identification",
];

export const challengeIpqcTests = [
  "Description",
  "Average mass",
  "Uniformity of mass",
  "Hardness",
  "Thickness",
  "Disintegration time",
  "Friability",
];

export const challengeQcTests = [
  "Assay",
  "Uniformity of Dosage Units (by Content Uniformity or Weight Variation)",
  "Dissolution Test",
  "Related Substances",
];

export const createEmptySamplingRow = (): SamplingPlanRow => ({
  test: "",
  sampleQuantity: "",
  numberOfSamples: "",
  equipmentName: "",
  diagram: "10-point blender",
});

export const createCompressionSampling = (): CompressionSampling => ({
  lhs: "",
  rhs: "",
  tests: [],
});

export const createCompressionChallenge = (
  id: string,
): CompressionChallenge => ({
  id,
  name: challengeOptions[0],
  customName: "",
  run: "",
  ipqc: createCompressionSampling(),
  qc: { qty: "", tests: [] },
});

export const createCompressionPoint = (id: string): CompressionPoint => ({
  id,
  name: optimumSamplingOptions[0],
  customName: "",
  ipqc: createCompressionSampling(),
  qcQty: "",
  tests: [],
});

export const createInitialCompression = (): CompressionState => ({
  loading: "Pneumatic conveying system",
  challenges: [],
  optimumRun: "",
  optimumPoints: [createCompressionPoint("point-1")],
  compositeEnabled: false,
  compositeQty: "",
  compositeSop: "",
  aqlEnabled: false,
});

export const isIpqcDone = (c: CompressionChallenge) =>
  !!c.ipqc.lhs && !!c.ipqc.rhs && c.ipqc.tests.length > 0;

export const isQcDone = (c: CompressionChallenge) =>
  !!c.qc.qty && c.qc.tests.length > 0;

export const isChallengeDone = (c: CompressionChallenge) =>
  !!c.run &&
  (c.name !== "Other challenge" || !!c.customName.trim()) &&
  isIpqcDone(c) &&
  isQcDone(c);

export const isOptimumPointDone = (point: CompressionPoint) =>
  !!point.name &&
  (point.name !== "Other sampling point" || !!point.customName.trim()) &&
  !!point.ipqc.lhs &&
  !!point.ipqc.rhs &&
  point.ipqc.tests.length > 0 &&
  !!point.qcQty &&
  point.tests.length > 0;