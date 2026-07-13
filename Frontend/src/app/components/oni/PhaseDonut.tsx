import { useMemo } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { useData } from "../../context/DataProvider";
import type { Phase } from "../../data/types";
import { phaseColor } from "../../lib/colorScale";

export function PhaseDonut({ range, fill }: { range: [number, number]; fill?: boolean }) {
  const { oniSeries } = useData();

  const counts = useMemo(() => {
    const c: Record<Phase, number> = { "El Niño": 0, "La Niña": 0, Neutral: 0 };
    oniSeries.slice(range[0], range[1] + 1).forEach((p) => {
      c[p.phase] += 1;
    });
    return (Object.keys(c) as Phase[]).map((phase) => ({
      phase,
      count: c[phase],
      color: phaseColor(phase),
    }));
  }, [oniSeries, range]);

  return (
    <ResponsiveContainer width="100%" height={fill ? "100%" : 180}>
      <PieChart>
        <Pie
          data={counts}
          dataKey="count"
          nameKey="phase"
          cx="50%"
          cy="50%"
          innerRadius="55%"
          outerRadius="85%"
          paddingAngle={2}
          isAnimationActive={false}
        >
          {counts.map((c) => (
            <Cell key={c.phase} fill={c.color} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: "var(--popover)",
            border: "1px solid var(--border)",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
