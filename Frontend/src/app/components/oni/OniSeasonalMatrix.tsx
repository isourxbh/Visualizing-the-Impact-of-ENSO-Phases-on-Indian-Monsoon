import { useMemo } from "react";
import { useData } from "../../context/DataProvider";
import { MONTHS } from "../../data/constants";
import { divergingScale } from "../../lib/colorScale";
import { GridHeatmap } from "../heatmap/GridHeatmap";

export function OniSeasonalMatrix({ range }: { range: [number, number] }) {
  const { oniSeries } = useData();

  const matrix = useMemo(() => {
    const lo = Math.max(0, range[0]);
    const hi = Math.min(oniSeries.length - 1, range[1]);
    const yearsSet = new Set<number>();
    for (let i = lo; i <= hi; i++) yearsSet.add(oniSeries[i].year);
    const years = Array.from(yearsSet).sort((a, b) => a - b);
    const yearRow: Record<number, number> = {};
    years.forEach((y, idx) => (yearRow[y] = idx));

    // Build ONI lookup by year+month
    const oniLookup = new Map<string, number>();
    oniSeries.forEach((p) => oniLookup.set(`${p.year}-${p.monthIndex}`, p.oni));

    const cells: { row: number; col: number; value: number }[] = [];
    years.forEach((y, row) => {
      for (let m = 0; m < 12; m++) {
        cells.push({ row, col: m, value: oniLookup.get(`${y}-${m}`) ?? 0 });
      }
    });
    return { years, cells };
  }, [oniSeries, range]);

  return (
    <GridHeatmap
      rows={matrix.years.length}
      cols={12}
      cells={matrix.cells}
      color={(v) => divergingScale(v, 2.5)}
      cellHeight={14}
      gap={1}
      rowLabels={matrix.years.map(String)}
      colLabels={MONTHS}
    />
  );
}
