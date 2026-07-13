import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export interface ViewOption {
  value: string;
  label: string;
}

/** Compact dropdown used in panel headers to switch between graphs. */
export function ViewSelect({
  value,
  onChange,
  options,
  width = 168,
}: {
  value: string;
  onChange: (v: string) => void;
  options: ViewOption[];
  width?: number;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" style={{ width }}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
