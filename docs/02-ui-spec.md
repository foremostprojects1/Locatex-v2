# Locatex v2 — UI specification (Deliverable B)

Built on the existing React template (`homelengo-react`): Bootstrap 5.3 grid, the theme's
`styles.css` design tokens, Swiper carousels, the icomoon icon set, and the component
conventions already established in `src/components`. No new design system, no new CSS
framework — v2 extends what is there.

---

## 1. Home Page 1 — structure

"Home Page 1" is the `/` route of the template (Homepage 01). Its section order and visual
language are kept; the content becomes Locatex's and most of it becomes backend-driven.

| # | Section | Source of data | States needed |
| --- | --- | --- | --- |
| 1 | **Hero + search** — headline, rotating word, tabbed search form | Static copy; dropdown options from `GET /api/v1/reference/locations` and `/reference/property-types` | Skeleton on the selects while reference data loads |
| 2 | **Featured listings** — tabbed by property type | `GET /api/v1/properties?featured=true&limit=9` | Loading skeletons ×3, empty ("No featured listings yet"), error with retry |
| 3 | **Browse by district** — Gujarat districts with counts | `GET /api/v1/reference/districts?withCounts=true` | Skeleton chips, empty hidden entirely |
| 4 | **Tools strip** — Area converter + EMI calculator | Pure client computation | None (instant) |
| 5 | **Why Locatex** — value props | Static content module | None |
| 6 | **KPI counters** — active listings, brokers, districts covered, properties sold | `GET /api/v1/stats/public` | Counter animates from 0 after load; hidden on error |
| 7 | **Recent listings** — newest approved | `GET /api/v1/properties?sort=newest&limit=8` | Same three states as §2 |
| 8 | **Top brokers** | `GET /api/v1/brokers?sort=rating&limit=8` | Same three states |
| 9 | **News / advertisements** — admin-posted, time-windowed | `GET /api/v1/news?active=true` | Section unmounts entirely when empty |
| 10 | **CTA band** — "List your property" (brokers) / "Create an account" (guests) | Session-aware | Renders per role |
| 11 | **Footer** | Static + newsletter POST | Inline success/error on subscribe |

**Removed from the template's homepage:** testimonials and the partner logo carousel —
no real content exists for them, and shipping placeholder testimonials on a trust-sensitive
product is worse than omitting the section. They can return when the client supplies content.

### 1.1 Backend-driven vs static

Backend-driven: featured listings, recent listings, district counts, KPI counters, broker
list, news items, reference data for every dropdown.
Static (a typed content module, not JSX literals): hero copy, value props, footer links,
tool labels. Kept in `src/content/home.ts` so copy changes never touch component code.

Nothing that will eventually come from the API is hard-coded — sections render from props
supplied by their container, and containers own the query.

### 1.2 Responsive behaviour

| Breakpoint | Layout |
| --- | --- |
| ≥1200 px | Cards 3-up (listings), 4-up (districts, brokers); hero search inline in one row |
| 992–1199 px | Cards 3-up; search wraps to two rows |
| 768–991 px | Cards 2-up; district chips scroll horizontally; tools stack side by side |
| 576–767 px | Cards 1-up in a Swiper (the template's `tf-sw-mobile` pattern already does this); search collapses into an accordion |
| <576 px | Single column, sticky "Search" bar, tools stack vertically, KPI counters 2×2 |

Verified the same way as the template migration: no horizontal overflow at any width, and
every interactive target ≥44 px on touch.

### 1.3 Component boundaries introduced here

Reusable beyond the home page (the point of building them now):

- `PropertyCard` *(exists)* — extended with `PriceDisplay` and `ContactLock`
- `PriceDisplay` — renders exact price or bucketed range based on session; the single
  place that knows the rule
- `ContactLock` — shows masked contact + "Log in to view" for guests, real details for
  buyers; used on cards, detail pages and broker profiles
- `PropertyGrid` — grid/carousel switch, owns loading/empty/error rendering
- `SectionHeader` — eyebrow + title + optional action link
- `StatCounter` — count-up on viewport entry (the template's `useCounters` hook)
- `DistrictChips`, `BrokerCard`, `NewsStrip`
- `AreaConverter`, `EmiCalculator` — self-contained, also embeddable on detail pages
- `Skeleton`, `EmptyState`, `ErrorState` — one visual language for all three states

---

## 2. Submit Property — flow specification

### 2.1 Why a wizard

The existing v1 form is a single page with nine sections, ~25 fields, four document
uploads and a 10-photo dropzone. Completion on mobile is poor and a failed submit loses
everything. v2 splits it into five steps with a **server-side draft** saved after each
step, so a broker can start on a phone in the field and finish on a desktop.

Access: `broker` and `admin` only (conflict C1 in the requirements analysis). Guests hitting
the route are sent to login with a return URL; buyers see an "Apply to become a broker" CTA.

### 2.2 Steps and fields

Field names below are v1's where they exist, so data migrates without a rename.

**Step 1 — Property basics**

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `title` | text | ✓ | 5–100 chars |
| `propertyType` | select: land, plot, house, apartment, commercial, industrial | ✓ | drives conditional fields in step 2 |
| `listingType` | radio: For Sale / For Rent | ✓ | |
| `insertedBy` | radio: Owner / Broker | ✓ | default Broker |
| `price` | currency | ✓ | > 0, Indian grouping (₹ 45,00,000), stored in paise |
| `priceUnit` | select: total / per vigha / per acre / per sq.ft | ✓ | default total |
| `areaValue` + `areaUnit` | number + select (vigha, guntha, gaj, sq.ft, acre) | ✓ | > 0; live conversion preview using the DOCX converter |
| `description` | textarea | — | ≤ 2000 chars, counter shown |

**Step 2 — Location**

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `state` | select | ✓ | Gujarat only for now (v1 behaviour) |
| `district` | select (34 districts) | ✓ | from reference API, not hard-coded HTML |
| `taluka` | select/autocomplete | ✓ | filtered by district |
| `village` | text/autocomplete | ✓ | |
| `pincode` | text | ✓ | 6 digits |
| `address` | text | — | free-form landmark |
| `location pin` | map picker | ✓ **new** | fixes v1's hard-coded `0,0`; "use my location" + drag-to-adjust |
| `boundary` | map polygon | — **new, optional** | the DekhoJamin differentiator; deferrable to a later phase but the field exists from day one |

**Step 3 — Government record & documents**

| Field | Type | Required | Rules |
| --- | --- | --- | --- |
| `khaataNumber` | text | ✓ | |
| `surveyNumber` | text | ✓ | |
| `govArea` | text | ✓ | `હે. આરે. ચો.મી.` format, e.g. `0-64-75`, masked input |
| `doc712` | file | conditional | required when propertyType = land \| plot |
| `doc8A` | file | conditional | required when propertyType = land \| plot |
| `docUtarotar` | file | — | |
| `docNaOrder` | file | conditional | required when propertyType = plot **[Open]** |
| `otherDocuments` | file ×5 | — | category chosen per file |

PDF/JPG/PNG, ≤25 MB each. Each row shows its own progress, retry and remove control —
uploads run against the draft immediately, not at submit.

**Step 4 — Features & media**

`amenities[]` (fencing, house, electricity, kuvo, underground pipeline — v1's set, extended
from reference data), `disadvantages[]` (underground cable, borewell/well, passing vijpool,
passing canal), and 8–10 photos with drag-to-reorder and a primary selection.

**Step 5 — Contact & review**

`contactName`, `contactEmail`, `contactPhone` (10 digits), `whatsappNumber` (optional,
"same as phone" checkbox), then a read-only summary of every step with edit links, and the
declaration checkbox before **Submit for approval**.

### 2.3 Validation behaviour

- One zod schema per step; the same schemas are shared with the backend contract so client
  and server never disagree.
- Validate on blur, re-validate on change once a field has errored, block "Next" until the
  step is valid, and focus the first invalid field.
- Errors appear beneath the field in the template's existing `.error` style (v1's
  convention), plus a summary banner at the top of the step listing them.
- Server-side errors map back to their fields by name; anything unmapped surfaces in the
  banner with the error identifier for support.

### 2.4 States

| State | Behaviour |
| --- | --- |
| Loading a draft | Step skeletons; the wizard never renders half-populated |
| Saving | "Saved" indicator with the timestamp; autosave on step change and every 30 s |
| Uploading | Per-file progress, cancel, retry; navigation warns while uploads are in flight |
| Submit in progress | Button disabled with a spinner; the whole form is locked |
| Submit success | Confirmation screen with property ID, "what happens next" (admin review), links to My Properties |
| Submit failure | Draft is preserved; banner explains the reason and offers retry |
| Offline / connection lost | Autosave queues; a banner warns that changes are unsaved |
| Rejected → resubmit | Wizard reopens pre-filled, showing the admin's rejection reason at the top |

### 2.5 Mapping from the existing form

| v1 field | v2 field | Change |
| --- | --- | --- |
| `title`, `price`, `status`, `type` | same | `status` → `listingType`, `type` gains `plot` |
| `totalAreaAcres` | `areaValue` + `areaUnit` | acres was the only option; now any Gujarat unit with canonical sq.m stored |
| `insertedBy` | same | unchanged |
| `state`, `district`, `taluka`, `village`, `pincode` | same | now from the reference API, cascading |
| *(none)* | `latitude`, `longitude` | **new** — v1 hard-coded `0,0` |
| `khaataNumber`, `surveyNumber`, `govArea` | same | unchanged, still required |
| `document712`, `document8A`, `documentUtarotar`, `otherDocuments` | `doc712`, `doc8A`, `docUtarotar`, `otherDocuments` | **now actually persisted** (v1 dropped them) and categorised |
| `amenities[]`, `disadvantages[]` | same | values unchanged; options move to reference data |
| `contactName/Email/Phone`, `whatsappNumber` | same | unchanged |
| `message` | `description` | v1 already mapped it this way on the server |

---

## 3. Shared UI rules

- **Currency:** Indian grouping with ₹, and lakh/crore shorthand on cards (`₹45.00 L`,
  `₹1.20 Cr`) — matching how the market reads prices.
- **Area:** always show the entered unit with the converted equivalent beneath.
- **Dates:** relative for recency ("2 days ago"), absolute on detail pages.
- **Empty states** name the next action, never just "No data".
- **Errors** show what happened and what to do, plus a copyable error id.
- **Accessibility:** labels bound to inputs, visible focus, `aria-invalid` on errored fields,
  live regions for async results, keyboard-navigable wizard.
