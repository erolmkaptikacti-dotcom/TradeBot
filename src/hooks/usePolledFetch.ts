"use client";

import { useEffect, useState } from "react";

interface PolledFetchState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

/** Fetches a JSON endpoint immediately, then re-fetches on an interval. */
export function usePolledFetch<T>(url: string, intervalMs: number) {
  const [state, setState] = useState<PolledFetchState<T>>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(url);
        const body = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setState({ data: null, error: body.error ?? "Request failed", loading: false });
          return;
        }
        setState({ data: body as T, error: null, loading: false });
      } catch (err) {
        if (cancelled) return;
        setState({
          data: null,
          error: err instanceof Error ? err.message : "Request failed",
          loading: false,
        });
      }
    }

    load();
    const id = setInterval(load, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [url, intervalMs]);

  return state;
}
