import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { del, get, put } from "../../services/locatexApi";

/**
 * Gujarat's districts, talukas and villages.
 *
 * There are nearly nine thousand villages, so nothing here loads a full list. The server
 * pages and searches; the browser holds one page at a time and asks for the next when the
 * bottom of the list comes into view. A screen that fetched everything would work with the
 * seed data and stop working the day somebody imports another district.
 *
 * The three levels are one panel rather than three, because they are one hierarchy: picking
 * a district narrows the talukas, and picking a taluka narrows the villages. Editing them
 * on separate screens would mean holding the hierarchy in your head.
 */
const LEVELS = [
  { id: "districts", label: "Districts", singular: "district" },
  { id: "talukas", label: "Talukas", singular: "taluka" },
  { id: "villages", label: "Villages", singular: "village" },
];

export default function PlacesPanel() {
  const [level, setLevel] = useState("districts");
  const [district, setDistrict] = useState("");
  const [taluka, setTaluka] = useState("");
  const [search, setSearch] = useState("");
  const [typed, setTyped] = useState("");

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  // Options for the two filter selects. Districts are only 34, so one fetch covers them.
  const [districts, setDistricts] = useState([]);
  const [talukas, setTalukas] = useState([]);

  // A keystroke should not be a request. The list settles a third of a second after
  // typing stops, which on a 9,000-row collection is the difference between a search box
  // and a stutter.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(typed.trim()), 300);
    return () => clearTimeout(timer);
  }, [typed]);

  useEffect(() => {
    get("/admin/reference/districts")
      .then((response) => setDistricts(response.data))
      .catch(() => setDistricts([]));
  }, []);

  useEffect(() => {
    if (!district) {
      setTalukas([]);
      return;
    }
    get(`/admin/reference/talukas?district=${encodeURIComponent(district)}`)
      .then((response) => setTalukas(response.data))
      .catch(() => setTalukas([]));
  }, [district]);

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (district && level !== "districts") params.set("district", district);
    if (taluka && level === "villages") params.set("taluka", taluka);
    params.set("limit", "50");
    return params;
  }, [search, district, taluka, level]);

  /** The first page. Replaces whatever was on screen. */
  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await get(`/admin/reference/${level}?${query.toString()}`);
      setRows(response.data);
      setTotal(response.total);
      setCursor(response.nextCursor);
    } catch (cause) {
      setError(cause);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [level, query]);

  useEffect(() => {
    load();
  }, [load]);

  /** The next page, appended. */
  const loadMore = useCallback(async () => {
    if (!cursor || busy) return;
    setBusy(true);
    try {
      const next = new URLSearchParams(query);
      next.set("cursor", cursor);
      const response = await get(`/admin/reference/${level}?${next.toString()}`);
      setRows((current) => [...current, ...response.data]);
      setCursor(response.nextCursor);
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  }, [cursor, busy, level, query]);

  // Fetches the next page when the end of the list is reached, rather than making
  // somebody find and press a button on every one of 180 pages.
  const sentinel = useRef(null);
  useEffect(() => {
    const element = sentinel.current;
    if (!element || !cursor) return undefined;

    const observer = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && loadMore(),
      { rootMargin: "200px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [cursor, loadMore]);

  const remove = async (row) => {
    const id = row.id ?? row.slug;
    const singular = LEVELS.find((entry) => entry.id === level)?.singular;
    if (!window.confirm(`Remove ${row.name}?`)) return;

    try {
      await del(`/admin/reference/${singular}?id=${encodeURIComponent(id)}`);
      await load();
    } catch (cause) {
      // The server refuses when listings still sit there, and says how many.
      setError(cause);
    }
  };

  return (
    <section className="lx-admin__panel">
      <header className="lx-admin__panel-head">
        <h5 className="title">Places</h5>
        <button
          type="button"
          className="tf-btn bg-color-primary pd-10"
          onClick={() => setEditing({ level })}
        >
          Add a {LEVELS.find((entry) => entry.id === level)?.singular}
        </button>
      </header>

      <p className="lx-note">
        The districts, talukas and villages every address on the site is built from. Changing
        one changes what brokers can choose when they list land.
      </p>

      <div className="lx-places__tabs">
        {LEVELS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            className={level === entry.id ? "is-active" : ""}
            onClick={() => {
              setLevel(entry.id);
              setTyped("");
              setSearch("");
            }}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="lx-places__filters">
        <input
          className="form-control"
          placeholder={`Search ${level} by name`}
          value={typed}
          onChange={(event) => setTyped(event.target.value)}
        />

        {level !== "districts" ? (
          <select
            className="form-control"
            value={district}
            onChange={(event) => {
              setDistrict(event.target.value);
              setTaluka("");
            }}
          >
            <option value="">Every district</option>
            {districts.map((entry) => (
              <option key={entry.slug} value={entry.slug}>
                {entry.name}
              </option>
            ))}
          </select>
        ) : null}

        {level === "villages" ? (
          <select
            className="form-control"
            value={taluka}
            disabled={!district}
            onChange={(event) => setTaluka(event.target.value)}
          >
            <option value="">{district ? "Every taluka" : "Choose a district first"}</option>
            {talukas.map((entry) => (
              <option key={entry.id} value={entry.slug}>
                {entry.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {error ? <p className="lx-field__error">{error.message}</p> : null}

      <p className="lx-admin__meta lx-places__count">
        {loading ? "Counting…" : `${total.toLocaleString("en-IN")} ${level}`}
        {search ? ` matching “${search}”` : ""}
        {rows.length < total ? ` · showing ${rows.length}` : ""}
      </p>

      <ul className="lx-admin__list lx-places__list">
        {rows.map((row) => (
          <li key={row.id ?? row.slug} className="lx-admin__row">
            <div className="lx-admin__row-main">
              <strong>{row.name}</strong>
              <span className="lx-admin__meta">
                {row.slug}
                {row.districtSlug ? ` · ${row.districtSlug}` : ""}
                {row.talukaSlug ? ` / ${row.talukaSlug}` : ""}
                {row.pincode ? ` · ${row.pincode}` : ""}
                {row.talukaCount != null ? ` · ${row.talukaCount} talukas` : ""}
              </span>
            </div>
            <div className="lx-admin__row-actions">
              <button
                type="button"
                className="tf-btn style-border pd-10"
                onClick={() => setEditing({ level, row })}
              >
                Edit
              </button>
              <button type="button" className="lx-linkbutton" onClick={() => remove(row)}>
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      {!loading && rows.length === 0 ? (
        <p className="lx-note">Nothing matches those filters.</p>
      ) : null}

      {cursor ? (
        <div ref={sentinel} className="lx-places__more">
          {busy ? "Loading more…" : "Scroll for more"}
        </div>
      ) : null}

      {editing ? (
        <PlaceForm
          level={editing.level}
          row={editing.row}
          districts={districts}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      ) : null}
    </section>
  );
}

/**
 * Adding or renaming one place.
 *
 * The slug is the identity, so saving an existing slug edits in place and a new one creates.
 * It is shown but locked while editing — changing it would make a new place and orphan every
 * listing pointing at the old one.
 */
function PlaceForm({ level, row, districts, onClose, onSaved }) {
  const singular = LEVELS.find((entry) => entry.id === level)?.singular;
  const [values, setValues] = useState({
    name: row?.name ?? "",
    slug: row?.slug ?? "",
    districtSlug: row?.districtSlug ?? "",
    talukaSlug: row?.talukaSlug ?? "",
    pincode: row?.pincode ?? "",
  });
  const [talukas, setTalukas] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (level !== "villages" || !values.districtSlug) return;
    get(`/admin/reference/talukas?district=${encodeURIComponent(values.districtSlug)}`)
      .then((response) => setTalukas(response.data))
      .catch(() => setTalukas([]));
  }, [level, values.districtSlug]);

  const update = (field) => (event) => {
    const value = event.target.value;
    setValues((current) => ({
      ...current,
      [field]: value,
      // The slug follows the name until somebody edits it themselves — one less field to
      // fill in, and it keeps the slugs consistent with the seeded data.
      ...(field === "name" && !row
        ? { slug: value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") }
        : {}),
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await put(`/admin/reference/${level}`, {
        name: values.name,
        slug: values.slug,
        ...(level !== "districts" ? { districtSlug: values.districtSlug } : {}),
        ...(level === "villages"
          ? { talukaSlug: values.talukaSlug, pincode: values.pincode }
          : {}),
      });
      await onSaved();
    } catch (cause) {
      setError(cause);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="lx-notice-form lx-places__form" onSubmit={submit}>
      <h6 className="lx-section-title">
        {row ? `Edit ${row.name}` : `New ${singular}`}
      </h6>

      {error ? <p className="lx-field__error">{error.message}</p> : null}

      <div className="lx-notice-form__dates">
        <label className="lx-field">
          <span>Name</span>
          <input className="form-control" value={values.name} onChange={update("name")} required />
        </label>

        <label className="lx-field">
          <span>Slug</span>
          <input
            className="form-control"
            value={values.slug}
            onChange={update("slug")}
            readOnly={Boolean(row)}
            required
          />
          {row ? (
            <small className="lx-field__hint">
              Fixed once created — changing it would orphan every listing using it.
            </small>
          ) : null}
        </label>
      </div>

      {level !== "districts" ? (
        <div className="lx-notice-form__dates">
          <label className="lx-field">
            <span>District</span>
            <select
              className="form-control"
              value={values.districtSlug}
              onChange={update("districtSlug")}
              required
            >
              <option value="">Choose</option>
              {districts.map((entry) => (
                <option key={entry.slug} value={entry.slug}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>

          {level === "villages" ? (
            <>
              <label className="lx-field">
                <span>Taluka</span>
                <select
                  className="form-control"
                  value={values.talukaSlug}
                  onChange={update("talukaSlug")}
                  disabled={!values.districtSlug}
                  required
                >
                  <option value="">Choose</option>
                  {talukas.map((entry) => (
                    <option key={entry.id} value={entry.slug}>
                      {entry.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="lx-field">
                <span>Pincode</span>
                <input
                  className="form-control"
                  value={values.pincode}
                  onChange={update("pincode")}
                  inputMode="numeric"
                  maxLength={6}
                  required
                />
              </label>
            </>
          ) : null}
        </div>
      ) : null}

      <div className="lx-wizard__actions">
        <button type="submit" className="tf-btn bg-color-primary pd-10" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>
        <button type="button" className="tf-btn style-border pd-10" onClick={onClose}>
          Cancel
        </button>
      </div>
    </form>
  );
}
