FROM python:3.11-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt /app/requirements.txt
COPY platform/apps/api/requirements.txt /app/api_requirements.txt

# Install CPU-only PyTorch explicitly. The default torch wheel bundles the CUDA 13
# GPU stack (~2.5 GB of nvidia-* wheels) that a CPU query server never uses —
# query embeddings run with device="cpu". Installing it first satisfies the `torch`
# pins in the requirements files, so pip won't pull the CUDA build.
RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu

# Install everything else, EXCLUDING torch (already installed, CPU) and easyocr.
# easyocr drags in torchvision + opencv + scikit-image (~1.5 GB) and is imported
# lazily only by the offline PDF-OCR ingestion path — never at API startup or in the
# query path — so the query-serving image doesn't need it.
RUN grep -ivE '^[[:space:]]*(torch|easyocr)([[:space:]<>=!]|$)' /app/requirements.txt \
      | pip install --no-cache-dir -r /dev/stdin \
 && grep -ivE '^[[:space:]]*(torch|easyocr)([[:space:]<>=!]|$)' /app/api_requirements.txt \
      | pip install --no-cache-dir -r /dev/stdin

# Pre-download the embedding model INTO the image, to a STABLE local directory, and
# load it from that path at runtime (compose sets EMBEDDING_MODEL=/opt/hf-models/embed).
# Why a path and not the hub name: main.py sets HF_HUB_OFFLINE=1, but transformers 5.x
# cannot reliably resolve the *hub cache* offline — it tries the network and fails with
# "couldn't connect to huggingface.co / not found in cache". Loading from a local
# directory skips all hub resolution, so it works offline regardless of network.
ARG EMBEDDING_MODEL=sentence-transformers/paraphrase-multilingual-mpnet-base-v2
RUN python -c "from huggingface_hub import snapshot_download; snapshot_download('${EMBEDDING_MODEL}', local_dir='/opt/hf-models/embed')"

# Copy application code
COPY platform/ /app/platform/

# Data lives outside the image: compose bind-mounts ./data to /app/data at runtime.
# (data/ is gitignored and may not exist in the build context, so don't COPY it.)
RUN mkdir -p /app/data

# Set Python path
ENV PYTHONPATH=/app

EXPOSE 8000

# The app is imported as `apps.api.main` (matching main.py's own uvicorn.run call).
# We can't use `platform.apps.api.main` because `platform` is a Python stdlib module
# that shadows the app dir — so add /app/platform to the import path via --app-dir.
# Single worker: each worker loads its own copy of the CPU embedding model (~1 GB
# resident), so on a small host 2 workers risks OOM. Scale up on a bigger box.
CMD ["uvicorn", "apps.api.main:app", "--app-dir", "/app/platform", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
