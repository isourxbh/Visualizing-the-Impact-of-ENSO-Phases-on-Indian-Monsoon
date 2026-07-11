import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { MonsoonHeroPanel } from "./MonsoonHeroPanel";
import { RainfallAnomalyPanel } from "./RainfallAnomalyPanel";

type CenterView = "g3" | "g4";

const OPTIONS: { value: CenterView; label: string }[] = [
  { value: "g3", label: "G3 · Monsoon onset & accumulation" },
  { value: "g4", label: "G4 · Seasonal rainfall anomaly" },
];

/**
 * Center slot whose heading is a dropdown: pick G3 (monsoon onset) or G4
 * (seasonal rainfall anomaly) and render that panel in place.
 */
export function CenterPanel({ className }: { className?: string }) {
  const [view, setView] = useState<CenterView>("g3");

  const titleSlot = (
    <Select value={view} onValueChange={(v) => setView(v as CenterView)}>
      <SelectTrigger size="sm" className="w-[290px] font-medium">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );

  return view === "g3" ? (
    <MonsoonHeroPanel className={className} titleSlot={titleSlot} />
  ) : (
    <RainfallAnomalyPanel className={className} titleSlot={titleSlot} />
  );
}
