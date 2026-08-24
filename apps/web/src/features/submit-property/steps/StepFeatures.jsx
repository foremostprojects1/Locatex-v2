import { useLandAttributes } from "../../../hooks/useReference";
import { CheckboxGrid, Field, TextInput } from "../Field";

/**
 * What the land has, and what it does not.
 *
 * Both lists come from the API rather than from a constant here, so an administrator can
 * add "drip irrigation" next season without a deployment — and so a listing migrated from
 * v1 keeps meaning what it meant, since every one of v1's nine attributes is in that list
 * with its original value recorded alongside.
 */
export default function StepFeatures({ data, setField, errorFor }) {
  const { amenities, disadvantages, loading } = useLandAttributes();

  const toggle = (field) => (slug) => {
    const current = data[field] ?? [];
    setField(
      field,
      current.includes(slug) ? current.filter((value) => value !== slug) : [...current, slug],
    );
  };

  const images = data.images ?? [];

  return (
    <>
      <h6 className="lx-section-title">What the land has</h6>
      {loading ? (
        <p className="lx-note">Loading…</p>
      ) : (
        <CheckboxGrid
          items={amenities}
          selected={data.amenities ?? []}
          onToggle={toggle("amenities")}
        />
      )}

      <h6 className="lx-section-title">Things a buyer should know</h6>
      <p className="lx-note">
        Declaring these up front saves a wasted site visit, and administrators approve honest
        listings faster.
      </p>
      {loading ? null : (
        <CheckboxGrid
          items={disadvantages}
          selected={data.disadvantages ?? []}
          onToggle={toggle("disadvantages")}
        />
      )}

      <h6 className="lx-section-title">Photographs</h6>
      <p className="lx-note">
        Paste image links for now — uploading from your phone arrives with the document
        upload in the next release.
      </p>

      {images.map((image, index) => (
        <div className="box grid-2 gap-30" key={`${image.url}-${index}`}>
          <Field label={`Photo ${index + 1}`} error={errorFor(`images.${index}.url`)}>
            <TextInput
              value={image.url}
              onChange={(value) =>
                setField(
                  "images",
                  images.map((entry, position) =>
                    position === index ? { ...entry, url: value } : entry,
                  ),
                )
              }
              placeholder="https://…"
            />
          </Field>
          <Field label="Caption">
            <TextInput
              value={image.alt}
              onChange={(value) =>
                setField(
                  "images",
                  images.map((entry, position) =>
                    position === index ? { ...entry, alt: value } : entry,
                  ),
                )
              }
              placeholder="Looking north from the road"
            />
          </Field>
        </div>
      ))}

      <button
        type="button"
        className="tf-btn style-border pd-10"
        onClick={() => setField("images", [...images, { url: "", alt: "", isPrimary: images.length === 0 }])}
      >
        Add a photo
      </button>
    </>
  );
}
