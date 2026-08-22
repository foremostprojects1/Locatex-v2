import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";

// Vendor and theme stylesheets, in the order the static template loaded them.
import "./styles/fonts.css";
import "./styles/font-icons.css";
import "./styles/bootstrap.min.css";
import "swiper/css/bundle";
import "./styles/animate.css";
import "./styles/styles.css";

// Bootstrap's data-api (tabs, accordions, dropdowns, modals) is delegated from
// the document, so importing it once is enough for every route.
import "bootstrap/dist/js/bootstrap.bundle.min";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
