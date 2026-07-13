import { useState } from "react";
import { LAG_FEATURES, type LagFeatureId } from "../../data/constants";
import { ColorLegend } from "../ColorLegend";
import { CorrelationHeatmap } from "../stats/CorrelationHeatmap";
import { ScatterRegression } from "../stats/ScatterRegression";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { PanelCard } from "./PanelCard";
import { ViewSelect } from "./ViewSelect";

const VIEWS = [
  { value: "matrix", label: "Correlation" },
  { value: "scatter", label: "Scatter + fit" },
];

function CompactFeatureSelect({
  value,
  onChange,
  label,
}: {
  value: LagFeatureId;
  onChange: (v: LagFeatureId) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="text-muted-foreground text-xs">{label}</span>
      <Select value={value} onValueChange={(v) => onChange(v as LagFeatureId)}>
        <SelectTrigger size="sm" className="w-[128px]">
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

export function RelationshipsPanel() {
  const [view, setView] = useState("matrix");
  const [xFeature, setXFeature] = useState<LagFeatureId>("oni");
  const [yFeature, setYFeature] = useState<LagFeatureId>("rainfall");

  return (
    <PanelCard
      className="col-span-12 row-span-4 md:col-span-6 lg:col-span-3"
      title={view === "matrix" ? "Correlation matrix" : "Scatter + regression"}
      info={
        view === "matrix"
          ? "Pearson r across climate & monsoon features. Red = positive, blue = negative. Click a cell to plot that pair."
          : "One point per year, colored by ENSO phase, with an ordinary least-squares fit and R²."
      }
      actions={<ViewSelect value={view} onChange={setView} options={VIEWS} width={140} />}
      bodyClassName={view === "matrix" ? "flex flex-col gap-2 overflow-auto" : "flex flex-col gap-2"}
    >
      {view === "matrix" ? (
        <>
          <CorrelationHeatmap
            xFeature={xFeature}
            yFeature={yFeature}
            onSelectPair={(x, y) => {
              setXFeature(x as LagFeatureId);
              setYFeature(y as LagFeatureId);
              setView("scatter");
            }}
          />
          <ColorLegend kind="correlation" minLabel="−1" midLabel="0" maxLabel="+1" />
        </>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <CompactFeatureSelect value={xFeature} onChange={setXFeature} label="X" />
            <CompactFeatureSelect value={yFeature} onChange={setYFeature} label="Y" />
          </div>
          <div className="min-h-0 flex-1">
            <ScatterRegression xFeature={xFeature} yFeature={yFeature} />
          </div>
        </>
      )}
    </PanelCard>
  );
}
