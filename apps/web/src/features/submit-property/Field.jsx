/**
 * The form controls, in the template's own markup so the wizard looks like the rest of the
 * dashboard rather than like a form bolted onto it.
 */
export function Field({ label, required, error, hint, children }) {
  return (
    <fieldset className="box box-fieldset">
      {label ? (
        <label>
          {label}
          {required ? <span>*</span> : null}
        </label>
      ) : null}
      {children}
      {hint && !error ? <small className="lx-field__hint">{hint}</small> : null}
      {error ? <small className="lx-field__error">{error}</small> : null}
    </fieldset>
  );
}

export function TextInput({ value, onChange, ...rest }) {
  return (
    <input
      type="text"
      className="form-control"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      {...rest}
    />
  );
}

export function NumberInput({ value, onChange, ...rest }) {
  return (
    <input
      type="number"
      inputMode="decimal"
      className="form-control"
      value={value ?? ""}
      onChange={(event) => {
        const raw = event.target.value;
        onChange(raw === "" ? undefined : Number(raw));
      }}
      {...rest}
    />
  );
}

export function TextArea({ value, onChange, ...rest }) {
  return (
    <textarea
      className="textarea"
      value={value ?? ""}
      onChange={(event) => onChange(event.target.value)}
      {...rest}
    />
  );
}

/**
 * A plain `<select>`, not the template's scripted dropdown: these lists run to hundreds of
 * villages, and a phone's native picker searches and scrolls them far better than a styled
 * div ever will.
 */
export function Select({ value, onChange, options, placeholder = "Choose", disabled }) {
  return (
    <select
      className="form-control"
      value={value ?? ""}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value || undefined)}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

/** Amenities and disadvantages: many small toggles, grouped the way the API groups them. */
export function CheckboxGrid({ items, selected, onToggle }) {
  const groups = items.reduce((accumulator, item) => {
    (accumulator[item.group] ??= []).push(item);
    return accumulator;
  }, {});

  return (
    <div className="lx-checkgrid">
      {Object.entries(groups).map(([group, groupItems]) => (
        <div key={group} className="lx-checkgrid__group">
          <h6 className="lx-checkgrid__title">{group}</h6>
          <div className="lx-checkgrid__items">
            {groupItems.map((item) => (
              <label key={item.slug} className="lx-checkgrid__item">
                <input
                  type="checkbox"
                  checked={selected.includes(item.slug)}
                  onChange={() => onToggle(item.slug)}
                />
                <span>{item.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
