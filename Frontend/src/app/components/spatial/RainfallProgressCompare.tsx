import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFilters } from "../../context/FilterContext";
import { useData } from "../../context/DataProvider";
import { STATE_NAME_BY_ID } from "../../data/constants";
import { fetchRainfallCumulative, type ApiRainfallCumulative } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { LoadingState, ErrorState } from "../ui/ErrorState";

const COLOR_A = "var(--chart-1)";
const COLOR_B = "var(--chart-4)";

export function RainfallProgressCompare({ yearA, yearB }: { yearA: number; yearB: number }) {
  const { state } = useFilters();
  const { getYearPhase } = useData();
  const regionId = state.selectedRegionId ?? "kl";
  const regionName = STATE_NAME_BY_ID[regionId] ?? regionId;

  const keyA = `y${yearA}`;
  const keyB = `y${yearB}`;

  const { data: cumA, loading: lA, error: eA } = useApiData<ApiRainfallCumulative, { date: string; cum: number }[]>({
    apiFn: () => fetchRainfallCumulative(regionName, yearA),
    transform: (api) => api.daily.map((d) => ({ date: d.date, cum: d.cumulative_mm })),
    deps: [yearA, regionId],
  });

  const { data: cumB, loading: lB, error: eB } = useApiData<ApiRainfallCumulative, number[]>({
    apiFn: () => fetchRainfallCumulative(regionName, yearB),
    transform: (api) => api.daily.map((d) => d.cumulative_mm),
    deps: [yearB, regionId],
  });

  if (lA || lB) return <LoadingState />;
  if (eA || !cumA) return <ErrorState message={eA ?? "No data."} />;

  const data = cumA.map((p, i) => ({
    date: p.date,
    day: i,
    [keyA]: p.cum,
    [keyB]: cumB?.[i] ?? 0,
  }));

  const last = data[data.length - 1];
  const totalA = last ? (last[keyA] as number) : 0;
  const totalB = last ? (last[keyB] as number) : 0;
  const deltaPct = totalB ? Math.round(((totalA - totalB) / totalB) * 100) : 0;

  return (
    <div className="flex h-full min-h-0 flex-col gap-2">
      <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-3 rounded-sm" style={{ background: COLOR_A }} />
          <strong style={{ color: COLOR_A }}>{yearA}</strong>: {totalA.toLocaleString()} mm
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block h-2.5 w-3 rounded-sm" style={{ background: COLOR_B }} />
          <strong style={{ color: COLOR_B }}>{yearB}</strong>: {totalB.toLocaleString()} mm
        </span>
        <span>
          {yearA} ran {deltaPct >= 0 ? "+" : ""}
          {deltaPct}% vs {yearB}
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -6 }}>
            <defs key="defs">
              <linearGradient id="rainProgA" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLOR_A} stopOpacity={0.55} />
                <stop offset="95%" stopColor={COLOR_A} stopOpacity={0.04} />
              </linearGradient>
              <linearGradient id="rainProgB" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COLOR_B} stopOpacity={0.5} />
                <stop offset="95%" stopColor={COLOR_B} stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis key="x" dataKey="date" tick={{ fontSize: 10 }} interval={13} stroke="var(--muted-foreground)" />
            <YAxis key="y" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" width={44} />
            <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`${v.toLocaleString()} mm`, ""]} />
            <Area key="area-a" type="monotone" dataKey={keyA} name={`${yearA} · ${getYearPhase(yearA)}`} stroke={COLOR_A} strokeWidth={2} fill="url(#rainProgA)" isAnimationActive={false} />
            <Area key="area-b" type="monotone" dataKey={keyB} name={`${yearB} · ${getYearPhase(yearB)}`} stroke={COLOR_B} strokeWidth={2} fill="url(#rainProgB)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <p className="text-muted-foreground text-xs">
        Cumulative monsoon rainfall progress for {regionName}. Select a state on either map to
        compare its seasonal build-up across the two years.
      </p>
    </div>
  );
}
