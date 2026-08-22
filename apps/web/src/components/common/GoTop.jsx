import { useEffect, useRef, useState } from "react";

const PATH = "M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98";
const SCROLL_OFFSET = 200;

/** Scroll-to-top button whose ring tracks the reading progress. */
export default function GoTop() {
  const pathRef = useRef(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const path = pathRef.current;
    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length} ${length}`;
    path.style.strokeDashoffset = String(length);

    const update = () => {
      const scroll = window.scrollY;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const progress =
        height > 0 ? length - (scroll * length) / height : length;
      path.style.strokeDashoffset = String(progress);
      setActive(scroll > SCROLL_OFFSET);
    };

    update();
    window.addEventListener("scroll", update);
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      className={`progress-wrap${active ? " active-progress" : ""}`}
      role="button"
      tabIndex={0}
      aria-label="Scroll to top"
      onClick={() => window.scrollTo(0, 0)}
      onKeyDown={(event) => {
        if (event.key === "Enter") window.scrollTo(0, 0);
      }}
    >
      <svg
        className="progress-circle svg-content"
        width="100%"
        height="100%"
        viewBox="-1 -1 102 102"
      >
        <path
          ref={pathRef}
          d={PATH}
          style={{ transition: "stroke-dashoffset 10ms linear 0s" }}
        />
      </svg>
    </div>
  );
}
