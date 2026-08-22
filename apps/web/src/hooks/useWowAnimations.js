import { useEffect } from "react";

/**
 * Replacement for wow.js: elements carrying a `wow` class are revealed with
 * their animate.css animation once they scroll into view. `data-wow-delay` and
 * `data-wow-duration` are honoured as before.
 */
export default function useWowAnimations(key) {
  useEffect(() => {
    const elements = [...document.querySelectorAll(".wow")];
    if (!elements.length) return undefined;

    const reveal = (element) => {
      const { wowDelay, wowDuration } = element.dataset;
      if (wowDelay) element.style.animationDelay = wowDelay;
      if (wowDuration) element.style.animationDuration = wowDuration;
      element.style.visibility = "visible";
      element.classList.add("animated");
    };

    if (!("IntersectionObserver" in window)) {
      elements.forEach(reveal);
      return undefined;
    }

    elements.forEach((element) => {
      element.style.visibility = "hidden";
    });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          reveal(entry.target);
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -5% 0px" },
    );
    elements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, [key]);
}
