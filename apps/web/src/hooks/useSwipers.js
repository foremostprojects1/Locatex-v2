import { useEffect } from "react";
import Swiper, {
  Autoplay,
  EffectFade,
  FreeMode,
  Navigation,
  Pagination,
  Thumbs,
} from "swiper";

// Modules used by the carousels of the template, registered per instance.
const MODULES = [
  Autoplay,
  EffectFade,
  FreeMode,
  Navigation,
  Pagination,
  Thumbs,
];

/** Creates a Swiper with the modules the theme relies on. */
const createSwiper = (element, options) =>
  new Swiper(element, { modules: MODULES, ...options });

const number = (element, key, fallback) => {
  const value = element.dataset[key];
  if (value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

const boolean = (element, key) => element.dataset[key] === "true";

/**
 * Carousel definitions ported from the template's `carousel.js`. Each entry
 * builds the Swiper options for the elements matching its selector, reading
 * the same `data-*` attributes the markup already carries.
 */
const CAROUSELS = [
  {
    selector: ".tf-sw-location",
    options: (el) => ({
      slidesPerView: number(el, "mobile", 1),
      spaceBetween: number(el, "space", 8),
      slidesPerGroup: number(el, "paginationSm", 1),
      pagination: { el: ".sw-pagination-location", clickable: true },
      navigation: {
        nextEl: ".nav-prev-location",
        prevEl: ".nav-next-location",
      },
      breakpoints: {
        575: {
          slidesPerView: number(el, "mobileSm", 2),
          spaceBetween: number(el, "space", 8),
          slidesPerGroup: number(el, "pagination", 1),
        },
        768: {
          slidesPerView: number(el, "tablet", 3),
          spaceBetween: number(el, "spaceMd", 8),
          slidesPerGroup: number(el, "paginationMd", 3),
        },
        1150: {
          slidesPerView: number(el, "preview", 6),
          spaceBetween: number(el, "spaceLg", 8),
          slidesPerGroup: number(el, "paginationLg", 3),
        },
      },
    }),
  },
  {
    selector: ".tf-sw-latest",
    options: (el) => ({
      slidesPerView: number(el, "mobile", 1),
      spaceBetween: number(el, "space", 15),
      pagination: { el: ".sw-pagination-latest", clickable: true },
      navigation: { nextEl: ".nav-prev-latest", prevEl: ".nav-next-latest" },
      breakpoints: {
        575: {
          slidesPerView: number(el, "mobileSm", 2),
          spaceBetween: number(el, "space", 15),
        },
        768: {
          slidesPerView: number(el, "tablet", 2),
          spaceBetween: number(el, "spaceMd", 15),
        },
        1150: {
          slidesPerView: number(el, "preview", 3),
          spaceBetween: number(el, "spaceLg", 30),
        },
      },
    }),
  },
  {
    selector: ".tf-sw-testimonial",
    options: (el) => ({
      slidesPerView: number(el, "mobile", 1),
      spaceBetween: number(el, "space", 15),
      loop: boolean(el, "loop"),
      navigation: {
        nextEl: ".nav-prev-testimonial",
        prevEl: ".nav-next-testimonial",
      },
      pagination: { el: ".sw-pagination-testimonial", clickable: true },
      breakpoints: {
        575: {
          slidesPerView: number(el, "mobileSm", 1),
          spaceBetween: number(el, "space", 15),
        },
        800: {
          slidesPerView: number(el, "tablet", 2),
          spaceBetween: number(el, "spaceMd", 30),
          centeredSlides: false,
        },
        1440: {
          slidesPerView: number(el, "preview", 4.5),
          spaceBetween: number(el, "spaceLg", 30),
          centeredSlides: boolean(el, "centered"),
        },
      },
    }),
  },
  {
    selector: ".tf-sw-partner",
    options: (el) => ({
      autoplay: {
        delay: 0,
        disableOnInteraction: false,
        pauseOnMouseEnter: true,
      },
      slidesPerView: number(el, "mobile", 2),
      spaceBetween: number(el, "space", 15),
      loop: true,
      speed: 3000,
      navigation: { nextEl: ".nav-prev-partner", prevEl: ".nav-next-partner" },
      pagination: { el: ".sw-pagination-partner", clickable: true },
      breakpoints: {
        575: {
          slidesPerView: number(el, "mobileSm", 3),
          spaceBetween: number(el, "space", 15),
        },
        768: {
          slidesPerView: number(el, "tablet", 4),
          spaceBetween: number(el, "spaceMd", 30),
        },
        1200: {
          slidesPerView: number(el, "preview", 6),
          spaceBetween: number(el, "spaceLg", 30),
        },
      },
    }),
  },
  {
    selector: ".tf-sw-categories",
    options: (el) => ({
      slidesPerView: number(el, "mobile", 1),
      spaceBetween: number(el, "space", 15),
      navigation: {
        nextEl: ".nav-prev-category",
        prevEl: ".nav-next-category",
      },
      pagination: { el: ".sw-pagination-category", clickable: true },
      breakpoints: {
        575: {
          slidesPerView: number(el, "mobileSm", 2),
          spaceBetween: number(el, "space", 15),
        },
        768: {
          slidesPerView: number(el, "tablet", 3),
          spaceBetween: number(el, "spaceMd", 30),
        },
        1200: {
          slidesPerView: number(el, "preview", 4),
          spaceBetween: number(el, "spaceLg", 30),
        },
      },
    }),
  },
  {
    selector: ".tf-sw-auto",
    options: (el) => ({
      speed: 2000,
      slidesPerView: "auto",
      spaceBetween: 20,
      loop: boolean(el, "loop"),
      navigation: {
        nextEl: ".nav-prev-category",
        prevEl: ".nav-next-category",
      },
    }),
  },
  {
    selector: ".tf-sw-result",
    options: () => ({
      slidesPerView: 1,
      spaceBetween: 15,
      loop: true,
      navigation: { nextEl: ".nav-next-result", prevEl: ".nav-prev-result" },
      pagination: { el: ".sw-pagination-result", clickable: true },
      breakpoints: {
        600: { slidesPerView: 2, spaceBetween: 20 },
        991: { slidesPerView: 3, spaceBetween: 30 },
        1550: { slidesPerView: 5.2, spaceBetween: 30 },
      },
    }),
  },
  {
    selector: ".slider-sw-home2",
    options: () => ({
      spaceBetween: 0,
      autoplay: { delay: 2000, disableOnInteraction: false },
      speed: 2000,
      effect: "fade",
      fadeEffect: { crossFade: true },
    }),
  },
];

/** Sliders that are only enabled below a breakpoint (`data-screen`). */
const MOBILE_CAROUSELS = [
  {
    selector: ".tf-sw-mobile",
    pagination: ".sw-pagination-mb",
    next: ".nav-prev-mb",
    prev: ".nav-next-mb",
  },
  {
    selector: ".tf-sw-mobile-1",
    pagination: ".sw-pagination-mb-1",
    next: ".nav-prev-mb-1",
    prev: ".nav-next-mb-1",
  },
];

function initThumbPairs(instances) {
  // Vertical thumbnails (property details v1) and the paginated gallery.
  document.querySelectorAll(".thumbs-swiper-column").forEach((element) => {
    const thumbsElement = document.querySelector(".thumbs-swiper-column1");
    if (!thumbsElement) return;
    const thumbs = createSwiper(thumbsElement, {
      spaceBetween: 0,
      slidesPerView: 4,
      freeMode: true,
      direction: "vertical",
      watchSlidesProgress: true,
    });
    instances.push(thumbs);
    instances.push(
      createSwiper(element, {
        spaceBetween: 0,
        autoplay: { delay: 3000, disableOnInteraction: false },
        speed: 500,
        effect: "fade",
        fadeEffect: { crossFade: true },
        thumbs: { swiper: thumbs },
      }),
    );
  });

  document.querySelectorAll(".sw-single").forEach((element) => {
    const thumbsElement = document.querySelector(".thumbs-sw-pagi");
    let thumbs = null;
    if (thumbsElement) {
      thumbs = createSwiper(thumbsElement, {
        spaceBetween: 14,
        slidesPerView: "auto",
        freeMode: true,
        watchSlidesProgress: true,
        breakpoints: {
          375: { slidesPerView: 3, spaceBetween: 14 },
          500: { slidesPerView: "auto" },
        },
      });
      instances.push(thumbs);
    }
    instances.push(
      createSwiper(element, {
        spaceBetween: 16,
        autoplay: { delay: 3000, disableOnInteraction: false },
        speed: 500,
        effect: "fade",
        fadeEffect: { crossFade: true },
        ...(thumbs ? { thumbs: { swiper: thumbs } } : {}),
        navigation: { nextEl: ".nav-prev-single", prevEl: ".nav-next-single" },
      }),
    );
  });
}

/**
 * Boots every carousel present on the current page and tears them down on
 * navigation. Swiper owns its DOM, so a ref-based effect is the supported way
 * to use it from React.
 */
export default function useSwipers(key) {
  useEffect(() => {
    const instances = [];

    for (const { selector, options } of CAROUSELS) {
      document.querySelectorAll(selector).forEach((element) => {
        instances.push(createSwiper(element, options(element)));
      });
    }
    initThumbPairs(instances);

    // Partner carousel pauses while hovered, like the original.
    const partners = [...document.querySelectorAll(".tf-sw-partner")];
    const onEnter = (event) => event.currentTarget.swiper?.autoplay?.stop();
    const onLeave = (event) => event.currentTarget.swiper?.autoplay?.start();
    partners.forEach((element) => {
      element.addEventListener("mouseenter", onEnter);
      element.addEventListener("mouseleave", onLeave);
    });

    const mobileSliders = [];
    const syncMobileSliders = () => {
      for (const config of MOBILE_CAROUSELS) {
        document.querySelectorAll(config.selector).forEach((element) => {
          const width = Number(element.dataset.screen ?? 575);
          const shouldRun = window.matchMedia(
            `only screen and (max-width: ${width}px)`,
          ).matches;
          const existing = mobileSliders.find(
            (item) => item.element === element,
          );
          if (shouldRun && !existing) {
            const swiper = createSwiper(element, {
              slidesPerView: number(element, "preview", 1),
              spaceBetween: number(element, "space", 15),
              speed: 1000,
              pagination: { el: config.pagination, clickable: true },
              navigation: { nextEl: config.next, prevEl: config.prev },
            });
            mobileSliders.push({ element, swiper });
          } else if (!shouldRun && existing) {
            existing.swiper.destroy(true, true);
            mobileSliders.splice(mobileSliders.indexOf(existing), 1);
            element.querySelector(".swiper-wrapper")?.removeAttribute("style");
            element
              .querySelectorAll(".swiper-slide")
              .forEach((slide) => slide.removeAttribute("style"));
          }
        });
      }
    };
    syncMobileSliders();
    window.addEventListener("resize", syncMobileSliders);

    return () => {
      window.removeEventListener("resize", syncMobileSliders);
      partners.forEach((element) => {
        element.removeEventListener("mouseenter", onEnter);
        element.removeEventListener("mouseleave", onLeave);
      });
      mobileSliders.forEach(({ swiper }) => swiper.destroy(true, false));
      instances.forEach((swiper) => swiper.destroy(true, false));
    };
  }, [key]);
}
