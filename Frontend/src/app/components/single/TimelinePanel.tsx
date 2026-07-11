import { useMemo } from "react";
import {
  Area,
  AreaChart,
  Brush,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useFilters } from "../../context/FilterContext";
import { useData } from "../../context/DataProvider";
import { OniDetailSheet } from "../oni/OniDetailSheet";
import { PanelCard } from "./PanelCard";

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

export function TimelinePanel() {
  const { state, setBrushRange } = useFilters();
  const { oniSeries: series } = useData();

  const range: [number, number] = state.brushRange ?? [
    Math.max(0, series.length - 60),
    series.length - 1,
  ];
  const focus = series.slice(range[0], range[1] + 1);
  const startLabel = series[range[0]]?.date ?? "";
  const endLabel = series[range[1]]?.date ?? "";
  const focusYear = series[Math.floor((range[0] + range[1]) / 2)]?.year ?? state.year;
  const rangeLabel = `${startLabel} → ${endLabel} (${focus.length} mo)`;

  return (
    <PanelCard
      className="col-span-12 row-span-2 lg:col-span-9"
      title="Oceanic Niño Index — focus + context"
      info="ONI is the running 3-month SST anomaly in the Niño-3.4 region. El Niño ≥ +0.5°C (red), La Niña ≤ −0.5°C (blue). Drag the lower band to brush a window."
      actions={
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground hidden text-xs sm:inline">{rangeLabel}</span>
          <OniDetailSheet range={range} rangeLabel={rangeLabel} focusYear={focusYear} />
        </div>
      }
      bodyClassName="flex flex-col gap-1"
    >
      <div className="min-h-0 flex-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={focus} margin={{ top: 6, right: 8, bottom: 0, left: -10 }}>
            <defs key="defs">
              <linearGradient id="oniWarmSingle" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.04} />
              </linearGradient>
            </defs>
            <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis key="x" dataKey="date" tick={{ fontSize: 10 }} minTickGap={28} stroke="var(--muted-foreground)" />
            <YAxis key="y" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" width={36} />
            <Tooltip key="tooltip" contentStyle={tooltipStyle} />
            <ReferenceLine key="elnino" y={0.5} stroke="var(--destructive)" strokeDasharray="4 4" />
            <ReferenceLine key="lanina" y={-0.5} stroke="var(--chart-2)" strokeDasharray="4 4" />
            <ReferenceLine key="zero" y={0} stroke="var(--muted-foreground)" />
            <Area
              type="monotone"
              dataKey="oni"
              name="ONI (°C)"
              stroke="var(--chart-1)"
              strokeWidth={2}
              fill="url(#oniWarmSingle)"
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="h-[72px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 2, right: 8, bottom: 0, left: -10 }}>
            <XAxis
              key="x"
              dataKey="date"
              tickFormatter={(v: string) => v.slice(0, 4)}
              tick={{ fontSize: 10 }}
              minTickGap={40}
              stroke="var(--muted-foreground)"
            />
            <YAxis key="y" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" width={36} />
            <ReferenceLine key="zero" y={0} stroke="var(--muted-foreground)" />
            <Area
              key="area"
              type="monotone"
              dataKey="oni"
              stroke="var(--chart-4)"
              strokeWidth={1}
              fill="var(--chart-4)"
              fillOpacity={0.15}
              isAnimationActive={false}
            />
            <Brush
              key="brush"
              dataKey="date"
              height={18}
              travellerWidth={8}
              startIndex={range[0]}
              endIndex={range[1]}
              stroke="var(--chart-1)"
              fill="var(--muted)"
              onChange={(r: { startIndex?: number; endIndex?: number }) => {
                if (r.startIndex != null && r.endIndex != null) {
                  setBrushRange([r.startIndex, r.endIndex]);
                }
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </PanelCard>
  );
}
