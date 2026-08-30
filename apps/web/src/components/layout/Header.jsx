import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import MainNav from "./MainNav";
import MobileMenu from "./MobileMenu";
import { ACCOUNT_MENU } from "../../constants/navigation";
import { useSession } from "../../hooks/useSession";
import useSearchPopup from "../../hooks/useSearchPopup";
import { BRAND } from "../../content/brand";

const UserIcon = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.1251 5C13.1251 5.8288 12.7959 6.62366 12.2099 7.20971C11.6238 7.79576 10.8289 8.125 10.0001 8.125C9.17134 8.125 8.37649 7.79576 7.79043 7.20971C7.20438 6.62366 6.87514 5.8288 6.87514 5C6.87514 4.1712 7.20438 3.37634 7.79043 2.79029C8.37649 2.20424 9.17134 1.875 10.0001 1.875C10.8289 1.875 11.6238 2.20424 12.2099 2.79029C12.7959 3.37634 13.1251 4.1712 13.1251 5ZM3.75098 16.765C3.77776 15.1253 4.44792 13.5618 5.61696 12.4117C6.78599 11.2616 8.36022 10.6171 10.0001 10.6171C11.6401 10.6171 13.2143 11.2616 14.3833 12.4117C15.5524 13.5618 16.2225 15.1253 16.2493 16.765C14.2888 17.664 12.1569 18.1279 10.0001 18.125C7.77014 18.125 5.65348 17.6383 3.75098 16.765Z"
      stroke="black"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SubmitPropertyIcon = () => (
  <svg
    width="21"
    height="20"
    viewBox="0 0 21 20"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M13.625 14.375V17.1875C13.625 17.705 13.205 18.125 12.6875 18.125H4.5625C4.31386 18.125 4.0754 18.0262 3.89959 17.8504C3.72377 17.6746 3.625 17.4361 3.625 17.1875V6.5625C3.625 6.045 4.045 5.625 4.5625 5.625H6.125C6.54381 5.62472 6.96192 5.65928 7.375 5.72834M13.625 14.375H16.4375C16.955 14.375 17.375 13.955 17.375 13.4375V9.375C17.375 5.65834 14.6725 2.57417 11.125 1.97834C10.7119 1.90928 10.2938 1.87472 9.875 1.875H8.3125C7.795 1.875 7.375 2.295 7.375 2.8125V5.72834M13.625 14.375H8.3125C8.06386 14.375 7.8254 14.2762 7.64959 14.1004C7.47377 13.9246 7.375 13.6861 7.375 13.4375V5.72834M17.375 11.25V9.6875C17.375 8.94158 17.0787 8.22621 16.5512 7.69876C16.0238 7.17132 15.3084 6.875 14.5625 6.875H13.3125C13.0639 6.875 12.8254 6.77623 12.6496 6.60041C12.4738 6.4246 12.375 6.18614 12.375 5.9375V4.6875C12.375 4.31816 12.3023 3.95243 12.1609 3.6112C12.0196 3.26998 11.8124 2.95993 11.5512 2.69876C11.2901 2.4376 10.98 2.23043 10.6388 2.08909C10.2976 1.94775 9.93184 1.875 9.5625 1.875H8.625"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

/**
 * Site header.
 *
 * @param {'default'|'fixed'|'style-2'|'dashboard'} variant
 *  - `fixed`/`style-2` reproduce the `header-fixed` behaviour of the original
 *    theme: the `is-fixed` class is added as soon as the page is scrolled, and
 *    the transparent logo is swapped for the dark one.
 *  - `dashboard` swaps the sign-in button for the account dropdown and adds the
 *    sidebar toggle next to the logo.
 */
export default function Header({
  variant = "default",
  showSearchButton = false,
  onToggleSidebar,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isFixed, setIsFixed] = useState(false);
  const { toggle: toggleSearchPopup } = useSearchPopup();

  const isDashboard = variant === "dashboard";
  const { user, signOut } = useSession();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  // The dashboard guard sends people here with ?signin=1 when they tried to reach a page
  // that needs an account. Opening the dialog for them beats making them find the button.
  useEffect(() => {
    if (params.get("signin") !== "1" || user) return;
    import("../modals/modalControl").then(({ openModal }) => openModal("modalLogin"));
    const next = new URLSearchParams(params);
    next.delete("signin");
    setParams(next, { replace: true });
  }, [params, user, setParams]);
  const hasFixedBehaviour = variant === "fixed" || variant === "style-2";

  useEffect(() => {
    if (!hasFixedBehaviour) return undefined;
    const onScroll = () => setIsFixed(window.scrollY > 0);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [hasFixedBehaviour]);

  useEffect(() => {
    document.body.classList.toggle("mobile-menu-visible", mobileMenuOpen);
    return () => document.body.classList.remove("mobile-menu-visible");
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileMenuOpen]);

  const headerClass = [
    "main-header",
    hasFixedBehaviour ? "header-fixed" : "",
    "fixed-header",
    variant === "style-2" ? "header-style-2" : "",
    isDashboard ? "header-dashboard" : "",
    isFixed ? "is-fixed" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const transparentLogo = variant === "style-2" && !isFixed;
  const logoSrc = transparentLogo ? BRAND.logo.light : BRAND.logo.dark;

  return (
    <header
      id={hasFixedBehaviour ? "header" : undefined}
      className={headerClass}
    >
      <div className="header-lower">
        <div className="row">
          <div className="col-lg-12">
            <div className="inner-header">
              <div className="inner-header-left">
                <div
                  className={isDashboard ? "logo-box d-flex" : "logo-box flex"}
                >
                  <div className="logo">
                    <Link to="/">
                      <img
                        id={variant === "style-2" ? "trans-logo" : undefined}
                        src={logoSrc}
                        alt={BRAND.name}
                        width={isDashboard ? 150 : 160}
                        height={isDashboard ? 26 : 28}
                      />
                    </Link>
                  </div>
                  {isDashboard && (
                    <div
                      className="button-show-hide"
                      role="button"
                      tabIndex={0}
                      aria-label="Toggle sidebar"
                      onClick={onToggleSidebar}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") onToggleSidebar?.();
                      }}
                    >
                      <span className="icon icon-categories" />
                    </div>
                  )}
                </div>
                <div className="nav-outer flex align-center">
                  <nav className="main-menu show navbar-expand-md">
                    <div
                      className="navbar-collapse collapse clearfix"
                      id="navbarSupportedContent"
                    >
                      <MainNav />
                    </div>
                  </nav>
                </div>
              </div>

              <div
                className={
                  isDashboard
                    ? "header-account inner-header-right"
                    : "inner-header-right header-account"
                }
              >
                {/*
                  Driven by the session rather than by which layout is rendering. The
                  template showed an account menu on every dashboard page and a "Sign in"
                  button everywhere else, which meant a signed-in visitor on the home page
                  was invited to sign in again.
                */}
                {user ? (
                  <div
                    className="box-avatar dropdown-toggle"
                    data-bs-toggle="dropdown"
                  >
                    <div className="avatar avt-34 round">
                      <img src={user.avatarUrl ?? "/images/avatar/avt-5.jpg"} alt="" />
                    </div>
                    <p className="name">
                      {user.fullName?.split(" ")[0] ?? "My account"}
                      <span className="icon icon-arr-down" />
                    </p>
                    <div className="dropdown-menu">
                      {user.role === "admin" ? (
                        <Link className="dropdown-item" to="/admin">
                          Admin dashboard
                        </Link>
                      ) : null}
                      {ACCOUNT_MENU.map((item) => (
                        <Link
                          key={item.label}
                          className="dropdown-item"
                          to={item.to}
                        >
                          {item.label}
                        </Link>
                      ))}
                      <button
                        type="button"
                        className="dropdown-item"
                        onClick={async () => {
                          await signOut();
                          navigate("/");
                        }}
                      >
                        Sign out
                      </button>
                    </div>
                  </div>
                ) : (
                  <a
                    href="#modalLogin"
                    data-bs-toggle="modal"
                    className="tf-btn btn-line btn-login"
                  >
                    <UserIcon />
                    Sign in
                  </a>
                )}
                <div className="flat-bt-top">
                  <Link className="tf-btn primary" to="/add-property">
                    <SubmitPropertyIcon />
                    Post your land
                  </Link>
                </div>
                {showSearchButton && (
                  <a
                    href="#"
                    className="btn-search-popup"
                    onClick={(event) => {
                      event.preventDefault();
                      toggleSearchPopup();
                    }}
                  >
                    <i className="icon icon-search" />
                  </a>
                )}
              </div>

              <div
                className="mobile-nav-toggler mobile-button"
                role="button"
                tabIndex={0}
                aria-label="Open menu"
                onClick={() => setMobileMenuOpen(true)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") setMobileMenuOpen(true);
                }}
              >
                <span />
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileMenu
        onClose={() => setMobileMenuOpen(false)}
        showAccountLinks={!isDashboard}
      />
    </header>
  );
}
