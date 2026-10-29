import {
  AlertCircle,
  ArrowLeft,
  Check,
  ChevronDown,
  Loader2,
  Plus,
  Save,
  Wrench,
  X,
} from "lucide-react";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import { getApiErrorMessage } from "../../../shared/api/apiError";
import { useAuthStore } from "../../auth/state/auth.store";
import { AppHeader } from "../../new-document/components/AppHeader";
import { AppSidebar } from "../../new-document/components/AppSidebar";
import { WizardFooter } from "../../new-document/components/WizardFooter";
import { useDocument } from "../../new-document/hooks/useDocument";
import { useStepNavigation } from "../../new-document/hooks/useStepNavigation";

import {
  cppMeta,
  getEquipmentInputs,
  getMasterData,
  setEquipmentInputs,
  type EquipmentEntry,
  type EquipmentMaster,
  type InstrumentMaster,
  type MasterData,
} from "../api/masterData";

type Mode = "equipment" | "instrument";
type DocumentType = "bmr" | "bpr";

export function StageInputPage() {
  /*
   * =========================================================
   * ROUTER VALUES
   * =========================================================
   */

  const { documentId = "" } = useParams();

  const [searchParams] = useSearchParams();

  const navigate = useNavigate();

  /*
   * Full stage value from URL.
   *
   * Example:
   *
   * ?stage=Dispensing%20(Raw%20Material%20Dispensing)
   *
   * We keep the FULL value for display.
   */
  const forStage = searchParams.get("stage") ?? "";

  /*
   * Workflow type.
   *
   * BPR:
   * ?type=bpr&stage=...
   *
   * BMR:
   * ?stage=...
   */
  const documentType: DocumentType =
    searchParams.get("type") === "bpr"
      ? "bpr"
      : "bmr";

  /*
   * =========================================================
   * AUTH
   * =========================================================
   */

  const user = useAuthStore(
    (state) => state.user,
  );

  /*
   * =========================================================
   * DOCUMENT
   * =========================================================
   */

  const { document: documentState } =
    useDocument(documentId);

  /*
   * =========================================================
   * STEP NAVIGATION
   * =========================================================
   */

  const { goToStep } = useStepNavigation(
    documentId,
    documentType,
  );

  /*
   * =========================================================
   * BACK NAVIGATION
   * =========================================================
   *
   * BPR -> /bprselecttest
   *
   * BMR -> normal stages navigation
   */

  const handleBackToStages = useCallback(() => {
    if (documentType === "bpr") {
      navigate(`/bpr/${documentId}/select`);

      return;
    }

    goToStep("stages");
  }, [
    documentType,
    navigate,
    goToStep,
  ]);

  /*
   * =========================================================
   * STATE
   * =========================================================
   */

  const [master, setMaster] =
    useState<MasterData | null>(null);

  const [entries, setEntries] =
    useState<EquipmentEntry[]>([]);

  const [isLoading, setIsLoading] =
    useState(true);

  const [isSaving, setIsSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [mode, setMode] =
    useState<Mode>("equipment");

  const [name, setName] =
    useState("");

  const [id, setId] =
    useState("");

  const [procStage, setProcStage] =
    useState("");

  const [cpp, setCpp] =
    useState<Record<string, string>>({});

  /*
   * =========================================================
   * LOAD MASTER DATA
   * =========================================================
   */

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const [
          md,
          existing,
        ] = await Promise.all([
          getMasterData(),
          getEquipmentInputs(
            documentId,
          ).catch(() => []),
        ]);

        if (cancelled) {
          return;
        }

        setMaster(md);
        setEntries(existing);
      } catch (caught) {
        if (!cancelled) {
          setError(
            getApiErrorMessage(
              caught,
              "Could not load the master data.",
            ),
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [documentId]);

  /*
   * =========================================================
   * EQUIPMENT
   * =========================================================
   */

  const equipment =
    useMemo<EquipmentMaster | null>(() => {
      if (mode !== "equipment") {
        return null;
      }

      return (
        master?.equipments.find(
          (e) =>
            e.name === name &&
            (!forStage ||
              stageRelated(
                e.stage,
                forStage,
              )),
        ) ?? null
      );
    }, [
      master,
      mode,
      name,
      forStage,
    ]);

  /*
   * =========================================================
   * INSTRUMENT
   * =========================================================
   */

  const instrument =
    useMemo<InstrumentMaster | null>(() => {
      if (mode !== "instrument") {
        return null;
      }

      return (
        master?.instruments.find(
          (i) => i.name === name,
        ) ?? null
      );
    }, [
      master,
      mode,
      name,
    ]);

  /*
   * =========================================================
   * INSTRUMENT UNIT
   * =========================================================
   */

  const instrumentUnit =
    useMemo(() => {
      return (
        instrument?.units.find(
          (u) => u.id === id,
        ) ?? null
      );
    }, [
      instrument,
      id,
    ]);

  /*
   * =========================================================
   * NAME OPTIONS
   * =========================================================
   *
   * IMPORTANT:
   *
   * We return the ORIGINAL names from master data.
   *
   * Nothing is cleaned or shortened here.
   */

  const nameOptions =
    useMemo(() => {
      if (mode === "equipment") {
        const all =
          master?.equipments ?? [];

        const related = forStage
          ? all.filter((e) =>
              stageRelated(
                e.stage,
                forStage,
              ),
            )
          : all;

        const source =
          related.length > 0
            ? related
            : all;

        return [
          ...new Set(
            source.map(
              (e) => e.name,
            ),
          ),
        ];
      }

      const all =
        master?.instruments ?? [];

      const related = forStage
        ? all.filter((i) =>
            i.units.some((u) =>
              stageRelated(
                u.stage,
                forStage,
              ),
            ),
          )
        : all;

      const source =
        related.length > 0
          ? related
          : all;

      return [
        ...new Set(
          source.map(
            (i) => i.name,
          ),
        ),
      ];
    }, [
      master,
      mode,
      forStage,
    ]);

  /*
   * =========================================================
   * ID OPTIONS
   * =========================================================
   */

  const idOptions =
    useMemo(() => {
      if (mode === "equipment") {
        return equipment?.ids ?? [];
      }

      return (
        instrument?.units.map(
          (u) => u.id,
        ) ?? []
      );
    }, [
      mode,
      equipment,
      instrument,
    ]);

  /*
   * =========================================================
   * PROCESSING STAGES
   * =========================================================
   */

  const stages =
    equipment?.stages ?? [];

  /*
   * =========================================================
   * CPP
   * =========================================================
   */

  const cpps =
    stages.find(
      (s) => s.stage === procStage,
    )?.cpps ?? [];

  /*
   * =========================================================
   * RESET FORM
   * =========================================================
   */

  const resetForm =
    useCallback(() => {
      setName("");
      setId("");
      setProcStage("");
      setCpp({});
    }, []);

  /*
   * =========================================================
   * SWITCH MODE
   * =========================================================
   */

  const switchMode =
    useCallback(
      (next: Mode) => {
        setMode(next);
        setName("");
        setId("");
        setProcStage("");
        setCpp({});
      },
      [],
    );

  /*
   * =========================================================
   * CHOOSE NAME
   * =========================================================
   */

  const chooseName =
    useCallback(
      (value: string) => {
        setName(value);
        setId("");
        setProcStage("");
        setCpp({});
      },
      [],
    );

  /*
   * =========================================================
   * CHOOSE ID
   * =========================================================
   */

  const chooseId =
    useCallback(
      (value: string) => {
        setId(value);
      },
      [],
    );

  /*
   * =========================================================
   * CAN ADD
   * =========================================================
   */

  const canAdd =
    mode === "equipment"
      ? Boolean(
          name &&
            id &&
            procStage,
        )
      : Boolean(
          name &&
            id,
        );

  /*
   * =========================================================
   * VISIBLE ENTRIES
   * =========================================================
   */

  const visibleEntries =
    useMemo(
      () =>
        entries
          .map(
            (
              entry,
              index,
            ) => ({
              entry,
              index,
            }),
          )
          .filter(
            ({ entry }) =>
              entry.mode ===
              mode,
          ),
      [
        entries,
        mode,
      ],
    );

  /*
   * =========================================================
   * BUILD ENTRY
   * =========================================================
   *
   * IMPORTANT:
   *
   * stage and proc_stage contain the FULL
   * original values.
   */

  const buildDraftEntry =
    useCallback(
      (): EquipmentEntry => {
        if (
          mode ===
          "equipment"
        ) {
          return {
            mode,
            name,
            id,

            /*
             * FULL stage value
             */
            stage: forStage,

            /*
             * FULL processing-stage value
             */
            proc_stage:
              procStage,

            cpp,
          };
        }

        return {
          mode,
          name,
          id,

          /*
           * FULL stage value
           */
          stage: forStage,

          proc_stage: "",
          cpp: {},
        };
      },
      [
        mode,
        name,
        id,
        forStage,
        procStage,
        cpp,
      ],
    );

  /*
   * =========================================================
   * ADD ENTRY
   * =========================================================
   */

  const addEntry =
    useCallback(() => {
      if (!canAdd) {
        return;
      }

      setEntries(
        (current) => [
          ...current,
          buildDraftEntry(),
        ],
      );

      resetForm();
    }, [
      canAdd,
      buildDraftEntry,
      resetForm,
    ]);

  /*
   * =========================================================
   * REMOVE ENTRY
   * =========================================================
   */

  const removeEntry =
    useCallback(
      (index: number) => {
        setEntries(
          (current) =>
            current.filter(
              (_, i) =>
                i !== index,
            ),
        );
      },
      [],
    );

  /*
   * =========================================================
   * PERSIST ALL
   * =========================================================
   */

  const persistAll =
    useCallback(
      async () => {
        const all = [
          ...entries,
          ...(canAdd
            ? [
                buildDraftEntry(),
              ]
            : []),
        ];

        await setEquipmentInputs(
          documentId,
          all,
        );

        return all;
      },
      [
        entries,
        canAdd,
        buildDraftEntry,
        documentId,
      ],
    );

  /*
   * =========================================================
   * SAVE & ADD ANOTHER
   * =========================================================
   */

  const saveStay =
    useCallback(
      async () => {
        setIsSaving(true);
        setError(null);

        try {
          const saved =
            await persistAll();

          setEntries(saved);
          resetForm();
        } catch (caught) {
          setError(
            getApiErrorMessage(
              caught,
              "Could not save the stage inputs.",
            ),
          );
        } finally {
          setIsSaving(false);
        }
      },
      [
        persistAll,
        resetForm,
      ],
    );

  /*
   * =========================================================
   * SAVE + BACK
   * =========================================================
   */

  const save =
    useCallback(
      async () => {
        setIsSaving(true);
        setError(null);

        try {
          await persistAll();

          handleBackToStages();
        } catch (caught) {
          setError(
            getApiErrorMessage(
              caught,
              "Could not save the stage inputs.",
            ),
          );
        } finally {
          setIsSaving(false);
        }
      },
      [
        persistAll,
        handleBackToStages,
      ],
    );

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <div className="min-h-screen bg-background text-text">
      <AppHeader
        user={user}
        unit={
          user?.unitId
            ? {
                id: user.unitId,
              }
            : null
        }
      />

      <div className="flex">
        <AppSidebar user={user} />

        <main className="min-w-0 flex-1 p-4 lg:p-6">
          <div className="mx-auto max-w-3xl space-y-5">

            {/* =================================================
                HEADER
            ================================================= */}

            <header className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <button
                  type="button"
                  onClick={
                    handleBackToStages
                  }
                  className="mb-2 inline-flex items-center gap-1.5 text-small font-semibold text-primary transition hover:text-primary-dark"
                >
                  <ArrowLeft
                    className="size-4"
                    aria-hidden="true"
                  />

                  Back to select stages
                </button>

                <h1 className="text-h1 font-semibold">
                  Equipment &amp; instruments

                  {forStage ? (
                    <span className="text-subdued">
                      {" "}
                      — {forStage}
                    </span>
                  ) : null}
                </h1>

                <p className="mt-1 max-w-xl text-small text-subdued">
                  Record the equipment and
                  instruments used
                  {forStage
                    ? ` for ${forStage}`
                    : ""}
                  .
                </p>

                <p className="mt-1 text-micro text-subdued">
                  Workflow:{" "}
                  <strong>
                    {documentType.toUpperCase()}
                  </strong>
                </p>
              </div>

              {documentState?.bmr_number ? (
                <span className="rounded-pill bg-accent-soft px-3 py-1.5 font-mono text-micro text-primary-dark">
                  {
                    documentState.bmr_number
                  }
                </span>
              ) : null}
            </header>

            {/* =================================================
                ERROR
            ================================================= */}

            {error ? (
              <div className="flex items-start gap-2 rounded-panel border border-danger/30 bg-danger-soft p-4">
                <AlertCircle
                  className="mt-0.5 size-4 shrink-0 text-danger"
                  aria-hidden="true"
                />

                <p className="text-small text-danger">
                  {error}
                </p>
              </div>
            ) : null}

            {/* =================================================
                LOADING
            ================================================= */}

            {isLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-panel border border-border bg-surface p-16 text-subdued">
                <Loader2
                  className="size-4 animate-spin"
                  aria-hidden="true"
                />

                <span className="text-small">
                  Loading master data…
                </span>
              </div>
            ) : (
              <>
                {/* =================================================
                    EXISTING ENTRIES
                ================================================= */}

                {visibleEntries.length > 0 ? (
                  <section className="overflow-hidden rounded-card border border-border bg-surface">
                    <div className="border-b border-border px-5 py-3 text-small font-semibold capitalize">
                      Added {mode} ·{" "}
                      {
                        visibleEntries.length
                      }
                    </div>

                    <ul className="divide-y divide-sunken">
                      {visibleEntries.map(
                        ({
                          entry,
                          index,
                        }) => (
                          <li
                            key={index}
                            className="flex items-center gap-3 px-5 py-3"
                          >
                            <Wrench
                              className="size-4 shrink-0 text-subdued"
                              aria-hidden="true"
                            />

                            <div className="min-w-0 flex-1">
                              <p className="truncate text-small font-semibold">
                                {
                                  entry.name
                                }{" "}
                                <span className="font-mono text-micro text-subdued">
                                  {
                                    entry.id
                                  }
                                </span>
                              </p>

                              <p className="truncate text-micro text-subdued">
                                {entry.mode ===
                                "equipment"
                                  ? `${entry.stage}${
                                      entry.proc_stage
                                        ? ` · ${entry.proc_stage}`
                                        : ""
                                    }${
                                      Object.keys(
                                        entry.cpp,
                                      ).length
                                        ? ` · ${Object.keys(
                                            entry.cpp,
                                          ).length} CPP`
                                        : ""
                                    }`
                                  : `Instrument · ${
                                      entry.stage ||
                                      "—"
                                    }`}
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                removeEntry(
                                  index,
                                )
                              }
                              title="Remove"
                              className="flex size-8 items-center justify-center rounded-control text-subdued transition hover:bg-sunken hover:text-danger"
                            >
                              <X
                                className="size-4"
                                aria-hidden="true"
                              />
                            </button>
                          </li>
                        ),
                      )}
                    </ul>
                  </section>
                ) : null}

                {/* =================================================
                    MODE
                ================================================= */}

                <div className="inline-flex rounded-pill border border-border bg-sunken p-0.5">
                  {(
                    [
                      "equipment",
                      "instrument",
                    ] as Mode[]
                  ).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() =>
                        switchMode(m)
                      }
                      className={`rounded-pill px-5 py-1.5 text-small font-semibold capitalize transition ${
                        mode === m
                          ? "bg-primary text-white shadow-sm"
                          : "text-subdued"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                {/* =================================================
                    SELECTION
                ================================================= */}

                <section className="rounded-card border border-border bg-surface p-5">
                  <h2 className="mb-4 text-micro font-bold uppercase tracking-wide text-subdued">
                    {mode ===
                    "equipment"
                      ? "Equipment"
                      : "Instrument"}{" "}
                    selection
                  </h2>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Combo
                      label={
                        mode ===
                        "equipment"
                          ? "Equipment name"
                          : "Instrument name"
                      }
                      value={name}
                      options={
                        nameOptions
                      }
                      onChange={
                        chooseName
                      }
                    />

                    <Combo
                      label={
                        mode ===
                        "equipment"
                          ? "Equipment ID"
                          : "Instrument ID"
                      }
                      value={id}
                      options={
                        idOptions
                      }
                      onChange={
                        chooseId
                      }
                    />
                  </div>

                  {mode ===
                    "equipment" &&
                  equipment ? (
                    <DetailBox
                      items={[
                        [
                          "Stage",
                          equipment.stage ||
                            "—",
                        ],
                        [
                          "Capacity",
                          equipment.capacity,
                        ],
                        [
                          "Working capacity",
                          equipment.working_capacity,
                        ],
                      ]}
                    />
                  ) : null}

                  {mode ===
                    "instrument" &&
                  instrumentUnit ? (
                    <DetailBox
                      items={[
                        [
                          "Stage",
                          instrumentUnit.stage ||
                            "—",
                        ],
                      ]}
                    />
                  ) : null}
                </section>

                {/* =================================================
                    PROCESSING STAGE
                ================================================= */}

                {mode ===
                "equipment" ? (
                  <section className="rounded-card border border-border bg-surface p-5">
                    <h2 className="mb-3 text-micro font-bold uppercase tracking-wide text-subdued">
                      Processing stage
                    </h2>

                    {!equipment ? (
                      <p className="text-small italic text-subdued">
                        Select equipment
                        above to load
                        its stages.
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {stages.map(
                          (s) => (
                            <button
                              key={
                                s.stage
                              }
                              type="button"
                              onClick={() => {
                                /*
                                 * IMPORTANT:
                                 *
                                 * Store the FULL
                                 * stage value.
                                 */
                                setProcStage(
                                  s.stage,
                                );

                                setCpp(
                                  {},
                                );
                              }}
                              className={`rounded-pill border px-4 py-1.5 text-small font-medium transition ${
                                procStage ===
                                s.stage
                                  ? "border-primary bg-primary text-white"
                                  : "border-border-strong bg-surface text-subdued hover:border-primary hover:text-primary-dark"
                              }`}
                            >
                              {/*
                               * IMPORTANT:
                               *
                               * DO NOT use
                               * cleanStageName()
                               * here.
                               *
                               * Display the complete
                               * master-data option.
                               */}

                              {s.stage}
                            </button>
                          ),
                        )}
                      </div>
                    )}
                  </section>
                ) : null}

                {/* =================================================
                    CPP
                ================================================= */}

                {mode ===
                "equipment" ? (
                  <section className="rounded-card border border-border bg-surface p-5">
                    <div className="mb-3 flex items-baseline gap-2">
                      <h2 className="text-small font-semibold">
                        Critical process
                        parameters
                      </h2>

                      {procStage ? (
                        <span className="font-mono text-micro text-subdued">
                          {name} ·{" "}
                          {procStage}
                        </span>
                      ) : null}
                    </div>

                    {!equipment ? (
                      <p className="text-small italic text-subdued">
                        Select equipment,
                        then a stage.
                      </p>
                    ) : !procStage ? (
                      <p className="text-small italic text-subdued">
                        Select a stage
                        above.
                      </p>
                    ) : cpps.length ===
                      0 ? (
                      <p className="text-small italic text-subdued">
                        No CPP recorded
                        for this stage.
                      </p>
                    ) : (
                      <div>
                        {cpps.map(
                          (param) => {
                            const meta =
                              cppMeta(
                                param,
                              );

                            return (
                              <div
                                key={
                                  param
                                }
                                className="grid grid-cols-1 items-center gap-3 border-t border-border py-3 first:border-t-0 sm:grid-cols-[1fr_210px]"
                              >
                                <span className="flex flex-wrap items-center gap-2 text-small">
                                  {
                                    param
                                  }

                                  {meta.unit ? (
                                    <span className="rounded-sm bg-sunken px-1.5 py-0.5 font-mono text-micro text-subdued">
                                      {
                                        meta.unit
                                      }
                                    </span>
                                  ) : null}
                                </span>

                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={
                                    cpp[
                                      param
                                    ] ??
                                    ""
                                  }
                                  placeholder={
                                    meta.ex
                                      ? `EX: ${meta.ex}`
                                      : "Enter value"
                                  }
                                  onChange={(
                                    e,
                                  ) =>
                                    setCpp(
                                      (
                                        current,
                                      ) => ({
                                        ...current,
                                        [param]:
                                          e
                                            .target
                                            .value,
                                      }),
                                    )
                                  }
                                  className="h-[38px] w-full rounded-control border border-border-strong bg-surface px-3 font-mono text-small tabular-nums placeholder:font-sans placeholder:italic placeholder:text-subdued focus:border-primary focus:outline-none focus:ring-2 focus:ring-accent-soft"
                                />
                              </div>
                            );
                          },
                        )}
                      </div>
                    )}
                  </section>
                ) : null}

                {/* =================================================
                    BUTTONS
                ================================================= */}

                <div className="flex flex-wrap justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={
                      addEntry
                    }
                    disabled={
                      !canAdd
                    }
                    className="inline-flex h-9 items-center gap-1.5 rounded-control border border-border-strong bg-surface px-4 text-small font-semibold transition hover:bg-sunken disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Plus
                      className="size-4"
                      aria-hidden="true"
                    />

                    Add to document
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void saveStay()
                    }
                    disabled={
                      isSaving ||
                      (entries.length ===
                        0 &&
                        !canAdd)
                    }
                    className="inline-flex h-9 items-center gap-1.5 rounded-control bg-primary px-4 text-small font-semibold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:bg-border-strong"
                  >
                    {isSaving ? (
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : (
                      <Save
                        className="size-4"
                        aria-hidden="true"
                      />
                    )}

                    Save &amp; add another
                  </button>
                </div>

                {/* =================================================
                    FOOTER
                ================================================= */}

                <WizardFooter
                  onBack={
                    handleBackToStages
                  }
                  backLabel="Back without saving"
                  onNext={() =>
                    void save()
                  }
                  nextLabel="Save & back to stages"
                  isBusy={
                    isSaving
                  }
                  isNextDisabled={
                    entries.length ===
                      0 &&
                    !canAdd
                  }
                  hint={
                    entries.length ===
                      0 &&
                    !canAdd
                      ? "Add at least one equipment or instrument"
                      : `${
                          entries.length +
                          (canAdd
                            ? 1
                            : 0)
                        } item${
                          entries.length +
                            (canAdd
                              ? 1
                              : 0) ===
                          1
                            ? ""
                            : "s"
                        } recorded`
                  }
                />
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

/*
 * =========================================================
 * HELPERS
 * =========================================================
 */

/**
 * Used ONLY for matching/filtering stages.
 *
 * It does NOT control what is displayed in the UI.
 *
 * Example:
 *
 * "Dispensing (Raw Material Dispensing)"
 *
 * becomes:
 *
 * "Dispensing"
 *
 * only when comparing stages.
 */
function cleanStageName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

/**
 * Determines whether a master-data stage
 * belongs to the selected URL stage.
 *
 * Matching is intentionally flexible.
 *
 * Display values are NEVER changed.
 */
function stageRelated(
  masterStage: string,
  forStage: string,
): boolean {
  const target =
    cleanStageName(
      forStage,
    ).toLowerCase();

  if (!target) {
    return true;
  }

  const words = target
    .split(/[^a-z0-9]+/)
    .filter(
      (word) =>
        word.length > 3,
    );

  if (words.length === 0) {
    return true;
  }

  const master =
    cleanStageName(
      masterStage,
    ).toLowerCase();

  return words.some(
    (word) =>
      master.includes(word),
  );
}

/*
 * =========================================================
 * DETAIL BOX
 * =========================================================
 */

function DetailBox({
  items,
}: {
  items: [string, string][];
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-6 rounded-control bg-sunken px-4 py-3">
      {items.map(
        ([label, value]) => (
          <div
            key={label}
            className="flex flex-col"
          >
            <span className="text-micro font-semibold uppercase tracking-wide text-subdued">
              {label}
            </span>

            <span className="font-mono text-small">
              {value}
            </span>
          </div>
        ),
      )}
    </div>
  );
}

/*
 * =========================================================
 * COMBO
 * =========================================================
 */

function Combo({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (
    value: string,
  ) => void;
}) {
  const [open, setOpen] =
    useState(false);

  const [query, setQuery] =
    useState("");

  const ref =
    useRef<HTMLDivElement>(
      null,
    );

  /*
   * Keep the input text synchronized
   * with the selected value.
   *
   * This preserves the COMPLETE option name.
   */
  useEffect(() => {
    setQuery(value);
  }, [value]);

  /*
   * Close dropdown when clicking outside.
   */
  useEffect(() => {
    const onDoc = (
      e: MouseEvent,
    ) => {
      if (
        ref.current &&
        !ref.current.contains(
          e.target as Node,
        )
      ) {
        setOpen(false);
      }
    };

    document.addEventListener(
      "mousedown",
      onDoc,
    );

    return () =>
      document.removeEventListener(
        "mousedown",
        onDoc,
      );
  }, []);

  /*
   * Search/filter.
   *
   * IMPORTANT:
   * We filter the original full strings.
   * We do NOT shorten them.
   */
  const filtered =
    options.filter((option) =>
      option
        .toLowerCase()
        .includes(
          query.toLowerCase(),
        ),
    );

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-micro font-semibold text-subdued">
        {label}{" "}
        <span className="text-danger">
          *
        </span>
      </label>

      <div
        ref={ref}
        className="relative"
      >
        <div className="flex min-h-[38px] items-center rounded-control border border-border-strong bg-surface pl-3 pr-1 focus-within:border-primary focus-within:ring-2 focus-within:ring-accent-soft">
          <input
            type="text"
            value={query}
            placeholder="Select or type…"
            autoComplete="off"
            onFocus={() =>
              setOpen(true)
            }
            onChange={(e) => {
              setQuery(
                e.target.value,
              );

              setOpen(true);
            }}
            onBlur={() => {
              if (
                query !==
                value
              ) {
                onChange(
                  query.trim(),
                );
              }
            }}
            onKeyDown={(e) => {
              if (
                e.key ===
                "Enter"
              ) {
                e.preventDefault();

                onChange(
                  query.trim(),
                );

                setQuery(
                  query.trim(),
                );

                setOpen(false);
              }

              if (
                e.key ===
                "Escape"
              ) {
                setQuery(value);
                setOpen(false);
              }
            }}
            className="min-w-0 flex-1 bg-transparent py-2 text-small outline-none placeholder:text-subdued"
          />

          <button
            type="button"
            tabIndex={-1}
            onMouseDown={(e) => {
              e.preventDefault();

              setOpen(
                (current) =>
                  !current,
              );
            }}
            className="flex size-7 shrink-0 items-center justify-center text-subdued"
          >
            <ChevronDown
              className="size-4"
              aria-hidden="true"
            />
          </button>
        </div>

        {open ? (
          <div className="absolute left-0 right-0 top-[calc(100%+4px)] z-20 max-h-64 overflow-auto rounded-control border border-border-strong bg-surface p-1 shadow-overlay">
            {filtered.length ===
            0 ? (
              <div className="px-2.5 py-2 text-small text-subdued">
                {query
                  ? `Use custom value "${query}"`
                  : "No options"}
              </div>
            ) : (
              filtered.map(
                (option) => (
                  <button
                    key={option}
                    type="button"
                    onMouseDown={(
                      e,
                    ) => {
                      e.preventDefault();

                      /*
                       * IMPORTANT:
                       *
                       * Send the COMPLETE
                       * option string.
                       */
                      onChange(
                        option,
                      );

                      /*
                       * Show the COMPLETE
                       * option string.
                       */
                      setQuery(
                        option,
                      );

                      setOpen(
                        false,
                      );
                    }}
                    className="flex w-full items-start gap-2 rounded-sm px-2.5 py-2 text-left text-small transition hover:bg-accent-soft hover:text-primary-dark"
                  >
                    {option ===
                    value ? (
                      <Check
                        className="mt-0.5 size-3.5 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                    ) : (
                      <span className="size-3.5 shrink-0" />
                    )}

                    <span className="whitespace-normal break-words">
                      {option}
                    </span>
                  </button>
                ),
              )
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
