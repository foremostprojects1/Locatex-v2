import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/layout/Header";
import DashboardSidebar from "../components/layout/DashboardSidebar";
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
      <div id="page" className="clearfix">
        <div className={`layout-wrap${sidebarCollapsed ? " full-width" : ""}`}>
          <Header
            variant="dashboard"
            onToggleSidebar={() => setSidebarCollapsed((value) => !value)}
          />
          <DashboardSidebar />
          <div className="main-content">
            <div className={meta.innerClass ?? "main-content-inner"}>
              <div
                className="button-show-hide show-mb"
                role="button"
                tabIndex={0}
                onClick={() => setSidebarCollapsed((value) => !value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter")
                    setSidebarCollapsed((value) => !value);
                }}
              >
                <span className="body-1">Show Dashboard</span>
              </div>
              <Outlet />
            </div>
            <div className={meta.footerClass ?? "footer-dashboard"}>
              <p>Copyright © 2024 Home Lengo</p>
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
