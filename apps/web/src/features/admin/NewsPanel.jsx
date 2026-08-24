import { useState } from "react";
import { adminApi } from "./adminApi";
import { usePanel } from "./usePanel";

const today = () => new Date().toISOString().slice(0, 10);

const EMPTY = { title: "", body: "", linkUrl: "", startsAt: today(), endsAt: "" };

/**
 * Timed news and advertisements.
 *
 * The window is what decides whether an item is on the site — there is no "publish" button
 * to forget to press, and no expiry job that can fail to run and leave last month's offer
 * on the homepage.
 */
export default function NewsPanel() {
  const panel = usePanel(() => adminApi.news(), []);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const create = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await adminApi.createNews({
        title: form.title,
        body: form.body,
        startsAt: new Date(form.startsAt).toISOString(),
        ...(form.endsAt ? { endsAt: new Date(form.endsAt).toISOString() } : {}),
        ...(form.linkUrl ? { linkUrl: form.linkUrl } : {}),
      });
      setForm(EMPTY);
      await panel.reload();
    } catch (cause) {
      panel.setError(cause);
    } finally {
      setSaving(false);
    }
  };

  const items = panel.data?.data ?? [];

  return (
    <section className="lx-admin__panel">
      <header className="lx-admin__panel-head">
        <h5 className="title">News and advertisements</h5>
      </header>

      {panel.error ? <p className="lx-field__error">{panel.error.message}</p> : null}

      <form className="lx-admin__form" onSubmit={create}>
        <input
          className="form-control"
          placeholder="Headline"
          value={form.title}
          onChange={update("title")}
        />
        <textarea
          className="textarea"
          placeholder="What you want people to know"
          value={form.body}
          onChange={update("body")}
        />
        <div className="lx-admin__form-row">
          <label>
            Starts
            <input
              type="date"
              className="form-control"
              value={form.startsAt}
              onChange={update("startsAt")}
            />
          </label>
          <label>
            Ends (optional)
            <input
              type="date"
              className="form-control"
              value={form.endsAt}
              onChange={update("endsAt")}
            />
          </label>
          <input
            className="form-control"
            placeholder="Link (optional)"
            value={form.linkUrl}
            onChange={update("linkUrl")}
          />
        </div>
        <button type="submit" className="tf-btn bg-color-primary pd-10" disabled={saving}>
          {saving ? "Saving…" : "Publish"}
        </button>
      </form>

      <ul className="lx-admin__list">
        {items.map((item) => (
          <li key={item.id} className="lx-admin__row">
            <div className="lx-admin__row-main">
              <strong>
                {item.title}{" "}
                <span className={`lx-tag is-${item.isLive ? "live" : "off"}`}>
                  {item.isLive ? "on the site" : "not showing"}
                </span>
              </strong>
              <span className="lx-admin__meta">
                {new Date(item.startsAt).toLocaleDateString("en-IN")}
                {item.endsAt
                  ? ` – ${new Date(item.endsAt).toLocaleDateString("en-IN")}`
                  : " – no end date"}
              </span>
            </div>
            <div className="lx-admin__row-actions">
              <button
                type="button"
                className="tf-btn style-border pd-10"
                onClick={async () => {
                  await adminApi.updateNews(item.id, { isActive: !item.isActive });
                  await panel.reload();
                }}
              >
                {item.isActive ? "Switch off" : "Switch on"}
              </button>
              <button
                type="button"
                className="tf-btn style-border pd-10"
                onClick={async () => {
                  await adminApi.deleteNews(item.id);
                  await panel.reload();
                }}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
