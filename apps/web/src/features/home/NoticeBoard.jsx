import { useEffect, useRef, useState } from "react";
import { get } from "../../services/locatexApi";

/**
 * Notices the administrator has posted, and the one being read.
 *
 * These used to be fixed text in a content file. They come from the API now, so what the
 * admin publishes is what appears — and a notice that has passed its end date disappears on
 * its own, because "live" is worked out from the dates rather than from a flag somebody has
 * to remember to switch off.
 *
 * A card shows the first lines; the whole thing opens in a dialog. Notices run to a few
 * paragraphs — jantri revisions, registration changes — and truncating them on the card was
 * making the section look cramped while hiding the part that mattered.
 */
export default function NoticeBoard() {
  const [notices, setNotices] = useState([]);
  const [reading, setReading] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    get("/news", { signal: controller.signal })
      .then((response) => setNotices(response.data ?? []))
      .catch((cause) => {
        if (cause.name !== "AbortError") setNotices([]);
      });
    return () => controller.abort();
  }, []);

  // Nothing published is not an error and not worth a placeholder — the section simply
  // is not there, and the page closes up around it.
  if (notices.length === 0) return null;

  return (
    <section className="lx-home__section">
      <div className="container">
        <div className="lx-notice__head">
          <span className="lx-notice__eyebrow">Noticeboard</span>
          <h2>News for land buyers and sellers</h2>
        </div>

        <div className="lx-notice__grid">
          {notices.map((notice) => (
            <article key={notice.id} className="lx-notice">
              {notice.imageUrl ? (
                <img className="lx-notice__image" src={notice.imageUrl} alt="" loading="lazy" />
              ) : null}

              <div className="lx-notice__body">
                <p className="lx-notice__date">
                  {new Date(notice.startsAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                  {notice.isPinned ? <span className="lx-notice__pin">Pinned</span> : null}
                </p>
                <h3>{notice.title}</h3>
                <p className="lx-notice__excerpt">{notice.body}</p>

                <button
                  type="button"
                  className="lx-notice__more"
                  onClick={() => setReading(notice)}
                >
                  Read this notice
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>

      {reading ? <NoticeDialog notice={reading} onClose={() => setReading(null)} /> : null}
    </section>
  );
}

/**
 * One notice, in full.
 *
 * A native `<dialog>` rather than a div with a high z-index: it traps focus, closes on
 * Escape and is announced as a dialog, all without any of that being written here. The
 * template's Bootstrap modals need markup in the page ahead of time, which does not suit
 * content that arrives from an API.
 */
function NoticeDialog({ notice, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog?.isConnected) return undefined;

    dialog.showModal();
    // Clicking the backdrop is the same as closing — `close` then runs `onClose` once,
    // whichever way it was dismissed.
    const onCancel = () => onClose();
    dialog.addEventListener("close", onCancel);
    return () => dialog.removeEventListener("close", onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      className="lx-dialog"
      onClick={(event) => {
        // The backdrop is the dialog element itself; the panel inside stops the click.
        if (event.target === ref.current) ref.current?.close();
      }}
    >
      <div className="lx-dialog__panel">
        <header className="lx-dialog__head">
          <div>
            <p className="lx-notice__date">
              {new Date(notice.startsAt).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <h3>{notice.title}</h3>
          </div>
          <button
            type="button"
            className="lx-dialog__close"
            aria-label="Close"
            onClick={() => ref.current?.close()}
          >
            ×
          </button>
        </header>

        {notice.imageUrl ? (
          <img className="lx-dialog__image" src={notice.imageUrl} alt="" />
        ) : null}

        {/* Preserves the paragraphs an admin typed, without accepting any markup. */}
        <div className="lx-dialog__body">{notice.body}</div>

        {notice.linkUrl ? (
          <a
            className="tf-btn bg-color-primary pd-10"
            href={notice.linkUrl}
            target="_blank"
            rel="noreferrer"
          >
            Read more
          </a>
        ) : null}
      </div>
    </dialog>
  );
}
