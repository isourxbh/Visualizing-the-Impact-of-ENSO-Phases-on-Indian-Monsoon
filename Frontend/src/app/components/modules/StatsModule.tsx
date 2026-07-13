import { useState } from "react";
import { LAG_FEATURES, type LagFeatureId } from "../../data/constants";
import { ChartCard } from "../ChartCard";
import { ColorLegend } from "../ColorLegend";
import { CorrelationHeatmap } from "../stats/CorrelationHeatmap";
import { ScatterRegression } from "../stats/ScatterRegression";
import { Card, CardContent } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

function FeatureSelect({
  value,
  onChange,
  label,
}: {
  value: LagFeatureId;
  onChange: (v: LagFeatureId) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <Select value={value} onValueChange={(v) => onChange(v as LagFeatureId)}>
        <SelectTrigger size="sm" className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {LAG_FEATURES.map((f) => (
            <SelectItem key={f.id} value={f.id}>
              {f.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function StatsModule() {
  const [xFeature, setXFeature] = useState<LagFeatureId>("oni");
  const [yFeature, setYFeature] = useState<LagFeatureId>("rainfall");

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="text-muted-foreground py-3 text-sm">
          Evaluate how ENSO indices lead monsoon outcomes. Click any cell in the correlation matrix
          to load that feature pair into the scatter plot and fit a regression line.
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Correlation matrix"
          description="Pearson r across climate & monsoon features (1991–2024)"
          info="Red = positive correlation, blue = negative. ONI and SOI are strongly anti-correlated; ONI and rainfall are negatively correlated (El Niño → drier)."
        >
          <CorrelationHeatmap
            xFeature={xFeature}
            yFeature={yFeature}
            onSelectPair={(x, y) => {
              setXFeature(x as LagFeatureId);
              setYFeature(y as LagFeatureId);
            }}
          />
          <ColorLegend
            kind="correlation"
            minLabel="−1"
            midLabel="0"
            maxLabel="+1"
            className="mt-3 max-w-xs"
          />
        </ChartCard>

        <ChartCard
          title="Scatter + regression"
          description="One point per year, colored by ENSO phase"
          info="Ordinary least-squares fit. R² reports the variance explained. Switch axes with the selectors or by clicking the matrix."
          actions={
            <div className="flex flex-col items-end gap-1">
              <FeatureSelect value={xFeature} onChange={setXFeature} label="X" />
              <FeatureSelect value={yFeature} onChange={setYFeature} label="Y" />
            </div>
          }
        >
          <ScatterRegression xFeature={xFeature} yFeature={yFeature} />
        </ChartCard>
      </div>
    </div>
  );
}
