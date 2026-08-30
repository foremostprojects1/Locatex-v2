import { useRef, useState } from "react";
import { post } from "../../services/locatexApi";

const MAX_BYTES = 10 * 1024 * 1024;
const MAX_IMAGES = 20;

/**
 * Photographs for a listing.
 *
 * The file goes straight from the phone to Cloudinary — our server only signs the request.
 * A broker standing in a field uploading eight photographs never occupies a connection to
 * our process, and a 4 MB photo does not travel twice.
 *
 * The URL we keep back carries transformation instructions rather than pointing at the
 * original, so a buyer on mobile data downloads roughly 120 KB instead of 4 MB. That is the
 * difference between a listing page that loads and one people give up on.
 */
export default function ImageUploader({ images, onChange, propertyId }) {
  const [uploading, setUploading] = useState(0);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  const room = MAX_IMAGES - images.length;

  const pick = async (files) => {
    setError(null);
    const chosen = Array.from(files).slice(0, room);
    if (chosen.length === 0) return;

    const tooBig = chosen.find((file) => file.size > MAX_BYTES);
    if (tooBig) {
      setError(`“${tooBig.name}” is larger than 10 MB. Photographs from a phone are usually well under.`);
      return;
    }

    setUploading(chosen.length);
    try {
      // One signature covers this batch — it is valid for about an hour.
      const { data: signature } = await post("/documents/images/signature", { propertyId });

      const uploaded = [];
      for (const file of chosen) {
        const form = new FormData();
        form.append("file", file);
        form.append("api_key", signature.apiKey);
        form.append("timestamp", String(signature.timestamp));
        form.append("signature", signature.signature);
        form.append("folder", signature.folder);

        const response = await fetch(signature.uploadUrl, { method: "POST", body: form });
        if (!response.ok) {
          throw new Error("Cloudinary refused that upload. Please try again.");
        }

        const result = await response.json();
        uploaded.push({
          // Sized on delivery rather than stored at full resolution.
          url: `https://res.cloudinary.com/${signature.cloudName}/image/upload/f_auto,q_auto,w_1600,c_limit/${result.public_id}`,
          alt: "",
          isPrimary: images.length === 0 && uploaded.length === 0,
        });
        setUploading((count) => count - 1);
      }

      onChange([...images, ...uploaded]);
    } catch (cause) {
      setError(cause.message);
    } finally {
      setUploading(0);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = (index) =>
    onChange(
      images
        .filter((_, position) => position !== index)
        // If the primary was removed, the first remaining photograph becomes it — a
        // listing with no primary renders a blank card.
        .map((image, position) => ({ ...image, isPrimary: position === 0 })),
    );

  const makePrimary = (index) =>
    onChange(images.map((image, position) => ({ ...image, isPrimary: position === index })));

  return (
    <div className="lx-images">
      {error ? <p className="lx-field__error">{error}</p> : null}

      <div className="lx-images__grid">
        {images.map((image, index) => (
          <figure key={`${image.url}-${index}`} className="lx-images__item">
            <img src={image.url} alt={image.alt || "Listing photograph"} loading="lazy" />

            {image.isPrimary ? (
              <span className="lx-images__badge">Main photo</span>
            ) : (
              <button
                type="button"
                className="lx-images__make-primary"
                onClick={() => makePrimary(index)}
              >
                Make main
              </button>
            )}

            <button
              type="button"
              className="lx-images__remove"
              aria-label={`Remove photograph ${index + 1}`}
              onClick={() => remove(index)}
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
              accept="image/jpeg,image/png,image/webp"
              multiple
              hidden
              disabled={uploading > 0}
              onChange={(event) => pick(event.target.files ?? [])}
            />
            <span>
              {uploading > 0
                ? `Uploading ${uploading}…`
                : images.length === 0
                  ? "Add photographs"
                  : "Add more"}
            </span>
            <small>{room} left</small>
          </label>
        ) : null}
      </div>

      <p className="lx-note">
        The first photograph is what buyers see in search results. Wide shots of the land
        itself do better than close-ups — and a listing with no photograph is one nobody
        opens.
      </p>
    </div>
  );
}
