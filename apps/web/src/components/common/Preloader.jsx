import { useEffect, useState } from "react";

/** Splash shown while the app boots, faded out like the original `.preload`. */
export default function Preloader() {
  const [hidden, setHidden] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setHidden(true), 200);
    const removeTimer = setTimeout(() => setRemoved(true), 800);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  if (removed) return null;

  return (
    <div
      className="preload preload-container"
      style={{ opacity: hidden ? 0 : 1, transition: "opacity 0.6s ease" }}
    >
      <div className="preload-logo">
        <div className="spinner" />
        <span className="icon icon-villa-fill" />
      </div>
    </div>
  );
}
