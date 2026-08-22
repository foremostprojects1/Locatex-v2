import { useEffect } from "react";

/**
 * Applies the `<body>` classes a page used in the static template
 * (e.g. `body bg-surface counter-scroll`).
 */
export default function useBodyClass(className = "body") {
  useEffect(() => {
    const classes = className.split(/\s+/).filter(Boolean);
    document.body.classList.add(...classes);
    return () => document.body.classList.remove(...classes);
  }, [className]);
}
