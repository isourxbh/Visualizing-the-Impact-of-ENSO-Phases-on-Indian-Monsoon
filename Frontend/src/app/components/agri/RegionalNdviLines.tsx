import { useMemo } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fetchNdviRegional, type ApiNdviRegional } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { STATE_NAME_BY_ID } from "../../data/constants";
import { LoadingState, ErrorState } from "../ui/ErrorState";

const PALETTE = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)",
  "var(--chart-4)", "var(--chart-5)", "var(--primary)",
];

const REGIONS = ["north", "south", "east", "west", "central"];

export function RegionalNdviLines({
  year,
  selectedRegionId,
}: {
  year: number;
  selectedRegionId: string | null;
}) {
  // Fetch all regions and merge
  const { data, loading, error, refetch } = useApiData<
    Record<string, ApiNdviRegional>,
    { ids: string[]; chartData: Record<string, unknown>[] }
  >({
    apiFn: async () => {
      const results: Record<string, ApiNdviRegional> = {};
      for (const r of REGIONS) {
        const res = await fetchNdviRegional(r);
        if (res) results[r] = res;
      }
      return Object.keys(results).length > 0 ? results : null;
    },
    transform: (apiMap) => {
      const ids = Object.keys(apiMap);
      // Merge into chart-friendly data: each row has date + one key per region
      const dateMap = new Map<string, Record<string, unknown>>();
      for (const [id, api] of Object.entries(apiMap)) {
        for (const d of api.data) {
          if (!dateMap.has(d.composite_start)) {
            dateMap.set(d.composite_start, { weekLabel: d.composite_start });
          }
          dateMap.get(d.composite_start)![id] = d.ndvi_anomaly;
        }
      }
      return { ids, chartData: Array.from(dateMap.values()) };
    },
    deps: [year],
  });

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "No NDVI data."} onRetry={refetch} />;

  return (
    <div className="h-full min-h-0">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.chartData} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
          <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis key="x" dataKey="weekLabel" tick={{ fontSize: 10 }} minTickGap={16} stroke="var(--muted-foreground)" />
          <YAxis key="y" tick={{ fontSize: 10 }} width={44} stroke="var(--muted-foreground)" />
          <Tooltip key="tooltip" contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
          <Legend key="legend" wrapperStyle={{ fontSize: 11 }} />
          <ReferenceLine key="ref-zero" y={0} stroke="var(--muted-foreground)" />
          {data.ids.map((id, i) => (
            <Line
              key={id}
              type="monotone"
              dataKey={id}
              name={id.charAt(0).toUpperCase() + id.slice(1)}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
