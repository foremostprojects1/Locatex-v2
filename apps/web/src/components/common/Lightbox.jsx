import { useCallback, useEffect, useState } from "react";

const YOUTUBE =
  /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]{6,})/;

const overlayStyle = {
  position: "fixed",
  inset: 0,
  zIndex: 1100,
  background: "rgba(24, 24, 27, 0.92)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "32px",
};

const buttonStyle = {
  position: "absolute",
  background: "rgba(255,255,255,0.12)",
  color: "#fff",
  border: 0,
  width: "44px",
  height: "44px",
  borderRadius: "50%",
  fontSize: "20px",
  cursor: "pointer",
};

/**
 * Replaces the jQuery Fancybox lightbox. Any `[data-fancybox]` link opens here,
 * grouped by the value of the attribute, so galleries keep their prev/next
 * behaviour; YouTube links open in an embedded player.
 */
export default function Lightbox() {
  const [gallery, setGallery] = useState(null); // { items: string[], index: number }

  const close = useCallback(() => setGallery(null), []);

  useEffect(() => {
    const onClick = (event) => {
      const link = event.target.closest("a[data-fancybox]");
      if (!link) return;
      event.preventDefault();
      const group = link.getAttribute("data-fancybox");
      const items = [
        ...document.querySelectorAll(`a[data-fancybox="${group}"]`),
      ].map((node) => node.getAttribute("href"));
      setGallery({
        items,
        index: Math.max(0, items.indexOf(link.getAttribute("href"))),
      });
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  useEffect(() => {
    if (!gallery) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") close();
      if (event.key === "ArrowRight")
        setGallery((g) => ({ ...g, index: (g.index + 1) % g.items.length }));
      if (event.key === "ArrowLeft")
        setGallery((g) => ({
          ...g,
          index: (g.index - 1 + g.items.length) % g.items.length,
        }));
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [gallery, close]);

  if (!gallery) return null;

  const source = gallery.items[gallery.index];
  const youtubeId = YOUTUBE.exec(source)?.[1];
  const move = (step) => (event) => {
    event.stopPropagation();
    setGallery((g) => ({
      ...g,
      index: (g.index + step + g.items.length) % g.items.length,
    }));
  };

  return (
    <div
      style={overlayStyle}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Media viewer"
    >
      <button
        type="button"
        style={{ ...buttonStyle, top: "24px", right: "24px" }}
        onClick={close}
        aria-label="Close"
      >
        ✕
      </button>
      {gallery.items.length > 1 && (
        <>
          <button
            type="button"
            style={{ ...buttonStyle, left: "24px" }}
            onClick={move(-1)}
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            type="button"
            style={{ ...buttonStyle, right: "24px" }}
            onClick={move(1)}
            aria-label="Next"
          >
            ›
          </button>
        </>
      )}
      {youtubeId ? (
        <iframe
          title="Video"
          width="960"
          height="540"
          style={{ maxWidth: "100%", maxHeight: "100%", border: 0 }}
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1`}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onClick={(event) => event.stopPropagation()}
        />
      ) : (
        <img
          src={source}
          alt=""
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
          onClick={(event) => event.stopPropagation()}
        />
      )}
    </div>
  );
}
