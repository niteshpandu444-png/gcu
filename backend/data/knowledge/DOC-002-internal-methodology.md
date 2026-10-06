---
document_id: DOC-002
project_id: GCU-DEMO-001
sensitivity: HIGH
source: synthetic_demo_reference
---

# Internal Sponsor Methodology Notes (CONFIDENTIAL)

This document is marked HIGH sensitivity. It contains the sponsor's internal
grading rubric for milestone acceptance and pre-agreed accuracy thresholds
that are shared only with the project team.

Acceptance thresholds for the demo project:
- Milestone 1 requires AUC >= 0.85 on the held-out validation set with a
  documented, reproducible training pipeline.
- Milestone 2 requires INT8 latency under 2 seconds per image on the target
  edge device and no more than a 2% absolute AUC drop after quantization.

Do not surface this content to users without project access. The retrieval
layer filters documents by project_id and access checks run before any
context is built.
