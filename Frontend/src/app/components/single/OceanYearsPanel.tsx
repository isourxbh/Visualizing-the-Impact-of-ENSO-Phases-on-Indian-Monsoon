import { useState } from "react";
import { useFilters } from "../../context/FilterContext";
import { useData } from "../../context/DataProvider";
import { YEARS } from "../../data/constants";
import { ColorLegend } from "../ColorLegend";
import { SstHeatmapPanel } from "../spatial/SstHeatmapPanel";
import { RainfallProgressCompare } from "../spatial/RainfallProgressCompare";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { PanelCard } from "./PanelCard";
import { ViewSelect } from "./ViewSelect";

const VIEWS = [
  { value: "sst", label: "SST field" },
  { value: "buildup", label: "Rainfall build-up" },
];

export function OceanYearsPanel() {
  const { state, setCompareYear } = useFilters();
  const { getYearPhase } = useData();
  const { year, compareYear } = state;
  const [view, setView] = useState("sst");

  return (
    <PanelCard
      className="col-span-12 row-span-4 md:col-span-6 lg:col-span-3"
      title={view === "sst" ? `Pacific SST — ${year}` : "Rainfall build-up"}
      info={
        view === "sst"
          ? "Synthetic tropical-Pacific sea-surface temperature. A warm eastern-Pacific tongue signals El Niño and a typically weaker Indian monsoon."
          : "Cumulative monsoon rainfall for the active state, comparing the primary year against a chosen comparison year."
      }
      actions={<ViewSelect value={view} onChange={setView} options={VIEWS} width={150} />}
      bodyClassName={view === "sst" ? "overflow-auto" : "flex flex-col"}
    >
      {view === "sst" ? (
        <div className="flex flex-col gap-2">
          <SstHeatmapPanel year={year} />
          <ColorLegend kind="sst" sstRange={[20, 32]} minLabel="20°C" maxLabel="32°C" />
        </div>
      ) : (
        <div className="flex h-full min-h-0 flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs">vs</span>
            <Select value={String(compareYear)} onValueChange={(v) => setCompareYear(Number(v))}>
              <SelectTrigger size="sm" className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {YEARS.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y} · {getYearPhase(y)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="min-h-0 flex-1">
            <RainfallProgressCompare yearA={year} yearB={compareYear} />
          </div>
        </div>
      )}
    </PanelCard>
  );
}
