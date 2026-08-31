import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { REPORT_REASONS, REPORT_REASON_LABEL } from "@locatex/contracts";
import { post } from "../services/locatexApi";
import { useConversation, useThreads } from "../features/chat/useChat";
import { useRealtime } from "../features/chat/useRealtime";
import { useSession } from "../hooks/useSession";

/**
 * Messages: the list of conversations on the left, the open one on the right.
 *
 * Which conversation is open lives in the URL, so a link to a specific conversation works
 * and the back button behaves.
 */
export default function Message() {
  const { user, loading: sessionLoading } = useSession();
  const [params, setParams] = useSearchParams();
  const { threads, loading, reload } = useThreads();
  const activeId = params.get("thread");

  const {
    messages,
    loading: loadingMessages,
    sending,
    send,
    reload: reloadMessages,
  } = useConversation(activeId, { onRead: reload });

  /*
   * A message pushed by the server means "read the thread again", not "here is the text to
   * append". Re-reading keeps one source of truth — the API — and means a message that
   * arrives while the socket is reconnecting is not silently missed.
   */
  useRealtime(Boolean(user), (incoming) => {
    if (incoming.threadId === activeId) reloadMessages();
    // Either way the inbox has changed: an unread count, or a new conversation entirely.
    reload();
  });

  const [draft, setDraft] = useState("");
  const [reporting, setReporting] = useState(false);
  const endRef = useRef(null);

  // Follow the conversation down as it grows, the way every chat does.
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const active = threads.find((thread) => thread.id === activeId);

  if (sessionLoading) return <div className="widget-box-2 mb-20">One moment…</div>;

  if (!user) {
    return (
      <div className="widget-box-2 mb-20">
        <h5 className="title">Sign in to see your messages</h5>
        <a href="#modalLogin" data-bs-toggle="modal" className="tf-btn bg-color-primary pd-10">
          Sign in
        </a>
      </div>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    const body = draft;
    setDraft("");
    await send(body);
    reload();
  };

  const setBlocked = async (blocked) => {
    await post(`/chat/threads/${activeId}/block`, { blocked });
    reload();
  };

  return (
    <div className="lx-chat">
      <aside className="lx-chat__list">
        <h5 className="title">Conversations</h5>

        {loading ? <p className="lx-note">Loading…</p> : null}
        {!loading && threads.length === 0 ? (
          <p className="lx-note">
            Nothing yet. Open a listing and ask the broker a question —{" "}
            <Link to="/properties">browse land</Link>.
          </p>
        ) : null}

        <ul>
          {threads.map((thread) => (
            <li key={thread.id}>
              <button
                type="button"
                className={thread.id === activeId ? "is-active" : ""}
                onClick={() => setParams({ thread: thread.id })}
              >
                <span className="lx-chat__who">
                  {thread.other.name}
                  {thread.unread > 0 ? (
                    <span className="lx-chat__badge">{thread.unread}</span>
                  ) : null}
                </span>
                <span className="lx-chat__about">{thread.propertyTitle}</span>
                <span className="lx-chat__preview">
                  {thread.lastFromMe ? "You: " : ""}
                  {thread.lastMessagePreview ?? "No messages yet"}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <section className="lx-chat__pane">
        {!activeId ? (
          <p className="lx-note lx-chat__placeholder">
            Choose a conversation to read it.
          </p>
        ) : (
          <>
            <header className="lx-chat__head">
              <div>
                <strong>{active?.other.name ?? "Conversation"}</strong>
                {active ? (
                  <Link to={`/properties/${active.propertyId}`} className="lx-chat__about">
                    {active.propertyTitle}
                  </Link>
                ) : null}
              </div>

              <div className="lx-chat__actions">
                {active?.blocked ? (
                  <button
                    type="button"
                    className="tf-btn style-border pd-10"
                    onClick={() => setBlocked(false)}
                  >
                    Unblock
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      className="tf-btn style-border pd-10"
                      onClick={() => setBlocked(true)}
                    >
                      Block
                    </button>
                    <button
                      type="button"
                      className="tf-btn style-border pd-10"
                      onClick={() => setReporting(true)}
                    >
                      Report
                    </button>
                  </>
                )}
              </div>
            </header>

            {reporting ? (
              <ReportBox
                threadId={activeId}
                onDone={() => {
                  setReporting(false);
                  reload();
                }}
                onCancel={() => setReporting(false)}
              />
            ) : null}

            <div className="lx-chat__messages">
              {loadingMessages ? <p className="lx-note">Loading…</p> : null}

              {messages.map((message) => {
                const mine = message.senderId === user.id || message.senderId === "me";
                return (
                  <div
                    key={message.id}
                    className={`lx-bubble${mine ? " is-mine" : ""}${message.failed ? " is-failed" : ""}`}
                  >
                    <p>{message.body}</p>
                    <span className="lx-bubble__time">
                      {message.pending
                        ? "Sending…"
                        : message.failed
                          ? "Not sent — try again"
                          : new Date(message.createdAt).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                      {mine && message.readAt ? " · Read" : ""}
                    </span>
                  </div>
                );
              })}
              <div ref={endRef} />
            </div>

            {active?.blocked ? (
              <p className="lx-note lx-chat__blocked">
                You blocked this conversation. Unblock to reply.
              </p>
            ) : (
              <form className="lx-chat__composer" onSubmit={submit}>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Write a message"
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  maxLength={2000}
                />
                <button
                  type="submit"
                  className="tf-btn bg-color-primary pd-10"
                  disabled={sending || !draft.trim()}
                >
                  Send
                </button>
              </form>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function ReportBox({ threadId, onDone, onCancel }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [detail, setDetail] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setPending(true);
    try {
      await post(`/chat/threads/${threadId}/report`, {
        reason,
        ...(detail.trim() ? { detail: detail.trim() } : {}),
      });
      onDone();
    } finally {
      setPending(false);
    }
  };

  return (
    <form className="lx-chat__report" onSubmit={submit}>
      <p className="lx-note">
        Reporting also blocks this conversation, so you will not hear from them again.
      </p>
      <select
        className="form-control"
        value={reason}
        onChange={(event) => setReason(event.target.value)}
      >
        {REPORT_REASONS.map((value) => (
          <option key={value} value={value}>
            {REPORT_REASON_LABEL[value]}
          </option>
        ))}
      </select>
      <textarea
        className="textarea"
        rows={2}
        placeholder="Anything else we should know? (optional)"
        value={detail}
        onChange={(event) => setDetail(event.target.value)}
      />
      <div className="lx-chat__actions">
        <button type="submit" className="tf-btn bg-color-primary pd-10" disabled={pending}>
          {pending ? "Sending…" : "Report and block"}
        </button>
        <button type="button" className="tf-btn style-border pd-10" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
