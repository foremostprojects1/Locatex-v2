import { useSearchParams } from "react-router-dom";
import { adminApi } from "../features/admin/adminApi";
import { usePanel } from "../features/admin/usePanel";
import ReviewQueue from "../features/admin/ReviewQueue";
import PeoplePanel from "../features/admin/PeoplePanel";
import InboxPanel from "../features/admin/InboxPanel";
import NewsPanel from "../features/admin/NewsPanel";
import StoragePanel from "../features/admin/StoragePanel";
import PlacesPanel from "../features/admin/PlacesPanel";
import { useSession } from "../hooks/useSession";
import Loader from "../components/common/Loader";

const TABS = [
  { id: "queue", label: "Listings" },
  { id: "people", label: "People" },
  { id: "inbox", label: "Messages" },
  { id: "news", label: "News" },
  { id: "places", label: "Places" },
  { id: "storage", label: "Storage" },
];

/**
 * Everything an administrator does, on one page.
 *
 * The counters reload whenever a panel changes something, so the number on the card and the
 * number of rows below it can never drift apart — the alternative, adjusting the count in
 * the browser, is right until the first time two administrators work at once.
 */
export default function AdminDashboard() {
  const { user, loading } = useSession();
  /*
   * The open tab lives in the URL. The dashboard sidebar links straight to
   * /admin?tab=people, and a tab held only in component state would ignore that and always
   * open on the queue.
   */
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") ?? "queue";
  const setTab = (next) =>
    setParams(next === "queue" ? {} : { tab: next }, { replace: true });
  const stats = usePanel(() => adminApi.stats(), []);

  if (loading) return <Loader size="page" label="One moment" />;

  if (user?.role !== "admin") {
    return (
      <div className="widget-box-2 mb-20">
        <h5 className="title">Administrators only</h5>
        <p className="lx-note">This page is not part of your account.</p>
      </div>
    );
  }

  const counts = stats.data?.data;

  return (
    <div className="lx-admin">
      <div className="lx-admin__cards">
        <Card label="Waiting for review" value={counts?.pendingApprovals} accent />
        <Card label="Live listings" value={counts?.listings?.approved} />
        <Card label="Sold" value={counts?.listings?.sold} />
        <Card label="Brokers" value={counts?.users?.broker} />
        <Card label="Buyers" value={counts?.users?.buyer} />
        <Card label="New messages" value={counts?.contactMessages?.new} accent />
        <Card label="Broker applications" value={counts?.brokerApplications} accent />
      </div>

      <nav className="lx-admin__tabs">
        {TABS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={tab === entry.id ? "is-active" : ""}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
          </button>
        ))}
      </nav>

      {tab === "queue" ? <ReviewQueue onChanged={stats.reload} /> : null}
      {tab === "people" ? <PeoplePanel onChanged={stats.reload} /> : null}
      {tab === "inbox" ? <InboxPanel onChanged={stats.reload} /> : null}
      {tab === "news" ? <NewsPanel /> : null}
      {tab === "places" ? <PlacesPanel /> : null}
      {tab === "storage" ? <StoragePanel /> : null}
    </div>
  );
}

function Card({ label, value, accent }) {
  return (
    <div className={`lx-admin__card${accent && value > 0 ? " is-accent" : ""}`}>
      <span className="lx-admin__card-value">{value ?? "—"}</span>
      <span className="lx-admin__card-label">{label}</span>
    </div>
  );
}
