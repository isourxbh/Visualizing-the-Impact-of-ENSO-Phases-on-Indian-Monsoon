import { fetchCalendarHeatmap, type ApiCalendarHeatmap } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { sequentialScale } from "../../lib/colorScale";
import { GridHeatmap } from "../heatmap/GridHeatmap";
import { LoadingState, ErrorState } from "../ui/ErrorState";

const WEEKDAYS = ["W1", "W2", "W3", "W4", "W5", "W6", "W7"];

export function CalendarHeatmap({ year, regionId }: { year: number; regionId: string }) {
  const { data, loading, error, refetch } = useApiData<ApiCalendarHeatmap, ApiCalendarHeatmap>({
    apiFn: () => fetchCalendarHeatmap(regionId, year),
    transform: (api) => api,
    deps: [year, regionId],
  });

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "No calendar data."} onRetry={refetch} />;

  const { weeks, cells } = data;
  const gridCells = cells.map((c) => ({ row: c.weekIndex, col: c.weekday, value: c.rainfallMm }));
  const max = Math.max(10, ...cells.map((c) => c.rainfallMm));

  return (
    <GridHeatmap
      rows={weeks}
      cols={7}
      cells={gridCells}
      colLabels={WEEKDAYS}
      rowLabels={Array.from({ length: weeks }, (_, i) => `Wk ${i + 1}`)}
      color={(v) => (v === undefined || v <= 0 ? "var(--muted)" : sequentialScale(v, 0, max))}
      cellHeight={20}
      rounded
      tooltip={(cell) => {
        const day = cell.row * 7 + cell.col;
        const c = cells.find((x) => x.day === day);
        return (
          <div>
            <div className="font-medium">{c?.date ?? `Day ${day + 1}`}</div>
            <div className="text-muted-foreground">{cell.value} mm</div>
          </div>
        );
      }}
    />
  );
}
