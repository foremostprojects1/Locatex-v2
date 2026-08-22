import { useEffect } from "react";

const REFRESH_INTERVAL = 100;

/**
 * Port of the countTo plugin: `.tf-counter .number` elements count up from 0 to
 * their `data-to` value the first time the block is scrolled into view. Only
 * pages whose body carries `counter-scroll` used it.
 */
export default function useCounters(key) {
  useEffect(() => {
    if (!document.body.classList.contains("counter-scroll")) return undefined;
    const counters = [...document.querySelectorAll(".tf-counter .number")];
    if (!counters.length) return undefined;

    const timers = new Set();

    const run = (element) => {
      const to = Number(element.dataset.to ?? 0);
      const speed = Number(element.dataset.speed ?? 1000);
      const decimals = Number(
        element.dataset.dec ?? element.dataset.decimals ?? 0,
      );
      const loops = Math.max(1, Math.ceil(speed / REFRESH_INTERVAL));
      const increment = to / loops;
      let value = 0;
      let count = 0;

      const timer = setInterval(() => {
        value += increment;
        count += 1;
        if (count >= loops) {
          value = to;
          clearInterval(timer);
          timers.delete(timer);
        }
        element.textContent = value.toFixed(decimals);
      }, REFRESH_INTERVAL);
      timers.add(timer);
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        run(entry.target);
        observer.unobserve(entry.target);
      }
    });
    counters.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
      timers.forEach((timer) => clearInterval(timer));
    };
  }, [key]);
}
