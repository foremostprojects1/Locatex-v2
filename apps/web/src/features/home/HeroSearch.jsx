import { useState } from "react";
import { Link } from "react-router-dom";
import AnimatedHeadline from "../../components/common/AnimatedHeadline";
import NiceSelect from "../../components/common/NiceSelect";
import { HERO, SEARCH_OPTIONS } from "../../content/home";

/**
 * Hero with the land search form.
 *
 * The form is presentational for now: on submit it routes to the listing page with the
 * chosen filters as query parameters, which is the same contract
 * `GET /api/v1/properties` will accept.
 */
export default function HeroSearch() {
  const [purpose, setPurpose] = useState("sale");

  return (
    <section
      className="flat-slider home-1"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(13,27,20,.72) 0%, rgba(13,27,20,.55) 45%, rgba(13,27,20,.75) 100%), url(${HERO.image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="container relative">
        <div className="row">
          <div className="col-lg-12">
            <div className="slider-content">
              <div className="heading text-center">
                <p className="text-subtitle text-white mb-3 wow fadeInUp">
                  {HERO.eyebrow}
                </p>
                <h1 className="title-large text-white animationtext slide">
                  {HERO.title}{" "}
                  <AnimatedHeadline type="slide" words={HERO.rotatingWords} />
                </h1>
                <p
                  className="subtitle text-white body-2 wow fadeInUp"
                  data-wow-delay=".2s"
                >
                  {HERO.text}
                </p>
              </div>

              <div className="flat-tab flat-tab-form">
                <ul
                  className="nav-tab-form style-1 justify-content-center"
                  role="tablist"
                >
                  {SEARCH_OPTIONS.purpose.map((item) => (
                    <li
                      className="nav-tab-item"
                      key={item.value}
                      role="presentation"
                    >
                      <button
                        type="button"
                        className={`nav-link-item${purpose === item.value ? " active" : ""}`}
                        onClick={() => setPurpose(item.value)}
                      >
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="tab-content">
                  <div className="tab-pane fade active show" role="tabpanel">
                    <div className="form-sl">
                      <form method="get" action="/sidebar-grid">
                        <input
                          type="hidden"
                          name="listingType"
                          value={purpose}
                        />
                        <div className="wd-find-select">
                          <div className="inner-group">
                            <div className="form-group-1 search-form form-style">
                              <label>Land type</label>
                              <div className="group-select">
                                <NiceSelect
                                  options={SEARCH_OPTIONS.landTypes}
                                  defaultValue=""
                                />
                              </div>
                            </div>
                            <div className="form-group-2 form-style">
                              <label>District</label>
                              <div className="group-select">
                                <NiceSelect
                                  options={SEARCH_OPTIONS.districts}
                                  defaultValue=""
                                />
                              </div>
                            </div>
                            <div className="form-group-3 form-style">
                              <label>Village, survey no. or keyword</label>
                              <input
                                type="text"
                                className="form-control"
                                placeholder="e.g. Lakhdhirpur or 144/2"
                                name="q"
                                title="Search land"
                              />
                            </div>
                          </div>
                          <div className="form-group-4 box-search">
                            <button
                              type="submit"
                              className="tf-btn primary size-1"
                            >
                              Search land
                            </button>
                          </div>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-center text-white mt-4 body-2">
                Have land to sell?{" "}
                <Link
                  to="/add-property"
                  className="fw-6 text-white text-decoration-underline"
                >
                  Post it free
                </Link>{" "}
                — we never charge brokerage.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
