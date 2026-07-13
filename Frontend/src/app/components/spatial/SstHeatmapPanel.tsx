import { fetchSstGridYear, type ApiSstGrid } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { sequentialScale } from "../../lib/colorScale";
import { GridHeatmap } from "../heatmap/GridHeatmap";
import { LoadingState, ErrorState } from "../ui/ErrorState";

const SST_MIN = 20;
const SST_MAX = 32;

interface SstCell {
  row: number;
  col: number;
  value: number;
  lat: number;
  lon: number;
}

export function SstHeatmapPanel({ year }: { year: number }) {
  const { data: grid, loading, error, refetch } = useApiData<
    ApiSstGrid,
    { rows: number; cols: number; cells: SstCell[] }
  >({
    apiFn: () => fetchSstGridYear(year),
    transform: (api) => {
      const lats = [...new Set(api.grid.values.map((v) => v.lat))].sort((a, b) => b - a);
      const lons = [...new Set(api.grid.values.map((v) => v.lon))].sort((a, b) => a - b);
      const latIdx = new Map(lats.map((l, i) => [l, i]));
      const lonIdx = new Map(lons.map((l, i) => [l, i]));
      const cells: SstCell[] = api.grid.values.map((v) => ({
        row: latIdx.get(v.lat) ?? 0,
        col: lonIdx.get(v.lon) ?? 0,
        value: v.sst,
        lat: v.lat,
        lon: v.lon,
      }));
      return { rows: lats.length, cols: lons.length, cells };
    },
    deps: [year],
  });

  if (loading) return <LoadingState />;
  if (error || !grid) return <ErrorState message={error ?? "No SST data."} onRetry={refetch} />;

  return (
    <div className="flex flex-col gap-2">
      <span className="text-muted-foreground text-xs">
        Tropical Pacific · {grid.rows}×{grid.cols} grid
      </span>
      <GridHeatmap
        rows={grid.rows}
        cols={grid.cols}
        cells={grid.cells}
        color={(v) => v === undefined ? "var(--muted)" : sequentialScale(v, SST_MIN, SST_MAX)}
        cellHeight={12}
        gap={1}
        tooltip={(cell) => {
          const c = grid.cells.find((x) => x.row === cell.row && x.col === cell.col);
          return (
            <div>
              <div className="font-medium">
                {c ? `${Math.abs(c.lat)}°${c.lat >= 0 ? "N" : "S"}, ${c.lon}°E` : ""}
              </div>
              <div className="text-muted-foreground">SST: {cell.value.toFixed(1)}°C</div>
            </div>
          );
        }}
      />
    </div>
  );
}
