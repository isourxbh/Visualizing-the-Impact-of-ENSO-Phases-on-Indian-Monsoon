import { useState } from "react";
import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
  ReferenceLine,
} from "recharts";
import { useFilters } from "../../context/FilterContext";
import { REGION_GROUPS } from "../../data/constants";
import { fetchNdviRegional, type ApiNdviRegional } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { linearRegression, pValue } from "../../data/utils";
import { PanelCard } from "../single/PanelCard";
import { ChartBox } from "../single/ChartBox";
import { ViewSelect } from "../single/ViewSelect";
import { LoadingState, ErrorState } from "../ui/ErrorState";

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

interface NdviChartPoint {
  date: string;
  ndviA: number;
  oni: number;
}

export function NdviOniPanel({ className }: { className?: string }) {
  const { state } = useFilters();
  const [groupId, setGroupId] = useState("C");

  let regionLabel =
    REGION_GROUPS.find((g) => g.id === groupId)?.label?.toLowerCase() ?? "central";
  if (regionLabel === "east & ne") {
    regionLabel = "east";
  }

  const { data, loading, error, refetch } = useApiData<
    ApiNdviRegional,
    NdviChartPoint[]
  >({
    apiFn: () => fetchNdviRegional(regionLabel),
    transform: (api) =>
      api.data.map((d) => ({
        date: d.composite_start,
        ndviA: d.mean_ndvi,
        oni: d.oni,
      })),
    deps: [groupId],
  });

  let rStr = "";
  let pStr = "";
  let line: any[] = [];
  if (data && data.length > 0) {
    const reg = linearRegression(data.map((d) => ({ x: d.oni, y: d.ndviA })));
    const r = Math.sqrt(reg.r2) * (reg.slope < 0 ? -1 : 1);
    const p = pValue(r, data.length);
    rStr = r.toFixed(2);
    pStr = p < 0.001 ? "<0.001" : p.toFixed(3);
    const xs = data.map((d) => d.oni);
    const minX = Math.min(...xs, -0.5);
    const maxX = Math.max(...xs, 0.5);
    line = [
      { oni: minX, ndviA: reg.intercept + reg.slope * minX },
      { oni: maxX, ndviA: reg.intercept + reg.slope * maxX },
    ];
  }

  return (
    <PanelCard
      className={className}
      title="G6 · NDVI vs ONI Correlation"
      info="Scatter plot showing the relationship between Oceanic Niño Index (ONI) and regional vegetation greenness (NDVI)."
      actions={
        <ViewSelect
          value={groupId}
          onChange={setGroupId}
          width={140}
          options={REGION_GROUPS.map((g) => ({ value: g.id, label: g.label }))}
        />
      }
      bodyClassName="flex flex-col"
    >
      {loading ? (
        <LoadingState />
      ) : error || !data ? (
        <ErrorState message={error ?? "No NDVI data."} onRetry={refetch} />
      ) : (
        <div className="flex h-full min-h-0 flex-col">
          <div className="text-muted-foreground shrink-0 text-xs mb-1">
            Correlation: r = {rStr}, p = {pStr} (n = {data.length})
          </div>
          <ChartBox>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 16, right: 16, bottom: 0, left: -16 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  type="number"
                  dataKey="oni"
                  name="ONI"
                  tick={{ fontSize: 9 }}
                  stroke="var(--muted-foreground)"
                  domain={[-2.5, 2.5]}
                />
                <YAxis
                  type="number"
                  dataKey="ndviA"
                  name="NDVI"
                  tick={{ fontSize: 9 }}
                  stroke="var(--chart-3)"
                  domain={['auto', 'auto']}
                />
                <ZAxis type="category" dataKey="date" name="Date" />
                <Tooltip 
                  cursor={{ strokeDasharray: '3 3' }} 
                  contentStyle={tooltipStyle}
                />
                <ReferenceLine x={0} stroke="var(--muted-foreground)" />
                <Scatter 
                  key="reg" 
                  data={line} 
                  line={{ stroke: "var(--destructive)", strokeWidth: 2 }} 
                  shape={() => <g />} 
                  isAnimationActive={false} 
                />
                <Scatter 
                  name="NDVI vs ONI" 
                  data={data} 
                  fill="var(--chart-3)" 
                  fillOpacity={0.6}
                />
              </ScatterChart>
            </ResponsiveContainer>
          </ChartBox>
        </div>
      )}
    </PanelCard>
  );
}

