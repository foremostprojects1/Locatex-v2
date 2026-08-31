import { useState } from "react";
import { DOCUMENT_CATEGORY_LABEL, formatBytes, formatIndianShort } from "@locatex/contracts";
import { adminApi } from "./adminApi";
import { get } from "../../services/locatexApi";
import { usePanel } from "./usePanel";
import Loader from "../../components/common/Loader";

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
      {panel.loading ? <Loader /> : null}

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

              {/* The papers, in the place the decision is actually made. */}
              <DocumentList propertyId={listing.id} />
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


/**
 * The documents attached to a listing, shown inside the review row.
 *
 * Fetched per row rather than with the queue: most rows are never expanded, and a reviewer
 * opening one listing should not have paid for the documents of the other twenty.
 */
function DocumentList({ propertyId }) {
  const [documents, setDocuments] = useState(null);
  const [open, setOpen] = useState(false);

  const load = async () => {
    setOpen(true);
    if (documents) return;
    try {
      const response = await get(`/properties/${propertyId}/documents`);
      setDocuments(response.data);
    } catch {
      setDocuments([]);
    }
  };

  if (!open) {
    return (
      <button type="button" className="lx-linkbutton" onClick={load}>
        Show documents
      </button>
    );
  }

  if (!documents) return <Loader size="inline" />;

  if (documents.length === 0) {
    return (
      <span className="lx-admin__meta is-warning">
        No documents attached. Nothing stops you approving it — v1 never required any — but
        there is nothing here to check the survey number against.
      </span>
    );
  }

  return (
    <span className="lx-admin__docs">
      {documents.map((document) => (
        <a
          key={document.id}
          href={`/api/v1/documents/${document.id}/content`}
          target="_blank"
          rel="noreferrer"
        >
          {DOCUMENT_CATEGORY_LABEL[document.category] ?? document.category}
          <small> ({formatBytes(document.sizeBytes)})</small>
        </a>
      ))}
    </span>
  );
}
