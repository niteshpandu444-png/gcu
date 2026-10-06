---
document_id: DOC-105
project_id: GCU-DEMO-001
sensitivity: INTERNAL
source: synthetic_demo_reference
---

# CNN-Based Classification for Diabetic Retinopathy

Convolutional neural networks (CNNs) are the standard approach for grading
fundus images. They learn a feature hierarchy directly from pixels:
early layers detect edges and blobs, deeper layers compose them into
lesion-level patterns (microaneurysms, exudates, vessel changes).

## Typical architecture

1. **Backbone** — stacked convolution + pooling blocks extract a feature
   map from the input image.
2. **Global average pooling** — collapses the spatial map to a compact
   vector, far fewer parameters than fully connected flattening.
3. **Classification head** — a small dense layer plus softmax for the DR
   grade (five ordinal classes for the demo project), or a sigmoid for a
   binary referable-DR decision.

## Transfer learning

With limited labelled fundus data, initialising from a backbone pretrained
on ImageNet usually beats training from scratch. Two regimes:

- **Feature extraction** — freeze the backbone, train only the head
  (fast, robust with tiny datasets).
- **Fine-tuning** — unfreeze deeper layers with a low learning rate once
  the head has converged.

## Training considerations for DR grading

- **Class imbalance** — later stages are rare: use class-weighted loss or
  focal loss rather than naive accuracy as the objective.
- **Ordinal labels** — grades are ordered; an off-by-one error is less
  serious than confusing "no DR" with "proliferative". Ordinal-aware
  losses or cumulative thresholds can encode this.
- **Interpretability** — Grad-CAM heatmaps show which regions drove the
  prediction; for a screening tool, confirm attention falls on lesions,
  not on borders or text artefacts.
- **Validation discipline** — patient-level splits, fixed seed, and a
  held-out test set that is never touched during model selection.
