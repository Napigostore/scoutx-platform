import { MissionOs } from "@/components/mission-os";
import type { MissionOsData } from "@/components/mission-os";

/* ─── Mock data ─── */

const MOCK_MISSION_OS: MissionOsData = {
  navSections: [
    {
      id: "intel",
      label: "Intelligence",
      items: [
        {
          id: "intel-active",
          label: "Active Missions",
          href: "/missions",
          icon: "radar",
          count: 3,
        },
        { id: "intel-feed", label: "Live Feed", href: "/market", icon: "activity" },
        { id: "intel-map", label: "Map View", href: "/missions/map", icon: "map" },
        {
          id: "intel-breaking",
          label: "Breaking Intel",
          href: "/market",
          icon: "compass",
          count: 2,
        },
      ],
    },
    {
      id: "operations",
      label: "Operations",
      items: [
        { id: "ops-scouts", label: "Scouts", href: "/scouts", icon: "users", count: 4 },
        { id: "ops-chat", label: "Messages", href: "/messages", icon: "message", count: 12 },
        { id: "ops-wallet", label: "Wallet", href: "/wallet", icon: "wallet" },
      ],
    },
    {
      id: "analytics",
      label: "Analytics",
      items: [
        { id: "analytics-trust", label: "Trust Scores", href: "/trust", icon: "shield" },
        { id: "analytics-coin", label: "Coin Activity", href: "/coin", icon: "wallet" },
      ],
    },
    {
      id: "settings",
      label: "System",
      items: [
        { id: "settings-ai", label: "AI Assistant", href: "/assistant", icon: "bot" },
        { id: "settings-config", label: "Settings", href: "/settings", icon: "settings" },
      ],
    },
  ],

  activeNavItemId: "intel-active",

  missionCenter: {
    id: "ms-001",
    title: "Flood Damage Assessment — Riverside Market",
    description:
      "Structural evaluation and flood extent mapping of the main market area. Scouts are to document water levels, structural damage to vendor stalls, road accessibility, and photo evidence of all affected zones. Priority for local relief coordination.",
    category: "ENVIRONMENT",
    status: "in_progress",
    urgency: "HIGH",
    location: "Kampala, Uganda",
    coordinates: { latitude: 0.3136, longitude: 32.5811 },
    assignedScouts: ["@scout_kato", "@scout_amina"],
    requesterName: "@alice_responder",
    createdAt: "2025-07-18T08:00:00Z",
    expiresAt: "2025-07-20T08:00:00Z",
  },

  evidence: [
    {
      id: "ev-001",
      caption: "Main entrance flood level",
      type: "photo",
      capturedAt: "2025-07-18T09:23:00Z",
      capturedBy: "@scout_kato",
      verified: true,
      location: "North entrance",
    },
    {
      id: "ev-002",
      caption: "Structural crack east wall",
      type: "photo",
      capturedAt: "2025-07-18T09:45:00Z",
      capturedBy: "@scout_kato",
      verified: true,
      location: "East wall section C",
    },
    {
      id: "ev-003",
      caption: "North road blocked by debris",
      type: "photo",
      capturedAt: "2025-07-18T10:12:00Z",
      capturedBy: "@scout_amina",
      verified: false,
      location: "North access road",
    },
    {
      id: "ev-004",
      caption: "Vendor stall collapse zone",
      type: "video",
      capturedAt: "2025-07-18T10:30:00Z",
      capturedBy: "@scout_amina",
      verified: false,
      location: "Section B stalls",
    },
    {
      id: "ev-005",
      caption: "Water level at 40cm — entrance marker",
      type: "photo",
      capturedAt: "2025-07-18T11:00:00Z",
      capturedBy: "@scout_kato",
      verified: true,
      location: "Main entrance",
    },
    {
      id: "ev-006",
      caption: "Field observation: drainage assessment",
      type: "note",
      capturedAt: "2025-07-18T11:15:00Z",
      capturedBy: "@scout_amina",
      verified: false,
      location: "South drain",
    },
  ],

  timeline: [
    {
      id: "tl-001",
      type: "phase",
      summary: "Investigation launched",
      detail: "Requester opened case for immediate flood assessment",
      actor: "@alice_responder",
      timestamp: "2025-07-18T08:00:00Z",
    },
    {
      id: "tl-002",
      type: "scout",
      summary: "@scout_kato assigned to mission",
      detail: "Lead field investigator - covers north and east zones",
      actor: "System",
      timestamp: "2025-07-18T08:30:00Z",
    },
    {
      id: "tl-003",
      type: "scout",
      summary: "@scout_amina assigned to mission",
      detail: "Support scout - covers south and west zones",
      actor: "System",
      timestamp: "2025-07-18T08:45:00Z",
    },
    {
      id: "tl-004",
      type: "evidence",
      summary: "Photo evidence uploaded — entrance flood",
      detail: "First evidence submission received",
      actor: "@scout_kato",
      timestamp: "2025-07-18T09:23:00Z",
      amount: 25,
    },
    {
      id: "tl-005",
      type: "evidence",
      summary: "Photo evidence uploaded — structural crack",
      detail: "Crack measures ~2m along east wall",
      actor: "@scout_kato",
      timestamp: "2025-07-18T09:45:00Z",
      amount: 25,
    },
    {
      id: "tl-006",
      type: "verify",
      summary: "Entrance flood evidence verified",
      detail: "2/2 verifiers confirmed accuracy",
      actor: "System",
      timestamp: "2025-07-18T10:00:00Z",
    },
    {
      id: "tl-007",
      type: "verify",
      summary: "Structural crack evidence verified",
      detail: "2/2 verifiers confirmed crack dimensions",
      actor: "System",
      timestamp: "2025-07-18T10:15:00Z",
    },
    {
      id: "tl-008",
      type: "coin",
      summary: "Bounty escalated to 250 ⛭",
      detail: "Automatic escalation triggered after 30 min of activity",
      actor: "System",
      timestamp: "2025-07-18T10:30:00Z",
      amount: 50,
    },
    {
      id: "tl-009",
      type: "note",
      summary: "@requester requested structural focus",
      detail: "Updated mission brief to prioritize structural assessment",
      actor: "@alice_responder",
      timestamp: "2025-07-18T10:45:00Z",
    },
    {
      id: "tl-010",
      type: "evidence",
      summary: "Video evidence — vendor stall collapse",
      detail: "360° pan of collapsed section B",
      actor: "@scout_amina",
      timestamp: "2025-07-18T11:00:00Z",
      amount: 35,
    },
  ],

  activity: [
    {
      id: "ac-001",
      type: "scout_moved",
      summary: "@scout_kato arrived at north entrance",
      actor: "@scout_kato",
      timestamp: "2025-07-18T09:20:00Z",
    },
    {
      id: "ac-002",
      type: "evidence_uploaded",
      summary: "Photo uploaded: main entrance flood level",
      actor: "@scout_kato",
      timestamp: "2025-07-18T09:23:00Z",
    },
    {
      id: "ac-003",
      type: "scout_moved",
      summary: "@scout_amina reached south access point",
      actor: "@scout_amina",
      timestamp: "2025-07-18T09:40:00Z",
    },
    {
      id: "ac-004",
      type: "evidence_uploaded",
      summary: "Photo uploaded: structural crack east wall",
      actor: "@scout_kato",
      timestamp: "2025-07-18T09:45:00Z",
    },
    {
      id: "ac-005",
      type: "scout_moved",
      summary: "@scout_kato moving to east wall section C",
      actor: "@scout_kato",
      timestamp: "2025-07-18T09:50:00Z",
    },
    {
      id: "ac-006",
      type: "verifier_action",
      summary: "Verifier #1 confirmed entrance flood evidence",
      actor: "@verifier_01",
      timestamp: "2025-07-18T09:55:00Z",
    },
    {
      id: "ac-007",
      type: "status_change",
      summary: "First verification threshold met",
      actor: "System",
      timestamp: "2025-07-18T10:00:00Z",
    },
    {
      id: "ac-008",
      type: "evidence_uploaded",
      summary: "Photo uploaded: north road blockage",
      actor: "@scout_amina",
      timestamp: "2025-07-18T10:12:00Z",
    },
    {
      id: "ac-009",
      type: "coin_event",
      summary: "Bounty escalated +50 ⛭",
      actor: "System",
      timestamp: "2025-07-18T10:30:00Z",
    },
    {
      id: "ac-010",
      type: "evidence_uploaded",
      summary: "Video uploaded: vendor stall collapse zone",
      actor: "@scout_amina",
      timestamp: "2025-07-18T11:00:00Z",
    },
  ],

  coinPanel: {
    currentBounty: 250,
    initialBounty: 200,
    maxCap: 500,
    escalationAmount: 50,
    escalationLabel: "30 min",
    escalationActive: true,
    totalEarned: 135,
    recentTransactions: [
      {
        id: "tx-001",
        amount: 50,
        reason: "Escalation @ T+30min",
        actor: "System",
        timestamp: "2025-07-18T10:30:00Z",
      },
      {
        id: "tx-002",
        amount: 25,
        reason: "Photo evidence bonus — entrance",
        actor: "@scout_kato",
        timestamp: "2025-07-18T09:23:00Z",
      },
      {
        id: "tx-003",
        amount: 25,
        reason: "Photo evidence bonus — crack",
        actor: "@scout_kato",
        timestamp: "2025-07-18T09:45:00Z",
      },
      {
        id: "tx-004",
        amount: 35,
        reason: "Video evidence bonus — stalls",
        actor: "@scout_amina",
        timestamp: "2025-07-18T11:00:00Z",
      },
    ],
  },

  scouts: [
    {
      scoutName: "@scout_kato",
      reliability: 92,
      completedMissions: 47,
      badges: ["Verified Reporter", "Speed Scout", "Photo Specialist"],
      lastActive: "2 min ago",
    },
    {
      scoutName: "@scout_amina",
      reliability: 88,
      completedMissions: 31,
      badges: ["Verified Reporter", "Field Veteran"],
      lastActive: "1 min ago",
    },
  ],

  verifiers: [
    {
      verifierName: "@verifier_01",
      verificationsDone: 203,
      acceptanceRate: 96,
    },
    {
      verifierName: "@verifier_02",
      verificationsDone: 156,
      acceptanceRate: 91,
    },
  ],
};

interface MissionOsPageProps {
  params: Promise<{ missionId: string }>;
}

export default async function MissionOsPage({ params }: MissionOsPageProps) {
  const { missionId: _missionId } = await params;
  return <MissionOs data={MOCK_MISSION_OS} />;
}
