import { AlertCircle, RefreshCw } from "lucide-react";

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * Styled error banner for panels that failed to load data.
 * Shows an alert icon, a message, and an optional retry button.
 */
export function ErrorState({
  message = "Failed to load data from the server.",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 rounded-md border border-dashed px-4 py-8 text-center ${className ?? ""}`}
      style={{ borderColor: "var(--destructive)", background: "color-mix(in srgb, var(--destructive) 6%, transparent)" }}
    >
      <AlertCircle className="size-8 text-destructive" />
      <p className="text-sm text-muted-foreground max-w-xs">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
        >
          <RefreshCw className="size-3.5" />
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * Compact loading skeleton for chart panels.
 */
export function LoadingState({ className }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center ${className ?? ""}`}
      style={{ minHeight: 120 }}
    >
      <div className="flex flex-col items-center gap-2">
        <div className="size-6 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
        <span className="text-xs text-muted-foreground">Loading…</span>
      </div>
    </div>
  );
}
