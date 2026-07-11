import { useMemo } from "react";
import { useFilters } from "../../context/FilterContext";
import { useData } from "../../context/DataProvider";
import { MONTHS } from "../../data/constants";
import { fetchSstGrid, fetchSstGridYear, type ApiSstGrid } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { divergingScale } from "../../lib/colorScale";
import { ColorLegend } from "../ColorLegend";
import { GridHeatmap } from "../heatmap/GridHeatmap";
import { PanelCard } from "../single/PanelCard";
import { Slider } from "../ui/slider";
import { LoadingState, ErrorState } from "../ui/ErrorState";
import { useState } from "react";

const DOMAIN = 3;

interface SstCell {
  row: number;
  col: number;
  value: number;
  lat: number;
  lon: number;
  sst: number;
  anom: number;
}

interface SstGridLocal {
  rows: number;
  cols: number;
  cells: SstCell[];
}

function apiToGrid(api: ApiSstGrid): SstGridLocal {
  // Determine grid dimensions from unique lat/lon counts
  const lats = new Set(api.grid.values.map((v) => v.lat));
  const lons = new Set(api.grid.values.map((v) => v.lon));
  const sortedLats = Array.from(lats).sort((a, b) => b - a); // descending
  const sortedLons = Array.from(lons).sort((a, b) => {
    const a360 = a < 0 ? a + 360 : a;
    const b360 = b < 0 ? b + 360 : b;
    return a360 - b360;
  }); // sort geographically across dateline
  const latIdx = new Map(sortedLats.map((l, i) => [l, i]));
  const lonIdx = new Map(sortedLons.map((l, i) => [l, i]));
  const cells: SstCell[] = api.grid.values.map((v) => ({
    row: latIdx.get(v.lat) ?? 0,
    col: lonIdx.get(v.lon) ?? 0,
    value: +(v.sst - 26.8).toFixed(2),
    lat: v.lat,
    lon: v.lon,
    sst: v.sst,
    anom: +(v.sst - 26.8).toFixed(2),
  }));
  return { rows: sortedLats.length, cols: sortedLons.length, cells };
}

const lonLabel = (lon: number) => (lon <= 180 ? `${lon}°E` : `${360 - lon}°W`);

function SstGrid({ grid, label }: { grid: SstGridLocal; label?: string }) {
  const byKey = useMemo(() => {
    const m = new Map<string, SstCell>();
    grid.cells.forEach((cc) => m.set(`${cc.row}:${cc.col}`, cc));
    return m;
  }, [grid]);

  return (
    <div className="flex flex-col gap-xs">
      {label ? <div className="text-label-sm text-text-secondary">{label}</div> : null}
      <GridHeatmap
        rows={grid.rows}
        cols={grid.cols}
        cells={grid.cells.map((c) => ({ row: c.row, col: c.col, value: c.value }))}
        color={(v) => divergingScale(v, DOMAIN)}
        cellHeight={4}
        gap={1}
        tooltip={(cell) => {
          const full = byKey.get(`${cell.row}:${cell.col}`);
          if (!full) return null;
          return (
            <div>
              <div className="text-label-sm">
                {Math.abs(full.lat)}°{full.lat >= 0 ? "N" : "S"} · {lonLabel(full.lon)}
              </div>
              <div className="text-video-title text-text-secondary">
                SST {full.sst}°C · anom {full.anom > 0 ? "+" : ""}
                {full.anom}°C
              </div>
            </div>
          );
        }}
      />
    </div>
  );
}

export function SstComparePanel({ className }: { className?: string }) {
  const { state } = useFilters();
  const { compareMode, year, compareYear } = state;
  const [selMonth, setSelMonth] = useState(10); // Nov is index 10

  const eventName = `${MONTHS[selMonth].toLowerCase()}_${year}`;

  // Single mode: fetch the selected event
  const singleResult = useApiData<ApiSstGrid, SstGridLocal>({
    apiFn: () => fetchSstGrid("ersst", eventName),
    transform: apiToGrid,
    deps: [eventName],
  });

  // Compare mode: fetch grids for both years
  const gridAResult = useApiData<ApiSstGrid, SstGridLocal>({
    apiFn: () => fetchSstGridYear(year),
    transform: apiToGrid,
    deps: [year],
  });
  const gridBResult = useApiData<ApiSstGrid, SstGridLocal>({
    apiFn: () => fetchSstGridYear(compareYear),
    transform: apiToGrid,
    deps: [compareYear],
  });

  const loading = compareMode
    ? gridAResult.loading || gridBResult.loading
    : singleResult.loading;
  const error = compareMode
    ? gridAResult.error || gridBResult.error
    : singleResult.error;

  return (
    <PanelCard
      className={className}
      title="G1 · SST datasets"
      info="Sea-surface temperature anomaly across the Indo-Pacific (60°S–66°N, 100°E–77°W)."
      actions={
        <ColorLegend
          kind="diverging"
          domain={DOMAIN}
          minLabel="−3°C"
          midLabel="0"
          maxLabel="+3°C"
          className="w-48"
        />
      }
      bodyClassName="flex flex-col gap-lg overflow-auto"
    >


      {loading ? (
        <LoadingState />
      ) : error ? (
        <ErrorState
          message={error}
          onRetry={compareMode ? gridAResult.refetch : singleResult.refetch}
        />
      ) : compareMode ? (
        <div className="flex flex-col gap-lg">
          {gridAResult.data && <SstGrid grid={gridAResult.data} label={`Year A · ${year}`} />}
          {gridBResult.data && <SstGrid grid={gridBResult.data} label={`Year B · ${compareYear}`} />}
        </div>
      ) : (
        singleResult.data && <SstGrid grid={singleResult.data} />
      )}

      {compareMode ? null : (
        <div className="mt-auto pt-4 flex flex-col gap-2">
          <div className="flex justify-between text-label-sm text-text-secondary px-1">
            <span>Jan</span>
            <span className="font-medium text-text-primary">{MONTHS[selMonth]}</span>
            <span>Dec</span>
          </div>
          <Slider
            min={0}
            max={11}
            step={1}
            value={[selMonth]}
            onValueChange={(vals) => setSelMonth(vals[0])}
          />
        </div>
      )}
    </PanelCard>
  );
}
