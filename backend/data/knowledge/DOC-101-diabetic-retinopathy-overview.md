---
document_id: DOC-101
project_id: GCU-DEMO-001
sensitivity: PUBLIC
source: synthetic_demo_reference
---

# Diabetic Retinopathy: Screening Overview

Diabetic retinopathy (DR) is a microvascular complication of diabetes and a
leading cause of preventable blindness in working-age adults. High blood
glucose damages retinal blood vessels over time, and damage can progress
before the patient notices any vision change — which is why systematic
screening with retinal images matters.

## Clinical staging (simplified)

Screening programs typically grade fundus images into five ordinal levels:

1. No detectable retinopathy
2. Mild non-proliferative DR (microaneurysms only)
3. Moderate non-proliferative DR (haemorrhages and exudates beyond mild)
4. Severe non-proliferative DR (extensive vascular changes, no neovascularisation)
5. Proliferative DR (new, fragile vessels that can bleed and scar the retina)

Diabetic macular oedema (swelling near the centre of vision) can occur at
almost any stage and is assessed somewhat separately from the stage above.

## Why this project focuses on edge screening

The demo project, "Low-cost detection of diabetic retinopathy from fundus
images on edge devices", targets settings where specialist graders are
scarce and cloud connectivity is unreliable. A compact model running on a
low-cost camera-attached device can triage patients: refer urgent cases to a
clinic and reassure routine cases, without sending images anywhere.

Key screening-design consequences for an edge DR model:

- Favour high sensitivity at the triage threshold so few true cases are
  missed; false positives only cost a follow-up visit.
- The model is a screening/assistive tool, not an autonomous diagnosis.
- Stages are ordinal, so evaluation should account for the ordered nature
  of the labels (see DOC-108 on metrics).

All content in this knowledge base is synthetic demo reference material
written for the GCU prototype; it contains no patient data.
