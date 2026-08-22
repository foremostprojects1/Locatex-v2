# LocateX v2 — Decision log

Answers given by the client on 2026-08-16. These close the questions raised in
`00-requirements-analysis.md` §5 and `04-implementation-plan.md` §10. Where an answer has a
consequence the client may not have intended, it is flagged **⚠ needs a follow-up**.

Approved plan reference: `https://claude.ai/code/artifact/96d75530-b258-4de5-b73c-7385314ac877`
(to be reconciled with `04-implementation-plan.md` — see item 7).

---

## D1 · Google Drive lives on a personal Google account

**Answer:** no Google Workspace; files go to the owner's personal Google Drive.

**What this means for the build**

- No Shared Drive and **no service account** — a service account has no usable Drive quota of
  its own. We use the OAuth "sign-in once" path instead: the owner visits
  `/admin/integrations/google`, signs in, consents, and the backend stores the **refresh
  token encrypted**. All uploads then run as that account.
- Scope stays `https://www.googleapis.com/auth/drive.file` — the app can only ever see files
  it created itself.
- Folder layout, resumable uploads, metadata-in-database and the audited download proxy are
  all unchanged from `04-implementation-plan.md` §4.

**⚠ Needs a follow-up**

| Risk | Detail | Mitigation |
| --- | --- | --- |
| **15 GB ceiling** | A free Google account shares 15 GB across Drive, Gmail and Photos. At ~2 MB per document and ~1 MB per stored image, that is roughly 2,000–4,000 documents before it fills — and Gmail stops receiving when it does. | Google One 100 GB is ₹130/month. Strongly recommended before launch. The system will alert the admin at 80% usage. |
| **Single point of failure** | Files are owned by one person. Losing that account, or that person, loses the paperwork. | Nightly metadata export; consider a second "owner" account with view access to the folder. |
| **Token revocation** | If the owner changes their Google password or revokes app access, uploads stop until they sign in again. | Health check surfaces a red banner in the admin dashboard; email alert on the first failure. |

---

## D2 · Mandatory documents = "same as v1"

**Answer:** whatever was mandatory in v1 stays mandatory in v2.

**⚠ Important correction.** Checking the v1 form, **no document was ever mandatory.** The
required fields in `submit-property.html` were: title, area, price, state, district, taluka,
village, pincode, **khaata number, survey number, government area**, and the three contact
fields. The 7/12, 8A, Utarotar and "other" file inputs were all optional — and, because of
the schema bug, were discarded even when supplied.

**Therefore, as decided:**

- Required to submit: title · land type · listing type · area + unit · price · district ·
  taluka · village · pincode · khaata number · survey number · government area (હે.આરે.ચો.મી.)
  · contact name · contact email · contact phone.
- Documents (7/12, 8A, Utarotar, other) are **optional at submission** — but now they are
  actually stored, and the admin can request them during review before approving.

**Recommendation for a later decision (not blocking):** make the 7/12 extract required for
agricultural land once brokers are used to the flow. The document-requirement rule is
per-category and data-driven, so this is a configuration change, not a code change.

---

## D3 · Viewer is a guest, not an account

**Answer:** viewers are visitors who have not logged in.

**What this means for the build**

- Stored roles are **three**: `buyer`, `broker`, `admin`. "Viewer" is the anonymous principal
  in the permission matrix — no record, no dashboard, no registration.
- **Three dashboards**, not four: buyer, broker, admin.
- Guests get the redacted projection: title, photos, city/district, **price band only**, and
  no broker contact.

---

## D4 · Everyone registers as a user, then applies to become a broker

**Answer:** a new account starts as a user; the user requests broker status; once approved by
the admin, they can post land.

**What this means for the build**

```
register  →  role: buyer
             ↓  applies at /become-a-broker (agency name, office address, RERA optional)
      broker_application: pending
             ↓  admin approves            ↓  admin rejects (with reason)
      role: broker                    stays buyer, may re-apply
             ↓
      may create listings → pending → admin approves → live
```

- Only `broker` and `admin` may create a property. This settles conflict **C1** in
  `00-requirements-analysis.md` — v1 let any logged-in account post.
- The v1 flow (`POST /api/agents/registration-request` plus admin verification) is the model;
  its fields merge with the brief's broker fields (agency/business name, office address, RERA
  number optional).
- `Property.insertedBy = Owner | Broker` stays as an attribute of the listing — a broker
  recording whether they own the land or are listing for someone else.
- Emails #11 (`broker-approved` / `broker-rejected`) carry the decision.

---

## D5 · Price band confirmed — **rule revised during implementation**

**Answer:** the proposed approach is approved.

**⚠ The approved rule did not work, and has been corrected.** Writing the test for it showed
that ±10% rounded outward to ₹1 lakh steps **leaks the exact price on every realistic land
price**. The band is symmetric around the price, and land prices are round numbers, so the
midpoint lands exactly on the real figure:

```
₹72,00,000  →  ₹64 L – ₹80 L   midpoint ₹72,00,000  ✗
₹96,00,000  →  ₹86 L – ₹106 L  midpoint ₹96,00,000  ✗
₹41,50,000  →  ₹37 L – ₹46 L   midpoint ₹41,50,000  ✗
```

Every price tested was recoverable. No symmetric interval can hide the value at its centre.

**What we implemented instead.** The ±10% window is still the input, but the published band
snaps outward to a fixed ladder of rungs (₹5 L, ₹10 L, … ₹1.1 Cr, ₹1.5 Cr, ₹2 Cr …):

```
₹72,00,000  →  "₹60 L – ₹90 L"
₹75,00,000  →  "₹60 L – ₹90 L"    ← same band, different price
₹1,50,000   →  "Under ₹5 L"
```

Because many prices map to the same rungs, the band identifies a range and nothing more —
which is what "price range" in the brief actually asks for. Buyers, brokers and admins
continue to receive the exact price.

**Cost of the correction:** public bands are wider than ±10%. That is the unavoidable price
of actually concealing the figure. If a tighter range matters more than concealment, say so
and we will tune the ladder — but the two goals are in direct tension.

Implemented in `packages/contracts/src/price.ts` as `publicPriceBand()`, with the raw ±10%
window kept as `priceBand()` for internal use. Eleven tests cover it, including one that
asserts non-invertibility directly.

---

## D6 · Email is sent through Gmail

**Answer:** Gmail will be used for outbound mail.

**What this means for the build**

- Transport: `smtp.gmail.com:465` over Nodemailer, authenticated with a **Google App
  Password** (requires 2-step verification on the account). OAuth2/XOAUTH2 is the
  alternative if app passwords are disabled by policy.
- The abstraction is a `Mailer` interface, so swapping to a transactional provider later is
  one adapter, not a rewrite.

**⚠ Needs a follow-up**

| Risk | Detail | Mitigation |
| --- | --- | --- |
| **500 emails per day** | A free Gmail account is capped at ~500 recipients/day (Workspace is 2,000). Twelve templates × approvals, chats and contact forms will approach this as volume grows. | Queue already throttles and retries. Monitor daily volume; move to Brevo/Resend/SendGrid (free tiers cover ~3,000/month) when the cap is within reach. |
| **From address** | Mail will appear from the Gmail address unless `support@locatex.in` is verified in Gmail as a "Send mail as" alias. | Set the alias up before phase 9; otherwise replies go to the Gmail inbox rather than support. |
| **Deliverability** | SPF/DKIM belong to Google, so alignment with `locatex.in` is imperfect and some mail may land in spam. | Acceptable at launch volume; a dedicated domain sender is the fix when it matters. |
| **Not for bulk** | Gmail's terms prohibit bulk/marketing sending. | Transactional only. The newsletter feature, if used, needs a real provider. |

---

## D7 · Stack: Node + MongoDB

**Answer:** the build uses Node + MongoDB (approach **B** in `04-implementation-plan.md` §1).

**What this means for the build**

- API stays Node 22 + **TypeScript strict** + Express 5, layered exactly as designed. Only
  the persistence adapter changes; use cases and domain rules are untouched.
- Mongoose 8 with **`strict: 'throw'`** on every schema, plus zod validation at the API
  boundary. This is the specific guard against v1's failure, where unknown fields — the
  uploaded document links — were dropped in silence.
- Money stays an integer in paise. Ids are ULIDs stored as strings, so they remain sortable
  and safe to expose.
- Migrations via `migrate-mongo`, checked into the repo and run as a release step.
- Everything else in the plan is unchanged: Redis + BullMQ for jobs and the 24-hour chat
  digest, Socket.IO for chat, Google Drive for documents, Cloudinary for images, JWT in
  httpOnly cookies.

**Collections:** `users`, `broker_profiles`, `properties`, `property_applications`,
`property_documents`, `favorites`, `inquiries`, `conversations`, `messages`,
`contact_messages`, `news_items`, `audit_events`, `email_log`, `upload_sessions`, and the
reference collections `districts`, `talukas`, `villages`, `pincodes`, `amenities`.

**Traded away by this choice (accepted):** database-enforced foreign keys and transactional
integrity across collections. Compensating controls — application-level referential checks in
the repositories, `$transaction` for the submit and approve flows (Atlas replica sets support
it), and the audit collection as the reconstruction trail.

---

## Consequences for the phase plan

| Phase | Change |
| --- | --- |
| 0 | Closed — this document is the sign-off. |
| 1 | Mongoose + `migrate-mongo` instead of Prisma; Atlas connection instead of Postgres. |
| 3 | Three roles, not four. Registration always creates `buyer`. Add the broker-application flow and its admin approval. |
| 4 | Three dashboard shells (buyer, broker, admin), plus the public guest projection. |
| 6 | Documents remain optional in the wizard; the government-record fields stay required. |
| 7 | OAuth "connect Drive" screen and encrypted refresh token, instead of a service-account key. Add the quota monitor and the reconnect alert. |
| 9 | Gmail SMTP adapter with an app password; add the "Send mail as" alias task; add daily-volume monitoring. |

Everything else in `04-implementation-plan.md` stands.

---

## Reconciliation with the approved plan

The approved build plan
(`https://claude.ai/code/artifact/96d75530-b258-4de5-b73c-7385314ac877`) has been **updated
in place** with all seven decisions above — same URL, so the link already shared stays
current. Amendments made to it:

- New **§0 "Decisions locked"** table at the top, stating each answer and its consequence.
- **§1 stack table:** database → MongoDB Atlas + Mongoose 8; geo queries → `2dsphere`
  indexes instead of PostGIS; email → Gmail SMTP; hosting → Atlas.
- **§1.1:** approach B recorded as the client's choice, with what changes (persistence only)
  and what is traded away (database-enforced constraints) plus the compensating controls.
- **§2:** three stored roles, Viewer as guest, and the user → broker-application flow.
- **§2.1:** price band now rounds outward to ₹1 lakh steps, with the reasoning and a worked
  example.
- **§5.1:** Workspace question closed — personal Drive, with the 15 GB and single-owner
  risks written in.
- **§6:** Gmail transport, the "Send mail as" alias task and the ~500/day cap.
- **§8:** required-to-submit field list, and the finding that no document was mandatory in v1.
- **§11:** phase 0 marked done; phase 1 now says Mongoose + `migrate-mongo`.
- **§12:** rewritten as "What is still open".

### Still open (from the approved plan, not yet answered)

| # | Question | Needed by |
| --- | --- | --- |
| 1 | Do guests see the **exact pin**, or only the approximate circle until login? *(Recommendation: the pin unlocks with the contact details.)* | Phase 4 |
| 2 | Signup verification — email link, phone OTP, or both? | Phase 2 |
| 3 | May buyers and brokers exchange phone numbers **inside chat**, or are they masked? | Phase 10 |
| 4 | The extra land attributes proposed in §8 (road access, water source, soil type, fencing type, distance from highway) — in or out? | Phase 5 |
| 5 | English-only UI, or Gujarati as well? | All phases — cheapest to decide now |
| 6 | Google One storage upgrade before launch? | Phase 6 |

---

## Second round — answered 16 Aug 2026

### D8 · Guests never see the exact pin

**Answer:** proceed with the recommendation.

Everyone sees a circle for `approx` listings. The **exact pin unlocks together with the
broker's contact details, on login** — the same paywall the brief defines for phone and
email. Guests therefore receive: photos, title, district/taluka/village, the price band and
a circle. `latitude`/`longitude` are omitted from the public projection entirely rather than
merely hidden in the UI.

### D9 · Registration fields as planned

**Answer:** go with the plan. Buyer — name, email, phone, preferred city/district, budget
range. Broker application — name, agency/business name, phone, email, office address, RERA
number (optional).

### D10 · Signup verification: both

**Answer:** **email link and phone OTP are both mandatory.**

An account is unverified until both are confirmed; login is refused until then, with a
resend path for each. Consequences: OTP needs an SMS provider (MSG91 or Twilio — Indian DLT
registration is required for transactional SMS and takes days, so start it during phase 1),
and OTP attempts need their own rate limit and expiry (6 digits, 10 minutes, 5 attempts).

### D11 · Contact swapping inside chat is allowed

**Answer:** allow it — no masking of phone numbers or emails in message bodies.

Simplifies phase 10. Rate limits, report/block and admin read-only oversight still apply.

### D12 · Extra land attributes are in

**Answer:** add them. On top of the five v1 amenities and four disadvantages:

| Attribute | Values |
| --- | --- |
| Road access | kaccha · pakka · highway |
| Water source | canal · borewell · well · none |
| Soil type | (list to be confirmed with the client — black, alluvial, sandy, loamy, rocky proposed) |
| Fencing type | barbed wire · wall · none |
| Distance from highway | numeric, km |
| Electricity connection type | agricultural · domestic · three-phase · none |

All live in the reference collections, so the admin extends them without a deploy. Soil-type
values remain **open** — a short list from the client would be better than our guess.

### D13 · No storage upgrade

**Answer:** no Google One purchase for now.

**⚠ Consequence.** The free 15 GB is shared with the owner's Gmail and Photos, so storage is
the tightest constraint in the system. Mitigations now built into the plan:

- **Only documents go to Drive.** Property images go to the CDN only — this was already the
  recommendation for performance and now matters for space as well.
- Document cap tightened to **10 MB** (was 25 MB), with server-side PDF/image compression
  before upload.
- Quota is polled daily; the admin dashboard shows a banner at 80% and uploads are blocked
  at 95% with a clear message rather than a silent failure.
- Rough capacity at 10 MB per document: ~1,500 documents. At a realistic 1–2 MB average:
  ~7,000–15,000. Revisit when the banner first appears.

### D14 · Database: MongoDB Atlas

**Answer:** confirmed — Atlas, as covered in D7.

### Note on the two plan documents

`04-implementation-plan.md` in this folder was written before the approved artifact and
recommends Postgres with a 16-phase schedule. The **approved artifact is now the single
source of truth** — it has 13 phases and a ~14–16 week estimate (≈9–11 on the MongoDB path).
`04-implementation-plan.md` is kept for its longer-form reasoning on Drive, email and chat,
all of which still stands.
