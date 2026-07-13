import { useState } from "react";
import { useFilters } from "../../context/FilterContext";
import { STATE_NAME_BY_ID } from "../../data/constants";
import { ColorLegend } from "../ColorLegend";
import { NdviMacroChart } from "../agri/NdviMacroChart";
import { RegionalNdviLines } from "../agri/RegionalNdviLines";
import { CumulativeLinePlot } from "../monsoon/CumulativeLinePlot";
import { CalendarHeatmap } from "../monsoon/CalendarHeatmap";
import { PanelCard } from "./PanelCard";
import { ViewSelect } from "./ViewSelect";

const VIEWS = [
  { value: "macro", label: "NDVI vs rain" },
  { value: "regional", label: "Regional NDVI" },
  { value: "cumulative", label: "Cumulative rain" },
  { value: "calendar", label: "Daily calendar" },
];

const INFO: Record<string, string> = {
  macro: "National NDVI greening (line) against weekly rainfall (bars) over the Kharif cycle. NDVI lags rainfall by ~3 weeks.",
  regional: "Per-state NDVI anomaly vs normal. Drier El Niño years push major belts negative. The selected state is emphasized.",
  cumulative: "Running seasonal rainfall total for the active state, actual vs normal, with the playback marker.",
  calendar: "Daily rainfall intensity for the active state — each cell is one day of the Jun–Sep season.",
};

export function VegetationPanel() {
  const { state } = useFilters();
  const { year, selectedRegionId } = state;
  const regionId = selectedRegionId ?? "kl";
  const regionName = STATE_NAME_BY_ID[regionId];
  const [view, setView] = useState("macro");

  const title =
    view === "macro"
      ? `Vegetation vs rainfall — ${year}`
      : view === "regional"
        ? `Regional NDVI anomaly — ${year}`
        : view === "cumulative"
          ? `Cumulative rainfall — ${regionName}`
          : `Daily rainfall — ${regionName}`;

  return (
    <PanelCard
      className="col-span-12 row-span-4 md:col-span-6 lg:col-span-3"
      title={title}
      info={INFO[view]}
      actions={<ViewSelect value={view} onChange={setView} options={VIEWS} width={150} />}
      bodyClassName={view === "calendar" ? "flex flex-col gap-2 overflow-auto" : "flex flex-col"}
    >
      {view === "macro" ? (
        <div className="min-h-0 flex-1">
          <NdviMacroChart year={year} />
        </div>
      ) : view === "regional" ? (
        <div className="min-h-0 flex-1">
          <RegionalNdviLines year={year} selectedRegionId={selectedRegionId} />
        </div>
      ) : view === "cumulative" ? (
        <div className="min-h-0 flex-1">
          <CumulativeLinePlot year={year} regionId={regionId} />
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <CalendarHeatmap year={year} regionId={regionId} />
          <ColorLegend kind="sst" sstRange={[0, 1]} minLabel="dry" maxLabel="heavy rain" className="max-w-xs" />
        </div>
      )}
    </PanelCard>
  );
}
