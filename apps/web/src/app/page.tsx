import { getTrendingMissions, howItWorksSteps } from "@scoutx/mock-data";

import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { MissionComposerPlaceholder } from "@/components/landing/mission-composer-placeholder";
import { TrendingSection } from "@/components/landing/trending-section";

export default function HomePage() {
  const trending = getTrendingMissions(6);

  return (
    <>
      <HeroSection />
      <MissionComposerPlaceholder />
      <HowItWorksSection steps={howItWorksSteps} />
      <TrendingSection missions={trending} />
    </>
  );
}
