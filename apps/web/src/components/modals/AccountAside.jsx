import { BRAND } from "../../content/brand";

/**
 * The panel beside the sign-in and registration forms.
 *
 * It replaces the template's stock photograph of an apartment block — the wrong picture for
 * a land marketplace, and one that said nothing. This says what LocateX is and what an
 * account gets you, which is the question somebody looking at a sign-up form is actually
 * asking: why should I.
 *
 * The three reasons are the real ones, not marketing: the price and the contact details are
 * genuinely withheld from anonymous visitors, so registering genuinely changes what you can
 * see. The illustration behind them is drawn in CSS rather than loaded — a photograph would
 * be another request in front of a dialog people want to get past.
 */
const REASONS = [
  {
    title: "See the actual price",
    body: "Visitors see a wide band. Signed in, you see what the broker is really asking.",
  },
  {
    title: "Call the broker directly",
    body: "Phone numbers are shown to signed-in buyers only — never to search engines.",
  },
  {
    title: "Keep a shortlist",
    body: "Save land and pick it up on any device, not just the one you found it on.",
  },
];

export default function AccountAside({ variant = "signin" }) {
  return (
    <aside className="lx-aside" aria-hidden="true">
      {/* Fields, a horizon and a low sun — the view from a plot, drawn rather than fetched. */}
      <div className="lx-aside__scene">
        <span className="lx-aside__sun" />
        <span className="lx-aside__field lx-aside__field--far" />
        <span className="lx-aside__field lx-aside__field--mid" />
        <span className="lx-aside__field lx-aside__field--near" />
        <span className="lx-aside__marker" />
      </div>

      <div className="lx-aside__body">
        <p className="lx-aside__eyebrow">{BRAND.name}</p>
        <h3>
          {variant === "register"
            ? "Land in Gujarat, direct from the people who hold it"
            : "Welcome back"}
        </h3>

        <ul className="lx-aside__reasons">
          {REASONS.map((reason) => (
            <li key={reason.title}>
              <strong>{reason.title}</strong>
              <span>{reason.body}</span>
            </li>
          ))}
        </ul>

        <p className="lx-aside__foot">Free to join. No brokerage, ever.</p>
      </div>
    </aside>
  );
}
