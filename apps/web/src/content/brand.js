/**
 * Brand facts for LocateX, carried over from the v1 site (about-us, contact, footer).
 * Copy lives here rather than inside components so it can be edited without touching JSX
 * and swapped for CMS/API content later.
 */

export const BRAND = {
  name: "LocateX",
  legalName: "LocateX",
  tagline: "Land, direct from the owner.",
  subTagline:
    "Gujarat's land marketplace where buyers and sellers meet without brokerage, commission or middlemen.",
  logo: {
    dark: "/images/locatex/brand/logo-dark.png",
    light: "/images/locatex/brand/logo-white.png",
  },
  contact: {
    phone: "+91 999 823 6623",
    phoneHref: "tel:+919998236623",
    whatsapp: "https://wa.me/919998236623",
    email: "support@locatex.in",
    place: "Morbi, Gujarat",
  },
  social: [
    { label: "Facebook", href: "#", icon: "icon-fb" },
    { label: "Instagram", href: "#", icon: "icon-instagram" },
    { label: "LinkedIn", href: "#", icon: "icon-linked" },
    { label: "YouTube", href: "#", icon: "icon-youtube" },
  ],
};

/** The promise the platform makes — taken from the v1 "Why Choose Locatex?" list. */
export const BRAND_VALUES = [
  {
    icon: "icon-guarantee",
    title: "Zero brokerage",
    text: "LocateX never charges buyers or sellers a commission or service fee. What you agree is what you pay.",
  },
  {
    icon: "icon-phone2",
    title: "Talk to the owner",
    text: "Buyers reach the person who posted the land directly. No middlemen sitting between the two sides of a deal.",
  },
  {
    icon: "icon-file-text",
    title: "Records up front",
    text: "Listings carry khaata and survey numbers with 7/12 and 8A extracts, so you can verify before you visit.",
  },
  {
    icon: "icon-home-location",
    title: "Built for Gujarat",
    text: "Search the way land is actually described here — district, taluka and village, in Vigha, Guntha or Acre.",
  },
];

/** How the marketplace works, buyer and seller side. */
export const HOW_IT_WORKS = [
  {
    step: "Post your land",
    text: "Add photos, area, price and the government record details. Posting is free and takes a few minutes.",
  },
  {
    step: "We review it",
    text: "Every listing is checked by our team before it goes live, so buyers see real land with real paperwork.",
  },
  {
    step: "Buyers reach you",
    text: "Interested buyers log in and contact you directly by phone, WhatsApp or email. We take nothing from the deal.",
  },
];

/**
 * Terms summary shown on the home page. The full text lives on the Terms page and is
 * reproduced from the v1 about-us page.
 */
export const TRUST_NOTE = {
  title: "A connecting platform — nothing more",
  points: [
    "LocateX helps buyers and sellers discover each other. We do not own, manage or verify the land listed by users.",
    "We never take part in negotiations, payments or deals, and we charge no brokerage.",
    "Always verify documents, visit the land in person and confirm the seller's identity before paying anything.",
  ],
};
