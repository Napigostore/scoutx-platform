import { howItWorksSteps } from "@scoutx/mock-data";
import { HeroSection } from "@/components/landing/hero-section";
import { LiveMarketplaceDiscovery } from "@/components/landing/live-marketplace-discovery";
import { TopScoutersSection } from "@/components/landing/top-scouters-section";
import { TopMissionsSection } from "@/components/landing/top-missions-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { MissionComposerPlaceholder } from "@/components/landing/mission-composer-placeholder";

export const revalidate = 0;

export default async function HomePage() {
  return (
    <>
      <HeroSection />
      <LiveMarketplaceDiscovery />
      <TopScoutersSection />
      <TopMissionsSection />
      <MissionComposerPlaceholder />
      <HowItWorksSection steps={howItWorksSteps} />
    </>
  );
}
