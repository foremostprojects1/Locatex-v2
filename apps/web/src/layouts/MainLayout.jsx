import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import GoTop from "../components/common/GoTop";
import LoginModal from "../components/modals/LoginModal";
import RegisterModal from "../components/modals/RegisterModal";
import useBodyClass from "../hooks/useBodyClass";
import useSwipers from "../hooks/useSwipers";
import useWowAnimations from "../hooks/useWowAnimations";
import useCounters from "../hooks/useCounters";
import useLegacyWidgets from "../hooks/useLegacyWidgets";
import { META_BY_ROUTE } from "../constants/pageMeta";

/**
 * Wrapper of every public page: header, page content, optional footer and the
 * blocks that used to be copy/pasted at the bottom of each HTML file
 * (scroll-to-top button, login and register modals).
 *
 * Pages using the `bare` layout (half map listings, homepage 06) have no
 * footer, exactly like their static counterparts.
 */
export default function MainLayout() {
  const { pathname } = useLocation();
  const meta = META_BY_ROUTE[pathname] ?? {};
  useBodyClass(meta.bodyClass ?? "body");
  useSwipers(pathname);
  useWowAnimations(pathname);
  useCounters(pathname);
  useLegacyWidgets(pathname);

  return (
    <div id="wrapper">
      {/*
        A keyboard user lands on the first element of the page, which is a header with
        dozens of navigation links. Without this they tab through every one of them on
        every page before reaching the content.
      */}
      <a className="lx-skip-link" href="#main-content">
        Skip to content
      </a>
      <div id="page" className="clearfix">
        <Header
          variant={meta.headerVariant ?? "default"}
          showSearchButton={Boolean(meta.showSearchButton)}
        />
        <main id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
        {meta.layout !== "bare" && <Footer />}
      </div>
      <GoTop />
      <LoginModal />
      <RegisterModal />
    </div>
  );
}
