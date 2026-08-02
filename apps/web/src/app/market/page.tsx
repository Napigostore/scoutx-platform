import { MarketDashboard } from "@/components/market/market-dashboard";
import type { MarketDashboardData } from "@/components/market/market-dashboard";

/* ─── Mock data for development ─── */

const MOCK_MARKET_DATA: MarketDashboardData = {
  /* ── Live Feed ── */
  liveFeed: [
    {
      id: "lf-001",
      type: "scout_joined",
      summary: "Scout Kato joined investigation #inv-042 — Flood Assessment",
      actor: "@scout_kato",
      timestamp: "2025-07-18T14:23:00Z",
    },
    {
      id: "lf-002",
      type: "evidence",
      summary: "New evidence uploaded: Bridge structural crack at Jinja Road",
      actor: "@scout_amina",
      timestamp: "2025-07-18T14:18:00Z",
      bounty: 50,
    },
    {
      id: "lf-003",
      type: "verify",
      summary: "Verification threshold met: Water quality samples — Lake Victoria",
      actor: "System",
      timestamp: "2025-07-18T14:12:00Z",
    },
    {
      id: "lf-004",
      type: "coin",
      summary: "Bounty paid out: Storm drain assessment — Kampala",
      actor: "@scout_kato",
      timestamp: "2025-07-18T14:05:00Z",
      bounty: 200,
    },
    {
      id: "lf-005",
      type: "created",
      summary: "New investigation opened: Traffic congestion at Entebbe Road",
      actor: "@requester_cityplan",
      timestamp: "2025-07-18T13:55:00Z",
      bounty: 150,
    },
    {
      id: "lf-006",
      type: "trust",
      summary: "Scout Amina received Endorsed badge for verified reports",
      actor: "@scout_amina",
      timestamp: "2025-07-18T13:48:00Z",
    },
    {
      id: "lf-007",
      type: "update",
      summary: "Bounty escalated to 300 ⛭ on Market Fire Assessment",
      actor: "System",
      timestamp: "2025-07-18T13:40:00Z",
    },
    {
      id: "lf-008",
      type: "scout_joined",
      summary: "Scout Musa joined investigation: Road damage assessment",
      actor: "@scout_musa",
      timestamp: "2025-07-18T13:32:00Z",
    },
  ],

  /* ── Trending ── */
  trending: [
    {
      id: "tr-001",
      label: "Flood Damage",
      category: "ENVIRONMENT",
      delta: 24,
      volume: 156,
    },
    {
      id: "tr-002",
      label: "Bridge Inspection",
      category: "INFRASTRUCTURE",
      delta: 18,
      volume: 89,
    },
    {
      id: "tr-003",
      label: "Water Quality",
      category: "ENVIRONMENT",
      delta: 12,
      volume: 203,
    },
    {
      id: "tr-004",
      label: "Road Conditions",
      category: "INFRASTRUCTURE",
      delta: 8,
      volume: 312,
    },
    {
      id: "tr-005",
      label: "Fire Risk Assessment",
      category: "SAFETY",
      delta: -3,
      volume: 67,
    },
  ],

  /* ── Market Stats ── */
  marketStats: [
    {
      key: "active-investigations",
      label: "Active Cases",
      value: 47,
      format: "count",
      delta: 12,
    },
    {
      key: "scouts-online",
      label: "Scouts Online",
      value: 183,
      format: "count",
      delta: 8,
    },
    {
      key: "coins-circulation",
      label: "Coins in Circulation",
      value: 28450,
      format: "coins",
      delta: 5,
    },
    {
      key: "verification-rate",
      label: "Verification Rate",
      value: 94,
      format: "percentage",
      delta: 2,
    },
  ],

  /* ── Coin Activity ── */
  coinActivity: [
    {
      id: "ca-001",
      actor: "@scout_kato",
      reason: "Flood Assessment bounty paid",
      amount: 200,
      timestamp: "2025-07-18T14:23:00Z",
    },
    {
      id: "ca-002",
      actor: "@scout_amina",
      reason: "Bridge inspection evidence bonus",
      amount: 75,
      timestamp: "2025-07-18T14:15:00Z",
    },
    {
      id: "ca-003",
      actor: "@requester_cityplan",
      reason: "Created new investigation bounty",
      amount: -150,
      timestamp: "2025-07-18T13:55:00Z",
    },
    {
      id: "ca-004",
      actor: "@scout_musa",
      reason: "Verification reward for road report",
      amount: 50,
      timestamp: "2025-07-18T13:40:00Z",
    },
    {
      id: "ca-005",
      actor: "@scout_grace",
      reason: "Market assessment completion bonus",
      amount: 120,
      timestamp: "2025-07-18T13:28:00Z",
    },
  ],

  /* ── Trust Activity ── */
  trustActivity: [
    {
      id: "ta-001",
      actor: "@scout_amina",
      action: "verified",
      target: "Flood level report by @scout_kato",
      timestamp: "2025-07-18T14:20:00Z",
    },
    {
      id: "ta-002",
      actor: "@scout_kato",
      action: "endorsed",
      target: "@scout_amina for water quality report",
      timestamp: "2025-07-18T14:10:00Z",
    },
    {
      id: "ta-003",
      actor: "@scout_musa",
      action: "badge_earned",
      target: "Verified Reporter Badge",
      timestamp: "2025-07-18T14:00:00Z",
    },
    {
      id: "ta-004",
      actor: "@verifier_01",
      action: "verified",
      target: "Road damage photos by @scout_musa",
      timestamp: "2025-07-18T13:48:00Z",
    },
    {
      id: "ta-005",
      actor: "@scout_grace",
      action: "disputed",
      target: "Market stall count in Market Fire Assessment",
      timestamp: "2025-07-18T13:35:00Z",
    },
  ],

  /* ── Global Activity ── */
  globalActivity: [
    {
      id: "ga-001",
      location: "Kampala, Uganda",
      summary: "Flood Assessment underway — 2 scouts active",
      type: "field_report",
      timestamp: "2025-07-18T14:23:00Z",
    },
    {
      id: "ga-002",
      location: "Nairobi, Kenya",
      summary: "Traffic congestion report verified by 3 witnesses",
      type: "verification",
      timestamp: "2025-07-18T14:18:00Z",
    },
    {
      id: "ga-003",
      location: "Lagos, Nigeria",
      summary: "Market price survey completed — 200 ⛭ payout",
      type: "coin_event",
      timestamp: "2025-07-18T14:05:00Z",
    },
    {
      id: "ga-004",
      location: "Cairo, Egypt",
      summary: "Scout Kato reached 50 verified reports milestone",
      type: "scout_milestone",
      timestamp: "2025-07-18T13:55:00Z",
    },
    {
      id: "ga-005",
      location: "Accra, Ghana",
      summary: "New investigation: Coastal erosion assessment",
      type: "field_report",
      timestamp: "2025-07-18T13:42:00Z",
    },
    {
      id: "ga-006",
      location: "Dar es Salaam, Tanzania",
      summary: "Road damage report verified — payouts processed",
      type: "verification",
      timestamp: "2025-07-18T13:30:00Z",
    },
  ],

  /* ── Breaking Intelligence ── */
  breakingIntel: [
    {
      id: "bi-001",
      title: "Flooding at Riverside Market — Critical",
      location: "Kampala, Uganda",
      category: "ENVIRONMENT",
      urgency: "critical",
      timestamp: "2025-07-18T14:23:00Z",
      bounty: 250,
    },
    {
      id: "bi-002",
      title: "Suspected Structural Damage — Jinja Road Bridge",
      location: "Jinja, Uganda",
      category: "INFRASTRUCTURE",
      urgency: "high",
      timestamp: "2025-07-18T14:00:00Z",
      bounty: 350,
    },
    {
      id: "bi-003",
      title: "Water Contamination Alert — Lake Victoria",
      location: "Entebbe, Uganda",
      category: "ENVIRONMENT",
      urgency: "critical",
      timestamp: "2025-07-18T13:45:00Z",
      bounty: 400,
    },
    {
      id: "bi-004",
      title: "Traffic Disruption — Entebbe Road",
      location: "Kampala, Uganda",
      category: "INFRASTRUCTURE",
      urgency: "medium",
      timestamp: "2025-07-18T13:30:00Z",
      bounty: 150,
    },
  ],

  /* ── Top Investigations ── */
  topInvestigations: [
    {
      id: "inv-042",
      title: "Flood Damage Assessment at Riverside Market",
      category: "ENVIRONMENT",
      location: "Kampala, Uganda",
      bounty: 250,
      status: "hot",
      scoutCount: 3,
    },
    {
      id: "inv-038",
      title: "Bridge Inspection at Jinja Road",
      category: "INFRASTRUCTURE",
      location: "Jinja, Uganda",
      bounty: 350,
      status: "active",
      scoutCount: 2,
    },
    {
      id: "inv-041",
      title: "Water Contamination Testing — Lake Victoria",
      category: "ENVIRONMENT",
      location: "Entebbe, Uganda",
      bounty: 400,
      status: "hot",
      scoutCount: 4,
    },
    {
      id: "inv-035",
      title: "Storm Drain Assessment — Nakivubo",
      category: "INFRASTRUCTURE",
      location: "Kampala, Uganda",
      bounty: 200,
      status: "active",
      scoutCount: 1,
    },
    {
      id: "inv-029",
      title: "Market Fire Damage Survey",
      category: "SAFETY",
      location: "Nairobi, Kenya",
      bounty: 300,
      status: "open",
      scoutCount: 0,
    },
  ],
};

export default function MarketPage() {
  return <MarketDashboard data={MOCK_MARKET_DATA} />;
}
