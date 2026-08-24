import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { del, get, put } from "../../services/locatexApi";
import { useSession } from "../../hooks/useSession";

/**
 * Which listings this person has saved.
 *
 * Held once for the whole app rather than fetched per card: a grid of twenty-four cards
 * would otherwise make twenty-four requests to draw twenty-four hearts.
 *
 * The toggle updates the set before the request finishes and puts it back if the request
 * fails. Saving is not a decision anyone wants to wait on, and being wrong for 200ms costs
 * nothing compared with a heart that lags behind the finger.
 */
const FavouritesContext = createContext(null);

export function FavouritesProvider({ children }) {
  const { isSignedIn } = useSession();
  const [ids, setIds] = useState(() => new Set());

  useEffect(() => {
    if (!isSignedIn) {
      setIds(new Set());
      return undefined;
    }
    const controller = new AbortController();
    get("/me/favourites/ids", { signal: controller.signal })
      .then((response) => setIds(new Set(response.data)))
      .catch(() => setIds(new Set()));
    return () => controller.abort();
  }, [isSignedIn]);

  const toggle = useCallback(
    async (propertyId) => {
      const saved = ids.has(propertyId);

      setIds((current) => {
        const next = new Set(current);
        if (saved) next.delete(propertyId);
        else next.add(propertyId);
        return next;
      });

      try {
        if (saved) await del(`/me/favourites/${propertyId}`);
        else await put(`/me/favourites/${propertyId}`);
      } catch {
        // Put it back exactly as it was; the server is the truth.
        setIds((current) => {
          const next = new Set(current);
          if (saved) next.add(propertyId);
          else next.delete(propertyId);
          return next;
        });
      }
    },
    [ids],
  );

  const value = useMemo(
    () => ({ ids, isSaved: (id) => ids.has(id), toggle, canSave: isSignedIn }),
    [ids, toggle, isSignedIn],
  );

  return <FavouritesContext.Provider value={value}>{children}</FavouritesContext.Provider>;
}

export function useFavourites() {
  return (
    useContext(FavouritesContext) ?? {
      ids: new Set(),
      isSaved: () => false,
      toggle: () => {},
      canSave: false,
    }
  );
}
