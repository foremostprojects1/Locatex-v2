import { useState } from "react";
import { adminApi } from "./adminApi";
import { usePanel } from "./usePanel";

/**
 * Accounts, and the broker applications waiting on a decision.
 *
 * Suspending someone ends their sessions immediately rather than when their token happens
 * to expire — which is the whole point of doing it.
 */
export default function PeoplePanel({ onChanged }) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const users = usePanel(
    () => adminApi.users(search ? `q=${encodeURIComponent(search)}` : ""),
    [search],
  );
  const applications = usePanel(() => adminApi.brokerApplications(), []);
  const [reason, setReason] = useState({});
  const [busy, setBusy] = useState(null);

  const decide = async (userId, decision) => {
    setBusy(userId);
    try {
      await adminApi.decideBroker(userId, decision, reason[userId]);
      await Promise.all([applications.reload(), users.reload()]);
      onChanged?.();
    } catch (cause) {
      applications.setError(cause);
    } finally {
      setBusy(null);
    }
  };

  const pending = applications.data?.data ?? [];

  return (
    <>
      <section className="lx-admin__panel">
        <header className="lx-admin__panel-head">
          <h5 className="title">Broker applications</h5>
        </header>

        {applications.error ? (
          <p className="lx-field__error">{applications.error.message}</p>
        ) : null}
        {pending.length === 0 && !applications.loading ? (
          <p className="lx-note">No applications are waiting.</p>
        ) : null}

        <ul className="lx-admin__list">
          {pending.map((applicant) => (
            <li key={applicant._id ?? applicant.id} className="lx-admin__row">
              <div className="lx-admin__row-main">
                <strong>{applicant.brokerApplication.agencyName}</strong>
                <span className="lx-admin__meta">
                  {applicant.fullName} · {applicant.email} · {applicant.phone}
                </span>
                <span className="lx-admin__meta">
                  {applicant.brokerApplication.district}
                  {applicant.brokerApplication.reraNumber
                    ? ` · RERA ${applicant.brokerApplication.reraNumber}`
                    : " · no RERA number given"}
                </span>
              </div>
              <div className="lx-admin__row-actions">
                <button
                  type="button"
                  className="tf-btn bg-color-primary pd-10"
                  disabled={busy === (applicant._id ?? applicant.id)}
                  onClick={() => decide(applicant._id ?? applicant.id, "approve")}
                >
                  Approve
                </button>
                <input
                  className="form-control"
                  placeholder="Reason, if rejecting"
                  value={reason[applicant._id ?? applicant.id] ?? ""}
                  onChange={(event) =>
                    setReason((current) => ({
                      ...current,
                      [applicant._id ?? applicant.id]: event.target.value,
                    }))
                  }
                />
                <button
                  type="button"
                  className="tf-btn style-border pd-10"
                  disabled={(reason[applicant._id ?? applicant.id] ?? "").trim().length < 5}
                  onClick={() => decide(applicant._id ?? applicant.id, "reject")}
                >
                  Reject
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="lx-admin__panel">
        <header className="lx-admin__panel-head">
          <h5 className="title">People</h5>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              setSearch(query.trim());
            }}
          >
            <input
              className="form-control lx-admin__filter"
              placeholder="Search name, email or phone"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
          </form>
        </header>

        {users.error ? <p className="lx-field__error">{users.error.message}</p> : null}

        <ul className="lx-admin__list">
          {(users.data?.data ?? []).map((user) => (
            <li key={user.id} className="lx-admin__row">
              <div className="lx-admin__row-main">
                <strong>
                  {user.fullName}{" "}
                  <span className={`lx-tag is-${user.role}`}>{user.role}</span>
                  {user.status === "suspended" ? (
                    <span className="lx-tag is-suspended">suspended</span>
                  ) : null}
                </strong>
                <span className="lx-admin__meta">
                  {user.email} · {user.phone}
                  {user.agencyName ? ` · ${user.agencyName}` : ""}
                  {user.isVerified ? "" : " · not fully verified"}
                </span>
              </div>
              <div className="lx-admin__row-actions">
                <button
                  type="button"
                  className="tf-btn style-border pd-10"
                  onClick={async () => {
                    setBusy(user.id);
                    try {
                      await adminApi.setUserStatus(
                        user.id,
                        user.status === "suspended" ? "active" : "suspended",
                      );
                      await users.reload();
                    } catch (cause) {
                      users.setError(cause);
                    } finally {
                      setBusy(null);
                    }
                  }}
                  disabled={busy === user.id}
                >
                  {user.status === "suspended" ? "Reinstate" : "Suspend"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
