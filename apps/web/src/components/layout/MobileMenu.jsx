import { Link } from "react-router-dom";
import { BRAND } from "../../content/brand";
import MainNav from "./MainNav";
import { CONTACT_INFO } from "../../constants/navigation";

/** Off-canvas drawer shown by the `mobile-menu-visible` body class. */
export default function MobileMenu({ onClose, showAccountLinks = true }) {
  return (
    <>
      <div
        className="close-btn"
        onClick={onClose}
        role="button"
        tabIndex={0}
        aria-label="Close menu"
        onKeyDown={(event) => {
          if (event.key === "Enter") onClose();
        }}
      >
        <span className="icon flaticon-cancel-1" />
      </div>
      <div className="mobile-menu">
        <div className="menu-backdrop" onClick={onClose} />
        <nav className="menu-box">
          <div className="nav-logo">
            <Link to="/" onClick={onClose}>
              <img
                src={BRAND.logo.dark}
                alt={BRAND.name}
                width="174"
                height="44"
              />
            </Link>
          </div>
          <div className="bottom-canvas">
            {showAccountLinks && (
              <div className="login-box flex align-center">
                <a href="#modalLogin" data-bs-toggle="modal">
                  Login
                </a>
                <span>/</span>
                <a href="#modalRegister" data-bs-toggle="modal">
                  Register
                </a>
              </div>
            )}
            <div className="menu-outer">
              <MainNav mobile onNavigate={onClose} />
            </div>
            <div className="button-mobi-sell">
              <Link
                className="tf-btn primary"
                to="/add-property"
                onClick={onClose}
              >
                Submit Property
              </Link>
            </div>
            <div className="mobi-icon-box">
              <div className="box d-flex align-items-center">
                <span className="icon icon-phone2" />
                <div>{CONTACT_INFO.phone}</div>
              </div>
              <div className="box d-flex align-items-center">
                <span className="icon icon-mail" />
                <div>{CONTACT_INFO.email}</div>
              </div>
            </div>
          </div>
        </nav>
      </div>
    </>
  );
}
