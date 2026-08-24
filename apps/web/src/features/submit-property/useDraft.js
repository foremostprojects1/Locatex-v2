import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { completedSteps, isDraftComplete, validateStep } from "@locatex/contracts";
import { del, get, post, put } from "../../services/locatexApi";

const AUTOSAVE_DELAY_MS = 1200;

/** Reads and writes `location.lat`-style paths without pulling in a helper library. */
const setPath = (object, path, value) => {
  const [head, ...rest] = path.split(".");
  if (rest.length === 0) {
    if (value === undefined || value === "") {
      const { [head]: _removed, ...without } = object;
      return without;
    }
    return { ...object, [head]: value };
  }
  return { ...object, [head]: setPath(object[head] ?? {}, rest.join("."), value) };
};

export const getPath = (object, path) =>
  path.split(".").reduce((current, key) => current?.[key], object);

/**
 * The wizard's state.
 *
 * The server holds the draft; this holds the copy being typed into. Every change is saved
 * after a short pause rather than on a "Save" button, because the form is long, it is
 * filled in on a phone, and the most common way to lose it is a phone call arriving
 * halfway through.
 *
 * Validation runs locally against the very schemas the API will use, so a broker sees the
 * problem while typing and the server never has to be the first to mention it.
 */
export function useDraft(draftId, { propertyId } = {}) {
  const [draft, setDraft] = useState(null);
  const [data, setData] = useState({});
  const [step, setStep] = useState("basics");
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);
  const [serverErrors, setServerErrors] = useState({});

  const timerRef = useRef(null);
  const pendingRef = useRef(null);
  /** The current form, readable synchronously — two fields set in one tick both land. */
  const dataRef = useRef({});

  // Open the draft: the one asked for, the one already attached to this listing, or a new one.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = draftId
          ? await get(`/property-drafts/${draftId}`)
          : await post("/property-drafts", propertyId ? { propertyId } : {});
        if (cancelled) return;
        setDraft(response.data);
        dataRef.current = response.data.data ?? {};
        setData(dataRef.current);
        setStep(response.data.step ?? "basics");
        setStatus("ready");
      } catch (cause) {
        if (!cancelled) {
          setError(cause);
          setStatus("error");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [draftId, propertyId]);

  const persist = useCallback(
    async (nextData, nextStep) => {
      if (!draft) return;
      setStatus("saving");
      try {
        const response = await put(`/property-drafts/${draft.id}`, {
          step: nextStep,
          data: nextData,
        });
        setDraft(response.data);
        setServerErrors({});
        setStatus("saved");
      } catch (cause) {
        setServerErrors(cause.fieldErrors?.() ?? {});
        setError(cause);
        setStatus("error");
      }
    },
    [draft],
  );

  /** Schedules an autosave, collapsing a burst of keystrokes into one request. */
  const scheduleSave = useCallback(
    (nextData, nextStep) => {
      pendingRef.current = { nextData, nextStep };
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        const pending = pendingRef.current;
        pendingRef.current = null;
        if (pending) persist(pending.nextData, pending.nextStep);
      }, AUTOSAVE_DELAY_MS);
    },
    [persist],
  );

  /**
   * Writes one field. The new form is computed from a ref rather than inside a `setState`
   * updater, because scheduling an autosave is a side effect and React may run an updater
   * more than once — and because a step that sets two fields in the same tick (choosing a
   * district clears the taluka under it) needs the second write to see the first.
   */
  const setField = useCallback(
    (path, value) => {
      const next = setPath(dataRef.current, path, value);
      dataRef.current = next;
      setData(next);
      scheduleSave(next, undefined);
    },
    [scheduleSave],
  );

  /** Saves immediately — used when leaving a step, and before finishing. */
  const flush = useCallback(
    async (nextStep) => {
      clearTimeout(timerRef.current);
      pendingRef.current = null;
      await persist(dataRef.current, nextStep ?? step);
    },
    [persist, step],
  );

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const goToStep = useCallback(
    async (nextStep) => {
      setStep(nextStep);
      await flush(nextStep);
    },
    [flush],
  );

  const complete = useCallback(async () => {
    await flush();
    const response = await post(`/property-drafts/${draft.id}/complete`);
    return response.data;
  }, [draft, flush]);

  const discard = useCallback(async () => {
    clearTimeout(timerRef.current);
    await del(`/property-drafts/${draft.id}`);
  }, [draft]);

  // The same functions the server runs, so the two can never disagree about "finished".
  const progress = useMemo(() => completedSteps(data), [data]);
  const issues = useMemo(() => validateStep(step, data), [step, data]);

  return {
    draft,
    data,
    step,
    status,
    error,
    progress,
    issues,
    serverErrors,
    isComplete: useMemo(() => isDraftComplete(data), [data]),
    setField,
    setStep: goToStep,
    flush,
    complete,
    discard,
  };
}
