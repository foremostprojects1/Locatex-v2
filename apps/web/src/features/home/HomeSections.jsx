import { Link } from "react-router-dom";
import PropertyCard from "../../components/common/PropertyCard";
import {
  BRAND,
  BRAND_VALUES,
  HOW_IT_WORKS,
  TRUST_NOTE,
} from "../../content/brand";
import {
  CATEGORIES,
  DISTRICTS,
  FEATURED,
  NEWS,
  STATS,
} from "../../content/home";

/** Section heading used across the page. */
export function SectionHeader({ eyebrow, title, text, center = true }) {
  return (
    <div className={`box-title${center ? " text-center" : ""} wow fadeInUp`}>
      {eyebrow && <div className="text-subtitle text-primary">{eyebrow}</div>}
      <h3 className="title mt-4">{title}</h3>
      {text && <p className="desc text-variant-1 mt-3">{text}</p>}
    </div>
  );
}

/** The promise strip directly under the hero — the platform's core claim. */
export function PromiseStrip() {
  return (
    <section
      className="flat-section-v2 pt-0 pb-0"
      style={{ paddingTop: "48px" }}
    >
      <div className="container">
        <div className="row g-3">
          {[
            {
              icon: "icon-guarantee",
              title: "0% brokerage",
              text: "No commission, ever",
            },
            {
              icon: "icon-phone2",
              title: "Owner contact",
              text: "Talk to the seller directly",
            },
            {
              icon: "icon-file-text",
              title: "7/12 & 8A on file",
              text: "Records with every listing",
            },
            {
              icon: "icon-home-location",
              title: "34 districts",
              text: "All across Gujarat",
            },
          ].map((item) => (
            <div className="col-lg-3 col-md-6" key={item.title}>
              <div
                className="d-flex align-items-center gap-3 p-4 bg-white radius-15"
                style={{
                  boxShadow: "0 10px 34px rgba(13, 27, 20, 0.1)",
                  border: "1px solid var(--Line, #E1E1E1)",
                  height: "100%",
                }}
              >
                <span
                  className={`icon ${item.icon} text-primary`}
                  style={{ fontSize: "28px" }}
                />
                <div>
                  <h6 className="mb-0">{item.title}</h6>
                  <p className="text-variant-1 mb-0 body-3">{item.text}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Land categories — counts come from the reference endpoint once the API exists. */
export function CategoryStrip() {
  return (
    <section className="flat-section pb-0">
      <div className="container">
        <SectionHeader
          eyebrow="What are you looking for?"
          title="Browse by land type"
          text="From farmland with a canal touch to approved NA plots — every listing carries its survey number and area."
        />
        <div className="row g-3 mt-3">
          {CATEGORIES.map((category) => (
            <div className="col-lg-2 col-md-4 col-6" key={category.slug}>
              <Link
                to={`/sidebar-grid?type=${category.slug}`}
                className="d-block text-center p-4 radius-15 bg-surface hover-img h-100"
              >
                <span
                  className={`icon ${category.icon} text-primary`}
                  style={{ fontSize: "32px" }}
                />
                <h6 className="mt-3 mb-1 body-2 fw-6">{category.name}</h6>
                <p className="text-variant-1 body-3 mb-0">
                  {category.count} listings
                </p>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Featured listings. `items` will come from `GET /api/v1/properties?featured=true`. */
export function FeaturedListings({ items = FEATURED }) {
  if (items.length === 0) {
    return (
      <section className="flat-section">
        <div className="container">
          <SectionHeader eyebrow="Handpicked" title="Featured land" />
          <div className="text-center py-5">
            <p className="text-variant-1">No listings are live yet.</p>
            <Link to="/add-property" className="tf-btn primary mt-3">
              Be the first to post
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flat-section">
      <div className="container">
        <SectionHeader
          eyebrow="Handpicked"
          title="Featured land across Gujarat"
          text="Verified listings with documents on file. Log in to see the seller's phone number."
        />
        <div className="row mt-4">
          {items.map((property) => (
            <div className="col-xl-4 col-lg-6 col-md-6" key={property.id}>
              <PropertyCard property={property} className="wow fadeInUp" />
            </div>
          ))}
        </div>
        <div className="text-center mt-3">
          <Link to="/sidebar-grid" className="tf-btn primary size-1">
            See all listings
          </Link>
        </div>
      </div>
    </section>
  );
}

/** District grid — counts from the reference endpoint. */
export function DistrictGrid() {
  return (
    <section className="flat-section bg-surface">
      <div className="container">
        <SectionHeader
          eyebrow="Where we work"
          title="Land by district"
          text="Search the way land is described here — district, taluka and village."
        />
        <div className="row g-3 mt-3">
          {DISTRICTS.map((district) => (
            <div className="col-lg-4 col-md-6 col-6" key={district.slug}>
              <div className="box-location wow fadeInUp">
                <Link
                  to={`/sidebar-grid?district=${district.slug}`}
                  className="image img-style"
                >
                  <img
                    src={district.image}
                    alt={`Land in ${district.name}`}
                    loading="lazy"
                  />
                </Link>
                <div className="content">
                  <h6>
                    <Link
                      to={`/sidebar-grid?district=${district.slug}`}
                      className="link"
                    >
                      {district.name}
                    </Link>
                  </h6>
                  <p className="text-variant-1 body-3 mb-0">
                    {district.count} listings
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Why LocateX — the v1 value list. */
export function WhyLocatex() {
  return (
    <section className="flat-section">
      <div className="container">
        <div className="row align-items-center g-4">
          <div className="col-lg-5">
            <SectionHeader
              eyebrow={`Why ${BRAND.name}`}
              title="A marketplace that takes nothing from your deal"
              text={BRAND.subTagline}
              center={false}
            />
            <Link to="/about-us" className="tf-btn primary size-1 mt-4">
              About {BRAND.name}
            </Link>
          </div>
          <div className="col-lg-7">
            <div className="row g-3">
              {BRAND_VALUES.map((value) => (
                <div className="col-md-6" key={value.title}>
                  <div className="p-4 radius-15 bg-surface h-100 wow fadeInUp">
                    <span
                      className={`icon ${value.icon} text-primary`}
                      style={{ fontSize: "30px" }}
                    />
                    <h6 className="mt-3 mb-2">{value.title}</h6>
                    <p className="text-variant-1 body-3 mb-0">{value.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Three-step explanation of the flow. */
export function HowItWorks() {
  return (
    <section className="flat-section bg-surface">
      <div className="container">
        <SectionHeader
          eyebrow="How it works"
          title="Sell your land in three steps"
        />
        <div className="row g-4 mt-3">
          {HOW_IT_WORKS.map((item, index) => (
            <div className="col-lg-4" key={item.step}>
              <div className="p-4 bg-white radius-15 h-100 wow fadeInUp">
                <span
                  className="d-inline-flex align-items-center justify-content-center radius-30 bg-primary-new text-primary fw-8"
                  style={{ width: "44px", height: "44px" }}
                >
                  {index + 1}
                </span>
                <h6 className="mt-3 mb-2">{item.step}</h6>
                <p className="text-variant-1 body-3 mb-0">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mt-4">
          <Link to="/add-property" className="tf-btn primary size-1">
            Post your land — free
          </Link>
        </div>
      </div>
    </section>
  );
}

/** KPI counters — `GET /api/v1/stats/public`. */
export function StatsBand() {
  return (
    <section className="flat-section-v3 py-5 bg-primary-new">
      <div className="container">
        <div className="row g-4 flat-counter-v2 tf-counter">
          {STATS.map((stat) => (
            <div className="col-lg-3 col-6 text-center" key={stat.label}>
              <div className="counter-box">
                <h2 className="mb-1">
                  <span
                    className="number"
                    data-speed="2000"
                    data-to={stat.value}
                    data-inviewport="yes"
                  >
                    {stat.value}
                  </span>
                  {stat.suffix}
                </h2>
                <p className="text-variant-1 mb-0">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Admin-posted news and notices — `GET /api/v1/news?active=true`. */
export function NewsStrip({ items = NEWS }) {
  if (items.length === 0) return null;

  return (
    <section className="flat-section pt-0">
      <div className="container">
        <SectionHeader
          eyebrow="Noticeboard"
          title="News for land buyers and sellers"
        />
        <div className="row g-4 mt-3">
          {items.map((item) => (
            <div className="col-lg-6" key={item.id}>
              <div className="p-4 radius-15 bg-surface h-100">
                <p className="text-variant-1 body-3 mb-1">{item.date}</p>
                <h6 className="mb-2">{item.title}</h6>
                <p className="text-variant-1 body-3 mb-0">{item.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/** Trust note lifted from the v1 terms, plus the closing call to action. */
export function TrustAndCta() {
  return (
    <section className="flat-section pt-0">
      <div className="container">
        <div className="row g-4 align-items-center">
          <div className="col-lg-7">
            <div
              className="p-4 radius-15"
              style={{ border: "1px solid var(--Line, #E1E1E1)" }}
            >
              <h6 className="mb-3">{TRUST_NOTE.title}</h6>
              <ul className="list-unstyled mb-3">
                {TRUST_NOTE.points.map((point) => (
                  <li
                    className="d-flex gap-2 mb-2 text-variant-1 body-3"
                    key={point}
                  >
                    <span className="icon icon-tick text-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
              <Link to="/privacy-policy" className="fw-6 text-primary">
                Read the full terms &amp; conditions
              </Link>
            </div>
          </div>
          <div className="col-lg-5">
            <div className="p-5 radius-15 bg-primary-new text-center">
              <h4 className="mb-2">Land to sell in Gujarat?</h4>
              <p className="text-variant-1 mb-4">
                Post it free and reach buyers directly. We never take a
                commission.
              </p>
              <Link to="/add-property" className="tf-btn primary size-1">
                Post your land
              </Link>
              <p className="body-3 text-variant-1 mt-3 mb-0">
                Questions? Call{" "}
                <a href={BRAND.contact.phoneHref} className="fw-6">
                  {BRAND.contact.phone}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
