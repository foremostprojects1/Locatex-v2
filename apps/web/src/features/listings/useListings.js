import { useCallback, useEffect, useRef, useState } from "react";
import { get } from "../../services/locatexApi";

/**
 * A page of listings, and the "show more" that follows it.
 *
 * Pagination is a cursor rather than a page number because the API's is: with listings
 * being approved while somebody scrolls, a page number silently repeats and drops rows.
 * The cursor is opaque here on purpose — a client that parses it breaks the day the sort
 * changes.
 */
export function useListings(query = {}) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  // The query is rebuilt on every render by its caller; comparing the serialised form is
  // what stops an infinite fetch loop without asking every caller to memoise.
  const serialised = JSON.stringify(query);
  const latest = useRef(0);

  const load = useCallback(async () => {
    const run = ++latest.current;
    setLoading(true);
    setError(null);
    try {
      const response = await get(`/properties?${toSearchParams(JSON.parse(serialised))}`);
      // A slower earlier request must not overwrite a faster later one.
      if (run !== latest.current) return;
      setItems(response.data);
      setTotal(response.total);
      setCursor(response.nextCursor);
    } catch (cause) {
      if (run === latest.current) setError(cause);
    } finally {
      if (run === latest.current) setLoading(false);
    }
  }, [serialised]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const params = toSearchParams(JSON.parse(serialised), cursor);
      const response = await get(`/properties?${params}`);
      setItems((current) => [...current, ...response.data]);
      setCursor(response.nextCursor);
    } catch (cause) {
      setError(cause);
    } finally {
      setLoadingMore(false);
    }
  }, [cursor, loadingMore, serialised]);

  return { items, total, loading, loadingMore, error, hasMore: Boolean(cursor), loadMore, reload: load };
}

/** Drops empty values, so a cleared filter disappears from the URL instead of sending "". */
export function toSearchParams(query, cursor) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      if (value.length > 0) params.set(key, value.join(","));
      continue;
    }
    params.set(key, String(value));
  }
  if (cursor) params.set("cursor", cursor);
  return params.toString();
}

/** One listing, for the detail page. */
export function useListing(id) {
  const [data, setData] = useState(null);
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!id) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    get(`/properties/${id}`, { signal: controller.signal })
      .then((response) => {
        setData(response.data);
        setActions(response.actions ?? []);
      })
      .catch((cause) => {
        if (cause.name !== "AbortError") setError(cause);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [id]);

  return { listing: data, actions, loading, error };
}
