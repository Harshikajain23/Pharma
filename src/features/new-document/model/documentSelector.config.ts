import type { DocumentOption, DocumentStep, SidebarItem } from "./documentSelector.types";
import {
  ClipboardCheck,
  Droplets,
  FileCheck2,
  FileText,
  FlaskConical,
  Package,
  Pill,
  HandCoins,
  Tablets,
  Bubbles,
} from "lucide-react";

export const RELEASE_TOOLTIP =
  "Not in this release. Tablet · BMR is the current release.";

export const DOCUMENT_SELECTOR_STEPS: DocumentStep[] = [
  { id: "type", label: "Type" },
  { id: "inputs", label: "Core inputs" },
  { id: "preview", label: "Preview" },
  { id: "cover-bom", label: "Cover + BOM" },
  { id: "stages", label: "Select stage & stage inputs" },
  { id: "generate-submit", label: "Generate & submit" },
];

export const BPR_STEPS: DocumentStep[] = [
  { id: "type", label: "Type" },
  { id: "inputs", label: "Core inputs" },
  { id: "preview", label: "Preview" },
  { id: "cover-page", label: "Cover page" },
  { id: "select-stage", label: "Select stage" },
  { id: "generate-submit", label: "Generate & submit" },
];

export const PVP_STEPS: DocumentStep[] = [
  { id: "type", label: "Type" },
  { id: "select-document", label: "Select document" },
  { id: "preview-basic-details", label: "Preview & basic details" },
  { id: "process-flow-bom", label: "Process flow & BOM" },
  { id: "cpp-cqa", label: "CPP + CQA" },
  { id: "procedure-sampling-plan", label: "Procedure & sampling plan" },
  { id: "generate-submit", label: "Generate & submit" },
];

export const PVP_PACKING_STEPS: DocumentStep[] = [
  { id: "type-packing", label: "Type" },
  { id: "select-packing", label: "Select document" },
  { id: "preview-basic-details-packing", label: "Preview & basic details" },
  { id: "process-flow-bom-packing", label: "Process flow & BOM" },
  { id: "cpp-cqa-packing", label: "CPP + CQA" },
  { id: "procedure-sampling-plan-packing", label: "Procedure & sampling plan" },
  { id: "generate-submit-packing", label: "Generate & submit" },
];

export const PVR_STEPS: DocumentStep[] = [
  { id: "type", label: "Type" },
  { id: "inputs", label: "Input" },
  {id: "cover", label: "Cover & Introduction"},
  { id: "cpp-cqa", label: "CPP + CQA" },
  { id: "stage-output", label: "Stage output" },
  { id: "generate-submit", label: "Generate & submit" },
  { id: "recommendation", label: "Recommendation" },
];

export const DOSAGE_FORM_OPTIONS: DocumentOption[] = [
  {
    id: "tablet",
    backendValue: "tablet",
    label: "Tablet",
    description: "Compressed solid dose",
    available: true,
    icon: Tablets,
  },
  {
    id: "capsule",
    backendValue: "capsule",
    label: "Capsule",
    description: "",
    available: false,
    unavailableReason: RELEASE_TOOLTIP,
    icon: Pill,
  },
  {
    id: "cream",
    backendValue: "cream",
    label: "Cream",
    description: "",
    available: false,
    unavailableReason: RELEASE_TOOLTIP,
    icon: HandCoins,
  },
  {
    id: "ointment",
    backendValue: "ointment",
    label: "Ointment",
    description: "",
    available: false,
    unavailableReason: RELEASE_TOOLTIP,
    icon: FlaskConical,
  },
  {
    id: "powder",
    backendValue: "powder",
    label: "Powder",
    description: "",
    available: false,
    unavailableReason: RELEASE_TOOLTIP,
    icon: Bubbles,
  },
  {
    id: "oral-liquid",
    backendValue: "oral-liquid",
    label: "Oral Liquid",
    description: "",
    available: false,
    unavailableReason: RELEASE_TOOLTIP,
    icon: Droplets,
  },
];

export const DOCUMENT_TYPE_OPTIONS: DocumentOption[] = [
  {
    id: "bmr",
    backendValue: "bmr",
    label: "Batch Manufacturing Record",
    shortLabel: "BMR",
    description: "Tablet dosage form",
    available: true,
    icon: FileText,
  },
  {
    id: "bpr",
    backendValue: "bpr",
    label: "Batch Packaging Record",
    shortLabel: "BPR",
    description: "Tablet Dosage Form",
    available: true,
    icon: Package,
  },
  {
    id: "pvp",
    backendValue: "pvp",
    label: "Process Validation Protocol",
    shortLabel: "PVP",
    description: "Tablet Dosage Form",
    available: true,
    icon: ClipboardCheck,
  },
  {
    id: "pvr",
    backendValue: "pvr",
    label: "Process Validation Report",
    shortLabel: "PVR",
    description: "",
    available: true,
    unavailableReason: RELEASE_TOOLTIP,
    icon: FileCheck2,
  },
];

export const DOCUMENT_SIDEBAR_ITEMS: SidebarItem[] = [
  { id: "new-document", label: "New document" },
  { id: "status-board", label: "Status board" },
  { id: "version-history", label: "Version history" },
  { id: "notifications", label: "Notifications" },
  { id: "audit-trail", label: "Audit trail" },
  // A single "Master data" entry — it opens the master-data setup (or, for a preparer, its
  // read-only preview). There is no separate "Master data setup" item.
  { id: "master-data", label: "Master data" },
];
