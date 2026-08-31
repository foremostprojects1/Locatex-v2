/**
 * One loader, everywhere.
 *
 * The site had eleven different ways of saying it was busy — "One moment…", "Loading…",
 * "Gathering your things…", "Opening your draft…" — each a bare paragraph in whatever type
 * the surrounding page happened to use. Different spellings of the same state make a site
 * feel assembled rather than built.
 *
 * Three sizes cover every case: `page` while a route resolves, `block` inside a panel, and
 * `inline` beside a control that is working.
 */
export default function Loader({ label = "Loading", size = "block" }) {
  return (
    <div className={`lx-loader lx-loader--${size}`} role="status" aria-live="polite">
      <span className="lx-loader__spinner" aria-hidden="true" />
      <span className="lx-loader__label">{label}</span>
    </div>
  );
}

/**
 * The shape of a thing that has not arrived yet.
 *
 * For lists and cards, where a spinner tells you less than an outline does — the page does
 * not jump when the content lands, because the space was already the right size.
 */
export function Skeleton({ rows = 3 }) {
  return (
    <div className="lx-skeleton" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <span key={index} className="lx-skeleton__row" />
      ))}
    </div>
  );
}
