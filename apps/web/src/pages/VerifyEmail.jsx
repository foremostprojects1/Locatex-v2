import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useSession } from "../hooks/useSession";

/**
 * Where the confirmation link in the email lands.
 *
 * The token is spent as soon as the page opens — there is no button, because the click in
 * the email *was* the intent and asking for a second one only loses people. It runs once
 * even though React mounts effects twice in development: the second run would find the
 * token already spent and report a failure for something that actually worked.
 */
export default function VerifyEmail() {
  const [params] = useSearchParams();
  const { verifyEmail } = useSession();
  const [state, setState] = useState("working");
  const [message, setMessage] = useState(null);
  const attempted = useRef(false);

  const token = params.get("token");

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    if (!token) {
      setState("failed");
      setMessage("That link is missing its confirmation code. Open the link from the email itself.");
      return;
    }

    verifyEmail(token)
      .then(() => setState("done"))
      .catch((cause) => {
        setState("failed");
        setMessage(cause.message);
      });
  }, [token, verifyEmail]);

  return (
    <div className="lx-centred-page">
      <div className="widget-box-2">
        {state === "working" ? <h5 className="title">Confirming your email…</h5> : null}

        {state === "done" ? (
          <>
            <h5 className="title">Your email is confirmed</h5>
            <p className="lx-note">
              Once your mobile number is confirmed too, you can sign in and start using
              LocateX.
            </p>
            <a href="#modalLogin" data-bs-toggle="modal" className="tf-btn bg-color-primary pd-10">
              Sign in
            </a>
          </>
        ) : null}

        {state === "failed" ? (
          <>
            <h5 className="title">That link did not work</h5>
            <p className="lx-note">{message}</p>
            <p className="lx-note">
              Confirmation links can be used once and expire after 24 hours. If yours has
              expired, register again with the same address, or{" "}
              <Link to="/contact">write to us</Link> and we will sort it out.
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
