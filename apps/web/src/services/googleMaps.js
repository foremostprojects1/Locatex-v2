const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

let loaderPromise = null;

export const hasMapsApiKey = () => Boolean(API_KEY);

/** Loads the Google Maps JS API once per session. */
export function loadGoogleMaps() {
  if (!API_KEY)
    return Promise.reject(new Error("Missing VITE_GOOGLE_MAPS_API_KEY"));
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (loaderPromise) return loaderPromise;

  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}`;
    script.async = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () =>
      reject(new Error("Failed to load the Google Maps API"));
    document.head.appendChild(script);
  });
  return loaderPromise;
}
