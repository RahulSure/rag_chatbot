"""
Embedding model setup using HuggingFace sentence-transformers.

Model: paraphrase-multilingual-mpnet-base-v2
- Supports 50+ languages including Hindi (Devanagari)
- 768-dimensional vectors
- Downloaded once; cached in HuggingFace local cache (~1.1 GB)
"""

from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()

EMBEDDING_MODEL = os.getenv(
    "EMBEDDING_MODEL",
    "sentence-transformers/paraphrase-multilingual-mpnet-base-v2",
)


@lru_cache(maxsize=1)
def get_embedding_model():
    """
    Returns a LlamaIndex-compatible embedding model backed by HuggingFace.
    Cached so the model is loaded only once per process.
    """
    from llama_index.embeddings.huggingface import HuggingFaceEmbedding

    # HF_TOKEN is picked up automatically by huggingface_hub from the environment.
    # Calling huggingface_hub.login() explicitly makes a network request to /api/whoami-v2
    # which fails when HF_HUB_OFFLINE=1 is set.

    print(f"[embeddings] Loading embedding model: {EMBEDDING_MODEL}")
    return HuggingFaceEmbedding(
        model_name=EMBEDDING_MODEL,
        device="cpu",
        embed_batch_size=32,
    )
