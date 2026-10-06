---
document_id: DOC-001
project_id: GCU-DEMO-001
sensitivity: INTERNAL
source: synthetic_demo_reference
---

# Lightweight Edge AI for Diabetic Retinopathy Screening

Fundus image classification on edge devices is constrained by memory, power,
and latency. Lightweight approaches that work well for diabetic retinopathy
(DR) screening include:

- Compact convolutional architectures such as MobileNetV3, EfficientNet-Lite,
  ShuffleNet, and small ResNet variants (ResNet-18 with width scaling).
- Post-training quantization (INT8) and quantization-aware training to shrink
  models 2-4x with minimal accuracy loss.
- Structured pruning and knowledge distillation into a smaller student model.
- Operator-level optimizations: fused convolutions, NEON/AVX intrinsics, and
  hardware accelerators (NPUs, Coral EdgeTPU, Raspberry Pi GPU compute).

A practical pipeline is: train a compact baseline on curated fundus images,
quantize for the target device, then measure both classification performance
and per-image inference latency on-device.
