"""End-to-end smoke test for the judging flow.

Run from backend/:  .venv/Scripts/python.exe smoke_test.py
Exercises all 21 priority endpoints against a running server on :8000.
"""

import sys

import httpx

BASE = "http://127.0.0.1:8000"
passed = 0
failed: list[str] = []


def check(label: str, cond: bool, detail: str = "") -> None:
    global passed
    if cond:
        passed += 1
        print(f"  PASS  {label}")
    else:
        failed.append(label)
        print(f"  FAIL  {label}  {detail}")


def main() -> int:
    c = httpx.Client(base_url=BASE, timeout=10.0)

    # 21. Health
    r = c.get("/health")
    check("21 GET /health", r.status_code == 200 and r.json() == {"status": "ok", "project": "GCU"}, r.text)

    # 1. Register (new user, unique email)
    import time
    suffix = str(int(time.time()))
    r = c.post("/api/auth/register", json={
        "name": "TEST-USER", "email": f"test-{suffix}@gcu.demo",
        "password": "secret123", "role": "STUDENT",
    })
    check("1 POST /api/auth/register", r.status_code == 201 and "access_token" in r.json(), f"{r.status_code} {r.text}")

    # 2. Sponsor login
    r = c.post("/api/auth/login", json={"email": "sponsor-001@gcu.demo", "password": "password123"})
    check("2 POST /api/auth/login", r.status_code == 200 and "access_token" in r.json(), f"{r.status_code} {r.text}")
    sponsor_token = r.json().get("access_token", "")
    sponsor = {"Authorization": f"Bearer {sponsor_token}"}

    r = c.post("/api/auth/login", json={"email": "expert-001@gcu.demo", "password": "password123"})
    expert = {"Authorization": f"Bearer {r.json().get('access_token', '')}"}
    r = c.post("/api/auth/login", json={"email": "student-001@gcu.demo", "password": "password123"})
    student1 = {"Authorization": f"Bearer {r.json().get('access_token', '')}"}

    # 3. GET /api/auth/me
    r = c.get("/api/auth/me", headers=sponsor)
    check("3 GET /api/auth/me", r.status_code == 200 and r.json()["role"] == "SPONSOR", r.text)

    # role check: student cannot create a project
    r = c.post("/api/projects", headers=student1, json={"title": "nope"})
    check("role guard: STUDENT cannot create project", r.status_code == 403, f"{r.status_code}")

    # 4. Sponsor creates a project (fresh, for the flow test)
    r = c.post("/api/projects", headers=sponsor, json={
        "title": "Smoke Test Project",
        "public_summary": "Testing the judging flow.",
        "confidential_brief": "SECRET-BRIEF-XYZ",
        "funding": 100000, "confidentiality": "INTERNAL",
    })
    check("4 POST /api/projects", r.status_code == 201, f"{r.status_code} {r.text}")
    pid = r.json().get("id")

    # 5. GET /api/projects
    r = c.get("/api/projects", headers=student1)
    check("5 GET /api/projects", r.status_code == 200 and isinstance(r.json(), list), r.status_code)
    # brief must NOT be exposed to a non-member student
    leaked = any(p.get("confidential_brief") for p in r.json() if p["id"] == pid)
    check("policy: brief hidden from non-member in list", not leaked)

    # 6. GET /api/projects/{id}
    r = c.get(f"/api/projects/{pid}", headers=sponsor)
    ok_detail = r.status_code == 200 and r.json().get("confidential_brief") == "SECRET-BRIEF-XYZ" and r.json().get("can_view_confidential_brief") is True
    check("6 GET /api/projects/{id} (sponsor sees brief)", ok_detail, r.text)
    r = c.get(f"/api/projects/{pid}", headers=student1)
    ok_hidden = r.status_code == 200 and r.json().get("confidential_brief") is None
    check("policy: brief hidden from non-member detail", ok_hidden, r.text)

    # find seeded demo project id (project #1)
    r = c.get("/api/projects", headers=sponsor)
    demo_pid = next((p["id"] for p in r.json() if p["title"].startswith("Low-cost detection")), None)

    # 7. POST members (sponsor adds s1, s2, expert as ACTIVE — drives the reward split)
    r = c.get("/api/auth/me", headers=student1)
    s1_id = r.json()["id"]
    r = c.post(f"/api/projects/{pid}/members", headers=sponsor, json={"user_id": s1_id, "status": "ACTIVE"})
    check("7 POST /api/projects/{id}/members", r.status_code == 201, f"{r.status_code} {r.text}")
    r = c.post("/api/auth/login", json={"email": "student-002@gcu.demo", "password": "password123"})
    student2 = {"Authorization": f"Bearer {r.json().get('access_token', '')}"}
    r = c.get("/api/auth/me", headers=student2)
    s2_id = r.json()["id"]
    r = c.post(f"/api/projects/{pid}/members", headers=sponsor, json={"user_id": s2_id, "status": "ACTIVE"})
    check("add student-002 member", r.status_code == 201, f"{r.status_code} {r.text}")
    r = c.get("/api/auth/me", headers=expert)
    expert_id = r.json()["id"]
    r = c.post(f"/api/projects/{pid}/members", headers=sponsor, json={"user_id": expert_id, "status": "ACTIVE"})
    check("add expert member", r.status_code == 201, f"{r.status_code} {r.text}")

    # 8. GET members
    r = c.get(f"/api/projects/{pid}/members", headers=student1)
    check("8 GET /api/projects/{id}/members", r.status_code == 200 and len(r.json()) >= 1, r.text)

    # member now sees brief
    r = c.get(f"/api/projects/{pid}", headers=student1)
    check("policy: ACTIVE member sees brief", r.json().get("confidential_brief") == "SECRET-BRIEF-XYZ", r.text)

    # 10. Charter create
    r = c.post(f"/api/projects/{pid}/charter", headers=sponsor, json={
        "scope": "Build DR screening pipeline.",
        "access_rules": "Members only.",
        "ip_rules": "Joint IP.",
        "ai_rules": "AI contributions attributed to human owner.",
        "reward_rules": "50/30/20 student/student/expert.",
        "confidentiality_rules": "INTERNAL.",
        "commercialisation_rules": "Sponsor first rights.",
    })
    check("10 POST /api/projects/{id}/charter", r.status_code == 201 and r.json().get("version") == 1, f"{r.status_code} {r.text}")

    # 11. GET charter
    r = c.get(f"/api/projects/{pid}", headers=sponsor)  # sanity
    r = c.get(f"/api/projects/{pid}/charter", headers=sponsor)
    check("11 GET /api/projects/{id}/charter", r.status_code == 200 and r.json()["version"] == 1, r.text)

    # charter v2 -> version increments
    r = c.post(f"/api/projects/{pid}/charter", headers=sponsor, json={"scope": "Updated scope."})
    check("charter version increments", r.status_code == 201 and r.json()["version"] == 2, r.text)

    # 9. Charter accept (as student)
    r = c.post(f"/api/projects/{pid}/charter/accept", headers=student1)
    check("9 POST /api/projects/{id}/charter/accept", r.status_code == 200, f"{r.status_code} {r.text}")
    r2 = c.post(f"/api/projects/{pid}/charter/accept", headers=student1)
    check("charter accept idempotent", r2.status_code == 200 and r2.json()["id"] == r.json()["id"], r2.text)

    # 6b. milestones on demo project (seeded with exactly 2)
    r = c.get(f"/api/projects/{demo_pid}/milestones", headers=sponsor)
    check("12 GET /api/projects/{id}/milestones", r.status_code == 200 and len(r.json()) == 2, r.text)
    check("demo milestone reward = 50000", r.json()[0]["reward"] == 50000)

    # Fresh milestones on the smoke project so the test is re-runnable
    r = c.post(f"/api/projects/{pid}/milestones", headers=sponsor, json={"title": "Smoke M1", "reward": 50000})
    check("POST milestones", r.status_code == 201, r.text)
    m1 = r.json()["id"]
    r = c.post(f"/api/projects/{pid}/milestones", headers=sponsor, json={"title": "Smoke M2", "reward": 50000})
    m2 = r.json()["id"]

    # 13. Contribution (human + AI)
    r = c.post(f"/api/projects/{pid}/contributions", headers=student1, json={
        "milestone_id": m1, "actor_type": "HUMAN", "action": "trained_model",
        "description": "Trained baseline", "artifact_id": "art-001",
    })
    check("13 POST /api/projects/{id}/contributions", r.status_code == 201, f"{r.status_code} {r.text}")

    # AI without human_owner_id must be rejected
    r = c.post(f"/api/projects/{pid}/contributions", headers=student1, json={
        "actor_type": "AI", "action": "drafted_report",
    })
    check("validation: AI contribution requires human_owner_id", r.status_code == 422, f"{r.status_code} {r.text}")

    r = c.post(f"/api/projects/{pid}/contributions", headers=student1, json={
        "milestone_id": m1, "actor_type": "AI", "human_owner_id": s1_id,
        "action": "drafted_report", "description": "LLM draft", "artifact_id": "art-002",
    })
    check("AI contribution with owner accepted", r.status_code == 201, f"{r.status_code} {r.text}")

    # 14. GET contributions
    r = c.get(f"/api/projects/{pid}/contributions", headers=student1)
    check("14 GET /api/projects/{id}/contributions", r.status_code == 200 and len(r.json()) >= 2, r.text)

    # 15. agent action
    r = c.post(f"/api/projects/{pid}/agent-actions", headers=student1, json={
        "agent_id": "scope-agent-1", "human_owner_id": s1_id, "action": "scope_generated",
        "tool": "gpt-agent", "input_summary": "sponsor brief", "output_summary": "scope draft",
    })
    check("15 POST /api/projects/{id}/agent-actions", r.status_code == 201, f"{r.status_code} {r.text}")

    # 16. GET agent actions
    r = c.get(f"/api/projects/{pid}/agent-actions", headers=student1)
    check("16 GET /api/projects/{id}/agent-actions", r.status_code == 200 and len(r.json()) >= 1, r.text)

    # 17. Review: student forbidden, expert allowed
    r = c.post(f"/api/projects/{pid}/reviews", headers=student1, json={"milestone_id": m1, "decision": "APPROVED"})
    check("role guard: STUDENT cannot review", r.status_code == 403, f"{r.status_code}")
    r = c.post(f"/api/projects/{pid}/reviews", headers=expert, json={
        "milestone_id": m1, "decision": "APPROVED", "comment": "Looks good.",
    })
    check("17 POST /api/projects/{id}/reviews", r.status_code == 201 and r.json()["decision"] == "APPROVED", f"{r.status_code} {r.text}")

    # GET reviews
    r = c.get(f"/api/projects/{pid}/reviews", headers=student1)
    check("GET reviews", r.status_code == 200 and len(r.json()) >= 1, r.text)

    # 18. Escrow fund (sponsor)
    r = c.post(f"/api/projects/{pid}/escrow/fund", headers=sponsor, json={"milestone_id": m1})
    check("18 POST /api/projects/{id}/escrow/fund", r.status_code == 201 and r.json()["status"] == "FUNDED", f"{r.status_code} {r.text}")
    # double fund -> conflict
    r = c.post(f"/api/projects/{pid}/escrow/fund", headers=sponsor, json={"milestone_id": m1})
    check("escrow double-fund rejected", r.status_code == 409, f"{r.status_code}")

    # release without APPROVED review must fail: use m2 (no review yet)
    r = c.post(f"/api/projects/{pid}/escrow/fund", headers=sponsor, json={"milestone_id": m2})
    check("fund m2", r.status_code == 201, r.text)
    r = c.post(f"/api/projects/{pid}/escrow/release", headers=sponsor, json={"milestone_id": m2})
    check("guard: release without APPROVED review blocked", r.status_code == 409, f"{r.status_code} {r.text}")

    # 19. Release m1 (has APPROVED review)
    r = c.post(f"/api/projects/{pid}/escrow/release", headers=sponsor, json={"milestone_id": m1})
    check("19 POST /api/projects/{id}/escrow/release", r.status_code == 200 and r.json()["status"] == "RELEASED", f"{r.status_code} {r.text}")

    # 20. Rewards
    r = c.get(f"/api/projects/{pid}/rewards", headers=student1)
    body = r.json()
    check("20 GET /api/projects/{id}/rewards", r.status_code == 200, r.text)
    rewards = body.get("rewards", [])
    # sum only milestone m1 payouts (m2 is funded but not released)
    by_user = {}
    for rw in rewards:
        if rw["milestone_id"] != m1:
            continue
        by_user.setdefault(rw["user_name"], 0)
        by_user[rw["user_name"]] += rw["amount"]
    print(f"        payout totals: {by_user}")
    check("Student A gets 25000", by_user.get("STUDENT-001") == 25000, str(by_user))
    check("Student B gets 15000", by_user.get("STUDENT-002") == 15000, str(by_user))
    check("Expert gets 10000", by_user.get("EXPERT-001") == 10000, str(by_user))
    check("split_rules present", isinstance(body.get("split_rules"), list) and len(body["split_rules"]) > 0)
    check("total_ai_share == 0", body.get("total_ai_share") == 0)
    m1_released = [rw for rw in rewards if rw["milestone_id"] == m1]
    check("m1 payouts all RELEASED", all(rw["status"] == "RELEASED" for rw in m1_released), str(m1_released))

    print(f"\n{passed} passed, {len(failed)} failed")
    if failed:
        print("FAILED:", *failed, sep="\n  - ")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
