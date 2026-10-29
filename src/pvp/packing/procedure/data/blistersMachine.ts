
export const BLISTER_MACHINES = [
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
] as const;

export type BlisterMachine = (typeof BLISTER_MACHINES)[number];

export type BlisterMachineId = BlisterMachine["id"];
