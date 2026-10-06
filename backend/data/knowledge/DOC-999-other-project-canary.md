---
document_id: DOC-999
project_id: GCU-OTHER-001
sensitivity: INTERNAL
source: synthetic_demo_reference
---

# Canary Document — Project Isolation Test

THIS DOCUMENT BELONGS TO ANOTHER PROJECT AND MUST NEVER BE RETRIEVED BY GCU-DEMO-001.

This file exists solely to test project isolation in the RAG loader.
If the string DOC-999 ever appears in a GCU-DEMO-001 research response,
the `project_id` filter in `load_documents()` is broken: retrieval must
filter by project before chunking and ranking, so this text can never
enter the demo project's context.
