import { Link } from "react-router-dom";
import MapPinIcon from "./MapPinIcon";

/**
 * The `.homelengo-box` listing card of the original template.
 *
 * Two layouts exist in the markup and are selected by `className`:
 *  - grid (no extra class): the location sits on top of the image;
 *  - list (`list-style-1 …`): the location sits below the meta list and an
 *    optional description is shown.
 */
export default function PropertyCard({ property, className = "", wowDelay }) {
  const {
    href,
    image,
    imageAlt = "img",
    tags = [],
    tagListClass = "d-flex gap-6",
    location,
    locationInImage,
    locationTextClass = "text-line-clamp-1",
    title,
    titleClass = "",
    titleLinkClass = "link",
    meta = [],
    description,
    descriptionClass = "description mt-20 text-line-clamp-2 text-variant-1",
    avatar,
    avatarClass = "avatar avt-40 round",
    agent,
    /** Shown where the agent would be, when there is no agent to show. */
    kind,
    price,
    priceTag = "h6",
  } = property;

  const boxClass = ["homelengo-box", className].filter(Boolean).join(" ");
  const Price = priceTag;

  return (
    <div
      className={boxClass}
      {...(wowDelay ? { "data-wow-delay": wowDelay } : {})}
    >
      <div className="archive-top">
        <Link to={href} className="images-group">
          <div className="images-style">
            <img className="lazyload" src={image} alt={imageAlt} />
          </div>
          {tags.length > 0 && (
            <div className="top">
              <ul className={tagListClass}>
                {tags.map((tag) => (
                  <li key={tag.label} className={tag.className}>
                    {tag.label}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {locationInImage && location && (
            <div className="bottom">
              <MapPinIcon />
              {location}
            </div>
          )}
        </Link>
      </div>
      <div className="archive-bottom">
        <div className="content-top">
          <h6 className={titleClass}>
            <Link to={href} className={titleLinkClass}>
              {" "}
              {title}
            </Link>
          </h6>
          <ul className="meta-list">
            {meta.map((item) => (
              <li className="item" key={item.icon}>
                <i className={`icon ${item.icon}`} />
                <span className="text-variant-1">{item.label}</span>
                <span className="fw-6">{item.value}</span>
              </li>
            ))}
          </ul>
          {!locationInImage && location && (
            <div className="location">
              <MapPinIcon stroke="#A3ABB0" />
              <span className={locationTextClass}> {location} </span>
            </div>
          )}
          {description && <p className={descriptionClass}>{description}</p>}
        </div>
        <div className="content-bottom">
          {/*
            The avatar renders only when there is one.
            
            It used to be an unconditional <img src={avatar} alt="avt">, and our listings
            carry no agent photograph — so every card showed a broken-image icon with the
            word "avt" beside it. An empty slot is better than a broken one, and a badge
            saying what kind of land it is beats both.
          */}
          <div className="d-flex gap-8 align-items-center">
            {avatar ? (
              <div className={avatarClass}>
                <img src={avatar} alt="" />
              </div>
            ) : null}
            {agent ? <span>{agent}</span> : null}
            {!avatar && !agent && kind ? (
              <span className="lx-card__kind">{kind}</span>
            ) : null}
          </div>
          <Price className="price">{price}</Price>
        </div>
      </div>
    </div>
  );
}
