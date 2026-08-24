import { useState } from "react";
import { formatIndianShort } from "@locatex/contracts";
import { adminApi } from "./adminApi";
import { usePanel } from "./usePanel";

/**
 * The approval queue.
 *
 * A rejection needs a reason before the button will do anything — the server insists on one,
 * and a broker told only "rejected" has no way to fix the listing and will simply repost it.
 */
export default function ReviewQueue({ onChanged }) {
  const [status, setStatus] = useState("pending");
  const panel = usePanel(() => adminApi.reviewQueue(status), [status]);
  const [rejecting, setRejecting] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(null);

  const act = async (id, action, withReason) => {
    setBusy(id);
    try {
      await adminApi.decide(id, action, withReason);
      setRejecting(null);
      setReason("");
      await panel.reload();
      onChanged?.();
    } catch (cause) {
      panel.setError(cause);
    } finally {
      setBusy(null);
    }
  };

  const listings = panel.data?.data ?? [];

  return (
    <section className="lx-admin__panel">
      <header className="lx-admin__panel-head">
        <h5 className="title">Listings</h5>
        <select
          className="form-control lx-admin__filter"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="pending">Waiting for review</option>
          <option value="approved">Live</option>
          <option value="rejected">Rejected</option>
          <option value="sold">Sold</option>
          <option value="withdrawn">Withdrawn</option>
        </select>
      </header>

      {panel.error ? <p className="lx-field__error">{panel.error.message}</p> : null}
      {panel.loading ? <p className="lx-note">Loading…</p> : null}

      {!panel.loading && listings.length === 0 ? (
        <p className="lx-note">
          {status === "pending" ? "Nothing is waiting. The queue is clear." : "Nothing here."}
        </p>
      ) : null}

      <ul className="lx-admin__list">
        {listings.map((listing) => (
          <li key={listing.id} className="lx-admin__row">
            <div className="lx-admin__row-main">
              <strong>{listing.title}</strong>
              <span className="lx-admin__meta">
                {formatIndianShort(listing.pricePaise)} · {listing.area.value}{" "}
                {listing.area.unit} · {listing.location.taluka}, {listing.location.district}
              </span>
              <span className="lx-admin__meta">
                {listing.contact.name} · {listing.contact.phone}
                {listing.govDetails?.surveyNumber
                  ? ` · survey ${listing.govDetails.surveyNumber}`
                  : ""}
              </span>
              {listing.rejectionReason ? (
                <span className="lx-admin__meta is-warning">
                  Last rejected: {listing.rejectionReason}
                </span>
              ) : null}
            </div>

            <div className="lx-admin__row-actions">
              {status === "pending" ? (
                <>
                  <button
                    type="button"
                    className="tf-btn bg-color-primary pd-10"
                    disabled={busy === listing.id}
                    onClick={() => act(listing.id, "approve")}
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    className="tf-btn style-border pd-10"
                    onClick={() => setRejecting(rejecting === listing.id ? null : listing.id)}
                  >
                    Reject
                  </button>
                </>
              ) : null}

              {listing.status === "approved" ? (
                <button
                  type="button"
                  className="tf-btn style-border pd-10"
                  disabled={busy === listing.id}
                  onClick={async () => {
                    setBusy(listing.id);
                    try {
                      await adminApi.feature(listing.id, !listing.isFeatured);
                      await panel.reload();
                    } finally {
                      setBusy(null);
                    }
                  }}
                >
                  {listing.isFeatured ? "Unfeature" : "Feature"}
                </button>
              ) : null}
            </div>

            {rejecting === listing.id ? (
              <div className="lx-admin__reject">
                <textarea
                  className="textarea"
                  value={reason}
                  placeholder="What does the broker need to fix? They will be emailed this."
                  onChange={(event) => setReason(event.target.value)}
                />
                <button
                  type="button"
                  className="tf-btn bg-color-primary pd-10"
                  disabled={reason.trim().length < 5 || busy === listing.id}
                  onClick={() => act(listing.id, "reject", reason)}
                >
                  Send the rejection
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
