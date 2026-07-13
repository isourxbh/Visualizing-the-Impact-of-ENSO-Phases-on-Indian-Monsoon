import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../ui/utils";

/**
 * A flex-fill wrapper for a recharts `ResponsiveContainer` that only mounts its
 * children once it has a measured, non-zero size. Prevents the recharts
 * "width(0) and height(0)" warning that fires when a chart is measured on the
 * first layout frame (before the surrounding flex/grid sizes have resolved).
 */
export function ChartBox({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setReady(el.clientWidth > 0 && el.clientHeight > 0);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={ref} className={cn("min-h-0 flex-1", className)}>
      {ready ? children : null}
    </div>
  );
}
