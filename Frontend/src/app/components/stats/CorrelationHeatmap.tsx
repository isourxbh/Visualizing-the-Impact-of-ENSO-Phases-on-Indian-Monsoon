import { fetchLagFeatureCorrelation, type ApiLagFeatureCorrelation } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { correlationScale } from "../../lib/colorScale";
import { GridHeatmap } from "../heatmap/GridHeatmap";
import { LoadingState, ErrorState } from "../ui/ErrorState";

interface Props {
  xFeature: string;
  yFeature: string;
  onSelectPair: (x: string, y: string) => void;
}

export function CorrelationHeatmap({ xFeature, yFeature, onSelectPair }: Props) {
  const { data, loading, error, refetch } = useApiData<
    ApiLagFeatureCorrelation,
    { features: { id: string; label: string }[]; cells: { row: number; col: number; r: number }[] }
  >({
    apiFn: () => fetchLagFeatureCorrelation(),
    transform: (api) => ({
      features: api.features,
      cells: api.cells.map((c) => ({ row: c.row, col: c.col, r: c.r })),
    }),
    deps: [],
  });

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "No correlation data."} onRetry={refetch} />;

  const { features, cells } = data;
  const labels = features.map((f) => f.label);

  return (
    <GridHeatmap
      rows={features.length}
      cols={features.length}
      cells={cells.map((c) => ({ row: c.row, col: c.col, value: c.r }))}
      rowLabels={labels}
      colLabels={features.map((f) => f.id.toUpperCase())}
      color={(v) => correlationScale(v)}
      cellHeight={40}
      gap={3}
      rounded
      onCellClick={(cell) => {
        const fx = features[cell.col].id;
        const fy = features[cell.row].id;
        onSelectPair(fx, fy);
      }}
      isSelected={(cell) =>
        features[cell.col].id === xFeature && features[cell.row].id === yFeature
      }
      tooltip={(cell) => (
        <div>
          <div className="font-medium">
            {features[cell.row].label} vs {features[cell.col].label}
          </div>
          <div className="text-muted-foreground">r = {cell.value.toFixed(2)} · click to plot</div>
        </div>
      )}
    />
  );
}
