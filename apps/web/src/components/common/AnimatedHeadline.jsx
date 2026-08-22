import { useEffect, useRef, useState } from "react";

const ANIMATION_DELAY = 2500;
const REVEAL_DURATION = 600;

/**
 * Rotating headline of the hero sections, replacing `animation_heading.js`.
 *
 * `slide` fades each word in from the top; `clip` collapses the wrapper to a
 * sliver before revealing the next word. In both cases the wrapper width is
 * driven by the words themselves, as in the original script.
 */
export default function AnimatedHeadline({
  words,
  type = "slide",
  className = "tf-text s1",
}) {
  const [index, setIndex] = useState(0);
  const [previous, setPrevious] = useState(null);
  const [width, setWidth] = useState(null);
  const wordRefs = useRef([]);

  const measure = (position) =>
    wordRefs.current[position]?.getBoundingClientRect().width ?? 0;

  // `slide` sizes the wrapper once, to the longest word.
  useEffect(() => {
    if (type !== "slide") return;
    setWidth(Math.max(...words.map((_, position) => measure(position))));
  }, [type, words]);

  useEffect(() => {
    if (type !== "clip") return undefined;
    setWidth(measure(index) + 10);
    return undefined;
  }, [type, index]);

  useEffect(() => {
    const next = (index + 1) % words.length;

    if (type === "clip") {
      const collapse = setTimeout(() => {
        setWidth(2);
        const advance = setTimeout(() => {
          setPrevious(index);
          setIndex(next);
        }, REVEAL_DURATION);
        return () => clearTimeout(advance);
      }, ANIMATION_DELAY);
      return () => clearTimeout(collapse);
    }

    const timer = setTimeout(() => {
      setPrevious(index);
      setIndex(next);
    }, ANIMATION_DELAY);
    return () => clearTimeout(timer);
  }, [index, words.length, type]);

  return (
    <span
      className={`${className} cd-words-wrapper`}
      style={{
        width: width === null ? undefined : `${width}px`,
        ...(type === "clip"
          ? { transition: `width ${REVEAL_DURATION}ms` }
          : {}),
      }}
    >
      {words.map((word, position) => (
        <span
          key={word}
          ref={(node) => {
            wordRefs.current[position] = node;
          }}
          className={`item-text${position === index ? " is-visible" : position === previous ? " is-hidden" : ""}`}
        >
          {word}
        </span>
      ))}
    </span>
  );
}
