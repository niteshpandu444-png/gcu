---
document_id: DOC-106
project_id: GCU-DEMO-001
sensitivity: INTERNAL
source: synthetic_demo_reference
---

# Lightweight CNN Architectures: MobileNet and EfficientNet Concepts

The demo project runs on edge devices, so the backbone must trade accuracy
against latency, memory and power. Lightweight architectures are built from
a few recurring ideas.

## Depthwise separable convolutions

The core trick behind MobileNet-style networks. A standard convolution
filters and mixes channels in one expensive step; a depthwise separable
convolution splits it into:

1. **Depthwise convolution** — one filter per input channel (cheap, spatial
   only).
2. **Pointwise (1x1) convolution** — mixes information across channels
   (cheap, channel only).

Together they cut multiply-adds substantially versus a dense convolution
of the same receptive field. A width multiplier shrinks channel counts
further when the hardware budget is tight.

## MobileNet family concepts

- **MobileNetV1** — stacked depthwise-separable blocks with width
  multiplier and a resolution multiplier.
- **MobileNetV2** — inverted residuals: expand channels with 1x1, apply
  depthwise 3x3, then project back with a linear (non-activated)
  bottleneck; skip connections join the low-dimensional bottlenecks.
- **MobileNetV3** — blocks shaped by hardware-aware neural architecture
  search, with squeeze-and-excitation channel attention and efficient
  activation functions (hard-swish).

## EfficientNet concepts

EfficientNet scales three axes together in a balanced way — **depth**,
**width**, and **input resolution** — starting from a compact baseline
found by neural architecture search. Compound scaling gives better
accuracy-per-parameter than scaling any single axis, and the smaller
variants (B0-B2 range) are realistic candidates for on-device DR screening.

## Choosing for the demo project

- Start from a MobileNet-class or EfficientNet-B0-class backbone
  pretrained on ImageNet, then fine-tune on the fundus data (DOC-105).
- Measure on the *actual* target hardware: parameter count and FLOPs are
  only proxies for latency.
- Pair the architecture choice with post-training quantisation (DOC-107)
  — depthwise-heavy models quantise well and run fast on integer-only NPUs.
- Keep enough spatial resolution to preserve microaneurysms (DOC-102);
  over-shrinking input size hurts DR grading more than it helps speed.
