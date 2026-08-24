import { useEffect, useState } from "react";
import { get } from "../services/locatexApi";

/**
 * Gujarat's administrative cascade, and the vocabulary a listing is described with.
 *
 * These endpoints are public, ETagged and change a few times a year, so the browser's own
 * cache does nearly all the work here — a repeat visit re-renders the district list without
 * a round trip. The only state worth holding is what the current form has asked for.
 */
function useEndpoint(path, { enabled = true, initial = null } = {}) {
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !path) {
      setData(initial);
      setLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    setLoading(true);
    setError(null);

    get(path, { signal: controller.signal })
      .then((response) => setData(response))
      .catch((cause) => {
        if (cause.name !== "AbortError") setError(cause);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
    // `initial` is a literal at every call site; including it would re-run on each render.
  }, [path, enabled]);

  return { data, loading, error };
}

export function useDistricts() {
  const { data, loading } = useEndpoint("/reference/districts");
  return { districts: data?.data ?? [], loading };
}

export function useTalukas(districtSlug) {
  const { data, loading } = useEndpoint(
    districtSlug ? `/reference/talukas?district=${encodeURIComponent(districtSlug)}` : null,
    { enabled: Boolean(districtSlug) },
  );
  return { talukas: data?.data ?? [], loading };
}

export function useVillages(districtSlug, talukaSlug) {
  const ready = Boolean(districtSlug && talukaSlug);
  const { data, loading } = useEndpoint(
    ready
      ? `/reference/villages?district=${encodeURIComponent(districtSlug)}&taluka=${encodeURIComponent(talukaSlug)}`
      : null,
    { enabled: ready },
  );
  return { villages: data?.data ?? [], loading };
}

export function useLandAttributes() {
  const { data, loading } = useEndpoint("/reference/land-attributes");
  return {
    amenities: data?.amenities ?? [],
    disadvantages: data?.disadvantages ?? [],
    loading,
  };
}

/**
 * What we know about a pincode: where it is, and which villages share it. Used to centre
 * the map before the broker has dropped a pin, and to warn when India Post disagrees with
 * the district they chose — its records still call Morbi "Rajkot", twelve years on.
 */
export function usePincode(pincode) {
  const valid = /^[1-9]\d{5}$/.test(pincode ?? "");
  const { data, loading } = useEndpoint(valid ? `/reference/pincode/${pincode}` : null, {
    enabled: valid,
  });
  return { pincode: data, loading };
}
