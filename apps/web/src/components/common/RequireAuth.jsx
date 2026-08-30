import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../../hooks/useSession";

/**
 * Guards the whole dashboard, once.
 *
 * It used to be a check inside each page, which had two faults. Pages were missed — the
 * saved-listings page had none at all — and even where the check existed, the dashboard's
 * chrome had already rendered around it: a signed-out visitor saw the sidebar, the account
 * menu and the navigation, with a "please sign in" panel in the middle. That reads as a
 * broken dashboard rather than a closed door.
 *
 * Guarding the layout means a page cannot be added to the dashboard and accidentally be
 * public.
 */
export default function RequireAuth({ children, role }) {
  const { user, loading } = useSession();
  const location = useLocation();

  // The session is a round trip, so the first render genuinely does not know yet. Showing
  // nothing beats flashing a sign-in prompt at somebody who is signed in.
  if (loading) {
    return (
      <div className="lx-centred-page">
        <p className="lx-note">One moment…</p>
      </div>
    );
  }

  if (!user) {
    // Home, with a marker the header uses to open the sign-in dialog, and where they were
    // heading so they land there afterwards rather than back at the start.
    return <Navigate to="/?signin=1" state={{ from: location.pathname }} replace />;
  }

  if (role && user.role !== role) {
    return (
      <div className="lx-centred-page">
        <div className="widget-box-2">
          <h5 className="title">Not your account</h5>
          <p className="lx-note">
            This page belongs to the {role} area. You are signed in as a {user.role}.
          </p>
        </div>
      </div>
    );
  }

  return children;
}
