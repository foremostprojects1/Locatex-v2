import { useState } from "react";
import { adminApi } from "./adminApi";
import { usePanel } from "./usePanel";
import Loader from "../../components/common/Loader";

const today = () => new Date().toISOString().slice(0, 10);
const EMPTY = { title: "", body: "", linkUrl: "", imageUrl: "", startsAt: today(), endsAt: "" };

/**
 * Notices, and the dates they run between.
 *
 * The window is what puts a notice on the site — there is no publish button to forget and
 * no expiry job that can fail to run, leaving last month's announcement on the homepage.
 * That makes the dates the most important field on the form, so they are not buried at the
 * bottom of it.
 *
 * Notices are grouped by what they are doing rather than listed by date: what is on the
 * site now, what is waiting to start, and what has finished. An administrator opening this
 * page is nearly always asking one of those three questions.
 */
export default function NewsPanel() {
  const panel = usePanel(() => adminApi.news(), []);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const items = panel.data?.data ?? [];
  const now = Date.now();

  const live = items.filter((item) => item.isLive);
  const scheduled = items.filter(
    (item) => !item.isLive && item.isActive && new Date(item.startsAt).getTime() > now,
  );
  const finished = items.filter(
    (item) => !item.isLive && (!item.isActive || new Date(item.startsAt).getTime() <= now),
  );

  const startEdit = (item) => {
    setEditing(item.id);
    setOpen(true);
    setForm({
      title: item.title,
      body: item.body,
      linkUrl: item.linkUrl ?? "",
      imageUrl: item.imageUrl ?? "",
      startsAt: new Date(item.startsAt).toISOString().slice(0, 10),
      endsAt: item.endsAt ? new Date(item.endsAt).toISOString().slice(0, 10) : "",
    });
  };

  const cancel = () => {
    setEditing(null);
    setOpen(false);
    setForm(EMPTY);
    panel.setError(null);
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    panel.setError(null);

    const payload = {
      title: form.title,
      body: form.body,
      startsAt: new Date(form.startsAt).toISOString(),
      // An empty date means "no end", which is null rather than an empty string — the
      // schema rejects the latter and the save would fail with nothing useful to show.
      endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null,
      linkUrl: form.linkUrl.trim() || null,
      imageUrl: form.imageUrl.trim() || null,
    };

    try {
      if (editing) await adminApi.updateNews(editing, payload);
      else await adminApi.createNews(payload);
      cancel();
      await panel.reload();
    } catch (cause) {
      panel.setError(cause);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Archiving switches a notice off without deleting it.
   *
   * Deleting loses what was announced and when, which is exactly the thing somebody asks
   * about three months later. Delete stays available for a notice posted by mistake.
   */
  const archive = async (item) => {
    await adminApi.updateNews(item.id, { isActive: !item.isActive });
    await panel.reload();
  };

  return (
    <section className="lx-admin__panel">
      <header className="lx-admin__panel-head">
        <h5 className="title">Noticeboard</h5>
        <button
          type="button"
          className="tf-btn bg-color-primary pd-10"
          onClick={() => (open ? cancel() : setOpen(true))}
        >
          {open ? "Cancel" : "Write a notice"}
        </button>
      </header>

      <p className="lx-note">
        A notice appears on the home page between the dates you set and disappears on its
        own — there is nothing to switch off afterwards.
      </p>

      {panel.error ? <p className="lx-field__error">{panel.error.message}</p> : null}

      {open ? (
        <form className="lx-notice-form" onSubmit={save}>
          <h6 className="lx-section-title">{editing ? "Edit this notice" : "New notice"}</h6>

          <label className="lx-field">
            <span>Headline</span>
            <input
              className="form-control"
              placeholder="Jantri rates revised for Morbi district"
              value={form.title}
              onChange={update("title")}
              maxLength={120}
              required
            />
          </label>

          <label className="lx-field">
            <span>What people need to know</span>
            <textarea
              className="textarea"
              rows={5}
              placeholder="The revised rates apply to registrations made on or after the first of next month. Check them before you agree a price."
              value={form.body}
              onChange={update("body")}
              maxLength={4000}
              required
            />
            <small className="lx-field__hint">
              {form.body.length} of 4,000 characters. Paragraphs are kept as you type them.
            </small>
          </label>

          <div className="lx-notice-form__dates">
            <label className="lx-field">
              <span>Appears from</span>
              <input
                type="date"
                className="form-control"
                value={form.startsAt}
                onChange={update("startsAt")}
                required
              />
            </label>

            <label className="lx-field">
              <span>Disappears after</span>
              <input
                type="date"
                className="form-control"
                value={form.endsAt}
                onChange={update("endsAt")}
              />
              <small className="lx-field__hint">Leave empty to run until you archive it.</small>
            </label>
          </div>

          <div className="lx-notice-form__dates">
            <label className="lx-field">
              <span>Link (optional)</span>
              <input
                type="url"
                className="form-control"
                placeholder="https://…"
                value={form.linkUrl}
                onChange={update("linkUrl")}
              />
            </label>

            <label className="lx-field">
              <span>Image (optional)</span>
              <input
                type="url"
                className="form-control"
                placeholder="https://…"
                value={form.imageUrl}
                onChange={update("imageUrl")}
              />
            </label>
          </div>

          <div className="lx-wizard__actions">
            <button type="submit" className="tf-btn bg-color-primary pd-10" disabled={saving}>
              {saving ? "Saving…" : editing ? "Save changes" : "Publish"}
            </button>
            <button type="button" className="tf-btn style-border pd-10" onClick={cancel}>
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      {panel.loading ? <Loader /> : null}

      <Group title="On the site now" items={live} empty="Nothing is showing on the home page.">
        {(item) => <Row item={item} onEdit={startEdit} onArchive={archive} panel={panel} />}
      </Group>

      <Group title="Waiting to start" items={scheduled} empty={null}>
        {(item) => <Row item={item} onEdit={startEdit} onArchive={archive} panel={panel} />}
      </Group>

      <Group title="Finished and archived" items={finished} empty={null}>
        {(item) => <Row item={item} onEdit={startEdit} onArchive={archive} panel={panel} />}
      </Group>
    </section>
  );
}

function Group({ title, items, empty, children }) {
  if (items.length === 0 && !empty) return null;

  return (
    <div className="lx-notice-group">
      <h6 className="lx-section-title">
        {title} <span className="lx-notice-group__count">{items.length}</span>
      </h6>
      {items.length === 0 ? (
        <p className="lx-note">{empty}</p>
      ) : (
        <ul className="lx-admin__list">{items.map((item) => children(item))}</ul>
      )}
    </div>
  );
}

function Row({ item, onEdit, onArchive, panel }) {
  const from = new Date(item.startsAt).toLocaleDateString("en-IN");
  const to = item.endsAt ? new Date(item.endsAt).toLocaleDateString("en-IN") : null;

  return (
    <li key={item.id} className="lx-admin__row">
      <div className="lx-admin__row-main">
        <strong>
          {item.title}
          {item.isLive ? <span className="lx-tag is-live">on the site</span> : null}
          {!item.isActive ? <span className="lx-tag">archived</span> : null}
        </strong>
        <span className="lx-admin__meta">
          {from} {to ? `– ${to}` : "– no end date"}
        </span>
        <span className="lx-admin__meta lx-notice-row__body">{item.body}</span>
      </div>

      <div className="lx-admin__row-actions">
        <button type="button" className="tf-btn style-border pd-10" onClick={() => onEdit(item)}>
          Edit
        </button>
        <button
          type="button"
          className="tf-btn style-border pd-10"
          onClick={() => onArchive(item)}
        >
          {item.isActive ? "Archive" : "Restore"}
        </button>
        <button
          type="button"
          className="lx-linkbutton"
          onClick={async () => {
            // Deleting loses the record of what was announced and when. Archiving is the
            // one offered first; this is for something posted by mistake.
            if (!window.confirm(`Delete “${item.title}” permanently?`)) return;
            await adminApi.deleteNews(item.id);
            await panel.reload();
          }}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
