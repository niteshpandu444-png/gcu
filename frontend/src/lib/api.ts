/**
 * GCU frontend API client.
 *
 * Talks to the FastAPI backend at http://127.0.0.1:8000, attaching the JWT
 * stored at login automatically. No external dependencies — plain fetch.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://127.0.0.1:8000";

/* --------------------------------- types --------------------------------- */

export type Role = "STUDENT" | "EXPERT" | "SPONSOR" | "ADMIN";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: Role;
  skills?: string;
  verification_status?: string;
}

export interface ProjectOut {
  id: number;
  sponsor_id: number;
  title: string;
  public_summary: string;
  confidential_brief: string | null;
  funding: number;
  confidentiality: string;
  status: string;
  created_at: string;
  can_view_confidential_brief: boolean;
  code: string | null;
  team_state: string;
}

export interface MemberOut {
  id: number;
  project_id: number;
  user_id: number;
  role: string;
  status: "INVITED" | "ACTIVE" | "REJECTED" | "LEFT" | "REVOKED";
  joined_at: string;
  user_name: string;
  user_email: string;
  skills: string;
  charter_version: number | null;
}

export interface CharterSectionData {
  scope: string;
  access_rules: string;
  ip_rules: string;
  ai_rules: string;
  reward_rules: string;
  dispute_rules: string;
  confidentiality_rules: string;
  commercialisation_rules: string;
}

export interface CharterOut extends CharterSectionData {
  id: number;
  project_id: number;
  version: number;
  status: "DRAFT" | "APPROVED";
  approved_by: number | null;
  approved_at: string | null;
  created_at: string;
}

export interface ScopeMilestone {
  title: string;
  description: string;
  required_skills: string[];
  deliverable: string;
  acceptance_criteria: string[];
}

export interface MatchCandidate {
  user_id: number;
  name: string;
  role: string;
  score: number;
  matched_skills: string[];
  reasons: string[];
}

export interface MatchResult {
  project_id: number;
  required_skills: string[];
  recommended_expert: MatchCandidate | null;
  recommended_students: MatchCandidate[];
  source?: string;
}

export interface MilestoneOut {
  id: number;
  project_id: number;
  title: string;
  description: string;
  deliverable: string;
  acceptance_criteria: string;
  reward: number;
  status: string;
  created_at: string;
}

export interface RewardRow {
  id?: number;
  milestone_id: number;
  user_id: number;
  user_name?: string;
  amount: number;
  reason?: string;
  status: string;
}

export interface LedgerRow {
  id?: number;
  entry_id: number;
  project_id: number;
  actor_id: number | null;
  actor_name: string;
  actor_type: string;
  action: string;
  artifact_id: string | null;
  timestamp: string;
  previous_hash: string;
  current_hash: string;
  details: string;
}

export interface LedgerVerify {
  valid: boolean;
  entries_checked: number;
  broken_at_entry?: number | null;
  reason?: string | null;
  details?: string | null;
  latest_hash?: string | null;
}

export interface ResearchResult {
  project_id: number | string;
  agent_id: string;
  human_owner_id: number | string;
  answer: string;
  sources: string[];
  source: string;
}

/* --------------------------------- session -------------------------------- */

const TOKEN_KEY = "gcu_token";
const USER_KEY = "gcu_user";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: SessionUser): void {
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearSession(): void {
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function roleHome(role: string): string {
  switch (role) {
    case "SPONSOR":
      return "/sponsor";
    case "EXPERT":
      return "/expert";
    case "ADMIN":
      return "/admin";
    default:
      return "/student";
  }
}

/* --------------------------------- core ---------------------------------- */

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; auth?: boolean } = {},
): Promise<T> {
  const { method = "GET", body, auth = true } = options;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  let data: unknown = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = null;
    }
  }

  if (!res.ok) {
    const detail =
      data && typeof data === "object" && "detail" in data
        ? String((data as { detail: unknown }).detail)
        : `Request failed (${res.status})`;
    throw new ApiError(res.status, detail);
  }
  return data as T;
}

/* --------------------------------- API ----------------------------------- */

export const api = {
  /* auth */
  login: (email: string, password: string) =>
    request<{ access_token: string; user: SessionUser }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    }),
  me: () => request<SessionUser>("/api/auth/me"),

  /* projects */
  listProjects: () => request<ProjectOut[]>("/api/projects"),
  getProject: (id: number | string) => request<ProjectOut>(`/api/projects/${id}`),
  createProject: (payload: {
    title: string;
    public_summary?: string;
    confidential_brief?: string;
    funding?: number;
    confidentiality?: string;
    code?: string;
  }) => request<ProjectOut>("/api/projects", { method: "POST", body: payload }),

  /* members */
  listMembers: (projectId: number | string) =>
    request<MemberOut[]>(`/api/projects/${projectId}/members`),
  invite: (projectId: number | string, userId: number) =>
    request<MemberOut>(`/api/projects/${projectId}/members/${userId}/invite`, {
      method: "POST",
      body: {},
    }),
  acceptInvite: (projectId: number | string, userId: number) =>
    request<MemberOut>(`/api/projects/${projectId}/members/${userId}/accept`, {
      method: "POST",
      body: {},
    }),
  rejectInvite: (projectId: number | string, userId: number) =>
    request<MemberOut>(`/api/projects/${projectId}/members/${userId}/reject`, {
      method: "POST",
      body: {},
    }),

  /* charter */
  getCharter: (projectId: number | string) =>
    request<CharterOut>(`/api/projects/${projectId}/charter`),
  approveCharter: (projectId: number | string) =>
    request<CharterOut>(`/api/projects/${projectId}/charter/approve`, {
      method: "POST",
      body: {},
    }),
  acceptCharter: (projectId: number | string) =>
    request<{ id: number; charter_id: number; user_id: number; accepted_at: string }>(
      `/api/projects/${projectId}/charter/accept`,
      { method: "POST", body: {} },
    ),

  /* AI */
  aiScope: (projectId: number | string, problem: string) =>
    request<{ project_id: number | string; milestones: ScopeMilestone[]; source: string }>(
      "/api/ai/scope",
      { method: "POST", body: { project_id: projectId, problem } },
    ),
  aiCharter: (projectId: number | string, problem: string) =>
    request<{
      project_id: number | string;
      source: string;
      charter: CharterOut;
      required_skills: string[];
      milestones: ScopeMilestone[];
    }>("/api/ai/charter", { method: "POST", body: { project_id: projectId, problem } }),
  aiMatch: (projectId: number | string) =>
    request<MatchResult>("/api/ai/match", {
      method: "POST",
      body: { project_id: projectId },
    }),
  aiResearch: (projectId: number | string, question: string, humanOwnerId?: string) =>
    request<ResearchResult>("/api/ai/research", {
      method: "POST",
      body: {
        project_id: projectId,
        question,
        ...(humanOwnerId ? { human_owner_id: humanOwnerId } : {}),
      },
    }),

  /* milestones & work */
  listMilestones: (projectId: number | string) =>
    request<MilestoneOut[]>(`/api/projects/${projectId}/milestones`),
  createMilestone: (projectId: number | string, payload: { title: string; reward: number }) =>
    request<MilestoneOut>(`/api/projects/${projectId}/milestones`, {
      method: "POST",
      body: payload,
    }),
  listContributions: (projectId: number | string) =>
    request<Record<string, unknown>[]>(`/api/projects/${projectId}/contributions`),
  createContribution: (
    projectId: number | string,
    payload: {
      milestone_id?: number | null;
      actor_type?: string;
      human_owner_id?: number;
      action: string;
      description: string;
      artifact_id?: string;
      verified?: boolean;
    },
  ) =>
    request<Record<string, unknown>>(`/api/projects/${projectId}/contributions`, {
      method: "POST",
      body: payload,
    }),

  /* reviews */
  listReviews: (projectId: number | string) =>
    request<Record<string, unknown>[]>(`/api/projects/${projectId}/reviews`),
  createReview: (
    projectId: number | string,
    payload: { milestone_id: number; decision: string; comment?: string },
  ) =>
    request<Record<string, unknown>>(`/api/projects/${projectId}/reviews`, {
      method: "POST",
      body: payload,
    }),

  /* escrow & rewards */
  fundEscrow: (projectId: number | string, milestoneId: number) =>
    request<Record<string, unknown>>(`/api/projects/${projectId}/escrow/fund`, {
      method: "POST",
      body: { milestone_id: milestoneId },
    }),
  releaseEscrow: (projectId: number | string, milestoneId: number) =>
    request<Record<string, unknown>>(`/api/projects/${projectId}/escrow/release`, {
      method: "POST",
      body: { milestone_id: milestoneId },
    }),
  getRewards: (projectId: number | string) =>
    request<{
      project_id: number;
      split_rules: string[];
      rewards: RewardRow[];
      total_distributed: number;
      total_ai_share: number;
    }>(`/api/projects/${projectId}/rewards`),

  /* ledger */
  getLedger: (projectId: number | string) =>
    request<LedgerRow[]>(`/api/projects/${projectId}/ledger`),
  verifyLedger: (projectId: number | string, tamper = false) =>
    request<LedgerVerify>(
      `/api/projects/${projectId}/ledger/verify${tamper ? "?tamper=true" : ""}`,
    ),

  /* agent actions */
  listAgentActions: (projectId: number | string, agentId?: string) =>
    request<Record<string, unknown>[]>(
      `/api/projects/${projectId}/agent-actions${agentId ? `?agent_id=${agentId}` : ""}`,
    ),
};

/**
 * Validate the stored token against ``GET /api/auth/me`` and refresh the
 * cached user. Returns ``null`` (clearing the session) on 401/403 so stale
 * tokens bounce back to /login; network errors propagate so a backend outage
 * does not wipe a valid session.
 */
export async function restoreSession(): Promise<SessionUser | null> {
  try {
    const fresh = await api.me();
    const token = getToken();
    if (token) setSession(token, fresh);
    return fresh;
  } catch (e) {
    if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
      clearSession();
      return null;
    }
    throw e;
  }
}

