"""
LlamaIndex query engine backed by MongoDB Atlas Vector Search + Krutrim LLM.

The engine:
  - Retrieves the top-k most relevant chunks from MongoDB Atlas Vector Search,
    optionally filtered by book_slug / topic / language.
  - Uses a Hindi-aware prompt that replies in the same language as the question.
  - Returns the answer text together with source-node metadata.

Design note: the expensive objects (embedding model, LLM, vector index, prompt
templates) are built once per process via `_get_shared_components()`. Each
request builds a cheap retriever + query engine on top of them via
`build_query_engine()`, so per-request metadata filters do not blow up an
lru_cache keyed on the filter values.
"""

from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

from dotenv import load_dotenv

load_dotenv()


_HINDI_RAG_PROMPT = """You are a warm, well-read assistant who explains the spiritual teachings from the books of Dr. Narayan Dutt Shrimali.

Answer the user as if you are having a natural, flowing conversation - like a calm, knowledgeable friend explaining something. NOT filling out a form.

GROUNDING:
- Base your answer ONLY on the context below. Never invent facts or add outside knowledge.
- If the context does not contain the answer, say so plainly and naturally in the user's language (e.g. "इस बारे में पुस्तक में स्पष्ट रूप से नहीं बताया गया है।").
- You are explaining what the books say; you are not the Guru himself.
- The user's question has already been resolved against the conversation, so answer it directly without asking for clarification about pronouns or "which book".

STYLE:
- Reply in the SAME language as the question (Hindi question -> Hindi answer, English -> English).
- Write in natural prose and complete sentences. Do NOT use labelled sections or headings like "प्रश्न:", "उत्तर:", "थोड़ा विस्तार:", "संदर्भ:". Do NOT repeat the question back.
- Be concise and conversational - usually one short paragraph (2-5 sentences). Expand only if the question truly needs it.
- Tone: simple, calm, gently spiritual - never robotic, never academic.
- If it adds value, mention the source briefly and naturally inside the flow or in light parentheses at the end, e.g. "(मन्त्र रहस्य, पृष्ठ 24)". Keep it casual, not a formal citation block.
- If the topic involves tantra, sadhana, or attraction practices, gently add ONE closing sentence in the user's language reminding that such practices should be done under the guidance of a qualified guru.

---
CONTEXT:
{context_str}
---

USER'S QUESTION: {query_str}

Now reply naturally, in flowing conversational language:
"""


_MULTI_BOOK_RAG_PROMPT = """You are a warm, well-read assistant who explains the spiritual teachings from the books of Dr. Narayan Dutt Shrimali.

Answer the user as if you are having a natural, flowing conversation - like a calm, knowledgeable friend explaining something. NOT filling out a form.

GROUNDING:
- Base your answer ONLY on the context below. Never invent facts or add outside knowledge.
- If the context does not contain the answer, say so plainly and naturally in the user's language.
- You are explaining what the books say; you are not the Guru himself.

MULTI-BOOK ANSWER (the context contains passages from MORE THAN ONE book):
- Attribute every claim to the book it comes from, by name.
- Structure it as a natural comparison: first what one book says, then the other, and only if the texts genuinely align or differ, one sentence noting that. e.g. "मन्त्र रहस्य में ... बताया गया है, जबकि सौन्दर्य में ..."
- NEVER blend teachings from different books into one unattributed statement.
- If one of the books says nothing about the topic, say so for that book specifically.

STYLE:
- Reply in the SAME language as the question (Hindi -> Hindi, English -> English).
- Natural prose and complete sentences. No labelled sections or headings. Do NOT repeat the question back.
- Calm, gently spiritual, never robotic or academic.
- Mention sources lightly in the flow, e.g. "(सौन्दर्य, पृष्ठ 12)".
- If the topic involves tantra, sadhana, or attraction practices, gently add ONE closing sentence reminding that such practices should be done under a qualified guru's guidance.

---
CONTEXT:
{context_str}
---

USER'S QUESTION: {query_str}

Now reply naturally, in flowing conversational language:
"""


@dataclass
class SharedComponents:
    index: Any
    llm: Any
    qa_single: Any
    qa_multi: Any


@lru_cache(maxsize=1)
def _get_shared_components() -> SharedComponents:
    """Build the expensive, request-independent objects once per process."""
    from llama_index.core import VectorStoreIndex, StorageContext, Settings
    from llama_index.core.prompts import PromptTemplate

    from rag.embeddings import get_embedding_model
    from rag.vector_store import get_vector_store
    from llm.krutrim_llm import OurLLM

    embed_model = get_embedding_model()
    Settings.embed_model = embed_model

    llm = OurLLM(
        api_key=os.getenv("KRUTRIM_API_KEY", ""),
        model_name=os.getenv("KRUTRIM_MODEL", "gpt-oss-120b"),
    )
    Settings.llm = llm

    vector_store = get_vector_store()
    storage_context = StorageContext.from_defaults(vector_store=vector_store)
    index = VectorStoreIndex.from_vector_store(
        vector_store,
        storage_context=storage_context,
    )

    return SharedComponents(
        index=index,
        llm=llm,
        qa_single=PromptTemplate(_HINDI_RAG_PROMPT),
        qa_multi=PromptTemplate(_MULTI_BOOK_RAG_PROMPT),
    )


def _build_metadata_filters(
    book_slugs: list[str] | None = None,
    topic: str | None = None,
    language: str | None = None,
):
    """Build LlamaIndex MetadataFilters from optional constraints.

    - 1 book slug  -> equality filter on metadata.book_slug
    - >1 book slug -> IN filter (Atlas $in pre-filter on metadata.book_slug)
    - none         -> no book filter

    Returns None when nothing is constrained so the retriever runs unfiltered.
    """
    from llama_index.core.vector_stores import (
        MetadataFilter,
        MetadataFilters,
        FilterOperator,
    )

    filters = []

    slugs = [s for s in (book_slugs or []) if s]
    if len(slugs) == 1:
        filters.append(MetadataFilter(key="book_slug", value=slugs[0]))
    elif len(slugs) > 1:
        filters.append(
            MetadataFilter(key="book_slug", value=slugs, operator=FilterOperator.IN)
        )

    if topic:
        filters.append(MetadataFilter(key="topic", value=topic))
    if language:
        filters.append(MetadataFilter(key="language", value=language))

    return MetadataFilters(filters=filters) if filters else None


def build_query_engine(
    similarity_top_k: int = 12,
    book_slugs: list[str] | None = None,
    topic: str | None = None,
    language: str | None = None,
    streaming: bool = False,
):
    """Build a per-request query engine on top of the shared components.

    Cheap: only the retriever + query engine are constructed here. The index,
    embedding model, LLM and prompt templates are process-cached.
    """
    from llama_index.core.query_engine import RetrieverQueryEngine
    from llama_index.core.retrievers import VectorIndexRetriever

    c = _get_shared_components()
    retriever = VectorIndexRetriever(
        index=c.index,
        similarity_top_k=similarity_top_k,
        filters=_build_metadata_filters(book_slugs, topic, language),
    )
    template = c.qa_multi if (book_slugs and len(book_slugs) > 1) else c.qa_single
    return RetrieverQueryEngine.from_args(
        retriever=retriever,
        llm=c.llm,
        text_qa_template=template,
        streaming=streaming,
    )


def get_llm():
    """Expose the shared Krutrim LLM (used by the router for condense+route)."""
    return _get_shared_components().llm


def answer_query(
    standalone_question: str,
    book_slugs: list[str] | None = None,
    top_k: int = 12,
    streaming: bool = False,
    topic: str | None = None,
    language: str | None = None,
):
    """Retrieve + synthesize an answer, book-scoped when book_slugs is given.

    - 0/1 book: single-book prompt; if a filtered retrieval returns nothing,
      retry once unfiltered so the user still gets an answer.
    - >=2 books: balanced per-book retrieval merged by score, multi-book prompt
      (so each book is retrieved and attributed even when one dominates the corpus).

    Returns a LlamaIndex Response (or StreamingResponse when streaming=True);
    both expose `.source_nodes` and str()/`.response_gen`.
    """
    c = _get_shared_components()
    slugs = [s for s in (book_slugs or []) if s]

    if len(slugs) <= 1:
        engine = build_query_engine(
            top_k, slugs or None, topic=topic, language=language, streaming=streaming
        )
        resp = engine.query(standalone_question)
        if (slugs or topic or language) and not getattr(resp, "source_nodes", None):
            engine = build_query_engine(top_k, None, streaming=streaming)
            resp = engine.query(standalone_question)
        return resp

    # Multi-book: retrieve each book separately so none is starved, then merge.
    from llama_index.core import get_response_synthesizer
    from llama_index.core.retrievers import VectorIndexRetriever

    per_book = max(4, top_k // len(slugs))
    seen: set[str] = set()
    nodes = []
    for slug in slugs:
        retriever = VectorIndexRetriever(
            index=c.index,
            similarity_top_k=per_book,
            filters=_build_metadata_filters([slug]),
        )
        for n in retriever.retrieve(standalone_question):
            nid = n.node.node_id
            if nid not in seen:
                seen.add(nid)
                nodes.append(n)
    nodes.sort(key=lambda n: n.score or 0.0, reverse=True)

    synthesizer = get_response_synthesizer(
        llm=c.llm,
        text_qa_template=c.qa_multi,
        streaming=streaming,
    )
    return synthesizer.synthesize(standalone_question, nodes=nodes)


# ──────────────────────────────────────────────────────────────────────────────
# Backward-compatible thin wrappers (single book_slug string).
# ──────────────────────────────────────────────────────────────────────────────

def get_query_engine(
    similarity_top_k: int = 12,
    book_slug: str | None = None,
    topic: str | None = None,
    language: str | None = None,
):
    return build_query_engine(
        similarity_top_k=similarity_top_k,
        book_slugs=[book_slug] if book_slug else None,
        topic=topic,
        language=language,
        streaming=False,
    )


def get_streaming_query_engine(
    similarity_top_k: int = 12,
    book_slug: str | None = None,
    topic: str | None = None,
    language: str | None = None,
):
    return build_query_engine(
        similarity_top_k=similarity_top_k,
        book_slugs=[book_slug] if book_slug else None,
        topic=topic,
        language=language,
        streaming=True,
    )
