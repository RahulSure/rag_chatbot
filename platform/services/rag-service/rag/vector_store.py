"""
MongoDB Atlas Vector Search store setup for LlamaIndex.
"""

from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()

MONGODB_URI        = os.getenv("MONGODB_URI", "")
MONGODB_DB_NAME    = os.getenv("MONGODB_DB_NAME", "dr-narayan-dutt")
MONGODB_COLLECTION = os.getenv("MONGODB_COLLECTION", "books")
MONGODB_INDEX_NAME = os.getenv("MONGODB_INDEX_NAME", "vector_index")


@lru_cache(maxsize=1)
def _get_mongo_client():
    import pymongo

    if not MONGODB_URI:
        raise ValueError("MONGODB_URI is not set in .env")
    return pymongo.MongoClient(MONGODB_URI)


def get_vector_store():
    """Returns a LlamaIndex MongoDBAtlasVectorSearch store."""
    from llama_index.vector_stores.mongodb import MongoDBAtlasVectorSearch

    client = _get_mongo_client()
    return MongoDBAtlasVectorSearch(
        client,
        db_name=MONGODB_DB_NAME,
        collection_name=MONGODB_COLLECTION,
        vector_index_name=MONGODB_INDEX_NAME,
    )


def get_collection():
    """Returns the raw pymongo collection of book chunks."""
    return _get_mongo_client()[MONGODB_DB_NAME][MONGODB_COLLECTION]


def collection_count() -> int:
    """Returns the number of documents currently stored in the collection."""
    return get_collection().count_documents({})
