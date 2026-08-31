import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ACCOUNT_MENU } from "../../constants/navigation";
import { useSession } from "../../hooks/useSession";

/**
 * The menu behind the avatar.
 *
 * Controlled by React rather than by Bootstrap's `data-bs-toggle`. The template's version
 * hung the dropdown off a `div`, which Bootstrap's data-api attaches to on page load — but
 * this element only exists once the session has resolved, so the listener was bound to
 * something that had already been replaced by a re-render. It opened sometimes and stayed
 * open sometimes, and the sign-out button inside it left the menu on screen.
 *
 * Doing it here also gets the behaviour people expect from a menu: it closes on Escape, on
 * a click outside, and when a link inside it navigates.
 */
export default function AccountMenu() {
  const { user, signOut } = useSession();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Navigating always closes it, including when the link went somewhere it already was.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return undefined;

    const onPointerDown = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (!user) return null;

  const firstName = user.fullName?.split(" ")[0] ?? "My account";
  const initials = (user.fullName ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="lx-account" ref={ref}>
      <button
        type="button"
        className="lx-account__toggle"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="lx-account__avatar">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt=""
              // A broken photo URL would otherwise leave an empty box where a face should
              // be; falling back to initials keeps the control looking like itself.
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          ) : (
            initials || "?"
          )}
        </span>
        <span className="lx-account__name">{firstName}</span>
        <span className="lx-account__chev" aria-hidden="true" />
      </button>

      {open ? (
        <div className="lx-account__menu" role="menu">
          <div className="lx-account__who">
            <strong>{user.fullName}</strong>
            <small>{user.email}</small>
          </div>

          {user.role === "admin" ? (
            <Link role="menuitem" to="/admin">
              Admin dashboard
            </Link>
          ) : null}

          {ACCOUNT_MENU.map((item) => (
            <Link role="menuitem" key={item.label} to={item.to}>
              {item.label}
            </Link>
          ))}

          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await signOut();
              navigate("/");
            }}
          >
            Sign out
          </button>
        </div>
      ) : null}
    </div>
  );
}
