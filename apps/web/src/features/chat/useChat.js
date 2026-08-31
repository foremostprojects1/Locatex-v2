import { useCallback, useEffect, useRef, useState } from "react";
import { get, post } from "../../services/locatexApi";

/**
 * The chat client.
 *
 * HTTP is the transport; the socket is an accelerator. Every message is sent and read
 * through the REST endpoints, and the socket only tells us to re-read sooner. That order
 * matters: a client built socket-first is broken for exactly the people on the worst
 * connections, who are the people most likely to be standing in a field.
 *
 * When no socket connects, a slow poll keeps the conversation working. It is deliberately
 * slow — a message arriving eight seconds late is a minor annoyance; a phone burning its
 * battery on a one-second poll is a deleted app.
 */
/**
 * The fallback rate, used when no socket is connected.
 *
 * Deliberately slow. A message arriving four seconds late is a minor annoyance; a phone
 * polling every second is a flat battery and a deleted app. When the socket does connect,
 * messages arrive immediately and this is only a safety net.
 */
const POLL_INTERVAL_MS = 4_000;

export function useThreads() {
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    try {
      const response = await get("/chat/threads");
      setThreads(response.data);
    } catch {
      setThreads([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { threads, loading, reload };
}

export function useConversation(threadId, { onRead } = {}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(Boolean(threadId));
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const onReadRef = useRef(onRead);
  onReadRef.current = onRead;

  const load = useCallback(async () => {
    if (!threadId) return;
    try {
      const response = await get(`/chat/threads/${threadId}/messages`);
      setMessages(response.data);
      // Reading is what marks them read, so the inbox badge is now stale.
      if (response.markedRead > 0) onReadRef.current?.();
    } catch (cause) {
      setError(cause);
    } finally {
      setLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    setMessages([]);
    setLoading(Boolean(threadId));
    load();
  }, [threadId, load]);

  // The fallback. Cheap, and stopped while the tab is hidden — nobody is reading a
  // conversation they cannot see.
  useEffect(() => {
    if (!threadId) return undefined;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") load();
    }, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [threadId, load]);

  const send = useCallback(
    async (body) => {
      if (!threadId || !body.trim() || sending) return;

      // Drawn immediately with a local id. The server echoes that id back, which is how
      // the confirmed message replaces this one instead of appearing beside it.
      const clientId = `local-${Date.now()}`;
      const optimistic = {
        id: clientId,
        clientId,
        senderId: "me",
        body: body.trim(),
        createdAt: new Date().toISOString(),
        pending: true,
      };
      setMessages((current) => [...current, optimistic]);
      setSending(true);

      try {
        const response = await post(`/chat/threads/${threadId}/messages`, {
          body: body.trim(),
          clientId,
        });
        setMessages((current) =>
          current.map((message) =>
            message.clientId === clientId ? { ...response.data, pending: false } : message,
          ),
        );
      } catch (cause) {
        // Marked failed rather than removed: silently deleting what somebody typed is
        // worse than showing it did not send.
        setMessages((current) =>
          current.map((message) =>
            message.clientId === clientId ? { ...message, pending: false, failed: true } : message,
          ),
        );
        setError(cause);
      } finally {
        setSending(false);
      }
    },
    [threadId, sending],
  );

  return { messages, loading, sending, error, send, reload: load };
}

/**
 * The unread badge, refreshed on a slow timer and on demand.
 *
 * Kept separate from the conversation so the header can show it on every page without
 * loading any messages.
 */
export function useUnreadCount(enabled) {
  const [unread, setUnread] = useState(0);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    try {
      const response = await get("/chat/unread");
      setUnread(response.unread);
    } catch {
      setUnread(0);
    }
  }, [enabled]);

  useEffect(() => {
    refresh();
    if (!enabled) return undefined;
    const timer = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, 60_000);
    return () => clearInterval(timer);
  }, [enabled, refresh]);

  return { unread, refresh };
}
