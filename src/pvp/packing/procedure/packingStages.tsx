
export type Item = {
  name: string;
  id: string;
  sop: string;
};

export type Parameter = {
  name: string;
  limit: string;
};

export type QualityAttribute = {
  name: string;
  limit: string;
  unit: string;
};

export type AnalyticalMethod = {
  name: string;
  limit: string;
  unit: string;
};

export type MachineParameter = {
  key: string;
  name: string;
  unit: string;
  kind?: "tol";
  target?: string;
  tol?: string;
  min?: string;
  max?: string;
};

export type BlisterMachineId = "BPM-02" | "BPM-03" | "BPM-04";

export type BlisterMachine = {
  id: BlisterMachineId;
  name: string;
  type: string;
  model: string;
  sop: string;
  params: MachineParameter[];
};

export type PackingStage = {
  key: string;
  id: string;
  name: string;
  equipment: Item[];
  instruments: Item[];
  cpp: Parameter[];
  cqa?: QualityAttribute[];
  analyticalMethod?: AnalyticalMethod[];
  hasChallenge?: boolean;
};

export const BLISTER_MACHINES: BlisterMachine[] = [
  {
    id: "BPM-02",
    name: "Blister Pack Machine",
    type: "Alu-Alu, cold form",
    model: "Make A · AA-200",
    sop: "SOP-PK-021",
    params: [
      {
        key: "seal",
        name: "Sealing Temperature",
        unit: "°C",
        kind: "tol",
        target: "150",
        tol: "20",
      },
      {
        key: "speed",
        name: "Machine Speed",
        unit: "SPM",
        min: "25",
        max: "50",
      },
    ],
  },
  {
    id: "BPM-03",
    name: "Alu-Alu Blister Pack Machine",
    type: "Alu-Alu, cold form",
    model: "Make B · AA-350",
    sop: "SOP-PK-022",
    params: [
      {
        key: "seal",
        name: "Sealing Plate Temperature",
        unit: "°C",
        kind: "tol",
        target: "180",
        tol: "20",
      },
      {
        key: "speed",
        name: "Machine Speed",
        unit: "strokes/min",
        min: "15",
        max: "35",
      },
    ],
  },
  {
    id: "BPM-04",
    name: "Blister Pack Machine",
    type: "Thermoform, PVC/PVDC-Alu",
    model: "Make C · TF-260",
    sop: "SOP-PK-024",
    params: [
      {
        key: "form",
        name: "Forming Temperature",
        unit: "°C",
        min: "120",
        max: "150",
      },
      {
        key: "seal",
        name: "Sealing Temperature",
        unit: "°C",
        min: "170",
        max: "210",
      },
      {
        key: "speed",
        name: "Machine Speed",
        unit: "cycles/min",
        min: "20",
        max: "40",
      },
    ],
  },
];

type MachineConfiguration = {
  equipment: Item[];
  instruments: Item[];
  cqa: QualityAttribute[];
  analyticalMethod?: AnalyticalMethod[];
};

export const blisterMachineConfigurations: Record<
  BlisterMachineId,
  MachineConfiguration
> = {
  "BPM-02": {
    equipment: [
      {
        name: "Blister Pack Machine",
        id: "BPM-02",
        sop: "SOP-PK-021",
      },
      {
        name: "De-foiling Machine",
        id: "DFM-01",
        sop: "SOP-PK-026",
      },
    ],
    instruments: [
      {
        name: "Leak test Apparatus",
        id: "LTA-02",
        sop: "SOP-PK-029",
      },
    ],
    cqa: [
      {
        name: "Description",
        limit:
          "Light orange to orange, capsule shape, biconvex, film coated tablets plain on both sides",
        unit: "",
      },
      {
        name: "Related Substances",
        limit: "",
        unit: "",
      },
      {
        name: "Assay",
        limit: "90.0% to 110.0% of label claim",
        unit: "",
      },
    ],
    analyticalMethod: [
      {
        name: "Description",
        limit:
          "Light orange to orange, capsule shape, biconvex, film coated tablets plain on both sides",
        unit: "",
      },
      {
        name: "Related Substances",
        limit: "",
        unit: "",
      },
      {
        name: "Assay",
        limit: "90.0% to 110.0% of label claim",
        unit: "",
      },
    ],
  },

  "BPM-03": {
    equipment: [
      {
        name: "Alu-Alu Blister Pack Machine",
        id: "BPM-03",
        sop: "SOP-PK-022",
      },
      {
        name: "De-foiling Machine",
        id: "DFM-01",
        sop: "SOP-PK-026",
      },
    ],
    instruments: [],
    cqa: [],
    analyticalMethod: [],
  },

  "BPM-04": {
    equipment: [
      {
        name: "Blister Pack Machine",
        id: "BPM-04",
        sop: "SOP-PK-024",
      },
    ],
    instruments: [],
    cqa: [],
    analyticalMethod: [],
  },
};

function getParameterLimit(parameter: MachineParameter): string {
  if (
    parameter.kind === "tol" &&
    parameter.target !== undefined &&
    parameter.tol !== undefined
  ) {
    const target = Number(parameter.target);
    const tolerance = Number(parameter.tol);

    if (Number.isFinite(target) && Number.isFinite(tolerance)) {
      return `${target - tolerance} ${parameter.unit} to ${
        target + tolerance
      } ${parameter.unit}`;
    }
  }

  if (parameter.min !== undefined && parameter.max !== undefined) {
    return `${parameter.min} ${parameter.unit} to ${
      parameter.max
    } ${parameter.unit}`;
  }

  return "";
}

const fixedPackingStages: PackingStage[] = [
  {
    key: "pm-dispensing",
    id: "01",
    name: "Packing material dispensing",
    equipment: [
      {
        name: "Dispensing booth (RLAF)",
        id: "RLAF-03",
        sop: "SOP-PK-011",
      },
    ],
    instruments: [
      {
        name: "Weighing Balance",
        id: "WB-12",
        sop: "SOP-PK-015",
      },
    ],
    cpp: [
      {
        name: "Quantity of Packing material",
        limit: "Issued quantity of packing material",
      },
    ],
  },
  {
    key: "secondary",
    id: "03",
    name: "Secondary packing",
    equipment: [
      {
        name: "Auto Cartoning Machine",
        id: "ACM-02",
        sop: "SOP-PK-033",
      },
      {
        name: "Check Weigher Machine",
        id: "CWM-02",
        sop: "SOP-PK-036",
      },
      {
        name: "Print N Spect Machine",
        id: "PNS-02",
        sop: "SOP-PK-038",
      },
      {
        name: "Bulk 2D Scanning Machine",
        id: "B2D-01",
        sop: "SOP-PK-041",
      },
      {
        name: "Aggregation Machine",
        id: "AGG-01",
        sop: "SOP-PK-044",
      },
    ],
    instruments: [
      {
        name: "Weighing Balance",
        id: "WB-14",
        sop: "SOP-PK-015",
      },
    ],
    cpp: [
      {
        name: "Auto Cartoning Machine Speed",
        limit: "10 CPM to 30 CPM",
      },
      {
        name: "PNS Machine Speed",
        limit: "40 % to 80 %",
      },
    ],
    cqa: [
      {
        name: "Check weight",
        limit: "± 2.0 g",
        unit: "",
      },
    ],
    analyticalMethod: [
      {
        name: "Analytical Method",
        limit: "SOP-QC-120",
        unit: "",
      },
    ],
  },
];

export function getPackingStages(
  selectedMachine: BlisterMachineId,
): PackingStage[] {
  const machine = BLISTER_MACHINES.find(
    (item) => item.id === selectedMachine,
  );

  const configuration = blisterMachineConfigurations[selectedMachine];

  const primaryStage: PackingStage = {
    key: "primary",
    id: "02",
    name: "Primary packing",
    hasChallenge: true,
    equipment: configuration.equipment,
    instruments: configuration.instruments,
    cpp: (machine?.params ?? []).map((parameter) => ({
      name: parameter.name,
      limit: getParameterLimit(parameter),
    })),
    cqa: configuration.cqa,
    analyticalMethod: configuration.analyticalMethod,
  };

  return [
    fixedPackingStages[0],
    primaryStage,
    fixedPackingStages[1],
  ];
}

export const packingBlocks = [
  {
    id: "equipment",
    name: "Equipment detail",
    source: "BPR · master data",
  },
  {
    id: "instruments",
    name: "Instrument used",
    source: "BPR · master data",
  },
  {
    id: "cpp",
    name: "Critical Process Parameters",
    source: "BPR",
  },
  {
    id: "cqa",
    name: "Critical Quality Attribute",
    source: "QC spec",
  },
  {
    id: "analytical",
    name: "Analytical Methodology",
    source: "QC spec",
  },
  {
    id: "challenge",
    name: "Challenge test",
    source: "template",
  },
] as const;

export type PackingBlock = (typeof packingBlocks)[number]["id"];

export const challengeOptions = [
  "Low speed – Low temperature",
  "High speed – Low temperature",
  "Low speed – High temperature",
  "High speed – High temperature",
  "Optimum speed – Optimum temperature",
  "Re-packing",
];

export const challengeIpqcTests = [
  "Appearance of blisters",
  "Leak test",
  "Blister seal check",
  "Embossing / print check",
];

export const challengeQcTests = [
  "Description",
  "Dissolution",
  "Assay",
  "Related substances",
  "Water content",
];
