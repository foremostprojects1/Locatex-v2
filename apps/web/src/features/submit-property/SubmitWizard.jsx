import { useEffect, useMemo, useState } from "react";
import { WIZARD_STEPS } from "@locatex/contracts";
import { useDraft } from "./useDraft";
import StepBasics from "./steps/StepBasics";
import StepLocation from "./steps/StepLocation";
import StepDetails from "./steps/StepDetails";
import StepFeatures from "./steps/StepFeatures";
import StepContact from "./steps/StepContact";
import StepDocuments from "./steps/StepDocuments";

const STEP_COMPONENTS = {
  basics: StepBasics,
  location: StepLocation,
  details: StepDetails,
  features: StepFeatures,
  contact: StepContact,
};

const SAVE_LABEL = {
  loading: "Opening…",
  saving: "Saving…",
  saved: "Saved",
  ready: "Saved",
  error: "Not saved",
};

/**
 * The five-step form.
 *
 * A broker may move between steps freely rather than being marched through them: land
 * details arrive in the order the seller happens to mention them, and a form that refuses
 * to let you skip ahead is a form people abandon. Nothing can be *submitted* until every
 * step validates, which is the check that actually matters and is repeated on the server.
 */
export default function SubmitWizard({ draftId, propertyId, onFinished, onDraftOpened }) {
  const draft = useDraft(draftId, { propertyId });

  // Put the draft in the URL as soon as the server gives us one, so a refresh — or the same
  // link opened on a laptop this evening — reopens this form instead of starting another.
  const openedId = draft.draft?.id;
  useEffect(() => {
    if (openedId && openedId !== draftId) onDraftOpened?.(openedId);
  }, [openedId, draftId, onDraftOpened]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [showErrors, setShowErrors] = useState(false);

  const index = WIZARD_STEPS.findIndex((step) => step.id === draft.step);
  const current = WIZARD_STEPS[index] ?? WIZARD_STEPS[0];
  const StepComponent = STEP_COMPONENTS[current.id];

  // Local validation while typing, plus anything the server refused on the last autosave.
  const errors = useMemo(() => {
    const combined = { ...draft.serverErrors };
    if (showErrors) {
      for (const issue of draft.issues) combined[issue.field] ??= issue.message;
    }
    return combined;
  }, [draft.issues, draft.serverErrors, showErrors]);

  const errorFor = (field) => errors[field];

  if (draft.status === "loading") {
    return <div className="widget-box-2 mb-20">Opening your draft…</div>;
  }

  if (draft.status === "error" && !draft.draft) {
    return (
      <div className="widget-box-2 mb-20">
        <h5 className="title">We could not open that draft</h5>
        <p className="lx-note">{draft.error?.message}</p>
      </div>
    );
  }

  const goTo = async (stepId) => {
    setShowErrors(false);
    await draft.setStep(stepId);
  };

  const next = async () => {
    if (draft.issues.length > 0) {
      setShowErrors(true);
      return;
    }
    const following = WIZARD_STEPS[index + 1];
    if (following) await goTo(following.id);
  };

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const property = await draft.complete();
      onFinished?.(property);
    } catch (cause) {
      setSubmitError(cause);
      setShowErrors(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="lx-wizard">
      <ol className="lx-wizard__rail">
        {WIZARD_STEPS.map((step, position) => {
          const done = draft.progress[step.id];
          const isCurrent = step.id === current.id;
          return (
            <li
              key={step.id}
              className={`lx-wizard__step${isCurrent ? " is-current" : ""}${done ? " is-done" : ""}`}
            >
              <button type="button" onClick={() => goTo(step.id)}>
                <span className="lx-wizard__number">{done && !isCurrent ? "✓" : position + 1}</span>
                <span className="lx-wizard__label">
                  <strong>{step.title}</strong>
                  <small>{step.hint}</small>
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="widget-box-2 mb-20">
        <div className="lx-wizard__head">
          <h5 className="title">{current.title}</h5>
          <span className={`lx-wizard__save is-${draft.status}`}>{SAVE_LABEL[draft.status]}</span>
        </div>

        <div className="box-info-property">
          <StepComponent data={draft.data} setField={draft.setField} errorFor={errorFor} />
        </div>

        {/*
          Documents attach to a saved listing, so they are offered while editing one rather
          than mid-way through creating it — there is nothing to attach them to until the
          draft has become a listing.
        */}
        {propertyId && current.id === "features" ? (
          <div className="lx-wizard__documents">
            <h6 className="lx-section-title">Documents</h6>
            <StepDocuments propertyId={propertyId} />
          </div>
        ) : null}

        {showErrors && draft.issues.length > 0 ? (
          <p className="lx-field__error">
            {draft.issues.length === 1
              ? "One thing still needs your attention on this step."
              : `${draft.issues.length} things still need your attention on this step.`}
          </p>
        ) : null}

        {submitError ? <p className="lx-field__error">{submitError.message}</p> : null}

        <div className="lx-wizard__actions">
          {index > 0 ? (
            <button
              type="button"
              className="tf-btn style-border pd-10"
              onClick={() => goTo(WIZARD_STEPS[index - 1].id)}
            >
              Back
            </button>
          ) : null}

          {index < WIZARD_STEPS.length - 1 ? (
            <button type="button" className="tf-btn bg-color-primary pd-10" onClick={next}>
              Continue
            </button>
          ) : null}

          <button
            type="button"
            className="tf-btn bg-color-primary pd-10"
            disabled={!draft.isComplete || submitting}
            onClick={submit}
            title={draft.isComplete ? undefined : "Finish every step first"}
          >
            {submitting ? "Saving…" : propertyId ? "Save changes" : "Create the listing"}
          </button>
        </div>
      </div>
    </div>
  );
}
