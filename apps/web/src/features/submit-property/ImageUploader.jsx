import { useCallback, useEffect, useRef, useState } from "react";
import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGES_PER_PROPERTY,
  MAX_IMAGE_BYTES,
  formatBytes,
} from "@locatex/contracts";
import { del, get, post } from "../../services/locatexApi";

/**
 * Photographs for a listing.
 *
 * These go to the same Google Drive as the paperwork — one place for everything, which is
 * what the client asked for. The file travels from the phone straight to Drive; our server
 * issues the session and afterwards checks that what landed matches what was sent.
 *
 * The photographs a buyer sees are proxied back through the API, because Drive has no
 * public address we could hand out that would not also be guessable.
 */
export default function ImageUploader({ propertyId, draftId, onChange }) {
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(0);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  // A listing once it exists, the draft before that — the photographs follow the draft
  // into the listing when the wizard finishes, so nothing is uploaded twice.
  const base = propertyId
    ? `/properties/${propertyId}`
    : draftId
      ? `/property-drafts/${draftId}`
      : null;

  const load = useCallback(async () => {
    if (!base) return;
    try {
      const response = await get(`${base}/photos`);
      setPhotos(response.data);
      onChange?.(response.data.map((photo, index) => ({
        url: photo.url,
        alt: "",
        isPrimary: index === 0,
      })));
    } catch (cause) {
      setError(cause);
    }
    // Keyed on the listing alone. `onChange` is rebuilt on every render by the wizard,
    // so depending on it here would reload the photographs in a loop.
  }, [base]);

  useEffect(() => {
    load();
  }, [load]);

  if (!base) {
    return <p className="lx-note">Opening the photo library…</p>;
  }

  const room = MAX_IMAGES_PER_PROPERTY - photos.length;

  const upload = async (files) => {
    setError(null);
    const chosen = Array.from(files).slice(0, room);
    if (chosen.length === 0) return;

    const tooBig = chosen.find((file) => file.size > MAX_IMAGE_BYTES);
    if (tooBig) {
      setError(new Error(`“${tooBig.name}” is over ${formatBytes(MAX_IMAGE_BYTES)}.`));
      return;
    }

    setBusy(chosen.length);
    try {
      for (const file of chosen) {
        const session = await post(
          propertyId
            ? `${base}/documents/upload-session`
            : `${base}/photos/upload-session`,
          {
            ...(propertyId ? { category: "photo" } : {}),
            fileName: file.name,
            mimeType: file.type,
            sizeBytes: file.size,
          },
        );

        const sent = await fetch(session.data.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!sent.ok) throw new Error("That upload did not go through. Please try again.");

        await post(`/documents/${session.data.documentId}/confirm`, {
          checksum: await sha256(file),
          sizeBytes: file.size,
        });
        setBusy((count) => count - 1);
      }
      await load();
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = async (id) => {
    await del(`/documents/${id}`);
    await load();
  };

  return (
    <div className="lx-images">
      {error ? <p className="lx-field__error">{error.message}</p> : null}

      <div className="lx-images__grid">
        {photos.map((photo, index) => (
          <figure key={photo.id} className="lx-images__item">
            <img src={photo.url} alt={`Listing photograph ${index + 1}`} loading="lazy" />
            {index === 0 ? <span className="lx-images__badge">Main photo</span> : null}
            <button
              type="button"
              className="lx-images__remove"
              aria-label={`Remove photograph ${index + 1}`}
              onClick={() => remove(photo.id)}
            >
              ×
            </button>
          </figure>
        ))}

        {room > 0 ? (
          <label className="lx-images__add">
            <input
              ref={inputRef}
              type="file"
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              multiple
              hidden
              disabled={busy > 0}
              onChange={(event) => upload(event.target.files ?? [])}
            />
            <span>
              {busy > 0 ? `Uploading ${busy}…` : photos.length === 0 ? "Add photographs" : "Add more"}
            </span>
            <small>{room} left</small>
          </label>
        ) : null}
      </div>

      <p className="lx-note">
        The first photograph is what buyers see in search results. Wide shots of the land do
        better than close-ups — and a listing with no photograph is one nobody opens.
      </p>
    </div>
  );
}

/**
 * The checksum the server compares against what actually reached Drive.
 *
 * `crypto.subtle` needs a secure context — every real deployment and localhost, but not a
 * plain-HTTP staging box. Where it is missing the upload is refused rather than confirmed
 * unverified, because an unverified upload is exactly what this flow exists to catch.
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
