import { useCallback, useEffect, useState } from "react";

/**
 * A panel's data: loaded on mount, reloaded after anything is changed.
 *
 * Re-reading rather than patching local state is deliberate. An approval changes a listing's
 * status, the pending count, and possibly the featured list; guessing at all of that in the
 * browser is how a dashboard ends up showing numbers the database disagrees with.
 */
export function usePanel(load, dependencies = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await load());
    } catch (cause) {
      setError(cause);
    } finally {
      setLoading(false);
    }
    // The loader is an arrow function rebuilt on every render; the caller's dependencies
    // are what actually decide when it should run again.
  }, dependencies);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload, setError };
}
