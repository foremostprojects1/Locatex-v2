import { useCallback, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SubmitWizard from "../features/submit-property/SubmitWizard";
import { useSession } from "../hooks/useSession";
import BecomeBrokerForm from "../features/broker/BecomeBrokerForm";
import StepDocuments from "../features/submit-property/steps/StepDocuments";
import Loader from "../components/common/Loader";

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

  if (loading) return <Loader size="page" label="One moment" />;

  if (!user) {
    return (
      <div className="widget-box-2 mb-20">
        <h5 className="title">Please sign in</h5>
        <p className="lx-note">You need an account before you can list land on LocateX.</p>
      </div>
    );
  }

  // Not a dead end: the application is right here, because this is the page somebody
  // reaches when they have decided to list land.
  if (!isBroker) return <BecomeBrokerForm />;

  if (created) {
    return (
      <div className="widget-box-2 mb-20">
        <h5 className="title">Saved as a draft</h5>
        <p className="lx-note">
          “{created.title}” is saved. It is not public yet — submit it for review from your
          listings, and our team will approve it, usually within a working day.
        </p>
        <div className="lx-wizard__documents">
          <h6 className="lx-section-title">Add the papers</h6>
          <StepDocuments propertyId={created.id} />
        </div>

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
