import { useCallback, useEffect, useState } from "react";
import {
  DOCUMENTS_ENCOURAGED,
  DOCUMENT_CATEGORIES,
  DOCUMENT_CATEGORY_HINT,
  DOCUMENT_CATEGORY_LABEL,
  MAX_DOCUMENT_BYTES,
  formatBytes,
} from "@locatex/contracts";
import { del, get, post } from "../../../services/locatexApi";

/**
 * The papers behind the listing.
 *
 * Uploads go straight from the browser to storage — the server issues a session, the file
 * travels directly, and only then is it confirmed. That is why this step needs a saved
 * listing to attach to, and why it is offered after the draft has been created rather than
 * inside the wizard's own draft state.
 *
 * Nothing here is mandatory. v1 required no documents, and adding a requirement the client
 * never had would strand every migrated listing — but a reviewer approves faster when the
 * 7/12 and 8A are present, and the step says so.
 */
export default function StepDocuments({ propertyId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(Boolean(propertyId));
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!propertyId) return;
    try {
      const response = await get(`/properties/${propertyId}/documents`);
      setDocuments(response.data);
    } catch (cause) {
      setError(cause);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!propertyId) {
    return (
      <p className="lx-note">
        Finish the listing first and it will be saved as a draft. You can then attach the
        7/12, the 8A and anything else from your listings page.
      </p>
    );
  }

  const upload = async (category, file) => {
    if (!file) return;
    setBusy(category);
    setError(null);

    try {
      // Step one: reserve the row and ask for somewhere to put it.
      const session = await post(`/properties/${propertyId}/documents/upload-session`, {
        category,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });

      // Step two: the bytes go straight to storage, never through our server.
      const sent = await fetch(session.data.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!sent.ok) throw new Error("The upload did not go through. Please try again.");

      // Step three: confirm, with a checksum of what we actually sent. The server compares
      // it against what landed, so a truncated upload is caught rather than recorded.
      const checksum = await sha256(file);
      await post(`/documents/${session.data.documentId}/confirm`, {
        checksum,
        sizeBytes: file.size,
      });

      await load();
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(null);
    }
  };

  const remove = async (documentId) => {
    setBusy(documentId);
    try {
      await del(`/documents/${documentId}`);
      await load();
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <p className="lx-note">
        None of these are required. Listings that carry the 7/12 and the 8A are reviewed
        faster, and buyers take them more seriously. Only you and our review team can ever
        see them — they are never shown on the public listing.
      </p>

      {error ? <p className="lx-field__error">{error.message}</p> : null}
      {loading ? <p className="lx-note">Loading…</p> : null}

      <div className="lx-docs">
        {DOCUMENT_CATEGORIES.map((category) => {
          const held = documents.filter((document) => document.category === category);

          return (
            <div key={category} className="lx-docs__row">
              <div className="lx-docs__label">
                <strong>
                  {DOCUMENT_CATEGORY_LABEL[category]}
                  {DOCUMENTS_ENCOURAGED.includes(category) ? (
                    <span className="lx-tag">recommended</span>
                  ) : null}
                </strong>
                <small>{DOCUMENT_CATEGORY_HINT[category]}</small>
              </div>

              <div className="lx-docs__files">
                {held.map((document) => (
                  <div key={document.id} className="lx-docs__file">
                    <a
                      href={`/api/v1/documents/${document.id}/content`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {document.fileName}
                    </a>
                    <span className="lx-admin__meta">
                      {formatBytes(document.sizeBytes)}
                      {document.version > 1 ? ` · version ${document.version}` : ""}
                    </span>
                    <button
                      type="button"
                      className="lx-linkbutton"
                      disabled={busy === document.id}
                      onClick={() => remove(document.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <label className="tf-btn style-border pd-10 lx-docs__pick">
                  {busy === category
                    ? "Uploading…"
                    : held.length > 0
                      ? "Replace"
                      : "Choose a file"}
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/webp"
                    hidden
                    disabled={busy === category}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      // Cleared so choosing the same file twice still fires a change.
                      event.target.value = "";
                      if (file && file.size > MAX_DOCUMENT_BYTES) {
                        setError(new Error(`That file is larger than ${formatBytes(MAX_DOCUMENT_BYTES)}.`));
                        return;
                      }
                      upload(category, file);
                    }}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

/**
 * The checksum the server compares against what actually landed.
 *
 * `crypto.subtle` needs a secure context, which is every deployment and also localhost —
 * but not a plain-HTTP staging box. If it is unavailable the upload is refused rather than
 * confirmed unverified, because an unverified upload is the failure this whole flow exists
 * to prevent.
 */
async function sha256(file) {
  if (!globalThis.crypto?.subtle) {
    throw new Error("This browser cannot verify the upload. Please use HTTPS.");
  }
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
