import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useFilters } from "../../context/FilterContext";
import { MONSOON_DAYS } from "../../data/constants";
import { Button } from "../ui/button";
import { Slider } from "../ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const SPEEDS = [
  { label: "0.5×", value: 240 },
  { label: "1×", value: 120 },
  { label: "2×", value: 60 },
  { label: "4×", value: 30 },
];

const START = new Date(2000, 5, 1);
function dayLabel(d: number) {
  const date = new Date(START);
  date.setDate(date.getDate() + d);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function PlaybackControls({ totalDays = MONSOON_DAYS }: { totalDays?: number }) {
  const { state, setPlaybackDay, togglePlay } = useFilters();
  const { playbackDay, isPlaying } = state;
  const [interval, setIntervalMs] = useState(120);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep the latest day in a ref so the interval reads fresh values without
  // re-subscribing (which would reset the timer) on every tick.
  const dayRef = useRef(playbackDay);
  dayRef.current = playbackDay;

  useEffect(() => {
    if (!isPlaying) {
      if (timer.current) clearInterval(timer.current);
      return;
    }
    timer.current = setInterval(() => {
      const next = dayRef.current + 1;
      if (next >= totalDays - 1) {
        setPlaybackDay(totalDays - 1);
        togglePlay(false);
      } else {
        setPlaybackDay(next);
      }
    }, interval);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
    // setPlaybackDay/togglePlay are stable callbacks from context.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, interval, totalDays]);

  const atEnd = playbackDay >= totalDays - 1;

  return (
    <div className="flex items-center gap-3">
      <Button
        size="icon"
        variant="default"
        aria-label={isPlaying ? "Pause" : "Play"}
        onClick={() => {
          if (atEnd) setPlaybackDay(0);
          togglePlay();
        }}
      >
        {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
      </Button>
      <Button
        size="icon"
        variant="outline"
        aria-label="Reset to season start"
        onClick={() => {
          togglePlay(false);
          setPlaybackDay(0);
        }}
      >
        <RotateCcw className="size-4" />
      </Button>

      <div className="min-w-0 flex-1">
        <Slider
          value={[playbackDay]}
          min={0}
          max={totalDays - 1}
          step={1}
          onValueChange={([v]) => setPlaybackDay(v)}
        />
      </div>

      <span className="text-muted-foreground w-20 shrink-0 text-right text-sm tabular-nums">
        {dayLabel(playbackDay)}
      </span>

      <Select value={String(interval)} onValueChange={(v) => setIntervalMs(Number(v))}>
        <SelectTrigger size="sm" className="w-[80px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SPEEDS.map((s) => (
            <SelectItem key={s.value} value={String(s.value)}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
