import { useFilters } from "../../context/FilterContext";
import { useData } from "../../context/DataProvider";
import { YEARS } from "../../data/constants";
import { phaseColor } from "../../lib/colorScale";
import { ChartCard } from "../ChartCard";
import { ColorLegend } from "../ColorLegend";
import { SstHeatmapPanel } from "../spatial/SstHeatmapPanel";
import { RainfallChoroplethPanel } from "../spatial/RainfallChoroplethPanel";
import { RainfallProgressCompare } from "../spatial/RainfallProgressCompare";
import { PlaybackControls } from "../monsoon/PlaybackControls";
import { OnsetMap } from "../monsoon/OnsetMap";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

function YearPicker({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
}) {
  const { getYearPhase, getYearOni } = useData();
  const phase = getYearPhase(value);
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger size="sm" className="w-[150px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y} · {getYearPhase(y)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Badge variant="outline" style={{ borderColor: phaseColor(phase) }} className="gap-1">
        <span className="size-2 rounded-full" style={{ background: phaseColor(phase) }} />
        ONI {getYearOni(value) > 0 ? "+" : ""}
        {getYearOni(value)}
      </Badge>
    </div>
  );
}

export function SpatialCompareModule() {
  const { state, setYear, setCompareYear } = useFilters();
  const { getYearPhase } = useData();
  const { year, compareYear } = state;

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3">
          <p className="text-muted-foreground text-sm">
            Compare two years side by side — ocean state (SST) on top, land response (rainfall
            anomaly) below. Try a strong El Niño vs. a La Niña year.
          </p>
          <div className="flex flex-wrap gap-4">
            <YearPicker value={year} onChange={setYear} label="Left" />
            <YearPicker value={compareYear} onChange={setCompareYear} label="Right" />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={`Sea-surface temperature — ${year}`}
          info="Synthetic tropical-Pacific SST field. Toggle resolution to compare how grid coarseness blurs the El Niño warm tongue in the central/eastern Pacific."
        >
          <SstHeatmapPanel year={year} />
          <ColorLegend kind="sst" sstRange={[20, 32]} minLabel="20°C" maxLabel="32°C" className="mt-3" />
        </ChartCard>

        <ChartCard
          title={`Sea-surface temperature — ${compareYear}`}
          info="Same field for the comparison year. Warmer eastern Pacific ⇒ El Niño ⇒ typically weaker Indian monsoon."
        >
          <SstHeatmapPanel year={compareYear} />
          <ColorLegend kind="sst" sstRange={[20, 32]} minLabel="20°C" maxLabel="32°C" className="mt-3" />
        </ChartCard>

        <ChartCard
          title={`Rainfall anomaly — ${year}`}
          info="Monsoon-season rainfall departure by state. Hover for values; selecting a state syncs with the Overview and Agriculture views."
        >
          <RainfallChoroplethPanel year={year} />
          <ColorLegend
            kind="rainfall"
            domain={40}
            minLabel="−40%"
            midLabel="normal"
            maxLabel="+40%"
            className="mt-2"
          />
        </ChartCard>

        <ChartCard
          title={`Rainfall anomaly — ${compareYear}`}
          info="Comparison year choropleth. Note how drier (brown) states tend to cluster in El Niño years."
        >
          <RainfallChoroplethPanel year={compareYear} />
          <ColorLegend
            kind="rainfall"
            domain={40}
            minLabel="−40%"
            midLabel="normal"
            maxLabel="+40%"
            className="mt-2"
          />
        </ChartCard>
      </div>

      <ChartCard
        title="Monsoon onset — animated year comparison"
        description={`Press play to sweep both seasons day-by-day: ${year} vs ${compareYear}`}
        info="Plays the monsoon onset progression for both years in lockstep so you can watch how the same calendar day looks in each. El Niño years (e.g. drier) typically advance slower; La Niña years arrive earlier. Shares the playback cursor with the Monsoon Progress tab."
      >
        <div className="flex flex-col gap-4">
          <PlaybackControls />
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex flex-col">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium">{year}</span>
                <Badge
                  variant="outline"
                  className="gap-1"
                  style={{ borderColor: phaseColor(getYearPhase(year)) }}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ background: phaseColor(getYearPhase(year)) }}
                  />
                  {getYearPhase(year)}
                </Badge>
              </div>
              <OnsetMap year={year} />
            </div>
            <div className="flex flex-col">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-medium">{compareYear}</span>
                <Badge
                  variant="outline"
                  className="gap-1"
                  style={{ borderColor: phaseColor(getYearPhase(compareYear)) }}
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ background: phaseColor(getYearPhase(compareYear)) }}
                  />
                  {getYearPhase(compareYear)}
                </Badge>
              </div>
              <OnsetMap year={compareYear} />
            </div>
          </div>
          <div className="text-muted-foreground flex items-center gap-2 text-[11px]">
            <span className="size-3 rounded-sm" style={{ background: "var(--muted)" }} />
            awaiting
            <span className="ml-3 size-3 rounded-sm" style={{ background: "rgb(120,140,90)" }} />
            just arrived
            <span className="ml-3 size-3 rounded-sm" style={{ background: "rgb(40,200,90)" }} />
            established
          </div>
        </div>
      </ChartCard>

      <ChartCard
        title="Monsoon rainfall progress — year comparison"
        description={`Cumulative seasonal build-up: ${year} vs ${compareYear}`}
        info="Running total of monsoon rainfall through the Jun–Sep season for both selected years, gradient-shaded for readability. La Niña years typically climb faster (wetter); El Niño years lag."
      >
        <RainfallProgressCompare yearA={year} yearB={compareYear} />
      </ChartCard>
    </div>
  );
}
