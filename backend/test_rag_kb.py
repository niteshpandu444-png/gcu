"""Direct RAG validation for the GCU demo knowledge base.

Run from backend/:  .venv/Scripts/python.exe test_rag_kb.py

Validates (without any server or LLM):
  - the 4 spec queries return sensible top-3 + sources
  - DOC-999 canary is never retrieved (negative security test)
  - unknown project ids retrieve no GCU-DEMO-001 documents
  - every demo document carries required front-matter metadata
"""

import sys

from app.services import rag

DEMO_REF = {"1", "GCU-DEMO-001"}
UNKNOWN_REF = {"NO-SUCH-PROJECT"}

QUERIES = [
    "What lightweight model approaches can be used for edge diabetic retinopathy screening?",
    "What preprocessing techniques can be applied to fundus images?",
    "Which metrics should be considered when evaluating diabetic retinopathy screening?",
    "How can a model be optimized for edge devices?",
]

passed = 0
failed: list[str] = []


def check(label: str, cond: bool, detail: str = "") -> None:
    global passed
    if cond:
        passed += 1
        print(f"  PASS  {label}")
    else:
        failed.append(label)
        print(f"  FAIL  {label}  {detail}")


def main() -> int:
    # ---- metadata completeness on loaded docs ----
    docs = rag.load_documents(DEMO_REF)
    print(f"\nDemo project documents loaded: {len(docs)}")
    check("8-12 demo documents", 8 <= len(docs) <= 12, str(len(docs)))
    for d in docs:
        check(f"metadata complete: {d.document_id}",
              bool(d.document_id) and d.project_id.lower() in {"gcu-demo-001", "1"}
              and bool(d.sensitivity) and bool(d.source),
              f"pid={d.project_id} sens={d.sensitivity} src={d.source}")

    # no canary in the loaded set at all
    ids = {d.document_id for d in docs}
    check("DOC-999 not loaded for demo project", "DOC-999" not in ids, str(ids))

    chunks = rag.split_into_chunks(docs)
    print(f"Chunks: {len(chunks)}")
    check("chunks produced", len(chunks) > 8, str(len(chunks)))

    # ---- the 4 spec queries ----
    for i, q in enumerate(QUERIES, 1):
        result = rag.retrieve(q, chunks, top_k=3)
        print(f"\nQ{i}: {q}")
        print(f"     sources={result.sources}")
        for c in result.chunks:
            print(f"     [{c.document_id} score={c.score:.3f}] {c.text[:70]!r}")
        check(f"Q{i} returns sources", len(result.sources) >= 1, str(result.sources))
        check(f"Q{i} returns <=3 chunks", len(result.chunks) <= 3, str(len(result.chunks)))
        check(f"Q{i} top-3 sensible (scores > 0)", all(c.score > 0 for c in result.chunks),
              str([c.score for c in result.chunks]))
        check(f"Q{i} never returns DOC-999", "DOC-999" not in result.sources, str(result.sources))
        check(f"Q{i} never returns other-project docs",
              all(d in ids for d in result.sources), str(result.sources))

    # relevance spot-checks: each query should surface its topic document
    q1 = {d for d in rag.retrieve(QUERIES[0], chunks, top_k=3).sources}
    check("Q1 hits a lightweight-model doc", bool(q1 & {"DOC-001", "DOC-106"}), str(q1))
    q2 = {d for d in rag.retrieve(QUERIES[1], chunks, top_k=3).sources}
    check("Q2 hits preprocessing/fundus docs", bool(q2 & {"DOC-103", "DOC-102"}), str(q2))
    q3 = {d for d in rag.retrieve(QUERIES[2], chunks, top_k=3).sources}
    check("Q3 hits evaluation docs", bool(q3 & {"DOC-108", "DOC-004"}), str(q3))
    q4 = {d for d in rag.retrieve(QUERIES[3], chunks, top_k=3).sources}
    check("Q4 hits the optimisation doc DOC-107", "DOC-107" in q4, str(q4))

    # ---- negative security tests ----
    print("\n-- negative security tests --")
    # a query that quotes the canary sentence verbatim
    canary_q = ("THIS DOCUMENT BELONGS TO ANOTHER PROJECT AND MUST NEVER BE "
                "RETRIEVED BY GCU-DEMO-001.")
    result = rag.retrieve(canary_q, chunks, top_k=3)
    check("canary-quoted query never returns DOC-999",
          "DOC-999" not in result.sources, str(result.sources))

    # unknown project id retrieves nothing from the demo project
    unknown_docs = rag.load_documents(UNKNOWN_REF)
    check("unknown project loads 0 documents", len(unknown_docs) == 0, str(len(unknown_docs)))
    unknown_result = rag.retrieve("diabetic retinopathy edge screening",
                                  rag.split_into_chunks(unknown_docs), top_k=3)
    check("unknown project retrieves 0 sources", unknown_result.sources == [],
          str(unknown_result.sources))

    # the canary is loadable only for its own project (loader works, filter works)
    canary_docs = rag.load_documents({"GCU-OTHER-001"})
    check("canary loads for its own project",
          any(d.document_id == "DOC-999" for d in canary_docs),
          str([d.document_id for d in canary_docs]))

    print(f"\n{passed} passed, {len(failed)} failed")
    if failed:
        print("FAILED:", *failed, sep="\n  - ")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
