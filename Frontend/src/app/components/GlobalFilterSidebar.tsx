import { useEffect, useMemo } from "react";
import { RotateCcw, Waves } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useFilters } from "../context/FilterContext";
import { useData } from "../context/DataProvider";
import {
  ALL,
  PHASES,
  STATES,
  STATE_NAME_BY_ID,
  SUBDIVISIONS,
  YEARS,
} from "../data/constants";
import type { Phase } from "../data/types";
import { phaseColor } from "../lib/colorScale";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
} from "./ui/sidebar";
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

export function GlobalFilterSidebar() {
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

  // Filtered year list based on selected phase
  const filteredYears = useMemo(
    () => getYearsForPhase(state.phase),
    [state.phase],
  );

  // Snap year into the filtered list whenever phase changes
  useEffect(() => {
    if (!filteredYears.includes(state.year)) {
      setYear(filteredYears[filteredYears.length - 1]);
    }
  }, [filteredYears, state.year, setYear]);

  const sparkData = useMemo(
    () => oniSeries.filter((p) => p.monthIndex === 6), // one point per year (July)
    [oniSeries],
  );

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
    <Sidebar>
      <SidebarHeader className="gap-1 px-4 pt-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground flex size-8 items-center justify-center rounded-md">
            <Waves className="size-4" />
          </div>
          <div className="leading-tight">
            <div className="font-medium">ENSO × Monsoon</div>
            <div className="text-muted-foreground text-xs">Climate Analytics</div>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {activeBadges.length > 0 ? (
          <SidebarGroup>
            <SidebarGroupLabel>Active filters</SidebarGroupLabel>
            <SidebarGroupContent>
              <div className="flex flex-wrap gap-1.5 px-1">
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
            </SidebarGroupContent>
          </SidebarGroup>
        ) : null}

        <SidebarGroup>
          <SidebarGroupLabel>Year</SidebarGroupLabel>
          <SidebarGroupContent>
            <Select value={String(state.year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {filteredYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y} · {getYearPhase(y)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Climate Phase</SidebarGroupLabel>
          <SidebarGroupContent>
            <Select value={state.phase} onValueChange={(v) => setPhase(v as Phase | typeof ALL)}>
              <SelectTrigger className="w-full">
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
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>State</SidebarGroupLabel>
          <SidebarGroupContent>
            <Select value={state.state} onValueChange={(v) => setState(v)}>
              <SelectTrigger className="w-full">
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
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-1" />

        <SidebarGroup>
          <SidebarGroupLabel>ONI history (Jul)</SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="h-12 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={sparkData} margin={{ top: 2, bottom: 2, left: 0, right: 0 }}>
                  <defs key="defs">
                    <linearGradient id="spark" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <Area
                    type="monotone"
                    dataKey="oni"
                    stroke="var(--chart-1)"
                    strokeWidth={1.5}
                    fill="url(#spark)"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-4 pb-4">
        <Button variant="outline" size="sm" className="w-full gap-2" onClick={reset}>
          <RotateCcw className="size-3.5" />
          Reset filters
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
