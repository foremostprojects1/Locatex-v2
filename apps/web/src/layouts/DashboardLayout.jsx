import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/layout/Header";
import DashboardSidebar from "../components/layout/DashboardSidebar";
import { BRAND } from "../content/brand";
import GoTop from "../components/common/GoTop";
import useBodyClass from "../hooks/useBodyClass";
import useSwipers from "../hooks/useSwipers";
import useWowAnimations from "../hooks/useWowAnimations";
import useCounters from "../hooks/useCounters";
import useLegacyWidgets from "../hooks/useLegacyWidgets";
import { META_BY_ROUTE } from "../constants/pageMeta";

/**
 * Layout of the account area. `full-width` collapses the sidebar, which the
 * template toggled from the header button and reset from the overlay.
 */
export default function DashboardLayout() {
  const { pathname } = useLocation();
  const meta = META_BY_ROUTE[pathname] ?? {};
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  useBodyClass(meta.bodyClass ?? "body bg-surface");
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
        <div className={`layout-wrap${sidebarCollapsed ? " full-width" : ""}`}>
          <Header
            variant="dashboard"
            onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
          />
          <DashboardSidebar />
          <div className="main-content">
            <div className={meta.innerClass ?? "main-content-inner"}>
              {/*
                A real button that says what it does. "Show Dashboard" was ambiguous —
                people are already on the dashboard — and it was a div pretending to be a
                button, so it announced itself as nothing to a screen reader.
              */}
              <button
                type="button"
                className="lx-side__toggle show-mb"
                aria-expanded={!sidebarCollapsed}
                aria-controls="dashboard-nav"
                onClick={() => setSidebarCollapsed((value) => !value)}
              >
                <i className="icon icon-list" aria-hidden="true" />
                <span>{sidebarCollapsed ? "Menu" : "Hide menu"}</span>
              </button>
              <main id="main-content" tabIndex={-1}>
                <Outlet />
              </main>
            </div>
            {/* The template's own credit line, which was still here after sign-in. */}
            <div className={meta.footerClass ?? "footer-dashboard"}>
              <p>
                ©{new Date().getFullYear()} {BRAND.name}. Built by{" "}
                <a
                  href="https://www.foremostinfosystem.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Foremost Infosystem
                </a>
              </p>
            </div>
          </div>
          <div
            className="overlay-dashboard"
            onClick={() => setSidebarCollapsed(false)}
          />
        </div>
      </div>
      <GoTop />
    </div>
  );
}
