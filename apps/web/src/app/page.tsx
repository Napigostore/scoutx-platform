import { howItWorksSteps } from "@scoutx/mock-data";
import { prisma } from "@/lib/prisma";
import { HeroSection } from "@/components/landing/hero-section";
import { HowItWorksSection } from "@/components/landing/how-it-works-section";
import { MissionComposerPlaceholder } from "@/components/landing/mission-composer-placeholder";
import { TrendingSection } from "@/components/landing/trending-section";

export const revalidate = 0;

export default async function HomePage() {
  const dbMissions = await prisma.mission.findMany({
    where: {
      status: "OPEN",
      assignedScoutId: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
    take: 6,
  });

  const trending = dbMissions.map((m) => {
    const amount = m.budgetCents;
    const currency = m.currency.trim().toUpperCase();
    const budgetLabel =
      currency === "VND"
        ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount)
        : new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(
            amount / 100,
          );

    return {
      id: m.id,
      title: m.title,
      category: m.category,
      urgency: m.urgency,
      city: "Ho Chi Minh City",
      country: "Vietnam",
      budgetLabel,
      status: m.status,
    };
  });

  return (
    <>
      <HeroSection />
      <MissionComposerPlaceholder />
      <HowItWorksSection steps={howItWorksSteps} />
      <TrendingSection missions={trending} />
    </>
  );
}
