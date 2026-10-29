import type { ProcedureStage } from "./constants";

export const stages: ProcedureStage[] = [
  {
    id: "01",
    key: "dispensing",
    name: "Dispensing",
    equipment: [
      { name: "Dispensing booth", id: "DB-01" },
      { name: "Weighing balance", id: "WB-07" },
    ],
    instruments: [
      { name: "Thermo-hygrometer", id: "TH-04", calibrationDue: "14 Nov 2026" },
    ],
    cpp: [{ name: "Dispensing accuracy", limit: "99.0 – 101.0 %" }],
    cqa: [{ name: "Assay of dispensed material", limit: "", unit: "%" }],
    analyticalMethod: "AM/DIS/014",
    samplingPlan: [],
  },
  {
    id: "02",
    key: "granulation",
    name: "Granulation",
    equipment: [
      { name: "Sifter", id: "SF-02" },
      { name: "Rapid mixer granulator (RMG)", id: "RMG-04" },
      { name: "Fluid bed dryer (FBD)", id: "FBD-03" },
      { name: "Multi-mill", id: "MM-05" },
      { name: "Octagonal blender", id: "OB-02" },
    ],
    instruments: [
      { name: "Thermo-hygrometer", id: "TH-04", calibrationDue: "14 Nov 2026" },
      { name: "LOD balance", id: "LOD-02", calibrationDue: "08 Oct 2026" },
    ],
    cpp: [
      { name: "Sifting - mesh size", limit: "20 – 40 #" },
      { name: "Mixing time", limit: "10 – 15 min" },
      { name: "Binder addition rate", limit: "50 – 80 g/min" },
      { name: "Drying temperature", limit: "55 – 65 °C" },
      { name: "LOD after drying", limit: "1.5 – 2.5 %" },
      { name: "Milling speed", limit: "800 – 1200 rpm" },
      { name: "Lubrication time", limit: "3 – 5 min" },
    ],
    cqa: [
      { name: "Blend uniformity", limit: "", unit: "%" },
      { name: "Bulk density", limit: "", unit: "g/mL" },
    ],
    analyticalMethod: "AM/GRN/021",
    samplingPlan: [],
  },
  {
    id: "03",
    key: "compression",
    name: "Compression",
    equipment: [{ name: "Compression machine", id: "CM-01" }],
    instruments: [
      { name: "Hardness tester", id: "HT-01", calibrationDue: "20 Oct 2026" },
      { name: "Friabilator", id: "FR-01", calibrationDue: "20 Oct 2026" },
      { name: "Vernier caliper", id: "VC-03", calibrationDue: "30 Sep 2026" },
    ],
    cpp: [
      { name: "Compression force", limit: "8 – 14 kN" },
      { name: "Turret speed", limit: "20 – 35 rpm" },
    ],
    cqa: [
      { name: "Average weight", limit: "", unit: "mg" },
      { name: "Hardness", limit: "", unit: "N" },
      { name: "Friability", limit: "", unit: "%" },
      { name: "Disintegration time", limit: "", unit: "min" },
    ],
    analyticalMethod: "AM/CMP/033",
    samplingPlan: [],
  },
  {
    id: "04",
    key: "inspection-uncoated",
    name: "Inspection (uncoated)",
    equipment: [{ name: "Inspection conveyor", id: "IC-01" }],
    instruments: [
      { name: "Weighing balance", id: "WB-09", calibrationDue: "30 Sep 2026" },
    ],
    cpp: [],
    cqa: [
      { name: "Visual defects", limit: "", unit: "%" },
      { name: "Weight variation", limit: "", unit: "%" },
    ],
    analyticalMethod: "AM/INS/007",
    samplingPlan: [],
  },
  {
    id: "05",
    key: "coating",
    name: "Coating",
    equipment: [
      { name: "Coating pan", id: "CP-01" },
      { name: "Solution preparation vessel", id: "SPV-02" },
    ],
    instruments: [
      { name: "Thermo-hygrometer", id: "TH-06", calibrationDue: "14 Nov 2026" },
      { name: "Viscometer", id: "VS-01", calibrationDue: "12 Nov 2026" },
    ],
    cpp: [
      { name: "Inlet air temperature", limit: "45 – 60 °C" },
      { name: "Spray rate", limit: "20 – 40 g/min" },
      { name: "Pan speed", limit: "8 – 12 rpm" },
    ],
    cqa: [
      { name: "Weight gain", limit: "", unit: "%" },
      { name: "Coating uniformity", limit: "", unit: "%" },
    ],
    analyticalMethod: "AM/COT/045",
    samplingPlan: [],
  },
  {
    id: "06",
    key: "inspection-coated",
    name: "Inspection (coated)",
    equipment: [{ name: "Inspection conveyor", id: "IC-01" }],
    instruments: [
      { name: "Weighing balance", id: "WB-09", calibrationDue: "30 Sep 2026" },
    ],
    cpp: [],
    cqa: [
      { name: "Visual defects", limit: "", unit: "%" },
      { name: "Weight variation", limit: "", unit: "%" },
    ],
    analyticalMethod: "AM/INS/008",
    samplingPlan: [],
  },
];