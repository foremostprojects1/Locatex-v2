import { Link } from "react-router-dom";
import {
  PasswordFieldIcon,
  SocialLoginButtons,
  UserFieldIcon,
} from "./accountIcons";

/** `#modalLogin` — opened from the header and the mobile drawer. */
export default function LoginModal() {
  return (
    <div className="modal modal-account fade" id="modalLogin">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="flat-account">
            <div className="banner-account">
              <img src="/images/banner/banner-account1.jpg" alt="banner" />
            </div>
            <form
              className="form-account"
              onSubmit={(event) => event.preventDefault()}
            >
              <div className="title-box">
                <h4>Login</h4>
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
                  <label htmlFor="login-account">Account</label>
                  <div className="ip-field">
                    <UserFieldIcon />
                    <input
                      id="login-account"
                      type="text"
                      className="form-control"
                      placeholder="Your name"
                    />
                  </div>
                </fieldset>
                <fieldset className="box-fieldset">
                  <label htmlFor="login-password">Password</label>
                  <div className="ip-field">
                    <PasswordFieldIcon />
                    <input
                      id="login-password"
                      type="password"
                      className="form-control"
                      placeholder="Your password"
                    />
                  </div>
                  <div className="text-forgot text-end">
                    <a href="#">Forgot password</a>
                  </div>
                </fieldset>
              </div>
              <div className="box box-btn">
                <Link
                  to="/dashboard"
                  className="tf-btn primary w-100"
                  data-bs-dismiss="modal"
                >
                  Login
                </Link>
                <div className="text text-center">
                  Don’t you have an account?{" "}
                  <a
                    href="#modalRegister"
                    data-bs-toggle="modal"
                    data-bs-dismiss="modal"
                    className="text-primary"
                  >
                    Register
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
