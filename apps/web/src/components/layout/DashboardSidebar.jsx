import { Link, useLocation } from "react-router-dom";
import { useSession } from "../../hooks/useSession";
import { BRAND } from "../../content/brand";

/**
 * The dashboard's navigation.
 *
 * It replaces 300-odd lines of the template's inline SVG, which carried a hardcoded email
 * address and links to pages that no longer exist — clicking "Reviews" reached a "results
 * not found" screen, because the route was deleted with the rest of the demo pages.
 *
 * What appears depends on who is signed in. A buyer has no use for a review queue and a
 * broker has no use for the account list, and showing links that lead to a refusal teaches
 * people to distrust the menu.
 */

/** Grouped so the menu reads as tasks rather than as one long list of pages. */
function menuFor(user) {
  const isBroker = user?.role === "broker" || user?.role === "admin";
  const isAdmin = user?.role === "admin";

  return [
    {
      title: "Overview",
      items: [{ to: "/dashboard", label: "Dashboard", icon: "icon-grid" }],
    },
    isAdmin && {
      title: "Administration",
      items: [
        { to: "/admin", label: "Review queue", icon: "icon-file-text" },
        { to: "/admin?tab=people", label: "People & brokers", icon: "icon-user" },
        { to: "/admin?tab=inbox", label: "Contact messages", icon: "icon-mail" },
        { to: "/admin?tab=news", label: "Noticeboard", icon: "icon-notification" },
        { to: "/admin?tab=storage", label: "Document storage", icon: "icon-hard-drive" },
      ],
    },
    isBroker && {
      title: "My land",
      items: [
        { to: "/my-property", label: "My listings", icon: "icon-home" },
        { to: "/add-property", label: "Post a listing", icon: "icon-plus" },
      ],
    },
    {
      title: "Buying",
      items: [
        { to: "/properties", label: "Browse land", icon: "icon-search" },
        { to: "/my-favorites", label: "Favourites", icon: "icon-heart" },
        { to: "/my-enquiries", label: "My enquiries", icon: "icon-file-text" },
      ],
    },
    {
      title: "Account",
      items: [
        { to: "/message", label: "Messages", icon: "icon-mail" },
        { to: "/my-profile", label: "My profile", icon: "icon-user" },
      ],
    },
  ].filter(Boolean);
}

export default function DashboardSidebar() {
  const { pathname, search } = useLocation();
  const { user, signOut } = useSession();

  // An admin tab is a query string, so the path alone cannot tell the active item apart.
  const current = `${pathname}${search}`;
  const isActive = (to) =>
    to.includes("?") ? current === to : pathname === to;

  const initials = (user?.fullName ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <aside className="sidebar-menu-dashboard lx-side">
      <Link to="/" className="lx-side__brand">
        <img src={BRAND.logo.light} alt={BRAND.name} />
      </Link>

      {user ? (
        <div className="lx-side__who">
          <span className="lx-side__avatar" aria-hidden="true">
            {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials || "?"}
          </span>
          <span className="lx-side__whotext">
            <strong>{user.fullName}</strong>
            <small>{user.email}</small>
            <span className={`lx-tag is-${user.role}`}>{user.role}</span>
          </span>
        </div>
      ) : null}

      <nav className="lx-side__nav">
        {menuFor(user).map((group) => (
          <div key={group.title} className="lx-side__group">
            <p className="lx-side__grouptitle">{group.title}</p>
            <ul>
              {group.items.map((item) => (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    className={isActive(item.to) ? "is-active" : ""}
                    aria-current={isActive(item.to) ? "page" : undefined}
                  >
                    <i className={`icon ${item.icon}`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="lx-side__foot">
        <Link to="/">Back to the site</Link>
        <button type="button" onClick={() => signOut()}>
          Sign out
        </button>
      </div>
    </aside>
  );
}
