import { useEffect, useRef } from "react";
import { io } from "socket.io-client";

/**
 * The live half of chat.
 *
 * The server has had a Socket.IO gateway since chat was built, and nothing ever connected
 * to it — so every message arrived on the eight-second poll, which reads as "I have to
 * refresh to see replies". This is the missing client.
 *
 * It stays an accelerator, not the transport. Every message is still sent and read over
 * HTTP; the socket only says "something arrived, read it now". A browser that cannot hold
 * a socket open — a corporate proxy, a bad mobile network — loses nothing but immediacy,
 * which is why the poll below it stays.
 */
export function useRealtime(enabled, onMessage) {
  const handlerRef = useRef(onMessage);
  handlerRef.current = onMessage;

  useEffect(() => {
    if (!enabled) return undefined;

    // Same origin, and the session cookie goes with the handshake — there is no separate
    // socket token to mint, expire or leak.
    const socket = io({
      path: "/api/v1/realtime",
      withCredentials: true,
      // Polling first, then upgrade. A network that blocks websockets still gets messages.
      transports: ["polling", "websocket"],
      reconnectionDelay: 1_000,
      reconnectionDelayMax: 10_000,
    });

    socket.on("message", (message) => handlerRef.current?.(message));

    return () => {
      socket.off("message");
      socket.disconnect();
    };
  }, [enabled]);
}
