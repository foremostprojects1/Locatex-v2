import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PROPERTY_STATUSES, formatIndianShort } from "@locatex/contracts";
import { get, post } from "../services/locatexApi";
import { useSession } from "../hooks/useSession";
import BecomeBrokerForm from "../features/broker/BecomeBrokerForm";

/**
 * A broker's own listings, in every status.
 *
 * This is where a draft becomes a live listing. The wizard creates a draft and sends the
 * broker here; without this page a listing could be written and then never submitted, which
 * is where the product used to stop.
 *
 * The buttons come from the server's `actions` array rather than from a guess in the
 * browser: the state machine decides what is legal, and the page renders whatever it says.
 */
const STATUS_LABEL = {
  draft: "Draft — not sent yet",
  pending: "Waiting for review",
  approved: "Live",
  rejected: "Needs a change",
  sold: "Sold",
  rented: "Rented",
  withdrawn: "Withdrawn",
};

const ACTION_LABEL = {
  submit: "Send for review",
  withdraw: "Withdraw",
  "mark-sold": "Mark sold",
  "mark-rented": "Mark rented",
  relist: "List again",
};

export default function MyProperty() {
  const { user, loading: sessionLoading, isBroker } = useSession();
  const [filter, setFilter] = useState("");
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!isBroker) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await get(`/properties/mine${filter ? `?status=${filter}` : ""}`);
      setListings(response.data);
      setError(null);
    } catch (cause) {
      setError(cause);
    } finally {
      setLoading(false);
    }
  }, [filter, isBroker]);

  useEffect(() => {
    load();
  }, [load]);

  if (sessionLoading) return <div className="widget-box-2 mb-20">One moment…</div>;

  if (!user) {
    return (
      <div className="widget-box-2 mb-20">
        <h5 className="title">Sign in to see your listings</h5>
        <a href="#modalLogin" data-bs-toggle="modal" className="tf-btn bg-color-primary pd-10">
          Sign in
        </a>
      </div>
    );
  }

  // A buyer who lands here is not lost — this is exactly where they would come to start.
  if (!isBroker) return <BecomeBrokerForm onSubmitted={load} />;

  const act = async (id, action) => {
    setBusy(id);
    setError(null);
    try {
      await post(`/properties/${id}/status`, { action });
      await load();
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="widget-box-2 mb-20">
      <div className="lx-admin__panel-head">
        <h5 className="title">My listings</h5>
        <div className="lx-chat__actions">
          <select
            className="form-control lx-admin__filter"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          >
            <option value="">Everything</option>
            {PROPERTY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABEL[status]}
              </option>
            ))}
          </select>
          <Link className="tf-btn bg-color-primary pd-10" to="/add-property">
            List new land
          </Link>
        </div>
      </div>

      {error ? <p className="lx-field__error">{error.message}</p> : null}
      {loading ? <p className="lx-note">Loading…</p> : null}

      {!loading && listings.length === 0 ? (
        <p className="lx-note">
          Nothing here yet. <Link to="/add-property">List your first property</Link> — it
          takes about five minutes.
        </p>
      ) : null}

      <ul className="lx-admin__list">
        {listings.map((listing) => (
          <li key={listing.id} className="lx-admin__row">
            <div className="lx-admin__row-main">
              <strong>
                {listing.title}{" "}
                <span className={`lx-tag is-${listing.status}`}>
                  {STATUS_LABEL[listing.status] ?? listing.status}
                </span>
                {listing.isFeatured ? <span className="lx-tag is-live">featured</span> : null}
              </strong>
              <span className="lx-admin__meta">
                {formatIndianShort(listing.pricePaise)} · {listing.area.value}{" "}
                {listing.area.unit} · {listing.location.taluka}, {listing.location.district}
              </span>
              <span className="lx-admin__meta">
                {listing.viewsCount} view{listing.viewsCount === 1 ? "" : "s"}
                {listing.publishedAt
                  ? ` · live since ${new Date(listing.publishedAt).toLocaleDateString("en-IN")}`
                  : ""}
              </span>

              {/* The reason a rejection happened, where the broker will actually see it. */}
              {listing.status === "rejected" && listing.rejectionReason ? (
                <span className="lx-admin__meta is-warning">
                  {listing.rejectionReason}
                </span>
              ) : null}
            </div>

            <div className="lx-admin__row-actions">
              <Link
                className="tf-btn style-border pd-10"
                to={`/add-property?property=${listing.id}`}
              >
                Edit
              </Link>

              {listing.status === "approved" || listing.status === "sold" ? (
                <Link className="tf-btn style-border pd-10" to={`/properties/${listing.id}`}>
                  View
                </Link>
              ) : null}

              {/* Whatever the state machine says is legal right now — never a guess. */}
              {(listing.actions ?? [])
                .filter((action) => ACTION_LABEL[action])
                .map((action) => (
                  <button
                    key={action}
                    type="button"
                    className={
                      action === "submit"
                        ? "tf-btn bg-color-primary pd-10"
                        : "tf-btn style-border pd-10"
                    }
                    disabled={busy === listing.id}
                    onClick={() => act(listing.id, action)}
                  >
                    {ACTION_LABEL[action]}
                  </button>
                ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
