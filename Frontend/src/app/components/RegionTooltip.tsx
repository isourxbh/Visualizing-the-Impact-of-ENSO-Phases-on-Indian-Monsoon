import type { ReactNode } from "react";

export interface TooltipState {
  x: number;
  y: number;
  content: ReactNode;
}

/**
 * A lightweight cursor-following tooltip for SVG maps and div heatmaps, where
 * Radix's anchored Tooltip is awkward. Render once per interactive view and feed
 * it a {x, y, content} state updated on mouse move.
 */
export function FloatingTooltip({ tooltip }: { tooltip: TooltipState | null }) {
  if (!tooltip) return null;
  return (
    <div
      className="pointer-events-none fixed z-50 max-w-[220px] rounded-md border border-border bg-popover px-2.5 py-1.5 text-popover-foreground shadow-md"
      style={{
        left: tooltip.x + 14,
        top: tooltip.y + 14,
        // Keep it from running off the right edge.
        transform:
          typeof window !== "undefined" && tooltip.x > window.innerWidth - 240
            ? "translateX(calc(-100% - 28px))"
            : undefined,
      }}
    >
      <div className="text-xs leading-snug">{tooltip.content}</div>
    </div>
  );
}
