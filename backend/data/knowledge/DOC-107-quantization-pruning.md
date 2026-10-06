---
document_id: DOC-107
project_id: GCU-DEMO-001
sensitivity: INTERNAL
source: synthetic_demo_reference
---

# Edge AI Deployment: Quantization and Model Pruning

After training (DOC-105) with a lightweight backbone (DOC-106), two
families of optimisation shrink the model further for edge deployment:
quantisation and pruning.

A common question for this project is: how can a model be optimized for
edge devices? The two main levers are **quantization** (reduce numeric
precision) and **pruning** (remove redundant weights), both described
below.

## Quantization

Quantisation reduces the numeric precision of weights and activations —
most commonly from 32-bit floats to 8-bit integers.

- **Post-training quantisation (PTQ)** — convert a trained model using a
  small calibration set that provides representative input statistics.
  Fast to apply, no retraining; usually the first thing to try.
- **Quantisation-aware training (QAT)** — simulate low precision during
  training so weights adapt to it. Use when PTQ loses too much accuracy.
- **Benefits** — roughly 4x smaller models, faster integer arithmetic, and
  compatibility with integer-only accelerators (NPUs, EdgeTPU-style
  hardware, DSPs).
- **Risks** — small activations (sometimes found in depthwise layers) can
  clamp or lose resolution under naive scaling; verify accuracy per class,
  not just overall.

Typical workflow: train FP32 baseline → calibrate → PTQ INT8 → evaluate →
if accuracy drops beyond tolerance, fall back to QAT.

## Pruning

Pruning removes parameters that contribute little to the output.

- **Unstructured pruning** — zeroes individual weights by magnitude,
  producing sparse matrices. Needs sparse-runtime support to realise
  speedups; otherwise it mainly saves memory/storage.
- **Structured pruning** — removes entire filters or channels, shrinking
  the dense tensor directly. Produces real latency gains on standard
  runtimes and is usually the better fit for edge deployment.
- **Process** — prune → fine-tune to recover accuracy → re-evaluate.
  Iterative pruning (gradually increasing sparsity) is gentler than one
  aggressive cut.

## Combining with knowledge distillation

A compact student model can be trained to match a larger teacher's
outputs, often recovering accuracy lost to pruning or quantisation —
useful when the edge budget is fixed but accuracy must hold.

## Deployment checklist for the demo project

- Export to a mobile/edge format (TFLite or ONNX) and verify operator
  coverage for every layer in the graph.
- Run the quantised/pruned model end-to-end on the target device and
  measure real latency, memory and battery draw — not laptop benchmarks.
- Compare against the FP32 baseline on accuracy *and* latency; keep the
  operating point that fits the low-cost screening budget.
- Re-run preprocessing exactly as during training (DOC-103).
