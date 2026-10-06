# GCU AI API — Frontend Contract

Base URL: `http://127.0.0.1:8000`

Both endpoints require `Authorization: Bearer <token>` (from
`POST /api/auth/login`).

Both endpoints **always return 200** on success — even when the LLM is
unavailable. Check the `source` field: `"llm"` = live model answer,
`"fallback"` = deterministic demo answer.

---

## POST /api/ai/scope

Generates milestone suggestions for a problem statement.

**Access:** project sponsor, an ACTIVE project member, or ADMIN.

### Request

```json
POST /api/ai/scope
Authorization: Bearer <token>
Content-Type: application/json

{
  "project_id": "GCU-DEMO-001",
  "problem": "Low-cost detection of diabetic retinopathy from fundus images on edge devices"
}
```

`project_id` accepts either the project code (`"GCU-DEMO-001"`) or the
numeric id (`1` or `"1"`).

### Response `200 OK`

```json
{
  "project_id": "GCU-DEMO-001",
  "milestones": [
    {
      "title": "Dataset and Baseline",
      "description": "Curate and label the dataset, establish a training pipeline, and produce a baseline model with an evaluation report.",
      "required_skills": ["Python", "Computer Vision", "Machine Learning"],
      "deliverable": "Baseline diabetic-retinopathy classification model and evaluation report",
      "acceptance_criteria": [
        "Dataset is documented, labelled, and split reproducibly",
        "Baseline model metrics are reported against a held-out test set"
      ]
    },
    {
      "title": "Edge Optimization and Validation",
      "description": "Quantise and optimise the baseline model for edge hardware and validate accuracy and latency on the target device.",
      "required_skills": ["Python", "Edge AI", "Model Optimization"],
      "deliverable": "Optimized edge-compatible model with latency and accuracy evaluation",
      "acceptance_criteria": [
        "Model runs on target edge hardware within the latency budget",
        "Accuracy drop after optimisation stays within the agreed tolerance"
      ]
    }
  ],
  "source": "fallback"
}
```

Milestones above are the deterministic fallback. With a working LLM,
`source` becomes `"llm"` and milestones are generated from the problem.

### Errors

| Status | Cause |
|--------|-------|
| 401 | Missing/invalid token |
| 403 | Caller is not sponsor / ACTIVE member / admin |
| 404 | Unknown `project_id` |
| 422 | Validation (e.g. `problem` < 5 chars) |

---

## POST /api/ai/research

Project-scoped research agent (`RESEARCH-AGENT-001`). Answers a question
using only the project's own knowledge documents (`data/knowledge/`),
retrieved with TF-IDF (top 3 chunks), then passed to the LLM.

**Access:** project sponsor, an ACTIVE project member, or ADMIN.

### Request

```json
POST /api/ai/research
Authorization: Bearer <token>
Content-Type: application/json

{
  "project_id": "GCU-DEMO-001",
  "human_owner_id": "STUDENT-001",
  "question": "What lightweight approaches can be used for edge diabetic retinopathy screening?"
}
```

- `project_id`: project code or numeric id (as above).
- `human_owner_id` *(optional)*: user name or id. Must be you, the
  sponsor, or an ACTIVE project member. Defaults to the authenticated
  user.

### Response `200 OK`

```json
{
  "project_id": "GCU-DEMO-001",
  "agent_id": "RESEARCH-AGENT-001",
  "human_owner_id": "STUDENT-001",
  "answer": "Lightweight edge screening can use compact convolutional architectures and optimization techniques such as quantization. Evaluation should consider both classification performance and inference latency so the model remains practical for resource-constrained devices.\n\n(Local knowledge base match: DOC-001, DOC-004 — connect an LLM API key for a fuller answer.)",
  "sources": ["DOC-001", "DOC-004"],
  "source": "fallback"
}
```

- `sources`: document ids the answer drew from (project-scoped; other
  projects' documents can never appear here).
- `source`: `"llm"` or `"fallback"`.

### Errors

| Status | Cause |
|--------|-------|
| 401 | Missing/invalid token |
| 403 | No project access, or `human_owner_id` not allowed |
| 404 | Unknown `project_id` or `human_owner_id` |
| 422 | Validation (e.g. `question` < 3 chars) |

---

## Side effects (for the ledger/trust UI)

Every successful call writes one row to **agent-actions** and one AI
**contribution** on the project:

| Field | Scope call | Research call |
|-------|------------|---------------|
| `agent_id` | `SCOPING-AGENT-001` | `RESEARCH-AGENT-001` |
| `action` | `AI_SCOPE_GENERATION` | `AI_RESEARCH_QUERY` |
| `actor_type` | `AI` | `AI` |
| `human_owner_id` | resolved owner | resolved owner |
| `artifact_id` | `null` | `null` |

Visible via the existing endpoints:

- `GET /api/projects/{id}/agent-actions`
- `GET /api/projects/{id}/contributions`

AI contributions carry no monetary reward (reward split only covers
students/experts).

---

## Configuration (.env)

```
LLM_API_KEY=            # empty => deterministic fallback (demo-safe)
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4o-mini
LLM_TIMEOUT_SECONDS=15
```

The client speaks the OpenAI-compatible `/chat/completions` shape, so any
provider (OpenAI, Groq, Together, Ollama, vLLM...) works via URL swap.
