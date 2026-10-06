"""Simple project-scoped RAG: document loader + chunker + TF-IDF retrieval.

No vector database, no sklearn — a small deterministic TF-IDF + cosine
similarity implementation over a handful of curated documents.

Knowledge base layout (relative to the backend directory):

    data/knowledge/*.{txt,md,pdf}

Every file must start with front matter so documents can never leak across
projects:

    ---
    document_id: DOC-001
    project_id: GCU-DEMO-001
    sensitivity: INTERNAL
    source: synthetic_demo_reference
    ---
    Free text follows...

``project_id`` in front matter may be a project code (GCU-DEMO-001) or a
numeric project id (1). Retrieval is always filtered by the requested
project before any text reaches the LLM.
"""

import math
import re
from dataclasses import dataclass, field
from pathlib import Path

KNOWLEDGE_DIR = Path(__file__).resolve().parents[2] / "data" / "knowledge"
SUPPORTED_SUFFIXES = {".txt", ".md", ".pdf"}

_FRONT_MATTER_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n", re.DOTALL)
_TOKEN_RE = re.compile(r"[a-z0-9]+")
_STOPWORDS = {
    "the", "a", "an", "and", "or", "of", "to", "in", "for", "on", "with",
    "is", "are", "be", "can", "how", "what", "which", "this", "that", "it",
    "as", "at", "by", "from", "into", "than", "then", "when", "do", "does",
}


@dataclass
class Document:
    document_id: str
    project_id: str
    sensitivity: str
    source: str
    text: str


@dataclass
class Chunk:
    document_id: str
    text: str
    source: str = ""
    score: float = 0.0


@dataclass
class RetrievalResult:
    chunks: list[Chunk] = field(default_factory=list)
    sources: list[str] = field(default_factory=list)


def _parse_front_matter(raw: str, fallback_id: str) -> tuple[dict[str, str], str]:
    """Extract ``key: value`` front matter; returns (metadata, body)."""
    match = _FRONT_MATTER_RE.match(raw)
    if not match:
        return {}, raw
    metadata: dict[str, str] = {}
    for line in match.group(1).splitlines():
        if ":" in line:
            key, value = line.split(":", 1)
            metadata[key.strip().lower()] = value.strip()
    metadata.setdefault("document_id", fallback_id)
    body = raw[match.end():]
    return metadata, body


def _read_text(path: Path) -> str:
    if path.suffix.lower() == ".pdf":
        from pypdf import PdfReader  # imported lazily: only needed for PDFs

        reader = PdfReader(str(path))
        return "\n".join(page.extract_text() or "" for page in reader.pages)
    return path.read_text(encoding="utf-8", errors="replace")


def load_documents(project_ref: set[str]) -> list[Document]:
    """Load knowledge documents whose ``project_id`` matches ``project_ref``.

    ``project_ref`` contains every accepted identifier for the project
    (numeric id as str, project code) so filtering is exact and enforced
    at load time — another project's documents are never read into scope.
    """
    if not KNOWLEDGE_DIR.is_dir():
        return []

    accepted = {ref.strip().lower() for ref in project_ref if ref.strip()}
    documents: list[Document] = []
    for path in sorted(KNOWLEDGE_DIR.iterdir()):
        if path.suffix.lower() not in SUPPORTED_SUFFIXES:
            continue
        try:
            raw = _read_text(path)
        except Exception:
            continue  # skip unreadable files, never fail the request
        metadata, body = _parse_front_matter(raw, fallback_id=path.stem)
        doc_project = metadata.get("project_id", "").lower()
        if not doc_project or doc_project not in accepted:
            continue  # project isolation: skip other projects' documents
        documents.append(
            Document(
                document_id=metadata.get("document_id", path.stem),
                project_id=metadata.get("project_id", ""),
                sensitivity=metadata.get("sensitivity", "INTERNAL"),
                # Honour the front-matter source label when present (fall back
                # to the filename for older documents without one).
                source=metadata.get("source") or path.name,
                text=body.strip(),
            )
        )
    return documents


def split_into_chunks(documents: list[Document], chunk_size: int = 600) -> list[Chunk]:
    """Split documents into overlapping character chunks on paragraph edges."""
    chunks: list[Chunk] = []
    overlap = 100
    for doc in documents:
        if not doc.text:
            continue
        start = 0
        text_len = len(doc.text)
        while start < text_len:
            end = min(start + chunk_size, text_len)
            if end < text_len:
                # Prefer breaking at a paragraph or sentence boundary.
                window = doc.text[start:end]
                cut = max(window.rfind("\n\n"), window.rfind(". "), window.rfind("\n"))
                if cut > chunk_size // 2:
                    end = start + cut + 1
            chunk_text = doc.text[start:end].strip()
            if chunk_text:
                chunks.append(Chunk(document_id=doc.document_id, text=chunk_text, source=doc.source))
            if end >= text_len:
                break
            start = max(end - overlap, start + 1)
    return chunks


def _tokenize(text: str) -> list[str]:
    return [t for t in _TOKEN_RE.findall(text.lower()) if t not in _STOPWORDS and len(t) > 1]


def _tf(tokens: list[str]) -> dict[str, int]:
    counts: dict[str, int] = {}
    for token in tokens:
        counts[token] = counts.get(token, 0) + 1
    return counts


def retrieve(query: str, chunks: list[Chunk], top_k: int = 3) -> RetrievalResult:
    """TF-IDF + cosine similarity retrieval, top_k chunks with source ids."""
    if not chunks:
        return RetrievalResult()

    query_tf = _tf(_tokenize(query))
    if not query_tf:
        return RetrievalResult()

    n_docs = len(chunks)
    doc_freq: dict[str, int] = {}
    doc_tfs: list[dict[str, int]] = []
    for chunk in chunks:
        tf = _tf(_tokenize(chunk.text))
        doc_tfs.append(tf)
        for token in tf:
            doc_freq[token] = doc_freq.get(token, 0) + 1

    def idf(token: str) -> float:
        return math.log((1 + n_docs) / (1 + doc_freq.get(token, 0))) + 1.0

    query_vec = {t: (1.0 + math.log(c)) * idf(t) for t, c in query_tf.items()}
    query_norm = math.sqrt(sum(w * w for w in query_vec.values())) or 1.0

    scored: list[Chunk] = []
    for chunk, tf in zip(chunks, doc_tfs):
        vec = {t: (1.0 + math.log(c)) * idf(t) for t, c in tf.items()}
        norm = math.sqrt(sum(w * w for w in vec.values())) or 1.0
        dot = sum(query_vec[t] * vec.get(t, 0.0) for t in query_vec)
        score = dot / (query_norm * norm)
        if score > 0:
            scored.append(
                Chunk(document_id=chunk.document_id, text=chunk.text, source=chunk.source, score=score)
            )

    scored.sort(key=lambda c: c.score, reverse=True)
    top = scored[:top_k]
    sources: list[str] = []
    for chunk in top:
        if chunk.document_id not in sources:
            sources.append(chunk.document_id)
    return RetrievalResult(chunks=top, sources=sources)
