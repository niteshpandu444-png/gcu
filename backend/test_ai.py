"""AI module tests — the 8 cases from the spec.

Run from backend/:  .venv/Scripts/python.exe test_ai.py
Expects the server on :8000 (no LLM_API_KEY set => fallback path).

Case 6 (LLM failure with a key present) starts a second server on :8001
with LLM_API_KEY set but an unreachable LLM_BASE_URL.
"""

import subprocess
import sys
import time

import httpx

BASE = "http://127.0.0.1:8000"
DEMO_CODE = "GCU-DEMO-001"

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


def login(client: httpx.Client, email: str) -> dict:
    r = client.post("/api/auth/login", json={"email": email, "password": "password123"})
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def main() -> int:
    c = httpx.Client(base_url=BASE, timeout=30.0)

    sponsor = login(c, "sponsor-001@gcu.demo")
    student1 = login(c, "student-001@gcu.demo")
    student3 = login(c, "student-003@gcu.demo")  # INVITED, not ACTIVE

    # Fresh registered user with no project access at all
    import time as _t
    r = c.post("/api/auth/register", json={
        "name": "NOACCESS", "email": f"noaccess-{int(_t.time())}@gcu.demo",
        "password": "secret123", "role": "STUDENT",
    })
    noaccess = {"Authorization": f"Bearer {r.json()['access_token']}"}

    # ---- 1. /api/ai/scope with valid project ----
    r = c.post("/api/ai/scope", headers=sponsor, json={
        "project_id": DEMO_CODE,
        "problem": "Low-cost detection of diabetic retinopathy from fundus images on edge devices",
    })
    check("1 scope valid project", r.status_code == 200, f"{r.status_code} {r.text[:300]}")
    body = r.json() if r.status_code == 200 else {}
    milestones = body.get("milestones", [])
    check("1 scope returns 2 milestones", len(milestones) == 2, str(len(milestones)))
    check("1 scope milestone shape",
          all({"title", "description", "required_skills", "deliverable", "acceptance_criteria"} <= set(m)
              for m in milestones), str(milestones[:1]))
    check("1 scope project_id echoed", body.get("project_id") == DEMO_CODE, str(body.get("project_id")))
    check("1 scope source field", body.get("source") in ("llm", "fallback"), str(body.get("source")))

    # scope also works with numeric id
    r = c.post("/api/ai/scope", headers=sponsor, json={"project_id": 1, "problem": "Test edge deployment"})
    check("1 scope numeric project id", r.status_code == 200, f"{r.status_code} {r.text[:200]}")

    # ---- 2. /api/ai/research with valid project ----
    r = c.post("/api/ai/research", headers=student1, json={
        "project_id": DEMO_CODE,
        "human_owner_id": "STUDENT-001",
        "question": "What lightweight approaches can be used for edge diabetic retinopathy screening?",
    })
    check("2 research valid project", r.status_code == 200, f"{r.status_code} {r.text[:300]}")
    rbody = r.json() if r.status_code == 200 else {}
    check("2 research agent_id", rbody.get("agent_id") == "RESEARCH-AGENT-001", str(rbody.get("agent_id")))
    check("2 research answer non-empty", bool(rbody.get("answer", "").strip()), str(rbody.get("answer"))[:80])
    check("2 research sources is list", isinstance(rbody.get("sources"), list), str(rbody.get("sources")))
    check("2 research human_owner_id echoed", rbody.get("human_owner_id") == "STUDENT-001",
          str(rbody.get("human_owner_id")))

    # ---- 5. missing API key => fallback (server has no LLM_API_KEY) ----
    check("5 fallback when API key missing", rbody.get("source") == "fallback", str(rbody.get("source")))
    check("5 fallback answer is the deterministic demo text",
          "compact convolutional architectures" in rbody.get("answer", ""), rbody.get("answer", "")[:120])

    # ---- 3. project isolation ----
    # canary doc DOC-999 (GCU-OTHER-001) must never surface
    check("3 isolation: DOC-999 canary absent", "DOC-999" not in rbody.get("sources", []),
          str(rbody.get("sources")))
    # unknown project id -> 404
    r = c.post("/api/ai/research", headers=student1, json={"project_id": "NOPE-999", "question": "anything"})
    check("3 unknown project 404", r.status_code == 404, f"{r.status_code} {r.text[:150]}")
    # user without access -> 403
    r = c.post("/api/ai/research", headers=noaccess, json={"project_id": DEMO_CODE, "question": "give me info"})
    check("3 non-member research 403", r.status_code == 403, f"{r.status_code} {r.text[:150]}")
    r = c.post("/api/ai/scope", headers=noaccess, json={"project_id": DEMO_CODE, "problem": "something bad"})
    check("3 non-member scope 403", r.status_code == 403, f"{r.status_code} {r.text[:150]}")
    # INVITED (not ACTIVE) member also denied
    r = c.post("/api/ai/research", headers=student3, json={"project_id": DEMO_CODE, "question": "hello?"})
    check("3 invited-only member research 403", r.status_code == 403, f"{r.status_code} {r.text[:150]}")
    # explicit human_owner must be you, the sponsor, or an ACTIVE member
    r = c.post("/api/ai/research", headers=student1, json={
        "project_id": DEMO_CODE, "human_owner_id": "NOACCESS", "question": "test owner check"})
    check("3 foreign owner not a member => 403", r.status_code == 403, f"{r.status_code} {r.text[:150]}")

    # ---- 4. unauthorized user (no token) ----
    r = c.post("/api/ai/scope", json={"project_id": DEMO_CODE, "problem": "test"})
    check("4 scope no token 401", r.status_code == 401, f"{r.status_code}")
    r = c.post("/api/ai/research", json={"project_id": DEMO_CODE, "question": "test"})
    check("4 research no token 401", r.status_code == 401, f"{r.status_code}")

    # ---- 7. AI action logging ----
    r = c.get(f"/api/projects/1/agent-actions", headers=sponsor, params={"agent_id": "RESEARCH-AGENT-001"})
    actions = r.json() if r.status_code == 200 else []
    research_actions = [a for a in actions if a["action"] == "AI_RESEARCH_QUERY"]
    check("7 research agent action logged", len(research_actions) >= 1, f"count={len(research_actions)}")
    if research_actions:
        a = research_actions[-1]
        check("7 action has human_owner_id", a.get("human_owner_id") is not None, str(a))
        check("7 action has input/output summaries",
              bool(a.get("input_summary")) and bool(a.get("output_summary")), str(a)[:200])
        check("7 action has timestamp", bool(a.get("created_at")), str(a.get("created_at")))
    r = c.get(f"/api/projects/1/agent-actions", headers=sponsor, params={"agent_id": "SCOPING-AGENT-001"})
    scope_actions = [a for a in (r.json() if r.status_code == 200 else []) if a["action"] == "AI_SCOPE_GENERATION"]
    check("7 scope agent action logged", len(scope_actions) >= 1, f"count={len(scope_actions)}")

    # ---- 8. contribution logging ----
    r = c.get("/api/projects/1/contributions", headers=sponsor, params={"milestone_id": "0"})  # all
    # milestone_id=0 filters nothing meaningful; fetch without filter
    r = c.get("/api/projects/1/contributions", headers=sponsor)
    contribs = r.json() if r.status_code == 200 else []
    ai_research = [x for x in contribs if x["action"] == "AI_RESEARCH_QUERY" and x["actor_type"] == "AI"]
    check("8 AI contribution logged", len(ai_research) >= 1, f"count={len(ai_research)}")
    if ai_research:
        x = ai_research[-1]
        check("8 contribution has human_owner_id", x.get("human_owner_id") is not None, str(x))
        check("8 contribution artifact_id null", x.get("artifact_id") is None, str(x.get("artifact_id")))
        check("8 contribution description set", bool(x.get("description")), str(x.get("description"))[:120])
    ai_scope = [x for x in contribs if x["action"] == "AI_SCOPE_GENERATION" and x["actor_type"] == "AI"]
    check("8 scope AI contribution logged", len(ai_scope) >= 1, f"count={len(ai_scope)}")

    # ---- 6. LLM failure fallback (key present, unreachable base URL) ----
    print("  ...starting second server on :8001 with unreachable LLM_BASE_URL")
    env = {
        "LLM_API_KEY": "test-key-should-fail",
        "LLM_BASE_URL": "http://127.0.0.1:9/v1",  # nothing listens here
        "LLM_MODEL": "test-model",
        "DATABASE_URL": "sqlite:///./gcu.db",
    }
    import os
    proc = subprocess.Popen(
        [sys.executable, "-m", "uvicorn", "app.main:app", "--port", "8001"],
        env={**os.environ, **env},
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    try:
        c2 = httpx.Client(base_url="http://127.0.0.1:8001", timeout=30.0)
        ready = False
        for _ in range(20):
            try:
                if c2.get("/health").status_code == 200:
                    ready = True
                    break
            except Exception:
                pass
            time.sleep(0.5)
        check("6 second server ready", ready)
        if ready:
            tok = login(c2, "sponsor-001@gcu.demo")
            r = c2.post("/api/ai/scope", headers=tok, json={
                "project_id": DEMO_CODE, "problem": "Detect diabetic retinopathy on edge devices"})
            check("6 scope survives LLM failure", r.status_code == 200, f"{r.status_code} {r.text[:300]}")
            if r.status_code == 200:
                b = r.json()
                check("6 scope fallback milestones", b.get("source") == "fallback"
                      and len(b.get("milestones", [])) == 2, str(b.get("source")))
                check("6 fallback milestone 1 title", b["milestones"][0]["title"] == "Dataset and Baseline",
                      b["milestones"][0]["title"])
                check("6 fallback milestone 2 title",
                      b["milestones"][1]["title"] == "Edge Optimization and Validation",
                      b["milestones"][1]["title"])
                check("6 fallback M2 skills",
                      "Model Optimization" in b["milestones"][1]["required_skills"],
                      str(b["milestones"][1]["required_skills"]))
            r = c2.post("/api/ai/research", headers=tok, json={
                "project_id": DEMO_CODE,
                "question": "What lightweight approaches can be used for edge diabetic retinopathy screening?"})
            check("6 research survives LLM failure", r.status_code == 200, f"{r.status_code} {r.text[:300]}")
            if r.status_code == 200:
                b = r.json()
                check("6 research fallback answer", b.get("source") == "fallback"
                      and "compact convolutional architectures" in b.get("answer", ""),
                      str(b.get("source")))
                check("6 fallback still cites KB sources", len(b.get("sources", [])) >= 1,
                      str(b.get("sources")))
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except Exception:
            proc.kill()

    print(f"\n{passed} passed, {len(failed)} failed")
    if failed:
        print("FAILED:", *failed, sep="\n  - ")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
