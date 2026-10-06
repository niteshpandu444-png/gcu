---
document_id: DOC-103
project_id: GCU-DEMO-001
sensitivity: INTERNAL
source: synthetic_demo_reference
---

# Fundus Image Preprocessing

A consistent preprocessing pipeline is essential for the edge DR project:
the same steps must run identically during training and on-device
inference.

## Standard steps

1. **Decode and validate** — reject corrupt files; run a quality gate
   (blur, brightness, field-of-view coverage) and request a retake when the
   image fails it.
2. **Crop / mask the field of view** — remove the black background outside
   the circular retina so the model spends capacity on real tissue instead
   of the border.
3. **Resize to the model input** — letterbox (pad) or warp to a fixed
   square size. Preserve enough resolution that microaneurysms stay visible
   (typically 512x512 or larger for DR grading).
4. **Contrast enhancement (optional)** — CLAHE (contrast-limited adaptive
   histogram equalisation) can make faint lesions more separable, but must
   be validated against unenhanced baselines; it can also amplify noise.
5. **Colour normalisation (optional)** — per-channel mean/std
   normalisation, or simple grey-world white-balance correction, reduces
   camera-to-camera shift. Keep the chosen method fixed at inference.
6. **Denoising (optional)** — light Gaussian or bilateral filtering when
   low-cost cameras produce noisy images; avoid heavy smoothing that erases
   microaneurysms.
7. **Standardisation** — scale pixel values to the range expected by the
   trained model (for example [0,1] or ImageNet statistics).

## Edge-device considerations

- Prefer cheap, fixed-cost operations (resize, mask, normalise) over
  iterative optimisations that burn battery.
- Cache the mask/geometry when reprocessing a video stream.
- Log the preprocessing configuration with every deployed model so results
  stay reproducible across firmware versions.
