import { useCallback, useEffect, useState } from "react";

/**
 * Generic hook: fetch data from the backend API.
 *
 * Returns `{ data, loading, error, refetch }`.
 * - While the request is in flight, `loading` is true and `data` is null.
 * - If the API returns data, `transform(apiData)` converts it to the
 *   shape the component needs and sets `data`.
 * - If the API returns an error or is unreachable, `error` contains
 *   a user-friendly message and `data` remains null.
 * - Call `refetch()` to retry the request.
 */
export function useApiData<TApi, TLocal>(opts: {
  apiFn: () => Promise<TApi | null>;
  transform: (api: TApi) => TLocal;
  deps?: unknown[];
}): { data: TLocal | null; loading: boolean; error: string | null; refetch: () => void } {
  const { apiFn, transform, deps = [] } = opts;
  const [data, setData] = useState<TLocal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const doFetch = useCallback(() => {
    setLoading(true);
    setError(null);
    apiFn()
      .then((apiData) => {
        if (apiData !== null) {
          setData(transform(apiData));
          setError(null);
        } else {
          setData(null);
          setError("Failed to load data from the server.");
        }
      })
      .catch((err) => {
        setData(null);
        setError(err instanceof Error ? err.message : "An unexpected error occurred.");
      })
      .finally(() => {
        setLoading(false);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  return { data, loading, error, refetch: doFetch };
}
