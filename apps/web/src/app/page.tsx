import { howItWorksSteps } from "@scoutx/mock-data";
import { HeroSection } from "@/components/landing/hero-section";
import { BrandPillarsSection } from "@/components/landing/brand-pillars";
import { Live3ColumnMissionsSection } from "@/components/landing/live-3column-missions-section";
import { LiveMarketplaceDiscovery } from "@/components/landing/live-marketplace-discovery";
import { TopScoutersSection } from "@/components/landing/top-scouters-section";
import { TopDisputesSection } from "@/components/landing/top-disputes-section";
import { TopMissionsSection } from "@/components/landing/top-missions-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { MissionComposerPlaceholder } from "@/components/landing/mission-composer-placeholder";

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function HomePage() {
  return (
    <>
      <HeroSection />
      <BrandPillarsSection />
      <Live3ColumnMissionsSection />
      <LiveMarketplaceDiscovery />
      <TopDisputesSection />
      <TopScoutersSection />
      <TopMissionsSection />
      <MissionComposerPlaceholder />
      <HowItWorksSection steps={howItWorksSteps} />
    </>
  );
}
