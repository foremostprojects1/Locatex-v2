/**
 * Closing a Bootstrap modal from React.
 *
 * The template's modals are opened declaratively with `data-bs-toggle`, which is fine — but
 * a modal that should close because a *network call* succeeded has no declarative trigger.
 * Bootstrap's instance API is the supported way to do it, and going through `getInstance`
 * rather than constructing a new one avoids leaving two controllers on the same element.
 */
export function closeModal(id) {
  const element = document.getElementById(id);
  if (!element) return;

  const bootstrap = window.bootstrap;
  const instance = bootstrap?.Modal?.getInstance?.(element);
  if (instance) {
    instance.hide();
    return;
  }

  // No instance yet — the modal was opened by the data-api before Bootstrap tracked it, or
  // the bundle has not attached. Clicking a dismiss trigger inside it does the same job.
  element.querySelector('[data-bs-dismiss="modal"]')?.click();
}

export function openModal(id) {
  const element = document.getElementById(id);
  const bootstrap = window.bootstrap;
  if (!element || !bootstrap?.Modal) return;
  bootstrap.Modal.getOrCreateInstance(element).show();
}
