import { AREA_UNITS, AREA_UNIT_LABEL, PRICE_UNITS, convertArea, formatIndianShort } from "@locatex/contracts";
import { Field, NumberInput, Select, TextInput } from "../Field";

const PRICE_UNIT_LABEL = {
  total: "Total price",
  per_vigha: "Per vigha",
  per_acre: "Per acre",
  per_sqft: "Per sq. ft.",
};

/**
 * Size and price.
 *
 * Prices are typed in rupees and stored in paise: money is an integer everywhere in the
 * system, and a price that has been through a floating-point rupee at any stage is a price
 * that can be out by one.
 */
export default function StepDetails({ data, setField, errorFor }) {
  const area = data.area ?? {};
  const rupees = data.pricePaise == null ? undefined : data.pricePaise / 100;

  const conversions =
    area.value && area.unit
      ? AREA_UNITS.filter((unit) => unit !== area.unit).map((unit) => ({
          unit,
          value: convertArea(area.value, area.unit, unit),
        }))
      : [];

  return (
    <>
      <div className="box grid-2 gap-30">
        <Field label="Area" required error={errorFor("area.value")}>
          <NumberInput
            value={area.value}
            onChange={(value) => setField("area.value", value)}
            min={0}
            step="any"
            placeholder="4"
          />
        </Field>

        <Field label="Measured in" required error={errorFor("area.unit")}>
          <Select
            value={area.unit}
            onChange={(value) => setField("area.unit", value)}
            options={AREA_UNITS.map((unit) => ({ value: unit, label: AREA_UNIT_LABEL[unit] }))}
          />
        </Field>
      </div>

      {conversions.length > 0 ? (
        <p className="lx-note">
          That is{" "}
          {conversions
            .map(({ unit, value }) => `${value.toLocaleString("en-IN", { maximumFractionDigits: 2 })} ${unit}`)
            .join(" · ")}
          . Buyers searching in any of these units will find it.
        </p>
      ) : null}

      <div className="box grid-2 gap-30">
        <Field
          label="Asking price (₹)"
          required
          error={errorFor("pricePaise")}
          hint={rupees ? formatIndianShort(data.pricePaise) : undefined}
        >
          <NumberInput
            value={rupees}
            onChange={(value) => setField("pricePaise", value == null ? undefined : Math.round(value * 100))}
            min={0}
            step="1"
            placeholder="7200000"
          />
        </Field>

        <Field label="Quoted as" error={errorFor("priceUnit")}>
          <Select
            value={data.priceUnit ?? "total"}
            onChange={(value) => setField("priceUnit", value)}
            options={PRICE_UNITS.map((unit) => ({ value: unit, label: PRICE_UNIT_LABEL[unit] }))}
          />
        </Field>
      </div>

      <p className="lx-note">
        Visitors who are not signed in never see this figure — only a wide price band. Signed-in
        buyers see it exactly as you typed it.
      </p>

      <h6 className="lx-section-title">Government record</h6>
      <div className="box grid-3 gap-30">
        <Field label="Khaata number" error={errorFor("govDetails.khaataNumber")}>
          <TextInput
            value={data.govDetails?.khaataNumber}
            onChange={(value) => setField("govDetails.khaataNumber", value)}
            placeholder="412"
          />
        </Field>

        <Field label="Survey number" error={errorFor("govDetails.surveyNumber")}>
          <TextInput
            value={data.govDetails?.surveyNumber}
            onChange={(value) => setField("govDetails.surveyNumber", value)}
            placeholder="85/2"
          />
        </Field>

        <Field
          label="Area as recorded"
          error={errorFor("govDetails.areaText")}
          hint="Exactly as written — હે. આરે. ચો.મી."
        >
          <TextInput
            value={data.govDetails?.areaText}
            onChange={(value) => setField("govDetails.areaText", value)}
            placeholder="૦-૬૪-૭૫"
          />
        </Field>
      </div>
    </>
  );
}
