import { useEffect, useRef, useState } from "react";
import { hasMapsApiKey, loadGoogleMaps } from "../../services/googleMaps";
import { MAP_CENTER, MAP_LOCATIONS, MAP_STYLES } from "../../data/mapData";

const infoWindowContent = (item) => `
  <div class="map-listing-item">
    <div class="inner-box">
      <div class="image-box"><img src="${item.image}" alt="${item.title}"></div>
      <div class="content">
        <p class="location"><span class="icon icon-mapPin"></span><span class="text">${item.location}</span></p>
        <div class="title"><a href="/property-details-v1">${item.title}</a></div>
        <ul class="list-info">
          <li><span class="icon icon-bed"></span><span class="text-variant-1">Beds</span><span class="fw-6">4</span></li>
          <li><span class="icon icon-bath"></span><span class="text-variant-1">Baths:</span><span class="fw-6">2</span></li>
          <li><span class="icon icon-sqft"></span><span class="text-variant-1">Sqft:</span><span class="fw-6">1150</span></li>
        </ul>
        <div class="box-bottom">
          <div class="avt-box"><img src="${item.avatar}" alt="${item.agent}">${item.agent}</div>
          <div class="price">${item.price}</div>
        </div>
      </div>
    </div>
  </div>`;

/**
 * Listing map. The API key now comes from `VITE_GOOGLE_MAPS_API_KEY` instead of
 * being hard-coded in the page, so the map degrades to a notice when the key is
 * not configured.
 */
export default function PropertyMap({
  id = "map",
  className = "top-map",
  zoom = 16,
  locations = MAP_LOCATIONS,
}) {
  const containerRef = useRef(null);
  const [error, setError] = useState(hasMapsApiKey() ? null : "missing-key");

  useEffect(() => {
    if (!hasMapsApiKey()) return undefined;
    let map;
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled || !containerRef.current) return;
        map = new maps.Map(containerRef.current, {
          zoom,
          scrollwheel: false,
          center: MAP_CENTER,
          mapTypeId: maps.MapTypeId.ROADMAP,
          zoomControl: true,
          zoomControlOptions: { position: maps.ControlPosition.TOP_LEFT },
          mapTypeControl: false,
          scaleControl: false,
          streetViewControl: false,
          gestureHandling: "cooperative",
          styles: MAP_STYLES,
        });

        const infoWindow = new maps.InfoWindow();
        for (const item of locations) {
          const marker = new maps.Marker({
            position: { lat: item.lat, lng: item.lng },
            map,
            title: item.title,
          });
          marker.addListener("click", () => {
            infoWindow.setContent(infoWindowContent(item));
            infoWindow.open({ anchor: marker, map });
          });
        }
      })
      .catch(() => !cancelled && setError("load-failed"));

    return () => {
      cancelled = true;
    };
  }, [zoom, locations]);

  if (error) {
    return (
      <div
        id={id}
        className={className}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <p className="text-variant-1">
          {error === "missing-key"
            ? "Map unavailable: set VITE_GOOGLE_MAPS_API_KEY in your environment to enable it."
            : "The map could not be loaded."}
        </p>
      </div>
    );
  }

  return <div id={id} ref={containerRef} className={className} />;
}
