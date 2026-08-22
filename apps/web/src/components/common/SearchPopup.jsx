import { useEffect, useState } from "react";
import useSearchPopup from "../../hooks/useSearchPopup";

/**
 * Search panel that slides from under the header (homepage 06). The header
 * button and this panel talk to each other through `SearchPopupContext`.
 */
export default function SearchPopup({ children }) {
  const { open, close } = useSearchPopup();
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    if (!open) return undefined;
    const header = document.querySelector(".main-header");
    setHeaderHeight(header?.offsetHeight ?? 0);
    const onKeyDown = (event) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, close]);

  return (
    <>
      <div
        className={`search-popup-wrapper${open ? " open" : ""}`}
        style={{ top: open ? `${headerHeight}px` : "-200%" }}
      >
        <div
          className="close-btn"
          role="button"
          tabIndex={0}
          aria-label="Close search"
          onClick={close}
          onKeyDown={(event) => {
            if (event.key === "Enter") close();
          }}
        >
          <span className="icon flaticon-cancel-1" />
        </div>
        {children}
      </div>
      <div
        className="overlay2"
        style={{ display: open ? "block" : "none" }}
        onClick={close}
      />
    </>
  );
}
