import { useCallback, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useListings, toSearchParams } from "../features/listings/useListings";
import PropertyCard from "../features/listings/PropertyCard";
import ListingFilters from "../features/listings/ListingFilters";
import ListingsMap from "../features/listings/ListingsMap";
import { useSession } from "../hooks/useSession";

/**
 * Browsing land.
 *
 * The filters live in the URL rather than in component state, so a search can be sent to
 * someone, bookmarked, or reached with the back button — all three of which people do with
 * a property search and none of which work if the state is only in React.
 */
export default function Properties() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { isSignedIn } = useSession();
  const [activeId, setActiveId] = useState(null);

  /**
   * `view` is ours, not the API's — the search schema is strict and would reject it. It is
   * stripped here and kept in the URL so that "Listings on map" in the navigation is a
   * plain link, and so a chosen view survives being shared or bookmarked.
   */
  const { view: viewParam, ...query } = useMemo(
    () => Object.fromEntries(params.entries()),
    [params],
  );
  const view = ["grid", "list", "map"].includes(viewParam) ? viewParam : "grid";

  const setView = useCallback(
    (next) => {
      const updated = new URLSearchParams(params);
      if (next === "grid") updated.delete("view");
      else updated.set("view", next);
      setParams(updated, { replace: true });
    },
    [params, setParams],
  );
  const { items, total, loading, loadingMore, error, hasMore, loadMore } = useListings(query);

  // Filters replace the whole query string, so clearing one really clears it — but the
  // chosen view is not a filter and must survive.
  const applyFilters = useCallback(
    (next) => {
      const updated = new URLSearchParams(toSearchParams(next));
      if (view !== "grid") updated.set("view", view);
      setParams(updated);
    },
    [setParams, view],
  );

  return (
    <div className="lx-listings container">
      <header className="lx-listings__head">
        <div>
          <h1 className="lx-listings__title">Land for sale in Gujarat</h1>
          <p className="lx-listings__count">
            {loading ? "Searching…" : `${total} ${total === 1 ? "listing" : "listings"}`}
            {isSignedIn ? null : " · sign in to see exact prices and contact details"}
          </p>
        </div>

        <div className="lx-listings__views" role="group" aria-label="View">
          {["grid", "list", "map"].map((option) => (
            <button
              key={option}
              type="button"
              className={view === option ? "is-active" : ""}
              onClick={() => setView(option)}
            >
              {option[0].toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </header>

      <div className="lx-listings__body">
        <ListingFilters value={query} onChange={applyFilters} />

        <div className="lx-listings__results">
          {error ? (
            <p className="lx-field__error">
              We could not load the listings just now. {error.message}
            </p>
          ) : null}

          {!loading && items.length === 0 ? (
            <div className="lx-empty">
              <h2>Nothing matches that yet</h2>
              <p>
                Try widening the district or the price. New land is listed here every week,
                and every listing is checked by our team before it appears.
              </p>
            </div>
          ) : null}

          {view === "map" ? (
            <>
              <ListingsMap
              listings={items}
              activeId={activeId}
              onSelect={setActiveId}
              onOpen={(id) => navigate(`/properties/${id}`)}
            />
              <div className="lx-grid is-compact">
                {items.map((listing) => (
                  <PropertyCard key={listing.id} listing={listing} view="list" />
                ))}
              </div>
            </>
          ) : (
            <div className={view === "list" ? "lx-grid is-list" : "lx-grid"}>
              {items.map((listing) => (
                <PropertyCard key={listing.id} listing={listing} view={view} />
              ))}
            </div>
          )}

          {hasMore ? (
            <div className="lx-listings__more">
              <button
                type="button"
                className="tf-btn bg-color-primary pd-10"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading…" : "Show more"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
