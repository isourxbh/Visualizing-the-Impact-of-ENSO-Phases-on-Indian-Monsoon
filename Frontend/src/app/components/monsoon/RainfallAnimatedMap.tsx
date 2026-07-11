import { useMemo } from "react";
import { useFilters } from "../../context/FilterContext";
import { fetchRainfallAnimationFrame } from "../../data/api";
import { useApiData } from "../../data/useApiData";
import { STATE_NAME_BY_ID, MONSOON_ANIM_DAYS } from "../../data/constants";
import { IndiaChoropleth, type PatternDensity } from "../maps/IndiaChoropleth";
import { LoadingState, ErrorState } from "../ui/ErrorState";

function cumColor(v: number, max: number): string {
  const t = Math.max(0, Math.min(1, v / (max || 1)));
  const stops: [number, [number, number, number]][] = [
    [0, [254, 240, 176]],
    [0.5, [45, 178, 168]],
    [1, [30, 64, 175]],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    const [t0, c0] = stops[i];
    const [t1, c1] = stops[i + 1];
    if (t <= t1) {
      const k = (t - t0) / (t1 - t0 || 1);
      const r = Math.round(c0[0] + (c1[0] - c0[0]) * k);
      const g = Math.round(c0[1] + (c1[1] - c0[1]) * k);
      const b = Math.round(c0[2] + (c1[2] - c0[2]) * k);
      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return "rgb(30, 64, 175)";
}

function currentDensity(current: number): PatternDensity {
  if (current < 20) return "none";
  if (current < 60) return "light";
  if (current < 120) return "medium";
  return "heavy";
}

/** Compute the animation date window for a given playback day. */
function getDateWindow(year: number, day: number): { start: string; end: string; periodStart: string } {
  const jun1 = new Date(year, 5, 1);
  const endDate = new Date(jun1);
  endDate.setDate(endDate.getDate() + day);
  const periodStart = new Date(endDate);
  periodStart.setDate(periodStart.getDate() - 6); // 7-day window
  if (periodStart < jun1) periodStart.setTime(jun1.getTime());
  const fmt = (d: Date) => d.toISOString().slice(0, 10);
  return { start: fmt(periodStart), end: fmt(endDate), periodStart: fmt(jun1) };
}

interface FrameCell { state: string; current_rain: number; cumulative_rain: number }

interface RainfallAnimatedMapProps {
  year: number;
  height?: number | string;
  patternIdPrefix?: string;
  compareYear?: number;
}

export function RainfallAnimatedMap({
  year,
  height = "100%",
  patternIdPrefix = "rain",
  compareYear,
}: RainfallAnimatedMapProps) {
  const { state, selectRegion, hoverRegion } = useFilters();
  const day = state.playbackDay;

  const dates = useMemo(() => getDateWindow(year, day), [year, day]);

  const { data: frame, loading, error } = useApiData<
    { frame: FrameCell[] },
    Record<string, { cumMm: number; currentMm: number }>
  >({
    apiFn: () => fetchRainfallAnimationFrame(year, dates.start, dates.end),
    transform: (api) => {
      const out: Record<string, { cumMm: number; currentMm: number }> = {};
      api.frame.forEach((f) => {
        const id = f.state.toLowerCase().replace(/\s+/g, "_");
        out[id] = { cumMm: Math.round(f.cumulative_rain ?? 0), currentMm: Math.round(f.current_rain ?? 0) };
      });
      return out;
    },
    deps: [year, day],
  });

  if (loading) return <LoadingState className="h-full" />;
  if (error || !frame) return <ErrorState message={error ?? "No animation data."} />;

  const maxCum = Math.max(1, ...Object.values(frame).map((c) => c.cumMm));

  const colorById: Record<string, string> = {};
  const patternById: Record<string, PatternDensity> = {};
  Object.entries(frame).forEach(([id, cell]) => {
    colorById[id] = cumColor(cell.cumMm, maxCum);
    patternById[id] = currentDensity(cell.currentMm);
  });

  return (
    <IndiaChoropleth
      colorById={colorById}
      patternById={patternById}
      patternIdPrefix={patternIdPrefix}
      height={height}
      selectedRegionId={state.selectedRegionId}
      hoveredRegionId={state.hoveredRegionId}
      onSelect={selectRegion}
      onHover={hoverRegion}
      tooltip={(id) => {
        const cell = frame[id];
        if (!cell) return null;
        return (
          <div>
            <div className="font-medium">{STATE_NAME_BY_ID[id] ?? id}</div>
            <div className="text-muted-foreground">
              Cumulative: {cell.cumMm} mm · now: {cell.currentMm} mm
            </div>
          </div>
        );
      }}
    />
  );
}
