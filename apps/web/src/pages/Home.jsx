import HeroSearch from "../features/home/HeroSearch";
import { useCounts, useFeatured } from "../features/home/useFeatured";
import ToolsSection from "../features/home/Tools";
import {
  CategoryStrip,
  DistrictGrid,
  FeaturedListings,
  HowItWorks,
  NewsStrip,
  PromiseStrip,
  StatsBand,
  TrustAndCta,
  WhyLocatex,
} from "../features/home/HomeSections";

/**
 * LocateX home page.
 *
 * Sections are composed from `src/features/home` and fed by `src/content`, which stands in
 * for the API described in `docs/03-technical-spec.md`. Swapping the content module for
 * queries changes no markup.
 */
export default function Home() {
  // Real listings, not the theme's demo data. Featured first, newest after — so the page
  // is never empty on the day the site goes live and nobody has been featured yet.
  const { listings } = useFeatured();
  const counts = useCounts();
  return (
    <>
      <HeroSearch />
      <PromiseStrip />
      <CategoryStrip counts={counts} />
      <FeaturedListings items={listings} />
      <DistrictGrid counts={counts} />
      <WhyLocatex />
      <HowItWorks />
      <ToolsSection />
      <StatsBand />
      <NewsStrip />
      <TrustAndCta />
    </>
  );
}
