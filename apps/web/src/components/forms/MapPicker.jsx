import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Where the land is.
 *
 * The pin is the centre of the map, under a fixed crosshair, and the broker moves the map
 * beneath it. That is deliberately not a draggable marker: on a phone a marker is smaller
 * than a fingertip and sits under the finger that is trying to place it, while dragging the
 * map keeps the target visible the whole time.
 *
 * OpenStreetMap tiles need no API key, which is why the picker works today. Swapping to
 * Google Maps later is a change to this one component — `services/googleMaps.js` already
 * has the loader, and everything above this receives the same `{ lat, lng }`.
 */
const GUJARAT_CENTRE = [22.2587, 71.1924];

export default function MapPicker({
  value,
  centre,
  zoom = 12,
  onChange,
  radiusMetres = null,
  disabled = false,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const circleRef = useRef(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Create the map once. Re-creating it on every render would fight Leaflet for the DOM.
  useEffect(() => {
    if (mapRef.current || !containerRef.current) return undefined;

    const map = L.map(containerRef.current, {
      center: value ? [value.lat, value.lng] : (centre ?? GUJARAT_CENTRE),
      zoom: value || centre ? zoom : 7,
      scrollWheelZoom: false,
      attributionControl: true,
    });

    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Only report a point once the broker has actually moved the map: opening the picker
    // is not the same as choosing a location.
    map.on("moveend", () => {
      if (disabled) return;
      const point = map.getCenter();
      onChangeRef.current?.({
        lat: Number(point.lat.toFixed(6)),
        lng: Number(point.lng.toFixed(6)),
      });
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Follow a centre chosen elsewhere — typing a pincode moves the map to that pincode.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !centre || value) return;
    map.setView(centre, zoom);
  }, [centre, zoom, value]);

  // The circle a guest would be shown, drawn while the broker is choosing, so "approximate"
  // is something they can see the size of rather than a word they have to trust.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    circleRef.current?.remove();
    circleRef.current = null;

    if (radiusMetres && value) {
      circleRef.current = L.circle([value.lat, value.lng], {
        radius: radiusMetres,
        color: "#e91e63",
        weight: 1,
        fillOpacity: 0.08,
      }).addTo(map);
    }
  }, [radiusMetres, value]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (disabled) mapRef.current.dragging.disable();
    else mapRef.current.dragging.enable();
  }, [disabled]);


  // Leaflet measures its container once, at construction. If the map is created while that
  // container has not been laid out yet — a tab that was just switched to, a panel that
  // was collapsed, a font still loading — it computes a size of zero and draws nothing but
  // grey. Watching the element and telling Leaflet to re-measure is the standard remedy,
  // and it also handles the browser window being resized.
  useEffect(() => {
    const element = containerRef.current;
    if (!element) return undefined;

    const settle = () => mapRef.current?.invalidateSize();
    // Once after the first paint, for the common case of mounting into a fresh container.
    const raf = requestAnimationFrame(settle);

    const observer = new ResizeObserver(settle);
    observer.observe(element);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="lx-map-picker">
      <div ref={containerRef} className="lx-map-picker__canvas" />
      <div className="lx-map-picker__crosshair" aria-hidden="true">
        <span />
      </div>
      <p className="lx-map-picker__hint">
        Drag the map so the crosshair sits on your land.
        {value ? ` Selected: ${value.lat.toFixed(5)}, ${value.lng.toFixed(5)}` : ""}
      </p>
    </div>
  );
}
