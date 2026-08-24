import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { get } from "../services/locatexApi";
import PropertyCard from "../features/listings/PropertyCard";
import { useSession } from "../hooks/useSession";

/**
 * The listings this buyer saved.
 *
 * Anything saved and since withdrawn is reported as a count rather than silently dropped —
 * a list that quietly shrinks makes people think the site lost their data, when what
 * actually happened is that a plot was sold.
 */
export default function MyFavorites() {
  const { loading: sessionLoading, isSignedIn } = useSession();
  const [state, setState] = useState({ loading: true, data: [], total: 0, unavailable: 0 });

  useEffect(() => {
    if (!isSignedIn) return undefined;
    const controller = new AbortController();
    get("/me/favourites", { signal: controller.signal })
      .then((response) => setState({ loading: false, ...response }))
      .catch((error) => {
        if (error.name !== "AbortError") setState({ loading: false, error, data: [] });
      });
    return () => controller.abort();
  }, [isSignedIn]);

  if (sessionLoading) return <div className="widget-box-2 mb-20">One moment…</div>;

  if (!isSignedIn) {
    return (
      <div className="widget-box-2 mb-20">
        <h5 className="title">Sign in to see your saved land</h5>
        <p className="lx-note">
          Saved listings follow your account, so they are there on your phone and your
          computer alike.
        </p>
        <a href="#modalLogin" data-bs-toggle="modal" className="tf-btn bg-color-primary pd-10">
          Sign in
        </a>
      </div>
    );
  }

  if (state.loading) return <div className="widget-box-2 mb-20">Loading…</div>;

  return (
    <div className="lx-saved">
      <header className="lx-listings__head">
        <div>
          <h1 className="lx-listings__title">Saved land</h1>
          <p className="lx-listings__count">
            {state.total} saved
            {state.unavailable > 0
              ? ` · ${state.unavailable} no longer available`
              : ""}
          </p>
        </div>
      </header>

      {state.data.length === 0 ? (
        <div className="lx-empty">
          <h2>Nothing saved yet</h2>
          <p>
            Tap the heart on any listing and it will be here.{" "}
            <Link to="/properties">Start browsing</Link>.
          </p>
        </div>
      ) : (
        <div className="lx-grid">
          {state.data.map((listing) => (
            <PropertyCard key={listing.id} listing={listing} />
          ))}
        </div>
      )}
    </div>
  );
}
