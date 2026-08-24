/** Main menu — LocateX information architecture over the existing template routes. */
export const MAIN_MENU = [
  {
    label: "Buy land",
    className: "home",
    children: [
      // These point at the real, API-backed pages. The template's demo variants
      // (/sidebar-grid, /topmap-grid and the rest) still exist and still render their
      // sample data — they are reference material, not part of the product.
      { label: "All listings", to: "/properties" },
      { label: "Listings on map", to: "/properties?view=map" },
      { label: "Agricultural land", to: "/properties?propertyType=land" },
      { label: "NA plots", to: "/properties?propertyType=plot" },
      { label: "Houses", to: "/properties?propertyType=house" },
    ],
  },
  {
    label: "Sell land",
    children: [
      { label: "Post your land — free", to: "/add-property" },
      { label: "My listings", to: "/my-property" },
      { label: "How it works", to: "/our-service" },
    ],
  },
  {
    label: "Tools",
    children: [
      { label: "Area converter", to: "/#tools" },
      { label: "EMI calculator", to: "/#tools" },
      { label: "Pricing", to: "/pricing" },
    ],
  },
  {
    label: "Company",
    children: [
      { label: "About us", to: "/about-us" },
      { label: "Contact", to: "/contact" },
      { label: "FAQs", to: "/faq" },
      { label: "Terms & conditions", to: "/privacy-policy" },
    ],
  },
  {
    label: "Account",
    children: [
      { label: "Dashboard", to: "/dashboard" },
      { label: "My listings", to: "/my-property" },
      { label: "Saved land", to: "/my-favorites" },
      { label: "My enquiries", to: "/my-enquiries" },
      { label: "Messages", to: "/message" },
      { label: "My profile", to: "/my-profile" },
    ],
  },
];

export const ACCOUNT_MENU = [
  { label: "My Properties", to: "/my-favorites" },
  { label: "Message", to: "/message" },
  { label: "My Favorites", to: "/my-favorites" },
  { label: "Reviews", to: "/reviews" },
  { label: "My Profile", to: "/my-profile" },
  { label: "Add Property", to: "/add-property" },
  { label: "Logout", to: "/" },
];

export const CONTACT_INFO = {
  phone: "+91 999 823 6623",
  email: "support@locatex.in",
  address: "Morbi, Gujarat, India",
};
