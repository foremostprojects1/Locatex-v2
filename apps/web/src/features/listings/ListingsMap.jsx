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

export default function ListingsMap({ listings, activeId, onSelect, height = 480 }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const layerRef = useRef(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

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

      shape.bindTooltip(`${point.title}<br><strong>${point.price}</strong>`, { direction: "top" });
      shape.on("click", () => onSelectRef.current?.(point.id));
      shape.addTo(layer);
    }

    // Fit to what is actually on screen. Padding keeps a circle at the edge from being
    // half cut off, which reads as a bug rather than as a map edge.
    const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng]));
    map.fitBounds(bounds.pad(0.2), { maxZoom: 13 });
  }, [points, activeId]);

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
