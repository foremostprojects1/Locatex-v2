import { useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SubmitWizard from "../features/submit-property/SubmitWizard";
import { useSession } from "../hooks/useSession";

/**
 * The page a broker lists land from.
 *
 * A draft is identified in the URL, so refreshing, sharing between devices, or coming back
 * tomorrow all reopen the same half-filled form rather than starting a new one.
 */
export default function AddProperty() {
  const { user, loading, isBroker } = useSession();
  const [params, setParams] = useSearchParams();
  const [created, setCreated] = useState(null);

  const rememberDraft = useCallback(
    (id) => setParams((current) => {
      const next = new URLSearchParams(current);
      next.set("draft", id);
      return next;
    }, { replace: true }),
    [setParams],
  );

  if (loading) return <div className="widget-box-2 mb-20">One moment…</div>;

  if (!user) {
    return (
      <div className="widget-box-2 mb-20">
        <h5 className="title">Please sign in</h5>
        <p className="lx-note">You need an account before you can list land on LocateX.</p>
      </div>
    );
  }

  if (!isBroker) {
    return (
      <div className="widget-box-2 mb-20">
        <h5 className="title">Brokers list the land</h5>
        <p className="lx-note">
          Your account is registered as a buyer. Apply to become a broker from your dashboard,
          and once our team has verified you, this page is where you will post listings.
        </p>
        <Link className="tf-btn bg-color-primary pd-10" to="/dashboard">
          Go to my dashboard
        </Link>
      </div>
    );
  }

  if (created) {
    return (
      <div className="widget-box-2 mb-20">
        <h5 className="title">Saved as a draft</h5>
        <p className="lx-note">
          “{created.title}” is saved. It is not public yet — submit it for review from your
          listings, and our team will approve it, usually within a working day.
        </p>
        <div className="lx-wizard__actions">
          <Link className="tf-btn bg-color-primary pd-10" to="/my-property">
            My listings
          </Link>
          <button
            type="button"
            className="tf-btn style-border pd-10"
            onClick={() => {
              setCreated(null);
              setParams({});
            }}
          >
            List another
          </button>
        </div>
      </div>
    );
  }

  return (
    <SubmitWizard
      draftId={params.get("draft") ?? undefined}
      propertyId={params.get("property") ?? undefined}
      onFinished={setCreated}
      onDraftOpened={rememberDraft}
    />
  );
}
