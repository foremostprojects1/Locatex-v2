import { useEffect, useRef, useState } from "react";

/**
 * React replacement for the jQuery "nice select" dropdown whose rendered
 * markup was baked into the static template. Behaviour and class names match
 * the original: the wrapper gets `open`, the chosen option gets `selected`
 * and the `.current` label mirrors the selection.
 */
export default function NiceSelect({
  className = "",
  options,
  defaultValue,
  name,
  onChange,
}) {
  const initial =
    options.find((option) => option.value === defaultValue) ?? options[0];
  const [selected, setSelected] = useState(initial);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocumentClick = (event) => {
      if (!ref.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener("click", onDocumentClick);
    return () => document.removeEventListener("click", onDocumentClick);
  }, [open]);

  const select = (option) => {
    setSelected(option);
    setOpen(false);
    onChange?.(option.value);
  };

  return (
    <div
      ref={ref}
      className={`nice-select${className ? ` ${className}` : ""}${open ? " open" : ""}`}
      tabIndex={0}
      role="listbox"
      aria-expanded={open}
      onClick={() => setOpen((value) => !value)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setOpen((value) => !value);
        } else if (event.key === "Escape") {
          setOpen(false);
        }
      }}
    >
      <span className="current">{selected?.label}</span>
      <ul className="list">
        {options.map((option) => (
          <li
            key={`${option.value}-${option.label}`}
            data-value={option.value}
            className={`option${option === selected ? " selected" : ""}`}
            role="option"
            aria-selected={option === selected}
            onClick={(event) => {
              event.stopPropagation();
              select(option);
            }}
          >
            {option.label}
          </li>
        ))}
      </ul>
      {name && (
        <input
          type="hidden"
          name={name}
          value={selected?.value ?? ""}
          readOnly
        />
      )}
    </div>
  );
}
