import { createContext, useContext } from "react";

/**
 * Shared state for the header search popup: the trigger lives in the header
 * while the popup markup belongs to the page (homepage 06).
 */
export const SearchPopupContext = createContext({
  open: false,
  toggle: () => {},
  close: () => {},
});

export default function useSearchPopup() {
  return useContext(SearchPopupContext);
}
