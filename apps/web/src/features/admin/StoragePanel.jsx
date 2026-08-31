import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { formatBytes } from "@locatex/contracts";
import { adminApi } from "./adminApi";
import { usePanel } from "./usePanel";
import Loader from "../../components/common/Loader";

/**
 * Where property documents are kept.
 *
 * The whole system lives inside one Google account's 15 GB, so this panel is an
 * operational control rather than a status readout: when the Drive fills, uploads stop, and
 * the first anyone would otherwise know is a broker's failed upload during a sale.
 */
export default function StoragePanel() {
  const panel = usePanel(() => adminApi.storage(), []);
  const [params, setParams] = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Google sends the administrator back here with the outcome in the URL.
  const outcome = params.get("storage");
  useEffect(() => {
    if (!outcome) return;
    panel.reload();
    const next = new URLSearchParams(params);
    ["storage", "account", "reason"].forEach((key) => next.delete(key));
    setParams(next, { replace: true });
    // Keyed on the outcome alone: re-running when `params` or `panel` change would clear
    // the message a second time and lose it before it has been read.
  }, [outcome]);

  const connect = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await adminApi.connectStorage();
      // A full page navigation, not a popup: Google refuses to render its consent screen
      // inside a frame, and popups are blocked more often than they work.
      window.location.href = response.url;
    } catch (cause) {
      setError(cause.message);
      setBusy(false);
    }
  };

  const status = panel.data?.data;
  const quota = status?.quota;

  return (
    <section className="lx-admin__panel">
      <header className="lx-admin__panel-head">
        <h5 className="title">Document storage</h5>
      </header>

      {outcome === "connected" ? (
        <p className="lx-note">
          Connected{params.get("account") ? ` as ${params.get("account")}` : ""}. Brokers can
          attach documents from now on.
        </p>
      ) : null}
      {outcome === "cancelled" ? (
        <p className="lx-note">Connection cancelled — nothing has changed.</p>
      ) : null}
      {outcome === "failed" ? (
        <p className="lx-field__error">{params.get("reason") ?? "That did not work."}</p>
      ) : null}
      {error ? <p className="lx-field__error">{error}</p> : null}

      {panel.loading ? <Loader /> : null}

      {status && !status.connected ? (
        <>
          <p className="lx-note">
            No Google account is connected, so brokers cannot attach a 7/12 or an 8A. The
            site works without it — the paperwork simply has nowhere to go.
          </p>
          <button
            type="button"
            className="tf-btn bg-color-primary pd-10"
            disabled={busy}
            onClick={connect}
          >
            {busy ? "Opening Google…" : "Connect a Google account"}
          </button>
        </>
      ) : null}

      {status?.connected ? (
        <>
          <p className="lx-note">
            Connected{status.accountEmail ? ` as ${status.accountEmail}` : ""}. Documents go
            to that Drive, and only you and the review team can open them.
          </p>

          {quota ? (
            <div className="lx-quota">
              <div className="lx-quota__bar">
                <span
                  className={`lx-quota__fill${quota.shouldBlock ? " is-full" : quota.shouldWarn ? " is-warn" : ""}`}
                  style={{ width: `${Math.min(100, quota.fraction * 100).toFixed(1)}%` }}
                />
              </div>
              <span className="lx-admin__meta">
                {formatBytes(quota.usedBytes)} of {formatBytes(quota.limitBytes)} used
              </span>

              {quota.shouldBlock ? (
                <span className="lx-admin__meta is-warning">
                  Full — uploads are being refused. Clear space in that Drive, or connect a
                  different account.
                </span>
              ) : quota.shouldWarn ? (
                <span className="lx-admin__meta is-warning">
                  Over 80% used. Arrange more space before it fills, not after — when it is
                  full, brokers simply cannot upload.
                </span>
              ) : null}
            </div>
          ) : null}

          <button
            type="button"
            className="tf-btn style-border pd-10"
            onClick={async () => {
              await adminApi.disconnectStorage();
              await panel.reload();
            }}
          >
            Disconnect
          </button>
          <p className="lx-note">
            Disconnecting forgets the credential. The documents stay in that Drive — they
            belong to the account, not to us.
          </p>
        </>
      ) : null}
    </section>
  );
}
