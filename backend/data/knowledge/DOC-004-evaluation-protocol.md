---
document_id: DOC-004
project_id: GCU-DEMO-001
sensitivity: PUBLIC
source: synthetic_demo_reference
---

# Evaluation Protocol for Edge DR Screening

Evaluation should consider both classification performance and inference
latency so the model remains practical for resource-constrained devices.

Recommended metrics:
- Sensitivity and specificity against the clinical reference standard.
- AUC-ROC and quadratic weighted kappa for the 5-level DR severity scale.
- Per-image latency (median and p95) on the target edge hardware.
- Model size in MB and peak memory footprint during inference.
- Power draw per inference when operating on battery-powered devices.

Report accuracy-latency trade-off curves for each optimization variant
(fp32 baseline, INT8 quantized, pruned) so sponsors can pick the operating
point that fits a low-cost screening deployment.
