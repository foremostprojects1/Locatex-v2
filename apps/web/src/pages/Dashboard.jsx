import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { formatIndianShort } from "@locatex/contracts";
import { get } from "../services/locatexApi";
import { useSession } from "../hooks/useSession";
import BecomeBrokerForm from "../features/broker/BecomeBrokerForm";

/**
 * Where everyone lands after signing in.
 *
 * Different people need different things here, so the page asks who is looking rather than
 * showing one layout to all three. A buyer wants their favourites and their enquiries; a
 * broker wants to know what is waiting on them; an administrator wants the review queue.
 *
 * It deliberately shows counts and the next action, not charts. Nobody signs in to look at
 * a graph of their own listings — they sign in to answer a message or send a listing for
 * review.
 */
export default function Dashboard() {
  const { user, loading, isBroker, isAdmin } = useSession();
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (!user) return;

    // Everything this page needs, gathered in parallel and tolerant of any one failing —
    // a dashboard that goes blank because one count errored is worse than a missing count.
    Promise.allSettled([
      get("/me/favourites?limit=1"),
      get("/me/enquiries"),
      get("/chat/unread"),
      isBroker ? get("/properties/mine") : Promise.resolve(null),
      isAdmin ? get("/admin/stats") : Promise.resolve(null),
    ]).then(([favourites, enquiries, unread, mine, stats]) => {
      const value = (result) => (result.status === "fulfilled" ? result.value : null);
      const listings = value(mine)?.data ?? [];

      setSummary({
        favourites: value(favourites)?.total ?? 0,
        enquiries: value(enquiries)?.data?.length ?? 0,
        unread: value(unread)?.unread ?? 0,
        listings,
        drafts: listings.filter((row) => row.status === "draft").length,
        pending: listings.filter((row) => row.status === "pending").length,
        live: listings.filter((row) => row.status === "approved").length,
        stats: value(stats)?.data ?? null,
      });
    });
  }, [user, isBroker, isAdmin]);

  if (loading) return <div className="widget-box-2 mb-20">One moment…</div>;

  if (!user) {
    return (
      <div className="widget-box-2 mb-20">
        <h5 className="title">Sign in to see your dashboard</h5>
        <a href="#modalLogin" data-bs-toggle="modal" className="tf-btn bg-color-primary pd-10">
          Sign in
        </a>
      </div>
    );
  }

  const firstName = user.fullName?.split(" ")[0] ?? "there";

  return (
    <>
      <div className="widget-box-2 mb-20">
        <h5 className="title">Hello, {firstName}</h5>

        {/* The one thing most worth doing, said before any numbers. */}
        <NextAction summary={summary} isBroker={isBroker} isAdmin={isAdmin} />
      </div>

      <div className="lx-admin__cards">
        {isAdmin && summary?.stats ? (
          <>
            <Card label="Waiting for review" value={summary.stats.pendingApprovals} to="/admin" accent />
            <Card label="New messages" value={summary.stats.contactMessages?.new} to="/admin" accent />
            <Card label="Broker applications" value={summary.stats.brokerApplications} to="/admin" accent />
            <Card label="Live listings" value={summary.stats.listings?.approved} to="/admin" />
          </>
        ) : null}

        {isBroker ? (
          <>
            <Card label="Drafts" value={summary?.drafts} to="/my-property" accent />
            <Card label="Waiting for review" value={summary?.pending} to="/my-property" />
            <Card label="Live listings" value={summary?.live} to="/my-property" />
          </>
        ) : null}

        <Card label="Favourites" value={summary?.favourites} to="/my-favorites" />
        <Card label="My enquiries" value={summary?.enquiries} to="/my-enquiries" />
        <Card label="Unread messages" value={summary?.unread} to="/message" accent />
      </div>

      {/* A buyer who has not applied is shown how to, because that is the whole funnel. */}
      {!isBroker && user.brokerApplicationStatus !== "approved" ? (
        <BecomeBrokerForm />
      ) : null}

      {isBroker && summary?.listings?.length ? (
        <div className="widget-box-2 mb-20">
          <div className="lx-admin__panel-head">
            <h5 className="title">Your most recent listings</h5>
            <Link className="tf-btn style-border pd-10" to="/my-property">
              See all
            </Link>
          </div>

          <ul className="lx-admin__list">
            {summary.listings.slice(0, 5).map((listing) => (
              <li key={listing.id} className="lx-admin__row">
                <div className="lx-admin__row-main">
                  <strong>{listing.title}</strong>
                  <span className="lx-admin__meta">
                    {formatIndianShort(listing.pricePaise)} · {listing.status} ·{" "}
                    {listing.viewsCount} view{listing.viewsCount === 1 ? "" : "s"}
                  </span>
                </div>
                <div className="lx-admin__row-actions">
                  <Link className="tf-btn style-border pd-10" to="/my-property">
                    Manage
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

/** One sentence: the thing most worth doing right now. */
function NextAction({ summary, isBroker, isAdmin }) {
  if (!summary) return <p className="lx-note">Gathering your things…</p>;

  if (isAdmin && summary.stats?.pendingApprovals > 0) {
    return (
      <p className="lx-note">
        {summary.stats.pendingApprovals} listing
        {summary.stats.pendingApprovals === 1 ? " is" : "s are"} waiting for review.{" "}
        <Link to="/admin">Open the queue</Link>.
      </p>
    );
  }

  if (summary.unread > 0) {
    return (
      <p className="lx-note">
        You have {summary.unread} unread message{summary.unread === 1 ? "" : "s"}.{" "}
        <Link to="/message">Read them</Link>.
      </p>
    );
  }

  if (isBroker && summary.drafts > 0) {
    return (
      <p className="lx-note">
        {summary.drafts} listing{summary.drafts === 1 ? "" : "s"} still unsent — nobody can
        see {summary.drafts === 1 ? "it" : "them"} until you send{" "}
        {summary.drafts === 1 ? "it" : "them"} for review.{" "}
        <Link to="/my-property">Finish up</Link>.
      </p>
    );
  }

  if (isBroker && summary.live === 0) {
    return (
      <p className="lx-note">
        Nothing of yours is live yet. <Link to="/add-property">List your first property</Link>{" "}
        — it takes about five minutes.
      </p>
    );
  }

  return (
    <p className="lx-note">
      Nothing needs you right now. <Link to="/properties">Browse land in Gujarat</Link>.
    </p>
  );
}

function Card({ label, value, to, accent }) {
  return (
    <Link className={`lx-admin__card${accent && value > 0 ? " is-accent" : ""}`} to={to}>
      <span className="lx-admin__card-value">{value ?? "—"}</span>
      <span className="lx-admin__card-label">{label}</span>
    </Link>
  );
}
