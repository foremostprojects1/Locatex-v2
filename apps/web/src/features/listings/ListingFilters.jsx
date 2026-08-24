import { AREA_UNITS, LISTING_TYPES, PROPERTY_SORTS, PROPERTY_TYPES } from "@locatex/contracts";
import { useDistricts, useTalukas } from "../../hooks/useReference";

const SORT_LABEL = {
  newest: "Newest first",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "area-desc": "Largest first",
};

const label = (value) => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * The filter rail.
 *
 * Prices are typed in lakhs rather than rupees, because that is how land is discussed here
 * and because a buyer typing 7200000 into a box is a buyer who will mistype a zero. The
 * conversion to paise happens once, on the way out.
 */
export default function ListingFilters({ value, onChange }) {
  const { districts } = useDistricts();
  const { talukas } = useTalukas(value.district);

  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <aside className="lx-filters">
      <div className="lx-filters__group">
        <label htmlFor="filter-q">Search</label>
        <input
          id="filter-q"
          type="search"
          className="form-control"
          placeholder="Village, landmark, keyword"
          value={value.q ?? ""}
          onChange={(event) => set({ q: event.target.value || undefined })}
        />
      </div>

      <div className="lx-filters__group">
        <label htmlFor="filter-district">District</label>
        <select
          id="filter-district"
          className="form-control"
          value={value.district ?? ""}
          onChange={(event) =>
            // Clearing the district has to clear the taluka under it, or the search keeps
            // a taluka that no longer belongs to anything selected.
            set({ district: event.target.value || undefined, taluka: undefined })
          }
        >
          <option value="">Anywhere in Gujarat</option>
          {districts.map((district) => (
            <option key={district.slug} value={district.slug}>
              {district.name}
            </option>
          ))}
        </select>
      </div>

      <div className="lx-filters__group">
        <label htmlFor="filter-taluka">Taluka</label>
        <select
          id="filter-taluka"
          className="form-control"
          disabled={!value.district}
          value={value.taluka ?? ""}
          onChange={(event) => set({ taluka: event.target.value || undefined })}
        >
          <option value="">{value.district ? "Any taluka" : "Choose a district first"}</option>
          {talukas.map((taluka) => (
            <option key={taluka.slug} value={taluka.slug}>
              {taluka.name}
            </option>
          ))}
        </select>
      </div>

      <div className="lx-filters__group">
        <label htmlFor="filter-type">Property type</label>
        <select
          id="filter-type"
          className="form-control"
          value={value.propertyType ?? ""}
          onChange={(event) => set({ propertyType: event.target.value || undefined })}
        >
          <option value="">Any type</option>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {label(type)}
            </option>
          ))}
        </select>
      </div>

      <div className="lx-filters__group">
        <label htmlFor="filter-listing">For</label>
        <select
          id="filter-listing"
          className="form-control"
          value={value.listingType ?? ""}
          onChange={(event) => set({ listingType: event.target.value || undefined })}
        >
          <option value="">Sale or rent</option>
          {LISTING_TYPES.map((type) => (
            <option key={type} value={type}>
              {type === "sale" ? "Sale" : "Rent"}
            </option>
          ))}
        </select>
      </div>

      <div className="lx-filters__group">
        <span className="lx-filters__legend">Price (₹ lakh)</span>
        <div className="lx-filters__pair">
          <input
            type="number"
            className="form-control"
            placeholder="Min"
            min="0"
            value={toLakh(value.priceMinPaise)}
            onChange={(event) => set({ priceMinPaise: fromLakh(event.target.value) })}
            aria-label="Minimum price in lakhs"
          />
          <input
            type="number"
            className="form-control"
            placeholder="Max"
            min="0"
            value={toLakh(value.priceMaxPaise)}
            onChange={(event) => set({ priceMaxPaise: fromLakh(event.target.value) })}
            aria-label="Maximum price in lakhs"
          />
        </div>
      </div>

      <div className="lx-filters__group">
        <span className="lx-filters__legend">Area</span>
        <div className="lx-filters__pair">
          <input
            type="number"
            className="form-control"
            placeholder="Min"
            min="0"
            value={value.areaMin ?? ""}
            onChange={(event) => set({ areaMin: event.target.value || undefined })}
            aria-label="Minimum area"
          />
          <select
            className="form-control"
            value={value.areaUnit ?? "vigha"}
            onChange={(event) => set({ areaUnit: event.target.value })}
            aria-label="Area unit"
          >
            {AREA_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="lx-filters__group">
        <label htmlFor="filter-sort">Order</label>
        <select
          id="filter-sort"
          className="form-control"
          value={value.sort ?? "newest"}
          onChange={(event) => set({ sort: event.target.value })}
        >
          {PROPERTY_SORTS.map((sort) => (
            <option key={sort} value={sort}>
              {SORT_LABEL[sort]}
            </option>
          ))}
        </select>
      </div>

      <button
        type="button"
        className="tf-btn style-border pd-10 w-100"
        onClick={() => onChange({ sort: value.sort ?? "newest" })}
      >
        Clear filters
      </button>
    </aside>
  );
}

const toLakh = (paise) => (paise == null || paise === "" ? "" : Number(paise) / 100 / 100_000);
const fromLakh = (lakh) => (lakh === "" ? undefined : Math.round(Number(lakh) * 100_000 * 100));
