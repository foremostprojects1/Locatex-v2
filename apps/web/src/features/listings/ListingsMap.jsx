import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { formatIndianShort } from "@locatex/contracts";

/**
 * Listings on a map.
 *
 * Two shapes are drawn, and which one appears is the whole point of the precision field.
 * A listing whose broker dropped an exact pin still reaches a signed-out visitor as a
 * coarsened point and a circle — the API never sends the real coordinates to a guest — so
 * this component cannot leak a location it was never given.
 *
 * Circles rather than markers for approximate listings: a marker asserts "here", and the
 * one thing we know about these is that we do not know exactly where.
 */
const GUJARAT_CENTRE = [22.2587, 71.1924];

/** Titles come from brokers, and this text becomes markup rather than React children. */
const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export default function ListingsMap({ listings, activeId, onSelect, onOpen, height = 480 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onOpenRef = useRef(onOpen);
  onOpenRef.current = onOpen;

  const points = useMemo(
    () =>
      listings
        .map((listing) => {
          const place = listing.location;
          const lat = place.lat ?? place.approxLat;
          const lng = place.lng ?? place.approxLng;
          if (lat == null || lng == null) return null;
          return {
            id: listing.id,
            title: listing.title,
            lat,
            lng,
            exact: place.precision === "exact" && place.lat != null,
            radius: place.radiusMetres ?? 0,
            price:
              listing.pricePaise != null
                ? formatIndianShort(listing.pricePaise)
                : listing.priceBand.label,
          };
        })
        .filter(Boolean),
    [listings],
  );

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return undefined;

    const map = L.map(containerRef.current, {
      center: GUJARAT_CENTRE,
      zoom: 7,
      scrollWheelZoom: false,
    });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    mapRef.current = map;
    layerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    if (points.length === 0) return;

    for (const point of points) {
      const shape = point.exact
        ? L.marker([point.lat, point.lng], { icon: pinIcon(point.id === activeId) })
        : L.circle([point.lat, point.lng], {
            radius: Math.max(point.radius, 800),
            color: point.id === activeId ? "#111827" : "#e91e63",
            weight: point.id === activeId ? 2 : 1,
            fillOpacity: 0.12,
          });

      /*
       * A popup, not just a tooltip.
       *
       * Clicking a listing on the map used to highlight it in a list that is not on screen
       * in map view, so nothing appeared to happen. The popup carries the way through to
       * the listing itself, which is what someone clicking a pin is asking for.
       *
       * The escaping matters: a broker's title is their text, and it is being put into
       * markup here rather than rendered by React.
       */
      shape.bindPopup(
        `<div class="lx-mappop">
           <strong>${escapeHtml(point.title)}</strong>
           <span>${escapeHtml(point.price)}</span>
           <button type="button" data-open="${escapeHtml(point.id)}">See this listing</button>
         </div>`,
        { closeButton: true, minWidth: 200 },
      );

      shape.on("click", () => onSelectRef.current?.(point.id));
      shape.addTo(layer);
    }

    // The popup's markup is created by Leaflet, so the handler is attached when it opens
    // rather than declared in JSX. Delegating from the map means one listener rather than
    // one per popup, and nothing to remove when a popup closes.
    map.off('popupopen');
    map.on('popupopen', (event) => {
      const button = event.popup.getElement()?.querySelector('[data-open]');
      button?.addEventListener('click', () => onOpenRef.current?.(button.dataset.open), {
        once: true,
      });
    });

    // Fit to what is actually on screen. Padding keeps a circle at the edge from being
    // half cut off, which reads as a bug rather than as a map edge.
    const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng]));
    map.fitBounds(bounds.pad(0.2), { maxZoom: 13 });
  }, [points, activeId]);


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
    <div className="lx-map" style={{ height }}>
      <div ref={containerRef} className="lx-map__canvas" />
      {points.length === 0 ? (
        <p className="lx-map__empty">
          None of these listings has a location on the map yet.
        </p>
      ) : null}
    </div>
  );
}

/** Drawn in CSS rather than loaded as an image, so there is no Leaflet asset path to break. */
function pinIcon(active) {
  return L.divIcon({
    className: "",
    html: `<span class="lx-map__pin${active ? " is-active" : ""}"></span>`,
    iconSize: [22, 22],
    iconAnchor: [11, 22],
  });
}
