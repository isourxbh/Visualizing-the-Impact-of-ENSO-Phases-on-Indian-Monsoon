import { useState, type ReactNode } from "react";
import { FloatingTooltip, type TooltipState } from "../RegionTooltip";
import { cn } from "../ui/utils";

export interface GridCell {
  row: number;
  col: number;
  value: number;
}

interface GridHeatmapProps {
  rows: number;
  cols: number;
  cells: GridCell[];
  /** Resolve a value to a CSS color. */
  color: (value: number | undefined) => string;
  rowLabels?: string[];
  colLabels?: string[];
  tooltip?: (cell: GridCell) => ReactNode;
  onCellClick?: (cell: GridCell) => void;
  isSelected?: (cell: GridCell) => boolean;
  /** Fixed cell height in px; width is responsive via grid. */
  cellHeight?: number;
  /** Gap between cells. */
  gap?: number;
  rounded?: boolean;
  className?: string;
}

export function GridHeatmap({
  rows,
  cols,
  cells,
  color,
  rowLabels,
  colLabels,
  tooltip,
  onCellClick,
  isSelected,
  cellHeight = 22,
  gap = 2,
  rounded = false,
  className,
}: GridHeatmapProps) {
  const [tip, setTip] = useState<TooltipState | null>(null);

  // Index cells by row/col for stable lookup.
  const byKey = new Map<string, GridCell>();
  cells.forEach((c) => byKey.set(`${c.row}:${c.col}`, c));

  return (
    <div className={cn("w-full", className)}>
      <div className="flex">
        {rowLabels ? (
          <div
            className="flex shrink-0 flex-col pr-2 text-right"
            style={{ gap }}
          >
            {colLabels ? <div style={{ height: 16 }} /> : null}
            {Array.from({ length: rows }).map((_, r) => (
              <div
                key={r}
                className="text-muted-foreground flex items-center justify-end text-[10px] leading-none"
                style={{ height: cellHeight }}
                title={rowLabels[r]}
              >
                <span className="max-w-[120px] truncate">{rowLabels[r]}</span>
              </div>
            ))}
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          {colLabels ? (
            <div
              className="text-muted-foreground grid text-[10px]"
              style={{
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
                gap,
                height: 16,
                marginBottom: gap,
              }}
            >
              {colLabels.map((label, c) => (
                <div key={c} className="overflow-hidden text-center leading-none">
                  <span className="block truncate">{label}</span>
                </div>
              ))}
            </div>
          ) : null}

          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
              gridAutoRows: `${cellHeight}px`,
              gap,
            }}
            onMouseLeave={() => setTip(null)}
          >
            {Array.from({ length: rows }).map((_, r) =>
              Array.from({ length: cols }).map((__, c) => {
                const cell = byKey.get(`${r}:${c}`);
                const selected = cell ? isSelected?.(cell) ?? false : false;
                return (
                  <div
                    key={`${r}:${c}`}
                    className={cn(
                      "transition-[outline] duration-100",
                      rounded ? "rounded-sm" : "rounded-[2px]",
                      (onCellClick && cell) ? "cursor-pointer" : "",
                    )}
                    style={{
                      background: color(cell?.value),
                      outline: selected ? "2px solid var(--ring)" : "none",
                      outlineOffset: selected ? -1 : 0,
                      boxShadow: selected ? "0 0 0 1px var(--ring)" : undefined,
                    }}
                    onClick={() => cell && onCellClick?.(cell)}
                    onMouseEnter={(e) => {
                      if (tooltip && cell) setTip({ x: e.clientX, y: e.clientY, content: tooltip(cell) });
                    }}
                    onMouseMove={(e) => {
                      if (tooltip && cell) setTip({ x: e.clientX, y: e.clientY, content: tooltip(cell) });
                    }}
                  />
                );
              }),
            )}
          </div>
        </div>
      </div>
      <FloatingTooltip tooltip={tip} />
    </div>
  );
}
