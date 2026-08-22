import { Fragment, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { MAIN_MENU } from "../../constants/navigation";

/**
 * The `.navigation` list shared by the desktop header and the mobile drawer.
 * On desktop the sub menus open on hover (CSS); on mobile they are toggled by
 * the `.dropdown2-btn` element, which the original template injected with
 * jQuery.
 */
export default function MainNav({ mobile = false, onNavigate }) {
  const { pathname } = useLocation();
  const [openIndex, setOpenIndex] = useState(-1);

  const toggle = (index) =>
    setOpenIndex((current) => (current === index ? -1 : index));

  return (
    <ul className="navigation clearfix">
      {MAIN_MENU.map((item, index) => {
        const isCurrent = item.children.some((child) => child.to === pathname);
        const isOpen = mobile && openIndex === index;
        const classes = [
          "dropdown2",
          item.className,
          isCurrent ? "current" : "",
          isOpen ? "open" : "",
        ]
          .filter(Boolean)
          .join(" ");

        // The static markup separated the items by a line break, which the
        // inline-block layout renders as a space.
        return (
          <Fragment key={item.label}>
            {index > 0 && " "}
            <li className={classes}>
              <a
                href="#"
                onClick={(event) => {
                  event.preventDefault();
                  if (mobile) toggle(index);
                }}
              >
                {item.label}
              </a>
              <ul
                style={
                  mobile ? { display: isOpen ? "block" : "none" } : undefined
                }
              >
                {item.children.map((child) => (
                  <li
                    key={child.label}
                    className={child.to === pathname ? "current" : undefined}
                  >
                    <Link to={child.to} onClick={onNavigate}>
                      {child.label}
                    </Link>
                  </li>
                ))}
              </ul>
              {mobile && (
                <div
                  className="dropdown2-btn"
                  role="button"
                  tabIndex={0}
                  aria-expanded={isOpen}
                  aria-label={`Toggle ${item.label} submenu`}
                  onClick={() => toggle(index)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      toggle(index);
                    }
                  }}
                />
              )}
            </li>
          </Fragment>
        );
      })}
    </ul>
  );
}
