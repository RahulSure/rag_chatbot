"""
LlamaIndex query engine backed by MongoDB Atlas Vector Search + Krutrim LLM.

The engine:
  - Retrieves the top-k most relevant chunks from ChromaDB.
  - Uses a custom Hindi-aware prompt that instructs the model to respond
    in the same language as the question (Hindi or English).
  - Returns the answer text together with source node metadata.
"""

from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()

# _HINDI_RAG_PROMPT = """\
# You are an AI assistant trained on the published spiritual writings of
# Dr. Narayan Dutt Shrimali (and related texts added to the system).

# IMPORTANT IDENTITY:
# - You are NOT Dr. Shrimali.
# - You are an AI system that explains and summarizes his teachings based ONLY on provided text.
# - Never speak as the Guru himself. Always maintain third-person framing like:
#   "According to the book..." or "In this text..."

# STRICT ANSWERING RULES:

# 1. SOURCE-BOUND ANSWERS ONLY
# - Use ONLY the provided context.
# - Do NOT add outside knowledge, assumptions, or interpretations.
# - If the answer is not clearly present, say:
#   "The answer is not clearly available in the provided text."

# 2. NO HALLUCINATIONS
# - Do NOT fill gaps.
# - Do NOT generalize beyond the text.
# - Do NOT combine ideas unless explicitly supported.

# 3. MULTI-BOOK HANDLING
# - If multiple sources are present, clearly distinguish them.
# - Mention book name and page reference wherever possible.
# - Do NOT merge teachings from different books unless clearly aligned.

# 4. TONE & STYLE
# - Calm, respectful, and neutral.
# - Slightly spiritual tone, but NOT preachy or authoritative.
# - Avoid exaggerated claims like "guaranteed", "definitely", etc.
# - Keep answers clear and structured.

# 5. SAFETY FOR SENSITIVE CONTENT (CRITICAL)
# If the question involves:
# - Tantra, sadhana procedures, rituals
# - Sexual energy / attraction practices
# - Vashikaran / influence / control
# - Health, physical transformation, or extreme claims

# THEN:
# - Add a caution note at the end:
#   "⚠️ This information is based on traditional text references. Such practices should only be undertaken under proper guidance of a qualified guru or expert."

# 6. NO ABSOLUTE CLAIMS
# - Present everything as "as described in the text"
# - Never present as universal truth or guaranteed outcome

# 7. LANGUAGE MATCHING
# - Reply in the SAME language as the user query

# ---

# RESPONSE FORMAT:

# 🕉️ Question:
# {query_str}

# 📖 Answer (based on text):
# [Clear, structured answer strictly from context]

# 📚 Sources:
# - [Book Name, Page X]
# - [Book Name, Page Y]

# (If no answer found)
# 📖 Answer:
# The answer is not clearly available in the provided text.

# ---

# CONTEXT:
# ---------------------
# {context_str}
# ---------------------
# """

_HINDI_RAG_PROMPT = """You are a warm, well-read assistant who explains the spiritual teachings from the books of Dr. Narayan Dutt Shrimali.

Answer the user as if you are having a natural, flowing conversation - like a calm, knowledgeable friend explaining something. NOT filling out a form.

GROUNDING:
- Base your answer ONLY on the context below. Never invent facts or add outside knowledge.
- If the context does not contain the answer, say so plainly and naturally in the user's language (e.g. "इस बारे में पुस्तक में स्पष्ट रूप से नहीं बताया गया है।").
- You are explaining what the books say; you are not the Guru himself.

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


def _build_metadata_filters(
    book_slug: str | None = None,
    topic: str | None = None,
    language: str | None = None,
):
    """Build a LlamaIndex MetadataFilters from optional metadata constraints.

    Returns None when no filter is requested so the retriever falls back to its
    unfiltered behavior.
    """
    from llama_index.core.vector_stores import MetadataFilter, MetadataFilters

    pairs = [
        ("book_slug", book_slug),
        ("topic", topic),
        ("language", language),
    ]
    filters = [MetadataFilter(key=k, value=v) for k, v in pairs if v]
    return MetadataFilters(filters=filters) if filters else None


@lru_cache(maxsize=8)
def get_query_engine(
    similarity_top_k: int = 12,
    book_slug: str | None = None,
    topic: str | None = None,
    language: str | None = None,
):
    """
    Build and cache a LlamaIndex RetrieverQueryEngine.

    Parameters
    ----------
    similarity_top_k:
        Number of top chunks to retrieve per query.
    book_slug, topic, language:
        Optional metadata filters applied to the vector search. Each maps to
        a `metadata.<field>` filter the Atlas vector_index already declares.
    """
    from llama_index.core import VectorStoreIndex, StorageContext, Settings
    from llama_index.core.prompts import PromptTemplate
    from llama_index.core.query_engine import RetrieverQueryEngine
    from llama_index.core.retrievers import VectorIndexRetriever

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

    retriever = VectorIndexRetriever(
        index=index,
        similarity_top_k=similarity_top_k,
        filters=_build_metadata_filters(book_slug, topic, language),
    )

    qa_prompt = PromptTemplate(_HINDI_RAG_PROMPT)

    query_engine = RetrieverQueryEngine.from_args(
        retriever=retriever,
        llm=llm,
        text_qa_template=qa_prompt,
        streaming=False,
    )

    return query_engine


def get_streaming_query_engine(
    similarity_top_k: int = 12,
    book_slug: str | None = None,
    topic: str | None = None,
    language: str | None = None,
):
    """Returns a streaming-enabled query engine (not cached — streaming = stateful)."""
    from llama_index.core import VectorStoreIndex, StorageContext, Settings
    from llama_index.core.prompts import PromptTemplate
    from llama_index.core.query_engine import RetrieverQueryEngine
    from llama_index.core.retrievers import VectorIndexRetriever

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

    retriever = VectorIndexRetriever(
        index=index,
        similarity_top_k=similarity_top_k,
        filters=_build_metadata_filters(book_slug, topic, language),
    )

    qa_prompt = PromptTemplate(_HINDI_RAG_PROMPT)

    return RetrieverQueryEngine.from_args(
        retriever=retriever,
        llm=llm,
        text_qa_template=qa_prompt,
        streaming=True,
    )
