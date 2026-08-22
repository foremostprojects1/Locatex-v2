import { useEffect } from "react";

/**
 * Two behaviours of the theme's `shortcodes.js` that are attached to deeply
 * nested, page-specific markup on a dozen pages: the "Search advanced" panel
 * and the active state of the FAQ accordions (the panels themselves are
 * Bootstrap collapses).
 *
 * They are wired with delegated listeners rather than duplicated as state in
 * every page module; everything else from the legacy scripts is implemented
 * with regular React state.
 */
export default function useLegacyWidgets(key) {
  useEffect(() => {
    const onClick = (event) => {
      const { target } = event;

      // "Search advanced" toggle.
      const trigger = target.closest(".pull-right");
      const searchForm = document.querySelector(".wd-search-form");
      if (searchForm) {
        if (trigger) {
          searchForm.classList.toggle("show");
        } else if (!target.closest(".wd-search-form")) {
          searchForm.classList.remove("show");
        }
      }

      // FAQ items highlight the open question.
      const faqItem = target.closest(".box-faq .faq-item");
      if (faqItem) {
        const wasActive = faqItem.classList.contains("active");
        faqItem
          .closest(".box-faq")
          .querySelectorAll(".faq-item")
          .forEach((item) => item.classList.remove("active"));
        if (!wasActive) faqItem.classList.add("active");
      }
    };

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [key]);
}
