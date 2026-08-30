/**
 * What LocateX actually says about itself.
 *
 * Taken from the live v1 site rather than written fresh — these are the client's own
 * commitments, and the legal ones in particular ("we are only a connecting platform", "we
 * charge no brokerage") are load-bearing. Kept in one file so the About, FAQ, Contact and
 * Terms pages cannot drift apart, and so a change of address or opening hours is one edit.
 */

export const CONTACT = {
  address: [
    "8-A National Highway, Platinum Plaza",
    "B/H Grand Vardhman Hotel",
    "Morbi-2, Lalpar, Gujarat 363642",
  ],
  phone: "+91 999 823 6623",
  phoneHref: "tel:+919998236623",
  email: "support@locatex.in",
  hours: [
    { day: "Monday – Saturday", time: "10 AM – 8 PM" },
    { day: "Sunday", time: "Closed" },
  ],
};

export const ABOUT = {
  title: "About LocateX",
  lede:
    "LocateX connects people who have land in Gujarat with people looking for it. " +
    "We are a listings platform and nothing more — no brokerage, no commission, and no " +
    "part in the deal itself.",

  /** The seven promises from the v1 site, which are also the limits of our liability. */
  promises: [
    {
      title: "Only a connecting platform",
      body: "We help owners, brokers and buyers discover each other. That is the whole service.",
    },
    {
      title: "No brokerage or service fees",
      body: "LocateX charges users nothing. Listing land is free and always has been.",
    },
    {
      title: "Direct communication",
      body: "Buyers and brokers talk to each other through the site. Nobody sits in between.",
    },
    {
      title: "Listings come from users",
      body: "Every detail on a listing is provided by the person posting it. We check that a broker is who they say they are, and that the listing is complete — we do not verify title.",
    },
    {
      title: "No involvement in transactions",
      body: "We take no part in negotiations, payments or agreements.",
    },
    {
      title: "Verify before you pay",
      body: "Check the documents, visit the land, and confirm who you are dealing with. Always.",
    },
    {
      title: "Platform-only responsibility",
      body: "LocateX is not responsible for disputes, losses or misrepresentation between users.",
    },
  ],

  scope:
    "Right now LocateX carries rental listings for agricultural land and NA plots across " +
    "Gujarat's 34 districts. Sales, and property types beyond land, will follow.",
};

/**
 * The terms, verbatim in substance from v1.
 *
 * These are the client's published commitments and were live on the old site, so the
 * wording is preserved rather than improved — a term that changes meaning between versions
 * is a term somebody agreed to under different words.
 */
export const TERMS = {
  updated: "August 2026",
  sections: [
    {
      title: "1. Platform usage",
      body:
        "LocateX is a connecting platform that helps land owners, brokers and buyers " +
        "discover each other. We do not own or manage any land listed here, and we do not " +
        "verify ownership. Users are solely responsible for the accuracy of what they post.",
    },
    {
      title: "2. Your responsibilities",
      body:
        "Provide accurate information when you list land. Misrepresentation is prohibited " +
        "and will remove your listing and your account. Before any transaction, verify the " +
        "land details, the ownership documents and the identity of the other party yourself.",
    },
    {
      title: "3. We are not part of the transaction",
      body:
        "LocateX takes no part in negotiations, payments or agreements between users. Every " +
        "transaction is conducted directly between the parties, at their own risk. We charge " +
        "no brokerage or service fee.",
    },
    {
      title: "4. Liability",
      body:
        "LocateX is not responsible for disputes, losses, fraud or misrepresentation arising " +
        "from dealings between users. Exercise due diligence and take professional legal " +
        "advice before making any land-related decision.",
    },
    {
      title: "5. Your information",
      body:
        "Information collected here is used to operate the listings and the messaging between " +
        "users. We do not sell or share your data with third parties without your consent, " +
        "except where the law requires it. Your phone number and email are shown only to " +
        "signed-in users, never to anonymous visitors and never to search engines.",
    },
    {
      title: "6. Fraud",
      body:
        "Be careful. Always verify documents, visit the land in person, and confirm the " +
        "seller's identity before paying anything. Report anything suspicious to " +
        `${CONTACT.email} immediately — every conversation on this site can be reported and ` +
        "blocked from inside it.",
    },
  ],
  closing:
    "By using LocateX you agree to these terms. We may update them, and will note the date " +
    "above when we do.",
};

/**
 * Questions the site actually raises.
 *
 * v1's FAQ page shipped with the template's placeholder text, so there was nothing to carry
 * over. These answer what the product genuinely does — the price band, the map circle, why
 * a broker has to be approved — because those are the things a visitor will wonder about.
 */
export const FAQS = [
  {
    group: "Using LocateX",
    items: [
      {
        q: "What does it cost?",
        a: "Nothing. Listing land is free, browsing is free, and we take no brokerage or commission from either side.",
      },
      {
        q: "What can I list here at the moment?",
        a: "Rental listings for agricultural land and NA plots anywhere in Gujarat. Sales and other property types are not supported yet.",
      },
      {
        q: "Do I need an account to look around?",
        a: "No. Anyone can browse listings and see the area, the district and a price band. Signing in reveals the exact price, the broker's phone number and the precise location.",
      },
    ],
  },
  {
    group: "Prices and locations",
    items: [
      {
        q: "Why does a listing show a price range instead of a price?",
        a: "Visitors who are not signed in see a band rather than the figure. It gives you a real sense of what land costs without publishing every broker's asking price to anyone who passes by. Sign in and you see the exact amount.",
      },
      {
        q: "Why is the land shown as a circle on the map?",
        a: "Brokers choose how precisely to show a parcel. Most pick approximate, which draws a circle around the pincode. Even where an exact pin has been dropped, visitors who are not signed in only ever see the circle — the precise point is for signed-in buyers.",
      },
      {
        q: "Which areas do you cover?",
        a: "All 34 districts of Gujarat, down to taluka and village. Nothing outside Gujarat.",
      },
    ],
  },
  {
    group: "Listing land",
    items: [
      {
        q: "How do I post land?",
        a: "Register, then apply to become a broker from your dashboard. Once our team has approved you — usually within a working day — the listing form opens up.",
      },
      {
        q: "Why does a broker have to be approved?",
        a: "Because buyers here take the listings seriously, and they do that because somebody checked. It is the difference between a marketplace and a noticeboard.",
      },
      {
        q: "How long does a listing take to go live?",
        a: "Our team reviews each one, usually within a working day. If something needs changing you will get an email saying exactly what, and the listing goes back to you rather than being deleted.",
      },
      {
        q: "Do I have to upload the 7/12?",
        a: "No, nothing is required. But listings carrying the 7/12 and the 8A are reviewed faster and taken more seriously — and only you and our review team can ever open them.",
      },
    ],
  },
  {
    group: "Safety",
    items: [
      {
        q: "Do you verify that a seller owns the land?",
        a: "No, and no listings platform can. We verify that a broker is who they say they are and that their listing is complete. Verifying title is your job, with your own lawyer, before any money changes hands.",
      },
      {
        q: "Someone is behaving badly. What do I do?",
        a: `Every conversation has a report button, which also blocks them from reaching you. For anything urgent, write to ${CONTACT.email}.`,
      },
      {
        q: "Will my phone number be visible to everyone?",
        a: "No. Contact details are shown only to signed-in, verified users — never to anonymous visitors and never to search engines.",
      },
    ],
  },
];
