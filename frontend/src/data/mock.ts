/**
 * Mock/static data for the GCU demo UI.
 * No API calls — everything the interface renders lives here.
 */

export type Tone = "success" | "warning" | "danger" | "info" | "neutral" | "accent";

/* ------------------------------------------------------------------ */
/* Current user (topbar)                                               */
/* ------------------------------------------------------------------ */

export const currentUser = {
  name: "Ananya Sharma",
  handle: "STUDENT-001",
  role: "STUDENT",
  verified: true,
  notifications: 3,
};

/* ------------------------------------------------------------------ */
/* Sidebar navigation                                                  */
/* ------------------------------------------------------------------ */

export type NavItem = {
  label: string;
  href: string;
  icon:
    | "grid"
    | "folder"
    | "workspace"
    | "spark"
    | "layers"
    | "shield"
    | "gift"
    | "chain";
};

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/", icon: "grid" },
  { label: "Projects", href: "/projects/1", icon: "folder" },
  { label: "Workspace", href: "/projects/1?tab=workspace", icon: "workspace" },
  { label: "AI Research", href: "/projects/1?tab=ai", icon: "spark" },
  { label: "Contributions", href: "/projects/1?tab=contributions", icon: "layers" },
  { label: "Integrity", href: "/projects/1?tab=integrity", icon: "shield" },
  { label: "Rewards", href: "/projects/1?tab=rewards", icon: "gift" },
  { label: "Ledger", href: "/projects/1?tab=ledger", icon: "chain" },
];

/* ------------------------------------------------------------------ */
/* Dashboard statistics                                                */
/* ------------------------------------------------------------------ */

export type Stat = {
  label: string;
  value: string;
  delta: string;
  deltaTone: Tone;
  hint: string;
};

export const stats: Stat[] = [
  {
    label: "Active Projects",
    value: "6",
    delta: "+2 this month",
    deltaTone: "success",
    hint: "4 awaiting milestone review",
  },
  {
    label: "Team Members",
    value: "24",
    delta: "+5 this month",
    deltaTone: "success",
    hint: "Across 6 research projects",
  },
  {
    label: "AI Actions",
    value: "128",
    delta: "+18 today",
    deltaTone: "accent",
    hint: "All actions logged with owners",
  },
  {
    label: "Verified Contributions",
    value: "342",
    delta: "98.2% verified",
    deltaTone: "success",
    hint: "6 awaiting expert review",
  },
];

/* ------------------------------------------------------------------ */
/* Demo project                                                        */
/* ------------------------------------------------------------------ */

export const project = {
  id: "GCU-DEMO-001",
  title:
    "Low-cost detection of diabetic retinopathy from fundus images on edge devices",
  status: "In Progress",
  statusTone: "info" as Tone,
  funding: "₹1,00,000",
  confidentiality: "INTERNAL",
  sponsor: "Dr. Meera Raghavan",
  sponsorOrg: "GCU Innovation Fund",
  progress: 65,
  teamSize: 4,
  milestones: 2,
  createdAt: "28 Sep 2026",
  objective:
    "Develop a low-cost, edge-compatible screening system that detects diabetic retinopathy from fundus photographs and runs within strict latency and power budgets for point-of-care deployment.",
  health: {
    label: "On track",
    tone: "success" as Tone,
    detail: "Milestone 1 funded · 2 open reviews",
  },
};

export type ProjectSummary = {
  id: string;
  title: string;
  status: string;
  statusTone: Tone;
  funding: string;
  progress: number;
  members: number;
  milestones: number;
};

export const projectCards: ProjectSummary[] = [
  {
    id: "GCU-DEMO-001",
    title:
      "Low-cost detection of diabetic retinopathy from fundus images on edge devices",
    status: "In Progress",
    statusTone: "info",
    funding: "₹1,00,000",
    progress: 65,
    members: 4,
    milestones: 2,
  },
  {
    id: "GCU-DEMO-002",
    title: "Federated early-warning model for hospital-acquired infections",
    status: "Open",
    statusTone: "success",
    funding: "₹75,000",
    progress: 15,
    members: 3,
    milestones: 3,
  },
  {
    id: "GCU-DEMO-003",
    title: "Low-power sensor fusion for wildfire smoke detection",
    status: "In Review",
    statusTone: "warning",
    funding: "₹60,000",
    progress: 88,
    members: 5,
    milestones: 2,
  },
];

/* ------------------------------------------------------------------ */
/* Team                                                                */
/* ------------------------------------------------------------------ */

export type Member = {
  name: string;
  handle: string;
  role: string;
  roleTone: Tone;
  skills: string[];
  verified: boolean;
  contribution: number;
  initials: string;
  avatarFrom: string;
  avatarTo: string;
  status?: string;
};

export const team: Member[] = [
  {
    name: "Dr. Meera Raghavan",
    handle: "SPONSOR-001",
    role: "Sponsor",
    roleTone: "accent",
    skills: ["Funding", "Medical Devices", "Clinical Research"],
    verified: true,
    contribution: 0,
    initials: "MR",
    avatarFrom: "#6366f1",
    avatarTo: "#8b5cf6",
    status: "Funder",
  },
  {
    name: "Dr. Samuel Okafor",
    handle: "EXPERT-001",
    role: "Expert",
    roleTone: "info",
    skills: ["Ophthalmology", "AI Ethics", "Peer Review"],
    verified: true,
    contribution: 20,
    initials: "SO",
    avatarFrom: "#0ea5e9",
    avatarTo: "#22d3ee",
    status: "Reviewer",
  },
  {
    name: "Ananya Sharma",
    handle: "STUDENT-001",
    role: "Student A",
    roleTone: "success",
    skills: ["Deep Learning", "PyTorch", "Medical Imaging"],
    verified: true,
    contribution: 50,
    initials: "AS",
    avatarFrom: "#34d399",
    avatarTo: "#22d3ee",
    status: "Lead",
  },
  {
    name: "Rohan Iyer",
    handle: "STUDENT-002",
    role: "Student B",
    roleTone: "success",
    skills: ["Edge Deployment", "CUDA", "MLOps"],
    verified: true,
    contribution: 30,
    initials: "RI",
    avatarFrom: "#f59e0b",
    avatarTo: "#f97316",
    status: "Active",
  },
  {
    name: "Priya Desai",
    handle: "STUDENT-003",
    role: "Student C",
    roleTone: "neutral",
    skills: ["Frontend", "Data Visualization"],
    verified: false,
    contribution: 0,
    initials: "PD",
    avatarFrom: "#a1a1aa",
    avatarTo: "#71717a",
    status: "Invited",
  },
];

/* ------------------------------------------------------------------ */
/* Charter                                                             */
/* ------------------------------------------------------------------ */

export const charter = {
  version: "Charter v1.0",
  accepted: true,
  acceptedBy: "4 of 5 members accepted",
  acceptedAt: "02 Oct 2026",
  sections: [
    {
      title: "Scope",
      body: "Build and validate an edge-compatible diabetic retinopathy screening pipeline: curated fundus dataset, baseline CNN, quantised deployment and clinical evaluation report.",
    },
    {
      title: "Access Rules",
      body: "Project data and artifacts are visible to ACTIVE members only. Confidential sponsor material requires sponsor approval or charter acceptance.",
    },
    {
      title: "IP Ownership",
      body: "Background IP stays with each contributor. Foreground IP is jointly owned by the sponsor and student contributors under the university innovation policy.",
    },
    {
      title: "AI Rules",
      body: "Every AI-generated artifact must declare its human owner and be logged as an AI contribution with actor, action and timestamp. AI cannot be a reward beneficiary.",
    },
    {
      title: "Reward Rules",
      body: "Milestone rewards split 50% Student A / 30% Student B / 20% Expert, released only after expert approval and escrow release. AI share is 0%.",
    },
    {
      title: "Confidentiality",
      body: "Classification: INTERNAL. Sponsor methodology notes are HIGH sensitivity and restricted to sponsor-approved members.",
    },
    {
      title: "Commercialisation",
      body: "Sponsor receives first negotiation rights for 12 months. Revenue share follows the university translational-research policy.",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Milestones                                                          */
/* ------------------------------------------------------------------ */

export type Milestone = {
  index: string;
  title: string;
  reward: string;
  status: string;
  statusTone: Tone;
  progress: number;
  detail: string;
  criteria: string;
};

export const milestones: Milestone[] = [
  {
    index: "M1",
    title: "Dataset & Baseline",
    reward: "₹50,000",
    status: "FUNDED",
    statusTone: "info",
    progress: 78,
    detail: "Curate labelled fundus images and train a baseline grading model.",
    criteria: "Validation AUC ≥ 0.85 with documented data provenance",
  },
  {
    index: "M2",
    title: "Edge Optimization & Validation",
    reward: "₹50,000",
    status: "PENDING",
    statusTone: "neutral",
    progress: 32,
    detail: "Quantise the model and validate accuracy + latency on target hardware.",
    criteria: "Inference < 2s per image on target device, pilot sign-off",
  },
];

/* ------------------------------------------------------------------ */
/* AI research chat                                                    */
/* ------------------------------------------------------------------ */

export const chat = {
  agentId: "RESEARCH-AGENT-001",
  humanOwner: "Student A",
  status: "Action Logged",
  messages: [
    {
      role: "user" as const,
      author: "You",
      text: "What lightweight approaches can be used for edge diabetic retinopathy screening?",
      time: "10:24",
    },
    {
      role: "assistant" as const,
      author: "Research Agent",
      text: "For edge-based diabetic retinopathy screening, three lightweight approaches stand out:\n\n1. Compact convolutions — MobileNetV3-small and EfficientNet-B0 use depthwise-separable convolutions and compound scaling, cutting parameters 5–10× versus a ResNet-50 baseline while preserving lesion-level detail.\n\n2. Post-training quantisation — converting FP32 weights to INT8 shrinks the model ~4× and unlocks integer-only NPUs; use a small calibration set and fall back to quantisation-aware training if accuracy drops beyond tolerance.\n\n3. Structured pruning + distillation — remove entire filters for real latency gains on standard runtimes, then recover accuracy by distilling from the FP32 teacher.\n\nPair any of these with a quality gate on input images and evaluate sensitivity/specificity alongside p95 latency so the model stays practical on resource-constrained devices.",
      time: "10:24",
      sources: ["DOC-001", "DOC-003", "DOC-004"],
    },
    {
      role: "user" as const,
      author: "You",
      text: "What acceptance thresholds did the sponsor agree for the baseline model?",
      time: "10:31",
    },
    {
      role: "assistant" as const,
      author: "Research Agent",
      text: "The sponsor's methodology notes require validation AUC ≥ 0.85 on the held-out set with a fully reproducible training pipeline, and for the edge milestone, INT8 latency under 2 seconds per image with no more than a 2% absolute AUC drop after quantisation.",
      time: "10:31",
      sources: ["DOC-002"],
    },
  ],
};

export const scoping = {
  generatedAt: "06 Oct 2026 · 09:12",
  milestones: [
    {
      title: "Dataset & Baseline",
      skills: ["Python", "Computer Vision", "Machine Learning"],
      deliverable: "Baseline DR classification model + evaluation report",
    },
    {
      title: "Edge Optimization",
      skills: ["Python", "Edge AI", "Optimization"],
      deliverable: "Quantised edge model with latency & accuracy evaluation",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Contributions timeline                                              */
/* ------------------------------------------------------------------ */

export type Contribution = {
  actor: string;
  initials: string;
  action: string;
  type: "HUMAN" | "AI";
  timestamp: string;
  verified: boolean;
  owner?: string;
  avatarFrom: string;
  avatarTo: string;
};

export const contributions: Contribution[] = [
  {
    actor: "Student A",
    initials: "AS",
    action: "Dataset preprocessing",
    type: "HUMAN",
    timestamp: "04 Oct 2026 · 14:32",
    verified: true,
    avatarFrom: "#34d399",
    avatarTo: "#22d3ee",
  },
  {
    actor: "Student B",
    initials: "RI",
    action: "Baseline model",
    type: "HUMAN",
    timestamp: "05 Oct 2026 · 11:15",
    verified: true,
    avatarFrom: "#f59e0b",
    avatarTo: "#f97316",
  },
  {
    actor: "Expert",
    initials: "SO",
    action: "Research review",
    type: "HUMAN",
    timestamp: "05 Oct 2026 · 16:40",
    verified: true,
    avatarFrom: "#0ea5e9",
    avatarTo: "#22d3ee",
  },
  {
    actor: "Research Agent",
    initials: "AI",
    action: "Literature analysis",
    type: "AI",
    timestamp: "06 Oct 2026 · 10:24",
    verified: true,
    owner: "Student A",
    avatarFrom: "#8b5cf6",
    avatarTo: "#6366f1",
  },
];

/* ------------------------------------------------------------------ */
/* Integrity                                                           */
/* ------------------------------------------------------------------ */

export const integrity = {
  score: 82,
  verdict: "Similarity Detected",
  risk: "HIGH" as const,
  status: "Requires Human Review",
  panels: [
    {
      title: "AI-use declaration",
      value: "Declared",
      tone: "success" as Tone,
      detail: "3 AI-assisted artifacts declared with human owners",
    },
    {
      title: "Artifact provenance",
      value: "Trusted",
      tone: "success" as Tone,
      detail: "All 12 artifacts carry signed hash entries",
    },
    {
      title: "Review status",
      value: "Pending",
      tone: "warning" as Tone,
      detail: "Expert re-review queued for artifact ART-009",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Rewards                                                             */
/* ------------------------------------------------------------------ */

export const rewards = {
  milestone: "Milestone 1 · Dataset & Baseline",
  total: "₹50,000",
  note: "Rewards follow charter-defined rules and reviewed contribution impact.",
  rows: [
    { name: "Student A", percent: 50, amount: "₹25,000", tone: "success" as Tone, shareOf: 50 },
    { name: "Student B", percent: 30, amount: "₹15,000", tone: "info" as Tone, shareOf: 30 },
    { name: "Expert", percent: 20, amount: "₹10,000", tone: "accent" as Tone, shareOf: 20 },
    { name: "AI", percent: 0, amount: "₹0", tone: "neutral" as Tone, shareOf: 0 },
  ],
};

/* ------------------------------------------------------------------ */
/* Ledger                                                              */
/* ------------------------------------------------------------------ */

export type LedgerEntry = {
  entry: string;
  actor: string;
  action: string;
  timestamp: string;
  prevHash: string;
  currHash: string;
  status: "Verified" | "Pending" | "Tampered";
};

export const ledgerEntries: LedgerEntry[] = [
  {
    entry: "#0142",
    actor: "STUDENT-001",
    action: "CONTRIBUTION_CREATE",
    timestamp: "06 Oct 2026 · 10:24:07",
    prevHash: "0x8f3a…c21b",
    currHash: "0x1d94…7ae0",
    status: "Verified",
  },
  {
    entry: "#0141",
    actor: "RESEARCH-AGENT-001",
    action: "AI_ACTION_LOG",
    timestamp: "06 Oct 2026 · 10:24:06",
    prevHash: "0x77be…40fd",
    currHash: "0x8f3a…c21b",
    status: "Verified",
  },
  {
    entry: "#0140",
    actor: "EXPERT-001",
    action: "REVIEW_APPROVE",
    timestamp: "05 Oct 2026 · 16:40:51",
    prevHash: "0x2c05…9b13",
    currHash: "0x77be…40fd",
    status: "Verified",
  },
  {
    entry: "#0139",
    actor: "STUDENT-002",
    action: "ARTIFACT_UPLOAD",
    timestamp: "05 Oct 2026 · 11:15:22",
    prevHash: "0xd41f…5e88",
    currHash: "0x2c05…9b13",
    status: "Verified",
  },
  {
    entry: "#0138",
    actor: "SPONSOR-001",
    action: "ESCROW_FUND",
    timestamp: "04 Oct 2026 · 09:02:14",
    prevHash: "0x60ae…1f42",
    currHash: "0xd41f…5e88",
    status: "Verified",
  },
  {
    entry: "#0137",
    actor: "STUDENT-001",
    action: "CONTRIBUTION_CREATE",
    timestamp: "04 Oct 2026 · 14:32:10",
    prevHash: "0x0b93…cc47",
    currHash: "0x60ae…1f42",
    status: "Verified",
  },
];

/* Tampered variant of entry #0141 — shown only in the demo toggle state. */
export const tamperedEntry: LedgerEntry = {
  ...ledgerEntries[1],
  currHash: "0x9999…tampered",
  status: "Tampered",
};

/* ------------------------------------------------------------------ */
/* Security overview                                                   */
/* ------------------------------------------------------------------ */

export const securityChecks = [
  { label: "Identity Verified", detail: "All 5 members KYC-checked", ok: true },
  { label: "Project Access Controlled", detail: "Membership + policy enforced", ok: true },
  { label: "Charter Accepted", detail: "4 of 5 members signed v1.0", ok: true },
  { label: "AI Actions Logged", detail: "128 actions with human owners", ok: true },
  { label: "Ledger Verified", detail: "142 entries · chain intact", ok: true },
];

/* ------------------------------------------------------------------ */
/* Workspace (mock files + agent sessions)                             */
/* ------------------------------------------------------------------ */

export const workspaceFiles = [
  { name: "dataset_card.md", kind: "docs", updated: "04 Oct · 14:28", size: "6 KB" },
  { name: "baseline_eval.json", kind: "metrics", updated: "05 Oct · 11:10", size: "14 KB" },
  { name: "edge_profile_int8.json", kind: "metrics", updated: "06 Oct · 09:41", size: "9 KB" },
  { name: "preprocess_pipeline.py", kind: "code", updated: "04 Oct · 13:55", size: "11 KB" },
];

export const agentSessions = [
  { agent: "RESEARCH-AGENT-001", action: "Literature analysis", owner: "Student A", time: "10:24" },
  { agent: "SCOPING-AGENT-001", action: "Milestone generation", owner: "Student A", time: "09:12" },
  { agent: "RESEARCH-AGENT-001", action: "Threshold lookup", owner: "Student B", time: "Yesterday" },
];
