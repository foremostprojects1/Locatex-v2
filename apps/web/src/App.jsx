import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import DashboardLayout from "./layouts/DashboardLayout";
import Preloader from "./components/common/Preloader";
import Lightbox from "./components/common/Lightbox";
import NotFound from "./pages/NotFound";
import { PAGE_META } from "./constants/pageMeta";
import RequireAuth from "./components/common/RequireAuth";
import { SearchPopupContext } from "./hooks/useSearchPopup";
import { SessionProvider } from "./hooks/useSession";
import { FavouritesProvider } from "./features/listings/useFavourites";

const pageModules = import.meta.glob("./pages/*.jsx");

const loadPage = (name) =>
  lazy(
    pageModules[`./pages/${name}.jsx`] ??
      (() => Promise.resolve({ default: NotFound })),
  );

const PAGES = PAGE_META.map((meta) => ({
  ...meta,
  Component: loadPage(meta.name),
}));

/** Restores the scroll position on navigation, like a full page load did. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  const { pathname } = useLocation();
  const [searchPopupOpen, setSearchPopupOpen] = useState(false);

  useEffect(() => {
    setSearchPopupOpen(false);
  }, [pathname]);

  const searchPopup = useMemo(
    () => ({
      open: searchPopupOpen,
      toggle: () => setSearchPopupOpen((value) => !value),
      close: () => setSearchPopupOpen(false),
    }),
    [searchPopupOpen],
  );

  const dashboardPages = PAGES.filter((page) => page.layout === "dashboard");
  const publicPages = PAGES.filter((page) => page.layout !== "dashboard");

  return (
    <SessionProvider>
      <FavouritesProvider>
        <SearchPopupContext.Provider value={searchPopup}>
      <Preloader />
      <Lightbox />
      <ScrollToTop />
      <Suspense fallback={null}>
        <Routes>
          <Route element={<MainLayout />}>
            {publicPages.map(({ route, Component }) => (
              <Route key={route} path={route} element={<Component />} />
            ))}
            <Route path="*" element={<NotFound />} />
          </Route>
          {/*
            The whole dashboard is behind the guard, not each page inside it. A page added
            here later cannot accidentally be public, and a signed-out visitor never sees
            the dashboard chrome rendered around a sign-in prompt.
          */}
          <Route
            element={
              <RequireAuth>
                <DashboardLayout />
              </RequireAuth>
            }
          >
            {dashboardPages.map(({ route, Component }) => (
              <Route
                key={route}
                path={route}
                element={
                  route === "/admin" ? (
                    <RequireAuth role="admin">
                      <Component />
                    </RequireAuth>
                  ) : (
                    <Component />
                  )
                }
              />
            ))}
          </Route>
        </Routes>
      </Suspense>
        </SearchPopupContext.Provider>
      </FavouritesProvider>
    </SessionProvider>
  );
}
