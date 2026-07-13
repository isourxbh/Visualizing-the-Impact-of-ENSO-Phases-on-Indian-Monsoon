import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchNdviNational, type ApiNdviNational } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { LoadingState, ErrorState } from "../ui/ErrorState";

interface MacroPoint {
  date: string;
  ndvi: number;
  rainfall: number;
}

export function NdviMacroChart({ year }: { year: number }) {
  const { data, loading, error, refetch } = useApiData<ApiNdviNational, MacroPoint[]>({
    apiFn: () => fetchNdviNational(),
    transform: (api) =>
      (api.data ?? []).map((d) => ({
        date: d.composite_start,
        ndvi: d.mean_ndvi,
        rainfall: (d.ndvi_anomaly ?? 0) * 100, // proxy
      })),
    deps: [year],
  });

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "No NDVI data."} onRetry={refetch} />;

  return (
    <div className="h-full min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
          <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis key="x" dataKey="date" tick={{ fontSize: 10 }} minTickGap={16} stroke="var(--muted-foreground)" />
          <YAxis key="y-ndvi" yAxisId="ndvi" domain={[0, 1]} tick={{ fontSize: 10 }} width={40} stroke="var(--chart-3)" label={{ value: "NDVI", angle: -90, position: "insideLeft", fontSize: 11, fill: "var(--chart-3)" }} />
          <YAxis key="y-rain" yAxisId="rain" orientation="right" tick={{ fontSize: 10 }} width={44} stroke="var(--chart-2)" label={{ value: "Anomaly (%)", angle: 90, position: "insideRight", fontSize: 11, fill: "var(--chart-2)" }} />
          <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
          <Bar yAxisId="rain" dataKey="rainfall" name="NDVI anomaly (%)" fill="var(--chart-2)" fillOpacity={0.35} radius={[2, 2, 0, 0]} isAnimationActive={false} />
          <Line yAxisId="ndvi" type="monotone" dataKey="ndvi" name="NDVI" stroke="var(--chart-3)" strokeWidth={2.5} dot={false} isAnimationActive={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
