import { useEffect, useMemo } from "react";
import { APPROX_RADIUS_M } from "@locatex/contracts";
import MapPicker from "../../../components/forms/MapPicker";
import { useDistricts, usePincode, useTalukas, useVillages } from "../../../hooks/useReference";
import { Field, Select, TextInput } from "../Field";

/**
 * Where the land is, and how precisely we are allowed to say so.
 *
 * Two things happen here that the rest of the form does not do. Choosing a district clears
 * the taluka and village below it, because a stale taluka from another district is exactly
 * the kind of value that passes a form and fails at submit. And typing a pincode moves the
 * map to that pincode, so the broker starts near their land rather than in the Arabian Sea.
 */
export default function StepLocation({ data, setField, errorFor }) {
  const location = data.location ?? {};
  const { districts } = useDistricts();
  const { talukas } = useTalukas(location.district);
  const { villages } = useVillages(location.district, location.taluka);
  const { pincode: pincodeInfo } = usePincode(location.pincode);

  const centre = useMemo(() => {
    const point = pincodeInfo?.location;
    return point ? [point.lat, point.lng] : null;
  }, [pincodeInfo]);

  // India Post's district names are years out of date; report the disagreement, never act on it.
  const postalWarning =
    pincodeInfo?.postal?.disagreesWithOurDistrict && location.district
      ? `India Post still files ${location.pincode} under ${pincodeInfo.postal.district}. That is their record being out of date — your choice is kept.`
      : null;

  // A pincode we know belongs to exactly one district and taluka; offer to fill them in.
  useEffect(() => {
    if (!pincodeInfo || location.district) return;
    setField("location.district", pincodeInfo.district);
    setField("location.taluka", pincodeInfo.taluka);
  }, [pincodeInfo, location.district, setField]);

  const precision = location.precision ?? "approx";
  const radius = precision === "exact" ? null : (pincodeInfo?.location?.radiusMetres ?? APPROX_RADIUS_M.pincode);

  return (
    <>
      <div className="box grid-2 gap-30">
        <Field label="Pincode" required error={errorFor("location.pincode")}>
          <TextInput
            value={location.pincode}
            onChange={(value) => setField("location.pincode", value.replace(/\D/g, "").slice(0, 6))}
            placeholder="363641"
            inputMode="numeric"
          />
        </Field>

        <Field label="District" required error={errorFor("location.district")}>
          <Select
            value={location.district}
            onChange={(value) => {
              setField("location.district", value);
              setField("location.taluka", undefined);
              setField("location.village", undefined);
            }}
            options={districts.map((district) => ({
              value: district.slug,
              label: district.name,
            }))}
          />
        </Field>
      </div>

      <div className="box grid-2 gap-30">
        <Field label="Taluka" required error={errorFor("location.taluka")}>
          <Select
            value={location.taluka}
            disabled={!location.district}
            placeholder={location.district ? "Choose" : "Choose a district first"}
            onChange={(value) => {
              setField("location.taluka", value);
              setField("location.village", undefined);
            }}
            options={talukas.map((taluka) => ({ value: taluka.slug, label: taluka.name }))}
          />
        </Field>

        <Field label="Village" error={errorFor("location.village")}>
          <Select
            value={location.village}
            disabled={!location.taluka}
            placeholder={location.taluka ? "Choose" : "Choose a taluka first"}
            onChange={(value) => setField("location.village", value)}
            options={villages.map((village) => ({ value: village.slug, label: village.name }))}
          />
        </Field>
      </div>

      {postalWarning ? <p className="lx-note">{postalWarning}</p> : null}

      <Field
        label="Address or landmark"
        error={errorFor("location.address")}
        hint="Only signed-in buyers ever see this. It is never shown to visitors."
      >
        <TextInput
          value={location.address}
          onChange={(value) => setField("location.address", value)}
          placeholder="Survey 85/2, off the Sanala road"
        />
      </Field>

      <Field label="How precisely should the map show it?" required>
        <div className="lx-choice">
          <label className={precision === "approx" ? "lx-choice__option is-active" : "lx-choice__option"}>
            <input
              type="radio"
              name="precision"
              checked={precision === "approx"}
              onChange={() => {
                setField("location.precision", "approx");
                setField("location.source", "pincode");
              }}
            />
            <strong>Approximate</strong>
            <span>A circle around the pincode. Nobody can find the plot from the map.</span>
          </label>

          <label className={precision === "exact" ? "lx-choice__option is-active" : "lx-choice__option"}>
            <input
              type="radio"
              name="precision"
              checked={precision === "exact"}
              onChange={() => {
                setField("location.precision", "exact");
                setField("location.source", "pin");
              }}
            />
            <strong>Exact pin</strong>
            <span>
              Signed-in buyers see the precise point. Visitors still only ever see a circle.
            </span>
          </label>
        </div>
      </Field>

      {precision === "exact" ? (
        <Field label="Drop the pin" required error={errorFor("location.lat")}>
          <MapPicker
            value={location.lat != null && location.lng != null ? { lat: location.lat, lng: location.lng } : null}
            centre={centre}
            onChange={(point) => {
              setField("location.lat", point.lat);
              setField("location.lng", point.lng);
            }}
          />
        </Field>
      ) : (
        <Field label="Roughly here">
          <MapPicker
            value={centre ? { lat: centre[0], lng: centre[1] } : null}
            centre={centre}
            radiusMetres={radius}
            disabled
          />
          <small className="lx-field__hint">
            {location.pincode
              ? "This is the circle a visitor will see. The exact plot stays private."
              : "Enter a pincode and we will place the circle for you."}
          </small>
        </Field>
      )}
    </>
  );
}
