import { Link } from "react-router-dom";
import {
  MailFieldIcon,
  PasswordFieldIcon,
  SocialLoginButtons,
  UserFieldIcon,
} from "./accountIcons";

/** `#modalRegister` — opened from the header, the drawer and the login modal. */
export default function RegisterModal() {
  return (
    <div className="modal modal-account fade" id="modalRegister">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="flat-account">
            <div className="banner-account">
              <img src="/images/banner/banner-account2.jpg" alt="banner" />
            </div>
            <form
              className="form-account"
              onSubmit={(event) => event.preventDefault()}
            >
              <div className="title-box">
                <h4>Register</h4>
                <span
                  className="close-modal icon-close2"
                  data-bs-dismiss="modal"
                  role="button"
                  tabIndex={0}
                  aria-label="Close"
                />
              </div>
              <div className="box">
                <fieldset className="box-fieldset">
                  <label htmlFor="register-username">User name</label>
                  <div className="ip-field">
                    <UserFieldIcon />
                    <input
                      id="register-username"
                      type="text"
                      className="form-control"
                      placeholder="User name"
                    />
                  </div>
                </fieldset>
                <fieldset className="box-fieldset">
                  <label htmlFor="register-email">Email address</label>
                  <div className="ip-field">
                    <MailFieldIcon />
                    <input
                      id="register-email"
                      type="email"
                      className="form-control"
                      placeholder="Email address"
                    />
                  </div>
                </fieldset>
                <fieldset className="box-fieldset">
                  <label htmlFor="register-password">Password</label>
                  <div className="ip-field">
                    <PasswordFieldIcon />
                    <input
                      id="register-password"
                      type="password"
                      className="form-control"
                      placeholder="Your password"
                    />
                  </div>
                </fieldset>
                <fieldset className="box-fieldset">
                  <label htmlFor="register-confirm-password">
                    Confirm password
                  </label>
                  <div className="ip-field">
                    <PasswordFieldIcon />
                    <input
                      id="register-confirm-password"
                      type="password"
                      className="form-control"
                      placeholder="Confirm password"
                    />
                  </div>
                </fieldset>
              </div>
              <div className="box box-btn">
                <Link
                  to="/dashboard"
                  className="tf-btn primary w-100"
                  data-bs-dismiss="modal"
                >
                  Sign Up
                </Link>
                <div className="text text-center">
                  Don’t you have an account?{" "}
                  <a
                    href="#modalLogin"
                    data-bs-toggle="modal"
                    data-bs-dismiss="modal"
                    className="text-primary"
                  >
                    Sign In
                  </a>
                </div>
              </div>
              <SocialLoginButtons />
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
