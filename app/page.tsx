"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import pipelineData from "@/data/pipeline.json";
import {
  formatNavDate,
  latestUpdate,
  matchesAwaitFilter,
  type AwaitFilterKey,
  type PipelineLine,
  type PipelineStatus,
} from "@/lib/types";
import Nav from "./components/Nav";
import Hero from "./components/Hero";
import KpiStats from "./components/KpiStats";
import GanttCard from "./components/GanttCard";
import BridgeStrip from "./components/BridgeStrip";
import Pipeline, {
  type SortDir,
  type SortKey,
  type ViewMode,
} from "./components/Pipeline";
import ActionsBar from "./components/ActionsBar";
import Footer from "./components/Footer";
import SubmitModal from "./components/SubmitModal";

type FilterKey = "all" | PipelineStatus;

const DATA = pipelineData as PipelineLine[];

const DEFAULT_PROGRAM_EST =
  DATA.find((r) => r.priority)?.est ??
  DATA.find((r) => r.status === "accepted")?.est ??
  DATA[0]?.est ??
  "";

const VALID_FILTERS: FilterKey[] = [
  "all",
  "pending",
  "quoted",
  "accepted",
  "production",
];
const VALID_AWAIT_FILTERS: AwaitFilterKey[] = [
  "all",
  "massif",
  "envision",
  "ready",
];
const VALID_VIEWS: ViewMode[] = ["cards", "table"];
const VALID_SORT_KEYS: SortKey[] = [
  "est",
  "desc",
  "status",
  "awaiting",
  "qty",
  "price",
];

function readParams(): {
  filter: FilterKey;
  awaitFilter: AwaitFilterKey;
  query: string;
  view: ViewMode;
  sortKey: SortKey;
  sortDir: SortDir;
  program: string;
} {
  if (typeof window === "undefined") {
    return {
      filter: "all",
      awaitFilter: "all",
      query: "",
      view: "cards",
      sortKey: "est",
      sortDir: "asc",
      program: DEFAULT_PROGRAM_EST,
    };
  }
  const p = new URLSearchParams(window.location.search);
  const filter = p.get("filter") as FilterKey | null;
  const awaitFilter = p.get("await") as AwaitFilterKey | null;
  const view = p.get("view") as ViewMode | null;
  const sortKey = p.get("sort") as SortKey | null;
  const sortDir = p.get("dir") as SortDir | null;
  const program = p.get("program");
  const programValid = program && DATA.some((r) => r.est === program);
  return {
    filter: filter && VALID_FILTERS.includes(filter) ? filter : "all",
    awaitFilter:
      awaitFilter && VALID_AWAIT_FILTERS.includes(awaitFilter)
        ? awaitFilter
        : "all",
    query: p.get("q") ?? "",
    view: view && VALID_VIEWS.includes(view) ? view : "cards",
    sortKey: sortKey && VALID_SORT_KEYS.includes(sortKey) ? sortKey : "est",
    sortDir: sortDir === "desc" ? "desc" : "asc",
    program: programValid ? program! : DEFAULT_PROGRAM_EST,
  };
}

export default function Page() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [awaitFilter, setAwaitFilter] = useState<AwaitFilterKey>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("cards");
  const [sortKey, setSortKey] = useState<SortKey>("est");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [program, setProgram] = useState<string>(DEFAULT_PROGRAM_EST);
  const [modalOpen, setModalOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const p = readParams();
    setFilter(p.filter);
    setAwaitFilter(p.awaitFilter);
    setQuery(p.query);
    setView(p.view);
    setSortKey(p.sortKey);
    setSortDir(p.sortDir);
    setProgram(p.program);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const p = new URLSearchParams();
    if (filter !== "all") p.set("filter", filter);
    if (awaitFilter !== "all") p.set("await", awaitFilter);
    if (query) p.set("q", query);
    if (view !== "cards") p.set("view", view);
    if (sortKey !== "est") p.set("sort", sortKey);
    if (sortDir !== "asc") p.set("dir", sortDir);
    if (program && program !== DEFAULT_PROGRAM_EST) p.set("program", program);
    const qs = p.toString();
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [filter, awaitFilter, query, view, sortKey, sortDir, program, hydrated]);

  const liveCount = useMemo(() => {
    const q = query.toLowerCase().trim();
    return DATA.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!matchesAwaitFilter(r, awaitFilter)) return false;
      if (!q) return true;
      return (r.est + " " + r.desc + " " + r.sku).toLowerCase().includes(q);
    }).length;
  }, [filter, awaitFilter, query]);

  const lastUpdate = useMemo(() => {
    const iso = latestUpdate(DATA);
    return iso ? formatNavDate(iso) : "—";
  }, []);

  /** Programs selectable for the Gantt: priority + accepted + production lines, parent-only. */
  const ganttPrograms = useMemo(
    () =>
      DATA.filter((r) => {
        if (r.est.includes(".")) return false;
        return (
          r.priority ||
          r.status === "accepted" ||
          r.status === "production"
        );
      }).sort((a, b) => {
        if (!!b.priority !== !!a.priority) return b.priority ? 1 : -1;
        return a.est.localeCompare(b.est, undefined, { numeric: true });
      }),
    []
  );

  const selectedProgram =
    ganttPrograms.find((p) => p.est === program) ??
    ganttPrograms[0] ??
    DATA[0];

  const handleSortChange = useCallback((k: SortKey, d: SortDir) => {
    setSortKey(k);
    setSortDir(d);
  }, []);

  /** Smoothly bring the pipeline section into view (respects reduced motion). */
  const scrollToPipeline = useCallback(() => {
    if (typeof document === "undefined") return;
    const target = document.getElementById("pipeline");
    if (!target) return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    target.scrollIntoView({
      behavior: reduce ? "auto" : "smooth",
      block: "start",
    });
  }, []);

  /**
   * Set the status filter from the KPI squares, then jump to the pipeline.
   * Clicking the active square again clears the filter without scrolling.
   */
  const handleKpiFilter = useCallback(
    (f: FilterKey) => {
      setFilter(f);
      if (f !== "all") scrollToPipeline();
    },
    [scrollToPipeline]
  );

  /** Same behavior for the stage (bridge) filters, which sit just above the list. */
  const handleBridgeFilter = useCallback(
    (f: AwaitFilterKey) => {
      setAwaitFilter(f);
      if (f !== "all") scrollToPipeline();
    },
    [scrollToPipeline]
  );

  return (
    <>
      <a href="#pipeline" className="skip-link">
        Skip to pipeline
      </a>
      <Nav
        liveCount={liveCount}
        query={query}
        onQueryChange={setQuery}
        lastUpdate={lastUpdate}
      />
      <Hero />
      <KpiStats data={DATA} filter={filter} onFilterChange={handleKpiFilter} />
      <GanttCard
        programs={ganttPrograms}
        selected={selectedProgram}
        onSelect={setProgram}
      />
      <BridgeStrip
        data={DATA}
        awaitFilter={awaitFilter}
        onAwaitFilterChange={handleBridgeFilter}
      />
      <Pipeline
        data={DATA}
        filter={filter}
        onFilterChange={setFilter}
        awaitFilter={awaitFilter}
        onAwaitFilterChange={setAwaitFilter}
        query={query}
        onClearSearch={() => setQuery("")}
        view={view}
        onViewChange={setView}
        sortKey={sortKey}
        sortDir={sortDir}
        onSortChange={handleSortChange}
      />
      <ActionsBar onSubmit={() => setModalOpen(true)} />
      <Footer />
      <SubmitModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
