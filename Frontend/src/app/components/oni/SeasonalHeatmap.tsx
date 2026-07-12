import { useApiData } from "../../data/useApiData";
import { fetchSeasonalHeatmap, type ApiSeasonalHeatmap } from "../../data/api";
import { divergingScale } from "../../lib/colorScale";
import { GridHeatmap } from "../heatmap/GridHeatmap";
import { LoadingState, ErrorState } from "../ui/ErrorState";

export function SeasonalHeatmap({ year }: { year: number }) {
  const { data, loading, error, refetch } = useApiData<
    ApiSeasonalHeatmap,
    { rows: string[]; cols: string[]; cells: { row: number; col: number; value: number }[] }
  >({
    apiFn: () => fetchSeasonalHeatmap(year),
    transform: (api) => ({
      rows: api.rows.slice(0, 14),
      cols: api.cols,
      cells: api.cells.filter((c) => c.row < 14),
    }),
    deps: [year],
  });

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "No seasonal data."} onRetry={refetch} />;

  return (
    <GridHeatmap
      rows={data.rows.length}
      cols={12}
      cells={data.cells}
      color={(v) => v === undefined ? "var(--muted)" : divergingScale(v, 60)}
      cellHeight={14}
      gap={1}
      rowLabels={data.rows}
      colLabels={data.cols}
    />
  );
}
