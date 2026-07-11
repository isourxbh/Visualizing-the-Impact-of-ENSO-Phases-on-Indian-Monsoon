import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useApiData } from "../../data/useApiData";
import { fetchOniDetails } from "../../data/api";
import { LoadingState, ErrorState } from "../ui/ErrorState";

interface OniDerivationPoint {
  date: string;
  rawSst: number;
  climatology: number;
  anomaly: number;
  runningMean: number;
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  fontSize: 12,
};

export function OniDerivationChart({
  range,
  startDate,
  endDate,
}: {
  range: [number, number];
  startDate: string;
  endDate: string;
}) {
  const { data, loading, error, refetch } = useApiData<
    { data: { year_month: string; sst_raw: number; climatology: number; anomaly: number; oni: number }[] },
    OniDerivationPoint[]
  >({
    apiFn: () => fetchOniDetails(startDate, endDate),
    transform: (api) =>
      api.data.map((d) => ({
        date: d.year_month,
        rawSst: d.sst_raw,
        climatology: d.climatology,
        anomaly: d.anomaly,
        runningMean: d.oni,
      })),
    deps: [startDate, endDate],
  });

  if (loading) return <LoadingState />;
  if (error || !data) return <ErrorState message={error ?? "No ONI detail data."} onRetry={refetch} />;

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
        <XAxis dataKey="date" tick={{ fontSize: 9 }} minTickGap={28} stroke="var(--muted-foreground)" />
        <YAxis tick={{ fontSize: 9 }} stroke="var(--muted-foreground)" width={36} />
        <Tooltip contentStyle={tooltipStyle} />
        <ReferenceLine y={0} stroke="var(--muted-foreground)" />
        <Line type="monotone" dataKey="rawSst" name="Raw SST" stroke="var(--chart-4)" strokeWidth={1} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="anomaly" name="Anomaly" stroke="var(--chart-1)" strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="runningMean" name="ONI (3-mo mean)" stroke="var(--destructive)" strokeWidth={2} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
