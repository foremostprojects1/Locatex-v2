import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ENQUIRY_CHANNEL_LABEL } from "@locatex/contracts";
import { get, patch } from "../services/locatexApi";
import { useSession } from "../hooks/useSession";
import Loader from "../components/common/Loader";

/**
 * Both sides of the same conversation, on one page.
 *
 * A buyer sees what they have asked; a broker sees what has been asked of them. They are
 * the same records read from opposite ends, so keeping them together means one page to
 * maintain rather than two that drift.
 */
export default function MyEnquiries() {
  const { user, loading: sessionLoading, isBroker } = useSession();
  const [sent, setSent] = useState([]);
  const [received, setReceived] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return undefined;
    const controller = new AbortController();

    Promise.all([
      get("/me/enquiries", { signal: controller.signal }).catch(() => ({ data: [] })),
      isBroker
        ? get("/broker/enquiries", { signal: controller.signal }).catch(() => ({ data: [] }))
        : Promise.resolve({ data: [] }),
    ])
      .then(([mine, theirs]) => {
        setSent(mine.data);
        setReceived(theirs.data);
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [user, isBroker]);

  const markReplied = async (id) => {
    await patch(`/broker/enquiries/${id}`, { status: "replied" });
    setReceived((current) =>
      current.map((row) => (row.id === id ? { ...row, status: "replied" } : row)),
    );
  };

  if (sessionLoading) return <Loader size="page" label="One moment" />;

  if (!user) {
    return (
      <div className="widget-box-2 mb-20">
        <h5 className="title">Sign in to see your enquiries</h5>
        <a href="#modalLogin" data-bs-toggle="modal" className="tf-btn bg-color-primary pd-10">
          Sign in
        </a>
      </div>
    );
  }

  if (loading) return <div className="widget-box-2 mb-20">Loading…</div>;

  return (
    <div className="lx-enquiries">
      {isBroker ? (
        <section className="lx-admin__panel">
          <header className="lx-admin__panel-head">
            <h5 className="title">Asked of you</h5>
          </header>

          {received.length === 0 ? (
            <p className="lx-note">Nobody has asked about your listings yet.</p>
          ) : (
            <ul className="lx-admin__list">
              {received.map((enquiry) => (
                <li key={enquiry.id} className="lx-admin__row is-stacked">
                  <div className="lx-admin__row-main">
                    <strong>
                      {ENQUIRY_CHANNEL_LABEL[enquiry.channel] ?? enquiry.channel}
                      <span className={`lx-tag is-${enquiry.status}`}>{enquiry.status}</span>
                    </strong>
                    <span className="lx-admin__meta">
                      <Link to={`/properties/${enquiry.propertyId}`}>the listing</Link> ·{" "}
                      {new Date(enquiry.createdAt).toLocaleString("en-IN")}
                      {enquiry.callbackPhone ? ` · call ${enquiry.callbackPhone}` : ""}
                    </span>
                    <p className="lx-admin__message">{enquiry.message}</p>
                  </div>

                  <div className="lx-admin__row-actions">
                    {enquiry.callbackPhone ? (
                      <a className="tf-btn bg-color-primary pd-10" href={`tel:${enquiry.callbackPhone}`}>
                        Call back
                      </a>
                    ) : null}
                    {enquiry.status !== "replied" ? (
                      <button
                        type="button"
                        className="tf-btn style-border pd-10"
                        onClick={() => markReplied(enquiry.id)}
                      >
                        Mark replied
                      </button>
                    ) : null}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}

      <section className="lx-admin__panel">
        <header className="lx-admin__panel-head">
          <h5 className="title">What you have asked</h5>
        </header>

        {sent.length === 0 ? (
          <p className="lx-note">
            You have not asked about anything yet.{" "}
            <Link to="/properties">Find some land</Link>.
          </p>
        ) : (
          <ul className="lx-admin__list">
            {sent.map((enquiry) => (
              <li key={enquiry.id} className="lx-admin__row is-stacked">
                <div className="lx-admin__row-main">
                  <strong>
                    <Link to={`/properties/${enquiry.propertyId}`}>the listing</Link>
                    <span className={`lx-tag is-${enquiry.status}`}>{enquiry.status}</span>
                  </strong>
                  <span className="lx-admin__meta">
                    {new Date(enquiry.createdAt).toLocaleString("en-IN")}
                  </span>
                  <p className="lx-admin__message">{enquiry.message}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
