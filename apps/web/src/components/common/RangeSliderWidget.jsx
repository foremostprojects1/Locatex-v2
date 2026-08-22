import { useCallback, useEffect, useRef, useState } from "react";
import { formatNumber } from "../../utils/format";

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

/**
 * Two-handle range slider rendered with the class names the theme stylesheet
 * expects (`noUi-target`, `noUi-base`, `noUi-origin`, `noUi-handle`,
 * `noUi-connect`), so the visuals match the noUiSlider widget it replaces —
 * without pulling in the plugin or jQuery.
 */
function DualRangeSlider({ min, max, step = 1, values, onChange, labels }) {
  const trackRef = useRef(null);
  const draggingRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const valueFromEvent = useCallback(
    (clientX) => {
      const track = trackRef.current;
      if (!track) return min;
      const rect = track.getBoundingClientRect();
      const ratio = rect.width
        ? clamp((clientX - rect.left) / rect.width, 0, 1)
        : 0;
      return clamp(
        Math.round((min + ratio * (max - min)) / step) * step,
        min,
        max,
      );
    },
    [min, max, step],
  );

  useEffect(() => {
    if (!dragging) return undefined;

    const onMove = (event) => {
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      const value = valueFromEvent(clientX);
      const handle = draggingRef.current;
      onChange(
        handle === 0
          ? [Math.min(value, values[1]), values[1]]
          : [values[0], Math.max(value, values[0])],
      );
    };
    const onUp = () => {
      draggingRef.current = null;
      setDragging(false);
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    document.addEventListener("touchmove", onMove, { passive: true });
    document.addEventListener("touchend", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.removeEventListener("touchmove", onMove);
      document.removeEventListener("touchend", onUp);
    };
  }, [dragging, onChange, values, valueFromEvent]);

  const startDrag = (index) => (event) => {
    event.preventDefault();
    draggingRef.current = index;
    setDragging(true);
  };

  const onKeyDown = (index) => (event) => {
    const delta = {
      ArrowLeft: -step,
      ArrowDown: -step,
      ArrowRight: step,
      ArrowUp: step,
    }[event.key];
    if (delta === undefined) return;
    event.preventDefault();
    const next = clamp(values[index] + delta, min, max);
    onChange(
      index === 0
        ? [Math.min(next, values[1]), values[1]]
        : [values[0], Math.max(next, values[0])],
    );
  };

  const percent = (value) => ((value - min) / (max - min)) * 100;

  return (
    <div
      ref={trackRef}
      className={`noUi-target noUi-ltr noUi-horizontal noUi-background${dragging ? " noUi-state-drag" : ""}`}
    >
      <div className="noUi-base">
        <div
          className="noUi-connect"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: `${percent(values[0])}%`,
            right: `${100 - percent(values[1])}%`,
          }}
        />
        {values.map((value, index) => (
          <div
            key={index}
            className="noUi-origin"
            style={{ left: `${percent(value)}%`, right: "auto", width: 0 }}
          >
            <div
              className="noUi-handle"
              role="slider"
              tabIndex={0}
              aria-label={labels?.[index]}
              aria-valuemin={index === 0 ? min : values[0]}
              aria-valuemax={index === 0 ? values[1] : max}
              aria-valuenow={value}
              onMouseDown={startDrag(index)}
              onTouchStart={startDrag(index)}
              onKeyDown={onKeyDown(index)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Price/size filter used by the search forms: the caption, the slider and the
 * hidden inputs that carry the selected range when the form is submitted.
 */
export default function RangeSliderWidget({
  title,
  min,
  max,
  start,
  step = 1,
  format = {},
  valueClassName = "fw-6",
  inputNames = [],
  className = "widget-price",
}) {
  const [values, setValues] = useState(start);

  return (
    <div className={className}>
      <div className="box-title-price">
        <span className="title-price fw-6">{title}</span>
        <div className="caption-price">
          <span className={valueClassName}>
            {formatNumber(values[0], format)}
          </span>
          <span>-</span>
          <span className={valueClassName}>
            {formatNumber(values[1], format)}
          </span>
        </div>
      </div>
      <DualRangeSlider
        min={min}
        max={max}
        step={step}
        values={values}
        onChange={setValues}
        labels={[`${title} minimum`, `${title} maximum`]}
      />
      <div className="slider-labels">
        <div>
          {inputNames[0] && (
            <input
              type="hidden"
              name={inputNames[0]}
              value={Math.round(values[0])}
              readOnly
            />
          )}
          {inputNames[1] && (
            <input
              type="hidden"
              name={inputNames[1]}
              value={Math.round(values[1])}
              readOnly
            />
          )}
        </div>
      </div>
    </div>
  );
}
