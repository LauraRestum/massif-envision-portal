"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import pipelineData from "@/data/pipeline.json";
import type { PipelineLine, PipelineStatus } from "@/lib/types";
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

const VALID_FILTERS: FilterKey[] = [
  "all",
  "pending",
  "quoted",
  "accepted",
  "production",
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
  query: string;
  view: ViewMode;
  sortKey: SortKey;
  sortDir: SortDir;
} {
  if (typeof window === "undefined") {
    return { filter: "all", query: "", view: "cards", sortKey: "est", sortDir: "asc" };
  }
  const p = new URLSearchParams(window.location.search);
  const filter = p.get("filter") as FilterKey | null;
  const view = p.get("view") as ViewMode | null;
  const sortKey = p.get("sort") as SortKey | null;
  const sortDir = p.get("dir") as SortDir | null;
  return {
    filter: filter && VALID_FILTERS.includes(filter) ? filter : "all",
    query: p.get("q") ?? "",
    view: view && VALID_VIEWS.includes(view) ? view : "cards",
    sortKey: sortKey && VALID_SORT_KEYS.includes(sortKey) ? sortKey : "est",
    sortDir: sortDir === "desc" ? "desc" : "asc",
  };
}

export default function Page() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<ViewMode>("cards");
  const [sortKey, setSortKey] = useState<SortKey>("est");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [modalOpen, setModalOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate state from URL on mount
  useEffect(() => {
    const p = readParams();
    setFilter(p.filter);
    setQuery(p.query);
    setView(p.view);
    setSortKey(p.sortKey);
    setSortDir(p.sortDir);
    setHydrated(true);
  }, []);

  // Sync state to URL (after hydration)
  useEffect(() => {
    if (!hydrated) return;
    const p = new URLSearchParams();
    if (filter !== "all") p.set("filter", filter);
    if (query) p.set("q", query);
    if (view !== "cards") p.set("view", view);
    if (sortKey !== "est") p.set("sort", sortKey);
    if (sortDir !== "asc") p.set("dir", sortDir);
    const qs = p.toString();
    const url = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", url);
  }, [filter, query, view, sortKey, sortDir, hydrated]);

  const liveCount = useMemo(() => {
    const q = query.toLowerCase().trim();
    return DATA.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return (r.est + " " + r.desc + " " + r.sku).toLowerCase().includes(q);
    }).length;
  }, [filter, query]);

  const handleSortChange = useCallback((k: SortKey, d: SortDir) => {
    setSortKey(k);
    setSortDir(d);
  }, []);

  return (
    <>
      <a href="#pipeline" className="skip-link">
        Skip to pipeline
      </a>
      <Nav liveCount={liveCount} query={query} onQueryChange={setQuery} />
      <Hero />
      <KpiStats data={DATA} filter={filter} onFilterChange={setFilter} />
      <GanttCard />
      <BridgeStrip data={DATA} />
      <Pipeline
        data={DATA}
        filter={filter}
        onFilterChange={setFilter}
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
