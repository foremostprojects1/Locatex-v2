import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { get, post } from "../services/locatexApi";

/**
 * Who is signed in, for the whole app.
 *
 * The session lives in an httpOnly cookie the browser cannot read, so "am I signed in?" is
 * a question only the server can answer — `/auth/me` is asked once on load and the answer
 * kept here. A 401 from that call is not an error: it is the answer "nobody".
 *
 * Every call below returns or throws an `ApiError`, which carries the server's field
 * messages; the forms attach them to the right input rather than showing one generic
 * failure.
 */
const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await get("/auth/me");
      setUser(response.user);
      return response.user;
    } catch {
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      user,
      loading,
      isSignedIn: Boolean(user),
      isBroker: user?.role === "broker" || user?.role === "admin",
      isAdmin: user?.role === "admin",
      refresh,

      async signIn(identifier, password) {
        const response = await post("/auth/login", { identifier, password });
        setUser(response.user);
        return response.user;
      },

      /**
       * Registration does not sign anyone in. Both the email link and the phone code have
       * to be confirmed first (decision: both, not either), so this returns and the form
       * moves on to the verification step.
       */
      async register(fields) {
        return post("/auth/register", fields);
      },

      verifyEmail: (token) => post("/auth/verify-email", { token }),
      requestOtp: (phone) => post("/auth/otp/request", { phone }),
      verifyOtp: (phone, code) => post("/auth/otp/verify", { phone, code }),
      forgotPassword: (email) => post("/auth/forgot-password", { email }),
      resetPassword: (token, newPassword) => post("/auth/reset-password", { token, newPassword }),

      async signOut() {
        await post("/auth/logout");
        setUser(null);
      },
    }),
    [user, loading, refresh],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error("useSession must be used inside a SessionProvider");
  return context;
}
