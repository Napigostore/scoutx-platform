import { InvestigationHero } from "@/components/investigation/investigation-hero";
import { InvestigationWorkspace } from "@/components/investigation/investigation-workspace";
import { getInvestigationData } from "@/lib/fetch-investigation";

interface InvestigationPageProps {
  params: Promise<{ id: string }>;
}

export default async function InvestigationPage({ params }: InvestigationPageProps) {
  const { id } = await params;
  const { hero, workspace } = await getInvestigationData(id);

  return (
    <main>
      <InvestigationHero investigation={hero} />
      <InvestigationWorkspace data={workspace} />
    </main>
  );
}
