import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { fetchOniTimeseries, type ApiOniTimeseriesItem } from "../data/api";
import { classifyPhase } from "../data/utils";
import type { OniPoint, Phase } from "../data/types";

interface DataContextValue {
  /** Full ONI series (monthly, all years). Empty while loading. */
  oniSeries: OniPoint[];
  /** Whether the initial ONI fetch is in progress. */
  loading: boolean;
  /** Error message if the ONI fetch failed. */
  error: string | null;
  /** ENSO phase for a year based on JJAS mean ONI. */
  getYearPhase: (year: number) => Phase;
  /** Mean JJAS ONI for a year. */
  getYearOni: (year: number) => number;
  /** All years matching a given phase (or all years). */
  getYearsForPhase: (phase: Phase | "All") => number[];
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: ReactNode }) {
  const [oniSeries, setOniSeries] = useState<OniPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOniTimeseries()
      .then((api) => {
        if (!api || !api.data) {
          setError("Failed to load ONI timeseries.");
          return;
        }
        const series: OniPoint[] = api.data.map((d: ApiOniTimeseriesItem) => {
          const [y, m] = d.year_month.split("-").map(Number);
          return {
            date: d.year_month,
            year: y,
            monthIndex: m - 1,
            oni: d.oni,
            phase: classifyPhase(d.oni),
          };
        });
        setOniSeries(series);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load ONI data.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Precompute yearly ONI lookups
  const yearOniMap = useMemo(() => {
    const map = new Map<number, number>();
    const yearMonths = new Map<number, number[]>();
    for (const p of oniSeries) {
      if (p.monthIndex >= 5 && p.monthIndex <= 8) {
        // JJAS months (Jun=5, Jul=6, Aug=7, Sep=8)
        if (!yearMonths.has(p.year)) yearMonths.set(p.year, []);
        yearMonths.get(p.year)!.push(p.oni);
      }
    }
    for (const [year, vals] of yearMonths) {
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      map.set(year, Math.round(mean * 100) / 100);
    }
    return map;
  }, [oniSeries]);

  const allYears = useMemo(() => {
    const s = new Set<number>();
    oniSeries.forEach((p) => s.add(p.year));
    return Array.from(s).sort((a, b) => a - b);
  }, [oniSeries]);

  const value = useMemo<DataContextValue>(
    () => ({
      oniSeries,
      loading,
      error,
      getYearPhase: (year: number): Phase => {
        const oni = yearOniMap.get(year) ?? 0;
        return classifyPhase(oni);
      },
      getYearOni: (year: number): number => {
        return yearOniMap.get(year) ?? 0;
      },
      getYearsForPhase: (phase: Phase | "All"): number[] => {
        if (phase === "All") return allYears;
        return allYears.filter((y) => classifyPhase(yearOniMap.get(y) ?? 0) === phase);
      },
    }),
    [oniSeries, loading, error, yearOniMap, allYears],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within a DataProvider");
  return ctx;
}
