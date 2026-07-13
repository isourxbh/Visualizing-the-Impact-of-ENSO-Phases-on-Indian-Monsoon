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
import { ChartCard } from "../ChartCard";
import { OniDetailSheet } from "../oni/OniDetailSheet";
import { Card, CardContent } from "../ui/card";

export function OniTimelineModule() {
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
  const rangeLabel = `Brushed window: ${startLabel} → ${endLabel} (${focus.length} months)`;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="text-muted-foreground py-3 text-sm">
          Drag the handles on the lower <strong>context</strong> band to brush a time window; the
          upper <strong>focus</strong> chart zooms to your selection. Open the side panel for
          details-on-demand on that window.
        </CardContent>
      </Card>

      <ChartCard
        title="Oceanic Niño Index — Focus + Context"
        description={rangeLabel}
        info="ONI is the running 3-month SST anomaly in the Niño-3.4 region. El Niño ≥ +0.5°C (red zone), La Niña ≤ −0.5°C (blue zone)."
        actions={
          <OniDetailSheet range={range} rangeLabel={rangeLabel} focusYear={focusYear} />
        }
      >
        {/* Focus chart */}
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={focus} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
              <defs key="defs">
                <linearGradient id="oniWarm" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid key="grid" strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis key="x" dataKey="date" tick={{ fontSize: 10 }} minTickGap={28} stroke="var(--muted-foreground)" />
              <YAxis key="y" tick={{ fontSize: 10 }} stroke="var(--muted-foreground)" width={36} />
              <Tooltip
                key="tooltip"
                contentStyle={{
                  background: "var(--popover)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <ReferenceLine key="elnino" y={0.5} stroke="var(--destructive)" strokeDasharray="4 4" />
              <ReferenceLine key="lanina" y={-0.5} stroke="var(--chart-2)" strokeDasharray="4 4" />
              <ReferenceLine key="zero" y={0} stroke="var(--muted-foreground)" />
              <Area
                type="monotone"
                dataKey="oni"
                name="ONI (°C)"
                stroke="var(--chart-1)"
                strokeWidth={2}
                fill="url(#oniWarm)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Context chart with brush */}
        <div className="mt-2 h-[110px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
              <XAxis key="x"
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
                height={22}
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
      </ChartCard>
    </div>
  );
}
