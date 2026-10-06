---
document_id: DOC-102
project_id: GCU-DEMO-001
sensitivity: PUBLIC
source: synthetic_demo_reference
---

# Fundus Image Characteristics

Fundus (retinal) photographs are the input modality for the demo project.
Understanding their visual properties drives every preprocessing and
augmentation decision downstream.

## Typical properties

- **Format:** colour RGB images, usually circular field of view on a dark
  background, taken through a dilated pupil with a fundus camera.
- **Resolution:** varies widely between cameras — from about 512x512 on
  low-cost devices up to several thousand pixels on clinical cameras.
  Models normally train on a fixed resized input.
- **Illumination:** centre is brighter than the periphery (vignetting);
  flashes and exposure settings differ between devices and visits.
- **Colour balance:** reddish-orange dominates; camera white balance and
  cataract status shift hue between images of the same eye.
- **Orientation:** left and right eyes are mirror images; the optic disc
  sits nasally, so its position indicates laterality.

## Lesion scale

DR lesions are small relative to the full image:

- Microaneurysms are the earliest sign and may only be a few pixels wide
  after resizing — aggressive downsampling can erase them.
- Hard exudates and haemorrhages are larger but sparse.
- Clinically important detail concentrates in the macular region.

## Common quality problems

Blur (focus or motion), off-centre framing, eyelash or eyelid occlusion,
lens glare, dust artefacts, and uneven exposure. Quality assessment before
inference is important on edge devices where the operator may be a
non-specialist — rejecting and retaking an unusable image is safer than
grading it.

## Dataset notes

Public benchmark datasets such as APTOS 2019, Messidor and EyePACS are
commonly used for DR research and vary in camera, population and grading
protocol. Models deployed on a new device must be re-validated for that
device's image characteristics (domain shift).
