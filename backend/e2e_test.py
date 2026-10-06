"""End-to-end GCU lifecycle test (the 16 spec checks + full flow).

Run from backend/:  .venv/Scripts/python.exe e2e_test.py
Expects the server on :8000 (no LLM_API_KEY => deterministic fallback path).

Flow covered:
  sponsor login -> create project -> AI charter (fallback) -> sponsor approval
  -> AI matching -> invitations -> candidate accept/reject -> TEAM_FORMED
  -> confidential access gating -> AI research -> contribution -> review
  -> reward -> escrow release -> ledger verification
"""

import sys
import time

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


def login(c: httpx.Client, email: str) -> dict:
    r = c.post("/api/auth/login", json={"email": email, "password": "password123"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def main() -> int:
    c = httpx.Client(base_url=BASE, timeout=20.0)

    sponsor = login(c, "sponsor-001@gcu.demo")
    expert = login(c, "expert-001@gcu.demo")
    student1 = login(c, "student-001@gcu.demo")
    student2 = login(c, "student-002@gcu.demo")
    student3 = login(c, "student-003@gcu.demo")

    # ---- 1. Sponsor creates a fresh project ----
    suffix = str(int(time.time()))
    r = c.post("/api/projects", headers=sponsor, json={
        "title": f"E2E Lifecycle Project {suffix}",
        "public_summary": "End-to-end lifecycle verification.",
        "confidential_brief": "E2E-SECRET-BRIEF-001",
        "funding": 100000,
        "confidentiality": "INTERNAL",
    })
    check("sponsor creates project", r.status_code == 201, f"{r.status_code} {r.text[:200]}")
    pid = r.json()["id"]

    # non-member student cannot see the brief
    r = c.get(f"/api/projects/{pid}", headers=student1)
    check("brief hidden from non-member", r.status_code == 200 and r.json()["confidential_brief"] is None, r.text[:200])

    # ---- 2. AI charter generation (fallback, no API key) ----
    r = c.post("/api/ai/charter", headers=sponsor, json={
        "project_id": pid,
        "problem": "Low-cost detection of diabetic retinopathy from fundus images on edge devices",
    })
    check("2 charter generation (fallback) returns 200", r.status_code == 200, f"{r.status_code} {r.text[:300]}")
    body = r.json() if r.status_code == 200 else {}
    check("2 source is llm or fallback", body.get("source") in ("llm", "fallback"), str(body.get("source")))
    charter = body.get("charter", {})
    sections = ["scope", "access_rules", "ip_rules", "ai_rules", "reward_rules",
                "dispute_rules", "confidentiality_rules", "commercialisation_rules"]
    check("3 charter has all required sections",
          all(charter.get(k) for k in sections), str({k: bool(charter.get(k)) for k in sections}))
    check("3 charter starts as DRAFT", charter.get("status") == "DRAFT", str(charter.get("status")))
    check("3 required skills returned", len(body.get("required_skills", [])) >= 2, str(body.get("required_skills")))
    check("3 two suggested milestones", len(body.get("milestones", [])) == 2, str(len(body.get("milestones", []))))

    # AI_CHARTER_GENERATION logged as an agent action with a human owner
    r = c.get(f"/api/projects/{pid}/agent-actions", headers=sponsor, params={"agent_id": "CHARTER-AGENT-001"})
    acts = [a for a in (r.json() if r.status_code == 200 else []) if a["action"] == "AI_CHARTER_GENERATION"]
    check("13 AI charter action logged", len(acts) >= 1 and acts[-1].get("human_owner_id"), str(acts[:1]))

    # ---- 3. Approval rules ----
    r = c.post(f"/api/projects/{pid}/members/1/invite", headers=student1, json={})  # not sponsor
    check("guard: student cannot invite (403)", r.status_code == 403, str(r.status_code))

    r = c.post(f"/api/projects/{pid}/charter/approve", headers=student1)
    check("guard: student cannot approve charter (403)", r.status_code == 403, str(r.status_code))

    # matching requires an APPROVED charter
    r = c.post("/api/ai/match", headers=sponsor, json={"project_id": pid})
    check("guard: match before approval blocked (409)", r.status_code == 409, f"{r.status_code} {r.text[:150]}")

    # invitation requires an APPROVED charter
    r = c.post(f"/api/projects/{pid}/members/2/invite", headers=sponsor, json={})
    check("guard: invite before approval blocked (409)", r.status_code == 409, f"{r.status_code} {r.text[:150]}")

    r = c.post(f"/api/projects/{pid}/charter/approve", headers=sponsor)
    check("4 sponsor approves charter", r.status_code == 200 and r.json()["status"] == "APPROVED",
          f"{r.status_code} {r.text[:200]}")
    check("4 approval records sponsor + timestamp",
          r.json().get("approved_by") and r.json().get("approved_at"), str(r.json())[:200])
    approved_version = r.json()["version"]

    # ---- 4. AI matching (explainable) ----
    r = c.post("/api/ai/match", headers=sponsor, json={"project_id": pid})
    check("5 matching returns 200", r.status_code == 200, f"{r.status_code} {r.text[:300]}")
    m = r.json() if r.status_code == 200 else {}
    expert_rec = m.get("recommended_expert")
    students_rec = m.get("recommended_students") or []
    check("5 recommended expert present", bool(expert_rec) and expert_rec["role"] == "EXPERT", str(expert_rec))
    check("5 recommended students >= 2", len(students_rec) >= 2, str(len(students_rec)))
    check("5 recommendation is explainable",
          all({"user_id", "score", "matched_skills", "reasons"} <= set(rec) for rec in ([expert_rec] if expert_rec else []) + students_rec),
          str((expert_rec or students_rec[:1])))

    # 14. AI matching action logged
    r = c.get(f"/api/projects/{pid}/agent-actions", headers=sponsor, params={"agent_id": "MATCHING-AGENT-001"})
    macts = [a for a in (r.json() if r.status_code == 200 else []) if a["action"] == "AI_TEAM_MATCHING"]
    check("14 AI matching action logged", len(macts) >= 1 and macts[-1].get("human_owner_id"), str(macts[:1]))

    # 6/7. hard filters: COI candidate and unverified candidate excluded
    from app.database import SessionLocal
    from app.models.user import User

    db = SessionLocal()
    try:
        coi_user = db.query(User).filter(User.name == "COI-TEST-USER").first()
        if coi_user is None:
            coi_user = User(name="COI-TEST-USER", email=f"coi-{suffix}@gcu.demo",
                            password_hash="x", role="STUDENT", skills="Computer Vision",
                            verification_status="VERIFIED", conflict_of_interest=True)
            db.add(coi_user)
            db.commit()
        unver_user = db.query(User).filter(User.name == "UNVERIFIED-TEST-USER").first()
        if unver_user is None:
            unver_user = User(name="UNVERIFIED-TEST-USER", email=f"unver-{suffix}@gcu.demo",
                              password_hash="x", role="STUDENT", skills="Computer Vision",
                              verification_status="UNVERIFIED", conflict_of_interest=False)
            db.add(unver_user)
            db.commit()
        coi_id, unver_id = coi_user.id, unver_user.id
    finally:
        db.close()

    r = c.post("/api/ai/match", headers=sponsor, json={"project_id": pid})
    m2 = r.json() if r.status_code == 200 else {}
    all_ids = [rec["user_id"] for rec in ([m2.get("recommended_expert")] if m2.get("recommended_expert") else [])
               + (m2.get("recommended_students") or [])]
    check("6 conflict candidate excluded", coi_id not in all_ids, str(all_ids))
    check("7 unverified candidate excluded", unver_id not in all_ids, str(all_ids))

    # ---- 5. Invitations ----
    def invite(token: dict, uid: int):
        return c.post(f"/api/projects/{pid}/members/{uid}/invite", headers=token, json={})

    # fetch demo user ids
    r = c.get("/api/auth/me", headers=expert); expert_id = r.json()["id"]
    r = c.get("/api/auth/me", headers=student1); s1_id = r.json()["id"]
    r = c.get("/api/auth/me", headers=student2); s2_id = r.json()["id"]
    r = c.get("/api/auth/me", headers=student3); s3_id = r.json()["id"]

    r = invite(sponsor, s1_id); check("invite student-001", r.status_code == 201 and r.json()["status"] == "INVITED", r.text[:200])
    r = invite(sponsor, s2_id); check("invite student-002", r.status_code == 201, r.text[:200])
    r = invite(sponsor, expert_id); check("invite expert-001", r.status_code == 201, r.text[:200])
    r = invite(sponsor, s3_id); check("invite student-003 (backup)", r.status_code == 201, r.text[:200])
    r = invite(sponsor, s1_id); check("double invite -> 409", r.status_code == 409, str(r.status_code))
    r = invite(sponsor, 999999); check("invite unknown user -> 404", r.status_code == 404, str(r.status_code))

    # ---- 6. Candidate review + reject ----
    r = c.get(f"/api/projects/{pid}/charter", headers=student3)
    check("candidate can read charter before deciding",
          r.status_code == 200 and r.json()["status"] == "APPROVED" and r.json()["version"] == approved_version,
          f"{r.status_code} {r.text[:150]}")

    r = c.post(f"/api/projects/{pid}/members/{s3_id}/reject", headers=student3)
    check("9 candidate rejects invitation", r.status_code == 200 and r.json()["status"] == "REJECTED", r.text[:200])
    # rejecting must never grant confidential access
    r = c.get(f"/api/projects/{pid}", headers=student3)
    check("12 rejected candidate has NO confidential access",
          r.json().get("confidential_brief") is None and r.json().get("can_view_confidential_brief") is False,
          r.text[:200])
    # and cannot use the project AI
    r = c.post("/api/ai/research", headers=student3, json={"project_id": pid, "question": "hello"})
    check("12 rejected candidate AI access denied", r.status_code == 403, str(r.status_code))

    # self-only rules
    r = c.post(f"/api/projects/{pid}/members/{s1_id}/accept", headers=student2)
    check("guard: cannot accept someone else's invitation (403)", r.status_code == 403, str(r.status_code))
    r = c.post(f"/api/projects/{pid}/members/{s2_id}/reject", headers=student1)
    check("guard: cannot reject someone else's invitation (403)", r.status_code == 403, str(r.status_code))

    # ---- 7. Acceptances ----
    r = c.post(f"/api/projects/{pid}/members/{s1_id}/accept", headers=student1)
    check("8 candidate accepts invitation", r.status_code == 200 and r.json()["status"] == "ACTIVE", r.text[:250])
    check("10 acceptance records charter version", r.json().get("charter_version") == approved_version,
          str(r.json().get("charter_version")))
    # idempotent re-accept
    r = c.post(f"/api/projects/{pid}/members/{s1_id}/accept", headers=student1)
    check("re-accept is idempotent", r.status_code == 200 and r.json()["status"] == "ACTIVE", r.text[:150])

    # team not formed yet (1 expert missing)
    r = c.get(f"/api/projects/{pid}", headers=sponsor)
    check("team not formed with only students", r.json().get("team_state") == "FORMING", str(r.json().get("team_state")))

    # before acceptance: no confidential access for student-002 (still INVITED)
    r = c.get(f"/api/projects/{pid}", headers=student2)
    check("invited candidate has no confidential access", r.json()["confidential_brief"] is None, r.text[:150])
    r = c.post("/api/ai/research", headers=student2, json={"project_id": pid, "question": "hello there"})
    check("invited candidate AI access denied (403)", r.status_code == 403, str(r.status_code))

    # after acceptance: confidential access + AI access
    r = c.get(f"/api/projects/{pid}", headers=student1)
    check("11 accepted candidate sees confidential brief",
          r.json().get("confidential_brief") == "E2E-SECRET-BRIEF-001" and r.json().get("can_view_confidential_brief") is True,
          r.text[:250])

    r = c.post(f"/api/projects/{pid}/members/{s2_id}/accept", headers=student2)
    check("student-002 accepts", r.status_code == 200 and r.json()["status"] == "ACTIVE", r.text[:200])
    r = c.post(f"/api/projects/{pid}/members/{expert_id}/accept", headers=expert)
    check("expert accepts", r.status_code == 200 and r.json()["status"] == "ACTIVE", r.text[:200])

    # ---- 8. TEAM_FORMED ----
    r = c.get(f"/api/projects/{pid}", headers=sponsor)
    check("5 TEAM_FORMED once 1 expert + 2 students ACTIVE", r.json().get("team_state") == "TEAM_FORMED",
          str(r.json().get("team_state")))

    # ---- 9. AI research as an ACTIVE member ----
    r = c.post("/api/ai/research", headers=student1, json={
        "project_id": pid, "human_owner_id": "STUDENT-001",
        "question": "What lightweight approaches can be used for edge diabetic retinopathy screening?",
    })
    check("AI research works for ACTIVE member", r.status_code == 200, f"{r.status_code} {r.text[:250]}")
    rb = r.json() if r.status_code == 200 else {}
    check("research returns answer + agent_id + owner",
          bool(rb.get("answer")) and rb.get("agent_id") == "RESEARCH-AGENT-001" and rb.get("human_owner_id") == "STUDENT-001",
          str(rb)[:200])

    # ---- 10. Milestone -> contribution -> review -> reward -> escrow ----
    r = c.post(f"/api/projects/{pid}/milestones", headers=sponsor, json={"title": "E2E Milestone 1", "reward": 50000})
    check("milestone created", r.status_code == 201, r.text[:200])
    mid = r.json()["id"]

    r = c.post(f"/api/projects/{pid}/contributions", headers=student1, json={
        "milestone_id": mid, "actor_type": "HUMAN", "action": "dataset_uploaded",
        "description": "E2E dataset uploaded", "artifact_id": "art-e2e-001",
    })
    check("contribution with artifact", r.status_code == 201, r.text[:200])

    r = c.post(f"/api/projects/{pid}/reviews", headers=expert, json={
        "milestone_id": mid, "decision": "APPROVED", "comment": "E2E approved.",
    })
    check("expert approves review", r.status_code == 201 and r.json()["decision"] == "APPROVED", r.text[:200])

    r = c.post(f"/api/projects/{pid}/escrow/fund", headers=sponsor, json={"milestone_id": mid})
    check("escrow funded", r.status_code == 201 and r.json()["status"] == "FUNDED", r.text[:200])

    r = c.post(f"/api/projects/{pid}/escrow/release", headers=sponsor, json={"milestone_id": mid})
    check("escrow released after approval", r.status_code == 200 and r.json()["status"] == "RELEASED", r.text[:200])

    r = c.get(f"/api/projects/{pid}/rewards", headers=student1)
    rewards = [rw for rw in r.json().get("rewards", []) if rw["milestone_id"] == mid]
    by_user = {}
    for rw in rewards:
        by_user[rw["user_name"]] = by_user.get(rw["user_name"], 0) + rw["amount"]
    check("reward split 25000/15000/10000", by_user.get("STUDENT-001") == 25000
          and by_user.get("STUDENT-002") == 15000 and by_user.get("EXPERT-001") == 10000, str(by_user))
    check("rewards total 50000", sum(by_user.values()) == 50000, str(sum(by_user.values())))

    # ---- 11. Ledger ----
    r = c.get(f"/api/projects/{pid}/ledger", headers=sponsor)
    check("GET ledger returns entries", r.status_code == 200 and len(r.json()) >= 5, f"{r.status_code} n={len(r.json()) if r.status_code==200 else 0}")
    entries = r.json() if r.status_code == 200 else []
    actions = [e["action"] for e in entries]
    required_events = ["PROJECT_CREATED", "CHARTER_APPROVED", "CHARTER_ACCEPTED", "MEMBER_ACCEPTED",
                       "AI_RESEARCH_QUERY", "ARTIFACT_SUBMITTED", "REVIEW_APPROVED",
                       "ESCROW_RELEASED", "PAYOUT_CREATED"]
    missing = [ev for ev in required_events if ev not in actions]
    check("7 ledger contains all integration events", not missing, f"missing={missing} actions={actions}")
    check("ledger entries hash-chained",
          all(e["previous_hash"] == entries[i - 1]["current_hash"] for i, e in enumerate(entries) if i > 0),
          "chain link mismatch")

    r = c.get(f"/api/projects/{pid}/ledger/verify", headers=sponsor)
    check("ledger verify -> valid", r.status_code == 200 and r.json()["valid"] is True
          and r.json()["entries_checked"] == len(entries), r.text[:250])

    r = c.get(f"/api/projects/{pid}/ledger/verify", headers=sponsor, params={"tamper": "true"})
    check("ledger detects tampering", r.status_code == 200 and r.json()["valid"] is False
          and r.json().get("broken_at_entry") and r.json().get("reason"), r.text[:250])

    # access rule: non-member cannot read the ledger
    from_app = c.get(f"/api/projects/{pid}/ledger", headers={"Authorization": "Bearer garbage"})
    check("ledger requires auth", from_app.status_code == 401, str(from_app.status_code))

    print(f"\n{passed} passed, {len(failed)} failed")
    if failed:
        print("FAILED:", *failed, sep="\n  - ")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
