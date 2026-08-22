import HeroSearch from "../features/home/HeroSearch";
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
  return (
    <>
      <HeroSearch />
      <PromiseStrip />
      <CategoryStrip />
      <FeaturedListings />
      <DistrictGrid />
      <WhyLocatex />
      <HowItWorks />
      <ToolsSection />
      <StatsBand />
      <NewsStrip />
      <TrustAndCta />
    </>
  );
}
