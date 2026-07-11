import { useState, type ReactNode } from "react";
import { INDIA_MAP } from "../../data/india-map";
import { FloatingTooltip, type TooltipState } from "../RegionTooltip";

interface IndiaChoroplethProps {
  /** region id -> color string (already resolved via a color scale). */
  colorById: Record<string, string>;
  selectedRegionId?: string | null;
  hoveredRegionId?: string | null;
  onSelect?: (id: string) => void;
  onHover?: (id: string | null) => void;
  /** Tooltip content factory for a region id. */
  tooltip?: (id: string, name: string) => ReactNode;
  /** Color used for regions with no data. */
  emptyColor?: string;
  /** Optional dot/hatch overlay density per region (e.g. current-period rainfall). */
  patternById?: Record<string, PatternDensity>;
  /** Prefix to keep <defs> pattern ids unique when two maps render together. */
  patternIdPrefix?: string;
  className?: string;
  height?: number | string;
}

export type PatternDensity = "none" | "light" | "medium" | "heavy";

const PATTERN_SPACING: Record<Exclude<PatternDensity, "none">, number> = {
  light: 9,
  medium: 6,
  heavy: 3.5,
};

export function IndiaChoropleth({
  colorById,
  selectedRegionId,
  hoveredRegionId,
  onSelect,
  onHover,
  tooltip,
  emptyColor = "var(--muted)",
  patternById,
  patternIdPrefix = "p",
  className,
  height = 420,
}: IndiaChoroplethProps) {
  const [tip, setTip] = useState<TooltipState | null>(null);

  const isFill = height === "100%";
  const densities: Exclude<PatternDensity, "none">[] = ["light", "medium", "heavy"];
  return (
    <div className={className} style={{ width: "100%", height: isFill ? "100%" : undefined }}>
      <svg
        viewBox={INDIA_MAP.viewBox}
        role="img"
        aria-label="Map of India by state"
        preserveAspectRatio="xMidYMid meet"
        style={{ width: "100%", height, display: "block" }}
        onMouseLeave={() => {
          setTip(null);
          onHover?.(null);
        }}
      >
        {patternById && (
          <defs key="patterns">
            {densities.map((d) => {
              const s = PATTERN_SPACING[d];
              return (
                <pattern
                  key={d}
                  id={`${patternIdPrefix}-dot-${d}`}
                  width={s}
                  height={s}
                  patternUnits="userSpaceOnUse"
                >
                  <circle cx={s / 2} cy={s / 2} r={0.9} fill="rgba(15,23,42,0.55)" />
                </pattern>
              );
            })}
          </defs>
        )}
        {INDIA_MAP.locations.map((loc) => {
          const isSelected = selectedRegionId === loc.id;
          const isHovered = hoveredRegionId === loc.id;
          const fill = colorById[loc.id] ?? emptyColor;
          const density = patternById?.[loc.id] ?? "none";
          return (
            <g key={loc.id}>
              <path
                d={loc.path}
                fill={fill}
                stroke={isSelected ? "var(--ring)" : "var(--background)"}
                strokeWidth={isSelected ? 1.6 : 0.4}
                style={{
                  cursor: onSelect ? "pointer" : "default",
                  opacity: isHovered || isSelected ? 1 : 0.92,
                  transition: "opacity 120ms ease, fill 200ms ease",
                  filter: isSelected ? "drop-shadow(0 0 2px var(--ring))" : undefined,
                }}
                onClick={() => onSelect?.(loc.id)}
                onMouseEnter={(e) => {
                  onHover?.(loc.id);
                  if (tooltip) {
                    setTip({ x: e.clientX, y: e.clientY, content: tooltip(loc.id, loc.name) });
                  }
                }}
                onMouseMove={(e) => {
                  if (tooltip) {
                    setTip({ x: e.clientX, y: e.clientY, content: tooltip(loc.id, loc.name) });
                  }
                }}
              />
              {density !== "none" && (
                <path
                  d={loc.path}
                  fill={`url(#${patternIdPrefix}-dot-${density})`}
                  style={{ pointerEvents: "none" }}
                />
              )}
            </g>
          );
        })}
      </svg>
      <FloatingTooltip tooltip={tip} />
    </div>
  );
}
