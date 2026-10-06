---
document_id: DOC-104
project_id: GCU-DEMO-001
sensitivity: INTERNAL
source: synthetic_demo_reference
---

# Data Augmentation for Fundus Models

Augmentation increases effective training diversity and reduces
overfitting — especially important for the demo project, where labelled
fundus images are limited and camera styles vary.

## Recommended transforms

- **Horizontal flip** (p=0.5) — safe; the retina's left/right anatomy is
  approximately mirror-symmetric for screening purposes.
- **Small rotations** — roughly +/- 15-25 degrees; fundus cameras are not
  perfectly aligned, but extreme rotations produce unphysical views.
- **Scale / crop jitter** — small zooms simulate framing differences
  between operators.
- **Brightness, contrast, gamma jitter** — mimics flash/exposure variation
  between devices and visits.
- **Slight colour jitter** — bounded hue/saturation shifts to cover camera
  white-balance differences without inventing unrealistic colours.
- **Mild noise and blur injection** — prepares the model for low-cost
  camera artefacts.

## Rules to avoid common pitfalls

- **Split first, augment second.** Never let augmented variants of one
  image appear in both train and test sets — split by patient or by image
  before any augmentation, or apply augmentation online only to training
  batches.
- **Preserve label semantics.** A transform that removes the macula or
  crops out lesions can change what the grade should be. Vertical flips
  and large elastic deformations are rarely appropriate for DR grading.
- **Class imbalance.** The severe/proliferative stages are rarer than mild
  ones; combine augmentation with class-balanced sampling or weighted loss
  rather than oversampling the same few severe images endlessly.
- **Sanity-check samples.** Render a grid of augmented images once per
  pipeline change and confirm lesions survive.
