"use client";

import { useMemo, useState } from "react";
import pipelineData from "@/data/pipeline.json";
import type { PipelineLine, PipelineStatus } from "@/lib/types";
import Nav from "./components/Nav";
import SearchStrip from "./components/SearchStrip";
import Hero from "./components/Hero";
import KpiStats from "./components/KpiStats";
import GanttCard from "./components/GanttCard";
import BridgeStrip from "./components/BridgeStrip";
import Pipeline from "./components/Pipeline";
import ActionsBar from "./components/ActionsBar";
import Footer from "./components/Footer";
import SubmitModal from "./components/SubmitModal";

type FilterKey = "all" | PipelineStatus;

const DATA = pipelineData as PipelineLine[];

export default function Page() {
  const [filter, setFilter] = useState<FilterKey>("all");
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const liveCount = useMemo(() => {
    const q = query.toLowerCase().trim();
    return DATA.filter((r) => {
      if (filter !== "all" && r.status !== filter) return false;
      if (!q) return true;
      return (r.est + " " + r.desc + " " + r.sku).toLowerCase().includes(q);
    }).length;
  }, [filter, query]);

  return (
    <>
      <Nav liveCount={liveCount} />
      <SearchStrip query={query} onQueryChange={setQuery} />
      <Hero />
      <KpiStats />
      <GanttCard />
      <BridgeStrip />
      <Pipeline
        data={DATA}
        filter={filter}
        onFilterChange={setFilter}
        query={query}
        onClearSearch={() => setQuery("")}
      />
      <ActionsBar onSubmit={() => setModalOpen(true)} />
      <Footer />
      <SubmitModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
