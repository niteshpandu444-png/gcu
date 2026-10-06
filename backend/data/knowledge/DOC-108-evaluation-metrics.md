---
document_id: DOC-108
project_id: GCU-DEMO-001
sensitivity: PUBLIC
source: synthetic_demo_reference
---

# Evaluation Metrics: Sensitivity, Specificity and Beyond

Which metrics matter when evaluating a diabetic retinopathy screening
model? The confusion matrix is the foundation; the right summary depends
on how the model is used.

## Core classification metrics

- **Sensitivity (recall, true positive rate)** — of all images that truly
  have referable disease, the fraction the model flags. For screening,
  this is the headline metric: missed cases are the costly error.
- **Specificity (true negative rate)** — of all healthy images, the
  fraction correctly cleared. Low specificity floods clinics with
  unnecessary referrals.
- **Positive/negative predictive value (PPV/NPV)** — depend on disease
  prevalence; report them alongside prevalence so the numbers are
  interpretable for a deployment site.
- **Accuracy** — misleading under class imbalance; a model predicting
  "no DR" for everything scores well on imbalanced screening sets.

## Threshold-independent metrics

- **AUC-ROC** — discriminability across all thresholds; good single-number
  summary but can look optimistic on rare severe stages.
- **Precision-recall AUC** — more informative when positives are rare.

## Ordinal grading metrics

DR grades are ordered (no DR → proliferative). **Quadratic weighted
kappa** penalises distant disagreements more than adjacent ones, making it
a better fit for five-level grading than plain accuracy.

## Choosing the operating point

Set the decision threshold from the screening objective — typically
target high sensitivity (for example, the threshold that achieves ~90%
sensitivity) and report the specificity achieved at that point. Always
publish the threshold with the metrics; metrics without a threshold are
not reproducible.

## Edge-specific metrics

For the demo project, model quality is only half the story. Also report:

- per-image inference latency (median and p95) on the target device,
- model size and peak memory,
- accuracy drop introduced by quantisation or pruning (DOC-107) versus
  the FP32 baseline.

Report an accuracy-latency trade-off curve across optimisation variants
so the sponsor can pick the operating point for a low-cost device.

Related: DOC-004 contains the project's evaluation protocol with metric
definitions; DOC-002 holds the sponsor's internal acceptance thresholds.
