# Locatex v2 — Requirements analysis

Inputs reviewed before any design decision was made:

| Source | What it gave us |
| --- | --- |
| `DOC-20260807-WA0001.docx` | The client's role model, registration fields, and three extra features |
| `Locatex-final-backend` / `Locatex-final-frontend` | The working v1 product — see `../research/locatex-current-system.md` |
| `homelengo-react` | The migrated React template that v2's frontend is built on |
| `dekhojamin.com` | The reference UI the client admires — see `../research/dekhojamin-analysis.md` |
| Google configuration in all three codebases | Audited for existing OAuth scopes |

Everything below is labelled **[Confirmed]** (stated in the DOCX), **[Existing]** (already
built in v1 and reusable), **[Recommended]** (our proposal), **[Assumption]**, or
**[Open]** (needs the client's answer).

---

## 1. What the requirements document actually says

The DOCX is one and a half pages. It is a feature brief, not a specification — it defines
*who* and *what*, and almost nothing about *how*.

### 1.1 Roles and access levels [Confirmed]

| Role | Permitted actions, verbatim from the document |
| --- | --- |
| **Viewer (Guest)** | View basic property details — title, photos, price range, city/state. **Broker phone number and email remain hidden.** |
| **Buyer (logged-in user)** | Must log in to unlock full broker contact info (phone/email), save favourite properties, send direct email inquiries. |
| **Broker** | List land, plots and houses. Update prices and descriptions, mark properties `Sold` or `Available`. |
| **Admin** | Approve or reject listings, activate/deactivate accounts, send email messages to brokers/users, post timed news/advertisements. |

This is the core commercial mechanic of the product: **contact details are the paywall**,
and the login is what unlocks them. Three consequences drive the whole design:

1. Broker phone/email must never leave the server for an unauthenticated request. Hiding
   them in CSS or in the client is not acceptable — the API response itself must differ by
   role.
2. "Price range" for guests is a different value from the exact price a buyer sees, so the
   public listing DTO needs a derived, bucketed price field.
3. Every property read path needs a role-aware serializer, not one shared JSON shape.

### 1.2 Registration data [Confirmed]

**Buyer:** Full Name · Email Address · Phone Number (mobile) · Preferred City/District in
Gujarat · Property Budget Range

**Broker:** Full Name · Agency / Business Name · Phone Number & Email · Office Address ·
RERA Registration Number (optional)

### 1.3 Extra features [Confirmed]

- **Gujarat Area Unit Converter** — Vigha, Guntha, Gaj (Sq. Yard), Sq. Feet, Acres
- **Loan EMI Calculator** — monthly instalment and interest
- **Dashboard KPIs** — active listings, pending approvals, total buyers, properties sold

### 1.4 What the document leaves open

Section 4 of the DOCX is not a requirement — it is a heading with two unanswered
questions written into it:

> "What documents are required for the property? What are the details to be taken from
> user for registration?"

So the property document set is **explicitly undecided by the client**. v1 already answers
it in practice (7/12, 8A, Utarotar), which is the best available starting point, but it
needs confirmation. See §4 below.

### 1.5 What the document never mentions

None of the following appear anywhere in the DOCX, and all of them are being introduced by
the project brief or inherited from v1:

- **Google Drive storage** — a requirement of this engagement, not of the client brief
- **Maps, pins or plot boundaries** — the DekhoJamin research suggests these matter
  commercially, but no requirement exists yet
- The property document set, property field list, approval workflow, or search/filtering
- Pricing, subscriptions, or any monetisation beyond the contact-unlock mechanic
- Language support (the v1 form contains Gujarati text)

---

## 2. Existing application — what carries forward

Full audit: `../research/locatex-current-system.md`. The load-bearing points for v2:

**Reusable domain knowledge [Existing]**

- The Gujarat land vocabulary: khaata number, survey number, 7/12, 8A, Utarotar,
  government area format `હે. આરે. ચો.મી.`, Vigha/Acre, and the
  state → district → taluka → village hierarchy with all 34 Gujarat districts.
- The approval workflow `pending → approved | rejected` with admin review.
- Broker profiles with verification, ratings and reviews.
- `insertedBy: Owner | Broker` attribution on each listing.

**Working code worth porting rather than rewriting [Existing]**

- Cloudinary upload middleware, bcrypt password handling, the reset-token flow,
  the admin approve/reject controllers, and the Leaflet + markercluster map plumbing.

**Defects not to carry over**

- Uploaded documents and land info are silently dropped (schema paths missing).
- Every property is stored at coordinates `0,0` — the form hard-codes them.
- Filters query `propertyType` and `specifications.*`, which do not exist in the schema.
- `/api/messages/*` is completely unauthenticated.
- Favourites live in `localStorage` instead of the server API that already exists.
- Auth is `localStorage` Bearer tokens with a no-op logout.

---

## 3. Conflicts between the document and the existing app

These need a decision before implementation; our recommendation is given for each.

| # | Conflict | v1 behaviour | DOCX | Recommendation |
| --- | --- | --- | --- | --- |
| C1 | **Who may list a property** | Any authenticated user (`POST /api/properties` is open to all roles) | Only Brokers list properties | Restrict creation to `broker` and `admin`. Keep `insertedBy: Owner \| Broker` as an attribute of the listing (a broker listing on behalf of an owner), which is what it already means. **[Recommended]** |
| C2 | **Role names** | `user`, `agent`, `admin` | `viewer`, `buyer`, `broker`, `admin` | Adopt the document's four names. `agent` → `broker`, `user` → `buyer`. `viewer` is the unauthenticated visitor and is *not* a stored role — see C3. |
| C3 | **Is "viewer" an account?** | No such concept | Listed as a role, described as "Guest" | Treat `viewer` as the anonymous/unauthenticated principal in the permission matrix, not a row in the users table. Nothing in the brief lets a viewer do anything a guest cannot. **[Assumption — confirm]** |
| C4 | **Price visibility** | Exact price returned to everyone | Guests see a "price range" | Add a derived bucketed range for public responses; exact price only for authenticated buyers. **[Recommended]** |
| C5 | **Contact visibility** | `contactInfo` returned in every property response | Hidden until login | Strip at the serializer; add an explicit "unlock" interaction in the UI. **[Recommended]** |
| C6 | **Buyer registration fields** | Name, email/phone, password | Adds preferred city/district and budget range | Extend registration; both new fields are useful for lead quality and for pre-filtering search. |
| C7 | **Broker registration fields** | Bio, company, specialties, socials, avatar | Agency name, office address, RERA number | Merge: keep v1's profile fields, add agency/office/RERA. RERA optional per the brief. |
| C8 | **Property status vocabulary** | `for-sale`, `for-rent`, `sold`, `rented` | Broker marks `Sold` / `Available` | Keep the richer v1 set; map "Available" to the active states in the UI. |
| C9 | **Storage** | Cloudinary | Not mentioned | Google Drive for documents (per this brief). Images are a separate decision — see the architecture doc, §Drive. |
| C10 | **Property types** | apartment, house, commercial, industrial, land | "land, houses, and plots" | Keep the v1 enum and add `plot`; land/plot distinction matters in Gujarat. **[Open — confirm with client]** |

---

## 4. Property document set

The DOCX asks the question rather than answering it. What v1 collects today, and what we
recommend as the starting set:

| Document | v1 | Recommendation |
| --- | --- | --- |
| 7/12 extract (સાતબાર) | `document712`, optional | **Required** for agricultural land; the primary title record |
| 8A extract | `document8A`, optional | Required for agricultural land |
| Utarotar (mutation entries) | `documentUtarotar`, optional | Recommended, optional |
| Other documents | up to 5 files | Keep; categorised on upload |
| NA order / NA certificate | not collected | **[Recommended]** add — required for non-agricultural plots |
| Property card / City survey | not collected | **[Open]** — relevant for urban plots |
| Sale deed / index copy | not collected | **[Open]** |
| Layout / site plan | not collected | **[Open]** — useful for plots |

**[Open]** for the client: which of these are mandatory before a listing can be submitted
for approval, versus optional attachments the admin may request later. The design supports
both by making the requirement a per-document-type rule rather than hard-coding it.

---

## 5. Open questions

Blocking (design cannot be finalised without an answer):

1. **Google Workspace or a consumer Google account?** Service accounts have no usable
   Drive storage of their own; files must live in a **Shared Drive**, which requires
   Workspace. Without Workspace we must use an OAuth refresh token for a nominated owner
   account, which has different failure modes. This changes the Drive design materially.
2. **Which property documents are mandatory** (§4 above).
3. **Are images also going to Drive, or staying on Cloudinary/a CDN?** Drive is a poor
   image CDN — no transforms, quota-limited reads, slow public links. Recommendation is to
   split: documents → Drive, images → CDN.

Non-blocking (can be decided during the phases):

4. Does a "viewer" ever become a stored account (C3)?
5. Exact price-range buckets for guest visibility (₹ bands).
6. Is the map a v2 requirement? The DekhoJamin research implies yes commercially, but no
   requirement exists. If yes, the property model needs coordinates and optionally a
   boundary polygon from day one — cheap now, expensive to retrofit.
7. Language: is a Gujarati UI in scope, or English-only with Gujarati domain terms?
8. What exactly is a "timed news/advertisement"? Assumed: an admin-authored item with a
   title, image, link and a start/end datetime, shown on the home page.
9. Email provider for the inquiry and admin-message flows (v1 used raw SMTP via Nodemailer).
10. Do brokers pay? Nothing in the brief suggests it, but the contact-unlock mechanic is
    usually paired with a plan.

---

## 6. Scope for this phase

Per the brief, implementation starts with **Home Page 1** — the `/` route of the migrated
template (`homelengo-react`, Homepage 01) — restructured for Locatex, plus the
**Submit Property** flow specification. Everything else in this document is design work to
be validated before it is built.
