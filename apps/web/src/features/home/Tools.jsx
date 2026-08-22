import { useMemo, useState } from "react";
import { SectionHeader } from "./HomeSections";

/**
 * The two calculators from the requirements brief. Both are pure client-side maths and
 * are reused on the property detail page, so they live as standalone components.
 */

// Canonical unit is the square foot. Gujarat conventions:
// 1 acre = 43,560 sqft = 40 guntha; 1 vigha = 17,424 sqft = 16 guntha; 1 gaj = 9 sqft.
const UNITS = [
  { value: "vigha", label: "Vigha", sqft: 17424 },
  { value: "guntha", label: "Guntha", sqft: 1089 },
  { value: "gaj", label: "Gaj (sq. yard)", sqft: 9 },
  { value: "sqft", label: "Square feet", sqft: 1 },
  { value: "acre", label: "Acre", sqft: 43560 },
];

const format = (value) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value);

export function AreaConverter() {
  const [amount, setAmount] = useState("1");
  const [unit, setUnit] = useState("vigha");

  const results = useMemo(() => {
    const from = UNITS.find((u) => u.value === unit);
    const sqft = (Number(amount) || 0) * from.sqft;
    return UNITS.filter((u) => u.value !== unit).map((u) => ({
      label: u.label,
      value: sqft / u.sqft,
    }));
  }, [amount, unit]);

  return (
    <div className="p-4 bg-white radius-15 h-100">
      <h6 className="mb-1">Gujarat area converter</h6>
      <p className="text-variant-1 body-3 mb-3">
        Vigha, Guntha, Gaj, square feet and acre.
      </p>

      <div className="d-flex gap-2 mb-3">
        <input
          type="number"
          min="0"
          className="form-control"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          aria-label="Area to convert"
        />
        <select
          className="form-control"
          value={unit}
          onChange={(event) => setUnit(event.target.value)}
          aria-label="Unit"
        >
          {UNITS.map((u) => (
            <option key={u.value} value={u.value}>
              {u.label}
            </option>
          ))}
        </select>
      </div>

      <ul className="list-unstyled mb-0">
        {results.map((result) => (
          <li
            className="d-flex justify-content-between py-2 border-bottom"
            key={result.label}
          >
            <span className="text-variant-1 body-3">{result.label}</span>
            <span className="fw-6">{format(result.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EmiCalculator() {
  const [amount, setAmount] = useState(2500000);
  const [rate, setRate] = useState(9);
  const [years, setYears] = useState(15);

  const { emi, total, interest } = useMemo(() => {
    const months = years * 12;
    const monthlyRate = rate / 12 / 100;
    const value =
      monthlyRate === 0
        ? amount / months
        : (amount * monthlyRate * (1 + monthlyRate) ** months) /
          ((1 + monthlyRate) ** months - 1);
    const totalPayable = value * months;
    return { emi: value, total: totalPayable, interest: totalPayable - amount };
  }, [amount, rate, years]);

  const rupees = (value) =>
    `₹${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Math.round(value))}`;

  return (
    <div className="p-4 bg-white radius-15 h-100">
      <h6 className="mb-1">Loan EMI calculator</h6>
      <p className="text-variant-1 body-3 mb-3">
        Estimate the monthly instalment on a land loan.
      </p>

      <label className="body-3 text-variant-1 d-flex justify-content-between">
        Loan amount <span className="fw-6 text-black">{rupees(amount)}</span>
      </label>
      <input
        type="range"
        min="100000"
        max="20000000"
        step="100000"
        value={amount}
        onChange={(event) => setAmount(Number(event.target.value))}
        className="w-100 mb-3"
        aria-label="Loan amount"
      />

      <label className="body-3 text-variant-1 d-flex justify-content-between">
        Interest rate <span className="fw-6 text-black">{rate}%</span>
      </label>
      <input
        type="range"
        min="5"
        max="18"
        step="0.1"
        value={rate}
        onChange={(event) => setRate(Number(event.target.value))}
        className="w-100 mb-3"
        aria-label="Interest rate"
      />

      <label className="body-3 text-variant-1 d-flex justify-content-between">
        Tenure <span className="fw-6 text-black">{years} years</span>
      </label>
      <input
        type="range"
        min="1"
        max="30"
        step="1"
        value={years}
        onChange={(event) => setYears(Number(event.target.value))}
        className="w-100 mb-3"
        aria-label="Tenure in years"
      />

      <div className="d-flex justify-content-between py-2 border-top">
        <span className="text-variant-1 body-3">Monthly EMI</span>
        <span className="fw-8 text-primary">{rupees(emi)}</span>
      </div>
      <div className="d-flex justify-content-between py-2">
        <span className="text-variant-1 body-3">Total interest</span>
        <span className="fw-6">{rupees(interest)}</span>
      </div>
      <div className="d-flex justify-content-between">
        <span className="text-variant-1 body-3">Total payable</span>
        <span className="fw-6">{rupees(total)}</span>
      </div>
    </div>
  );
}

export default function ToolsSection() {
  return (
    <section className="flat-section bg-surface" id="tools">
      <div className="container">
        <SectionHeader
          eyebrow="Free tools"
          title="Work out the area and the instalment"
          text="Two things every land buyer in Gujarat does on paper — now on the page."
        />
        <div className="row g-4 mt-3">
          <div className="col-lg-6">
            <AreaConverter />
          </div>
          <div className="col-lg-6">
            <EmiCalculator />
          </div>
        </div>
      </div>
    </section>
  );
}
