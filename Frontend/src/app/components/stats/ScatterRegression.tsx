import { useMemo } from "react";
import {
  CartesianGrid,
  Cell,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { LAG_FEATURES, type LagFeatureId } from "../../data/constants";
import { fetchLagFeatureCorrelation, type ApiLagFeatureCorrelation } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { linearRegression } from "../../data/utils";
import { classifyPhase } from "../../data/utils";
import { phaseColor } from "../../lib/colorScale";
import { LoadingState, ErrorState } from "../ui/ErrorState";

const labelOf = (id: string) => LAG_FEATURES.find((f) => f.id === id)?.label ?? id;

interface ScatterPt {
  year: number;
  x: number;
  y: number;
  phase: string;
}

export function ScatterRegression({
  xFeature,
  yFeature,
}: {
  xFeature: LagFeatureId;
  yFeature: LagFeatureId;
}) {
  const { data: apiData, loading, error, refetch } = useApiData<
    ApiLagFeatureCorrelation,
    { points: ScatterPt[] }
  >({
    apiFn: () => fetchLagFeatureCorrelation(),
    transform: (api) => {
      const xSeries = api.series[xFeature] ?? [];
      const ySeries = api.series[yFeature] ?? [];
      const pts: ScatterPt[] = [];
      for (let i = 0; i < xSeries.length; i++) {
        const xd = xSeries[i];
        const yd = ySeries[i];
        if (xd && yd && xd.year === yd.year) {
          // Determine phase from ONI series
          const oniVal = api.series["oni"]?.[i]?.value ?? 0;
          pts.push({
            year: xd.year,
            x: xd.value,
            y: yd.value,
            phase: classifyPhase(oniVal),
          });
        }
      }
      return { points: pts };
    },
    deps: [xFeature, yFeature],
  });

  if (loading) return <LoadingState />;
  if (error || !apiData) return <ErrorState message={error ?? "No data."} onRetry={refetch} />;

  const { points } = apiData;
  const reg = linearRegression(points);
  const xs = points.map((p) => p.x);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const line = [
    { x: minX, y: reg.slope * minX + reg.intercept },
    { x: maxX, y: reg.slope * maxX + reg.intercept },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span>
          <strong>y</strong> = {reg.slope.toFixed(2)}·x + {reg.intercept.toFixed(2)}
        </span>
        <span>
          R² = <strong>{reg.r2.toFixed(3)}</strong>
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart margin={{ top: 8, right: 16, bottom: 16, left: -6 }}>
            <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              key="x"
              type="number"
              dataKey="x"
              name={labelOf(xFeature)}
              tick={{ fontSize: 10 }}
              stroke="var(--muted-foreground)"
              label={{ value: labelOf(xFeature), position: "bottom", fontSize: 11, fill: "var(--muted-foreground)" }}
            />
            <YAxis key="y" type="number" dataKey="y" name={labelOf(yFeature)} tick={{ fontSize: 10 }} width={44} stroke="var(--muted-foreground)" />
            <ZAxis key="z" range={[60, 60]} />
            <Tooltip
              cursor={{ strokeDasharray: "3 3" }}
              contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              formatter={(v: number, name: string) => [typeof v === "number" ? v.toFixed(2) : v, name]}
              labelFormatter={() => ""}
            />
            <Scatter data={points} isAnimationActive={false}>
              {points.map((p) => (
                <Cell key={p.year} fill={phaseColor(p.phase as any)} fillOpacity={0.8} />
              ))}
            </Scatter>
            <Line data={line} dataKey="y" stroke="var(--chart-1)" strokeWidth={2} dot={false} activeDot={false} isAnimationActive={false} legendType="none" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="text-muted-foreground flex items-center gap-3 text-[11px]">
        <span className="flex items-center gap-1"><span className="size-2.5 rounded-full" style={{ background: phaseColor("El Niño") }} /> El Niño</span>
        <span className="flex items-center gap-1"><span className="size-2.5 rounded-full" style={{ background: phaseColor("La Niña") }} /> La Niña</span>
        <span className="flex items-center gap-1"><span className="size-2.5 rounded-full" style={{ background: phaseColor("Neutral") }} /> Neutral</span>
      </div>
    </div>
  );
}
