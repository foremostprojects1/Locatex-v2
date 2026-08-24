import { LISTING_TYPES, PROPERTY_TYPES } from "@locatex/contracts";
import { Field, Select, TextArea, TextInput } from "../Field";

const label = (value) => value.charAt(0).toUpperCase() + value.slice(1);

export default function StepBasics({ data, setField, errorFor }) {
  return (
    <>
      <Field
        label="Listing title"
        required
        error={errorFor("title")}
        hint="What a buyer sees first — say what it is and roughly where."
      >
        <TextInput
          value={data.title}
          onChange={(value) => setField("title", value)}
          placeholder="e.g. Fertile farmland with borewell near Morbi"
          maxLength={100}
        />
      </Field>

      <Field label="Description" error={errorFor("description")}>
        <TextArea
          value={data.description}
          onChange={(value) => setField("description", value)}
          placeholder="Soil, water, road access, what is growing on it now."
          maxLength={2000}
        />
      </Field>

      <div className="box grid-3 gap-30">
        <Field label="Property type" required error={errorFor("propertyType")}>
          <Select
            value={data.propertyType}
            onChange={(value) => setField("propertyType", value)}
            options={PROPERTY_TYPES.map((type) => ({ value: type, label: label(type) }))}
          />
        </Field>

        <Field label="Listing for" required error={errorFor("listingType")}>
          <Select
            value={data.listingType}
            onChange={(value) => setField("listingType", value)}
            options={LISTING_TYPES.map((type) => ({
              value: type,
              label: type === "sale" ? "Sale" : "Rent",
            }))}
          />
        </Field>

        <Field label="Listed by" error={errorFor("insertedBy")}>
          <Select
            value={data.insertedBy ?? "broker"}
            onChange={(value) => setField("insertedBy", value)}
            options={[
              { value: "broker", label: "Me, as the broker" },
              { value: "owner", label: "The owner" },
            ]}
          />
        </Field>
      </div>
    </>
  );
}
