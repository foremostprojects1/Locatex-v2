import { useState } from "react";
import { CONTACT_STATUSES, CONTACT_SUBJECT_LABEL } from "@locatex/contracts";
import { adminApi } from "./adminApi";
import { usePanel } from "./usePanel";

/** Messages from the contact form, and where each one has got to. */
export default function InboxPanel({ onChanged }) {
  const [filter, setFilter] = useState("new");
  const panel = usePanel(() => adminApi.contactMessages(filter || undefined), [filter]);
  const [note, setNote] = useState({});

  const move = async (id, status) => {
    try {
      await adminApi.setContactStatus(id, status, note[id]);
      await panel.reload();
      onChanged?.();
    } catch (cause) {
      panel.setError(cause);
    }
  };

  const messages = panel.data?.data ?? [];

  return (
    <section className="lx-admin__panel">
      <header className="lx-admin__panel-head">
        <h5 className="title">Contact messages</h5>
        <select
          className="form-control lx-admin__filter"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
        >
          <option value="">All</option>
          {CONTACT_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </header>

      {panel.error ? <p className="lx-field__error">{panel.error.message}</p> : null}
      {!panel.loading && messages.length === 0 ? (
        <p className="lx-note">Nothing here.</p>
      ) : null}

      <ul className="lx-admin__list">
        {messages.map((message) => (
          <li key={message.id} className="lx-admin__row is-stacked">
            <div className="lx-admin__row-main">
              <strong>
                {message.name}{" "}
                <span className="lx-tag">{CONTACT_SUBJECT_LABEL[message.subject]}</span>
                <span className={`lx-tag is-${message.status}`}>{message.status}</span>
              </strong>
              <span className="lx-admin__meta">
                {message.email}
                {message.phone ? ` · ${message.phone}` : ""} ·{" "}
                {new Date(message.createdAt).toLocaleString("en-IN")}
              </span>
              <p className="lx-admin__message">{message.message}</p>
              {message.adminNote ? (
                <span className="lx-admin__meta">Note: {message.adminNote}</span>
              ) : null}
            </div>

            <div className="lx-admin__row-actions">
              <input
                className="form-control"
                placeholder="Add a note"
                value={note[message.id] ?? ""}
                onChange={(event) =>
                  setNote((current) => ({ ...current, [message.id]: event.target.value }))
                }
              />
              <a className="tf-btn style-border pd-10" href={`mailto:${message.email}`}>
                Reply by email
              </a>
              <button
                type="button"
                className="tf-btn bg-color-primary pd-10"
                onClick={() => move(message.id, "replied")}
              >
                Mark replied
              </button>
              <button
                type="button"
                className="tf-btn style-border pd-10"
                onClick={() => move(message.id, "closed")}
              >
                Close
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
