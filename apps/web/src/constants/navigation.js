/** Main menu — LocateX information architecture over the existing template routes. */
export const MAIN_MENU = [
  {
    label: "Buy land",
    className: "home",
    children: [
      { label: "All listings", to: "/sidebar-grid" },
      { label: "Listings on map", to: "/topmap-grid" },
      { label: "Split map view", to: "/property-halfmap-grid" },
      { label: "Agricultural land", to: "/sidebar-list" },
      { label: "NA plots", to: "/topmap-list" },
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
