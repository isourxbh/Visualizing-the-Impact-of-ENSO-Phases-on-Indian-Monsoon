import { useFilters } from "../../context/FilterContext";
import { STATE_NAME_BY_ID } from "../../data/constants";
import { ChartCard } from "../ChartCard";
import { ColorLegend } from "../ColorLegend";
import { Card, CardContent } from "../ui/card";
import { PlaybackControls } from "../monsoon/PlaybackControls";
import { OnsetMap } from "../monsoon/OnsetMap";
import { CalendarHeatmap } from "../monsoon/CalendarHeatmap";
import { CumulativeLinePlot } from "../monsoon/CumulativeLinePlot";

export function MonsoonProgressModule() {
  const { state } = useFilters();
  const { year } = state;
  const regionId = state.selectedRegionId ?? "kl";
  const regionName = STATE_NAME_BY_ID[regionId];

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="py-3">
          <p className="text-muted-foreground mb-3 text-sm">
            Press play to animate the {year} monsoon onset sweeping north-westward across India. The
            cumulative plot&apos;s marker tracks the same day. Select a state to focus its daily
            rainfall calendar.
          </p>
          <PlaybackControls />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartCard
          title={`Onset progression — ${year}`}
          description="States shade in as the monsoon arrives"
          info="Each state colors in once its onset day is reached. El Niño years generally delay onset; La Niña years bring it forward."
        >
          <OnsetMap year={year} />
          <div className="text-muted-foreground mt-2 flex items-center gap-2 text-[11px]">
            <span className="size-3 rounded-sm" style={{ background: "var(--muted)" }} />
            awaiting
            <span className="ml-3 size-3 rounded-sm" style={{ background: "rgb(120,140,90)" }} />
            just arrived
            <span className="ml-3 size-3 rounded-sm" style={{ background: "rgb(40,200,90)" }} />
            established
          </div>
        </ChartCard>

        <ChartCard
          title={`Cumulative rainfall — ${regionName}`}
          description="Actual vs. normal, with playback marker"
          info="Running seasonal total for the selected region. The red marker follows the playback day."
        >
          <CumulativeLinePlot year={year} regionId={regionId} />
        </ChartCard>
      </div>

      <ChartCard
        title={`Daily rainfall calendar — ${regionName}, ${year}`}
        description="Each cell is one day of the Jun–Sep season"
        info="Calendar heatmap of daily rainfall intensity. Wetter days are darker. Rows are weeks of the monsoon season."
      >
        <CalendarHeatmap year={year} regionId={regionId} />
        <ColorLegend kind="sst" sstRange={[0, 1]} minLabel="dry" maxLabel="heavy rain" className="mt-3 max-w-xs" />
      </ChartCard>
    </div>
  );
}
