
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
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
import { ChallengeLevels } from "./components/ChallengeLevels";

import {
  AddButton,
  Block,
  ChallengeDropdown,
  CountBadge,
  RemoveButton,
  SamplingPanel,
  TableHeader,
  cellClass,
  inputClass,
  labelClass,
} from "./SharedUI";

import {
  BLISTER_MACHINES,
  challengeIpqcTests,
  challengeOptions,
  challengeQcTests,
  getPackingStages,
  packingBlocks,
  type BlisterMachineId,
  type PackingBlock,
  type PackingStage,
} from "./packingStages";

import { PrimaryPackaging } from "./components/PrimaryPacking";
import { SecondaryPackaging } from "./components/SecondaryPacking";
import { PackingMaterialDispensing } from "./components/PackingMaterialDispensing";

type Study = {
  id: string;
  name: string;
  run: string;
  ipqcQty: string;
  ipqcTests: string[];
  qcQty: string;
  qcTests: string[];
};

type ChallengeLevels = Record<
  string,
  {
    Low: string;
    High: string;
  }
>;

const isStudyDone = (study: Study) =>
  Boolean(
    study.run &&
      study.ipqcQty &&
      study.qcQty &&
      study.ipqcTests.length &&
      study.qcTests.length,
  );

export const Procedure = () => {
  const { documentId = "" } = useParams();
  const navigate = useNavigate();

  const user = useAuthStore((state) => state.user);

  const [selectedMachine, setSelectedMachine] =
    useState<BlisterMachineId>("BPM-02");

  const packingStages = getPackingStages(selectedMachine);

  const selectedMachineData = BLISTER_MACHINES.find(
    (machine) => machine.id === selectedMachine,
  )!;

  const { context, isLoading: isLoadingContext } =
    useDocumentSelectorData(user);

  const { document: saved } = useDocument(documentId);

  const { goToStep } = useStepNavigation(
    documentId,
    "pvp",
    "packing",
  );

  const [openStage, setOpenStage] = useState<string | null>("primary");
  const [minimised, setMinimised] = useState<Set<string>>(new Set());
  const [levels, setLevels] = useState<ChallengeLevels>({});
  const [studies, setStudies] = useState<Study[]>([]);

  const handleMachineChange = (id: BlisterMachineId) => {
    if (id === selectedMachine) return;

    setSelectedMachine(id);
    setLevels({});
    setStudies([]);
  };

  const toggleBlock = (key: string) =>
    setMinimised((previous) => {
      const next = new Set(previous);

      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }

      return next;
    });

  const addStudy = () =>
    setStudies((previous) => [
      ...previous,
      {
        id: `study-${Date.now()}`,
        name:
          challengeOptions.find(
            (option) =>
              !previous.some((study) => study.name === option),
          ) ?? "",
        run: "",
        ipqcQty: "",
        ipqcTests: [],
        qcQty: "",
        qcTests: [],
      },
    ]);

  const updateStudy = <K extends keyof Study>(
    id: string,
    field: K,
    value: Study[K],
  ) =>
    setStudies((previous) =>
      previous.map((study) =>
        study.id === id ? { ...study, [field]: value } : study,
      ),
    );

  const removeStudy = (id: string) =>
    setStudies((previous) =>
      previous.filter((study) => study.id !== id),
    );

  function renderBlockContent(
    stage: PackingStage,
    blockId: PackingBlock,
  ) {
    switch (blockId) {
      case "equipment":
      case "instruments": {
        const rows =
          blockId === "equipment"
            ? stage.equipment
            : stage.instruments;

        return (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] table-fixed border-collapse text-small">
              <colgroup>
                <col className="w-[50%]" />
                <col className="w-[20%]" />
                <col className="w-[30%]" />
              </colgroup>

              <thead className="bg-muted/30">
                <tr>
                  <TableHeader>
                    {blockId === "equipment"
                      ? "Equipment"
                      : "Instrument"}
                  </TableHeader>
                  <TableHeader>ID</TableHeader>
                  <TableHeader>Operation SOP No.</TableHeader>
                </tr>
              </thead>

              <tbody>
                {rows.map((item) => (
                  <tr key={item.id}>
                    <td className={cellClass}>{item.name}</td>

                    <td className={`${cellClass} font-sans text-subdued`}>
                      {item.id}
                    </td>

                    <td className={`${cellClass} font-sans text-subdued`}>
                      {item.sop}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case "cpp":
        return (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] table-fixed border-collapse text-small">
              <colgroup>
                <col className="w-[50%]" />
                <col className="w-[50%]" />
              </colgroup>

              <thead className="bg-muted/30">
                <tr>
                  <TableHeader>Parameter</TableHeader>
                  <TableHeader>Limit</TableHeader>
                </tr>
              </thead>

              <tbody>
                {stage.cpp.map((item) => (
                  <tr key={item.name}>
                    <td className={cellClass}>{item.name}</td>

                    <td className={`${cellClass} font-sans`}>
                      {item.limit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "cqa":
        return (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] table-fixed border-collapse text-small">
              <colgroup>
                <col className="w-[50%]" />
                <col className="w-[50%]" />
              </colgroup>

              <thead className="bg-muted/30">
                <tr>
                  <TableHeader>Attribute</TableHeader>
                  <TableHeader>Limit</TableHeader>
                </tr>
              </thead>

              <tbody>
                {(stage.cqa ?? []).map((item) => (
                  <tr
                    key={`${stage.key}-${selectedMachine}-${item.name}`}
                  >
                    <td className={`${cellClass} font-medium`}>
                      {item.name}
                    </td>

                    <td className={cellClass}>
                      <div className="flex flex-wrap items-center gap-2">
                        {item.name === "Related Substances" &&
                        !item.limit?.trim() ? (
                          <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-gray">
                            Not printed
                          </span>
                        ) : item.limit?.trim() ? (
                          <span className="font-sans">
                            {item.limit}
                            {item.unit?.trim() && ` ${item.unit}`}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-700">
                            —
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );

      case "analytical": {
        const methods = Array.isArray(stage.analyticalMethod)
          ? stage.analyticalMethod
          : [];

        if (methods.length === 0) {
          return null;
        }

        return (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] table-fixed border-collapse text-small">
              <colgroup>
                <col className="w-[50%]" />
                <col className="w-[50%]" />
              </colgroup>

              <thead className="bg-muted/30">
                <tr>
                  <TableHeader>Analytical Method</TableHeader>
                  <TableHeader>Limit / Reference</TableHeader>
                </tr>
              </thead>

              <tbody>
                {methods.map((item, index) => (
                  <tr key={`${stage.key}-analytical-${index}`}>
                    <td className={`${cellClass} font-medium`}>
                      {item.name}
                    </td>

                     <td className={cellClass}>
                      <div className="flex flex-wrap items-center gap-2">
                        {item.name === "Related Substances" &&
                        !item.limit?.trim() ? (
                          <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-gray">
                            Not printed
                          </span>
                        ) : item.limit?.trim() ? (
                          <span className="font-sans">
                            {item.limit}
                            {item.unit?.trim() && ` ${item.unit}`}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-700">
                            —
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case "challenge":
        return (

          <ChallengeLevels />
        );

      default:
        return null;
    }
  }

  function renderStageContent(stage: PackingStage) {
    const blocks = (
      <>
        {packingBlocks
          .filter((block) => {
            if (block.id === "challenge" && !stage.hasChallenge) {
              return false;
            }

            if (
              block.id === "equipment" &&
              !stage.equipment.length
            ) {
              return false;
            }

            if (
              block.id === "instruments" &&
              !stage.instruments.length
            ) {
              return false;
            }

            if (block.id === "cpp" && !stage.cpp.length) {
              return false;
            }

            if (block.id === "cqa" && !stage.cqa?.length) {
              return false;
            }

            if (block.id === "analytical") {
              return (
                Array.isArray(stage.analyticalMethod) &&
                stage.analyticalMethod.length > 0
              );
            }

            return true;
          })
          .map((block) => {
            const key = `${stage.key}.${block.id}`;

            return (
              <Block
                key={key}
                title={
                  <>
                    {block.name}
                    {block.id === "challenge" && (
                      <CountBadge count={studies.length} />
                    )}
                  </>
                }
                source={block.source}
                open={!minimised.has(key)}
                onToggle={() => toggleBlock(key)}
              >
                {renderBlockContent(stage, block.id)}
              </Block>
            );
          })}
      </>
    );

    if (stage.key === "primary") {
      return (
        <PrimaryPackaging
          selectedMachine={selectedMachine}
          onMachineChange={handleMachineChange}
        >
          {blocks}
        </PrimaryPackaging>
      );
    }

    if (stage.key === "secondary") {
      return <SecondaryPackaging>{blocks}</SecondaryPackaging>;
    }

    if (stage.key === "pm-dispensing") {
      return (
        <PackingMaterialDispensing>
          {blocks}
        </PackingMaterialDispensing>
      );
    }

    return <div className="flex flex-col gap-4">{blocks}</div>;
  }

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
                activeStepId="procedure-sampling-plan-packing"
                completedStepIds={saved?.completed_steps ?? []}
                onStepClick={goToStep}
                title="Procedure & sampling plan"
                description="This step follows the packing validation section of the protocol template. Equipment and SOP details follow the selected blister machine where applicable. CPP limits come from the machine configuration, while quality attributes and analytical methods must be confirmed against the applicable QC specification."
                identifier={saved?.draft_id ?? documentId}
                status="DRAFT"
                dosageForm={saved?.dosage_form}
                docType="pvp"
                isPvp
                validationType="packing"
              />
            </div>

            <div className="flex-1 px-5 py-6 sm:px-6 lg:px-8">
              <div className="mx-auto max-w-[1100px]">
                <div className="overflow-x-auto rounded-lg">
                  <table className="w-full table-fixed border-separate border-spacing-0 overflow-hidden rounded-lg border border-border text-left">
                    <thead>
                      <tr>
                        <th className="border-b border-border bg-white px-4 py-4 text-left">
                          <div className="flex flex-wrap items-center gap-3">
                            <span className="text-small font-semibold text-text">
                              Packing stages
                            </span>

                            <span className="text-small font-normal text-gray-400">
                              packing validation · order fixed
                            </span>
                          </div>
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {packingStages.map((stage) => {
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
                                  onClick={() =>
                                    setOpenStage((previous) =>
                                      previous === stage.key
                                        ? null
                                        : stage.key,
                                    )
                                  }
                                  aria-expanded={isStageOpen}
                                  className={[
                                    "flex min-h-[58px] w-full items-center gap-3 border-l px-4 py-3 text-left transition-colors",
                                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#0e8c8c]",
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
                                    {renderStageContent(stage)}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <p className="mt-3 text-micro leading-5 text-subdued">
                  CPP = Critical Process Parameter. CQA = Critical
                  Quality Attribute. Confirm machine limits, quality
                  attributes and analytical methods against the approved
                  BPR and QC specification before use.
                </p>
              </div>
            </div>

            <div className="border-t border-border bg-surface px-5 py-4 sm:px-6 lg:px-8">
              <div className="mx-auto flex max-w-[1100px] flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      `/pvp/${encodeURIComponent(documentId)}/selectpacking`,
                    )
                  }
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-control border border-border-strong bg-surface px-5 py-2.5 text-small font-semibold text-text transition hover:bg-muted focus:outline-none focus:ring-2 focus:ring-[#0e8c8c] focus:ring-offset-2"
                >
                  <ArrowLeft className="size-4" aria-hidden="true" />
                  Back
                </button>

                <button
                  type="button"
                  onClick={() => goToStep("generate-packing")}
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
