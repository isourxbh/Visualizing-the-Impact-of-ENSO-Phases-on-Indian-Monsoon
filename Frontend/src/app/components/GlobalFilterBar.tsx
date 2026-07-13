import { useEffect, useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useFilters } from "../context/FilterContext";
import { useData } from "../context/DataProvider";
import {
  ALL,
  PHASES,
  STATES,
  STATE_NAME_BY_ID,
  SUBDIVISIONS,
} from "../data/constants";
import type { Phase } from "../data/types";
import { phaseColor } from "../lib/colorScale";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Separator } from "./ui/separator";

/** Horizontal global-filter bar (replaces the former left sidebar). */
export function GlobalFilterBar() {
  const {
    state,
    setYear,
    setPhase,
    setState,
    setSubdivision,
    selectRegion,
    reset,
  } = useFilters();
  const { getYearPhase, getYearsForPhase, oniSeries } = useData();

  // Filtered year list based on selected phase.
  const filteredYears = useMemo(() => getYearsForPhase(state.phase), [state.phase]);

  // Snap year into the filtered list whenever phase changes.
  useEffect(() => {
    if (!filteredYears.includes(state.year)) {
      setYear(filteredYears[filteredYears.length - 1]);
    }
  }, [filteredYears, state.year, setYear]);

  const sparkData = useMemo(
    () => oniSeries.filter((p) => p.monthIndex === 6), // one point per year (July)
    [oniSeries],
  );

  // The sparkline only shows at ≥xl (1280px). Track the media query so we mount
  // the recharts container only when it's actually visible — a chart rendered
  // inside a `display:none` ancestor measures 0×0 and recharts warns.
  const [sparkVisible, setSparkVisible] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1280px)");
    const update = () => setSparkVisible(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const activeBadges: { label: string; onClear: () => void }[] = [];
  if (state.phase !== ALL) activeBadges.push({ label: state.phase, onClear: () => setPhase(ALL) });
  if (state.state !== ALL)
    activeBadges.push({ label: STATE_NAME_BY_ID[state.state], onClear: () => setState(ALL) });
  if (state.subdivision !== ALL) {
    const sd = SUBDIVISIONS.find((s) => s.id === state.subdivision);
    if (sd) activeBadges.push({ label: sd.name, onClear: () => setSubdivision(ALL) });
  }
  if (state.selectedRegionId)
    activeBadges.push({
      label: `📍 ${STATE_NAME_BY_ID[state.selectedRegionId]}`,
      onClear: () => selectRegion(null),
    });

  return (
    <div className="bg-background flex flex-wrap items-center gap-x-4 gap-y-2 border-b px-4 py-2">
      <label className="flex items-center gap-1.5">
        <span className="text-muted-foreground text-xs">Year</span>
        <Select value={String(state.year)} onValueChange={(v) => setYear(Number(v))}>
          <SelectTrigger size="sm" className="w-[128px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {filteredYears.slice().reverse().map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y} · {getYearPhase(y)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="flex items-center gap-1.5">
        <span className="text-muted-foreground text-xs">Phase</span>
        <Select value={state.phase} onValueChange={(v) => setPhase(v as Phase | typeof ALL)}>
          <SelectTrigger size="sm" className="w-[130px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All phases</SelectItem>
            {PHASES.map((p) => (
              <SelectItem key={p} value={p}>
                <span className="flex items-center gap-2">
                  <span
                    className="inline-block size-2.5 rounded-full"
                    style={{ background: phaseColor(p) }}
                  />
                  {p}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      <label className="flex items-center gap-1.5">
        <span className="text-muted-foreground text-xs">State</span>
        <Select value={state.state} onValueChange={(v) => setState(v)}>
          <SelectTrigger size="sm" className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All states</SelectItem>
            {STATES.map((s) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>

      {activeBadges.length > 0 ? (
        <>
          <Separator orientation="vertical" className="h-6" />
          <div className="flex flex-wrap items-center gap-1.5">
            {activeBadges.map((b, i) => (
              <Badge
                key={i}
                variant="secondary"
                className="cursor-pointer gap-1"
                onClick={b.onClear}
                title="Click to clear"
              >
                {b.label}
                <span className="text-muted-foreground">×</span>
              </Badge>
            ))}
          </div>
        </>
      ) : null}

      <div className="ml-auto flex items-center gap-3">
        <div className="hidden items-center gap-1.5 xl:flex">
          <span className="text-muted-foreground text-xs">ONI (Jul)</span>
          <div className="h-8 w-32">
            {sparkVisible ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
                  <defs key="defs">
                    <linearGradient id="sparkBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="oni"
                    stroke="var(--chart-1)"
                    strokeWidth={1.5}
                    fill="url(#sparkBar)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : null}
          </div>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={reset}>
          <RotateCcw className="size-3.5" />
          Reset
        </Button>
      </div>
    </div>
  );
}
