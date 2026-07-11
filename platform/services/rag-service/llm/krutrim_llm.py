from typing import Mapping, Any
import json
import os
import time

import requests
import httpx

from llama_index.core.llms import (
    CustomLLM,
    CompletionResponse,
    CompletionResponseGen,
    LLMMetadata,
)
from llama_index.core.llms.callbacks import llm_completion_callback


KRUTRIM_ENDPOINT = "https://cloud.olakrutrim.com/v1/chat/completions"
DEFAULT_TIMEOUT = 120
STREAM_TIMEOUT = 180
MAX_ATTEMPTS = 2          # 1 retry
BACKOFF_SECONDS = 1.0


class KrutrimLLMError(RuntimeError):
    """Raised when the Krutrim API fails after retries.

    Callers (query handlers, router) catch this to surface a 502 / fall back,
    rather than persisting the error text as if it were a real answer.
    """


class OurLLM(CustomLLM):
    context_window: int = 32768
    num_output: int = 1024
    model_name: str = os.getenv("KRUTRIM_MODEL", "gpt-oss-120b")
    api_key: str = os.getenv("KRUTRIM_API_KEY", "")

    @property
    def metadata(self) -> LLMMetadata:
        return LLMMetadata(
            context_window=self.context_window,
            num_output=self.num_output,
            model_name=self.model_name,
        )

    def _headers(self, stream: bool = False) -> dict:
        h = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        if stream:
            h["Accept"] = "text/event-stream"
        return h

    def _payload(self, prompt: str, stream: bool, **kwargs: Any) -> dict:
        return {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": kwargs.get("temperature", float(os.getenv("LLM_TEMPERATURE", "0.7"))),
            "max_tokens": kwargs.get("max_tokens", self.num_output),
            "stream": stream,
        }

    # ────────────────────────────────────────────────────────────────
    #  Non-streaming synchronous completion (with retry, raises on failure)
    # ────────────────────────────────────────────────────────────────
    @llm_completion_callback()
    def complete(self, prompt: str, **kwargs: Any) -> CompletionResponse:
        timeout = kwargs.get("timeout", DEFAULT_TIMEOUT)
        payload = self._payload(prompt, stream=False, **kwargs)
        last_err: Exception | None = None

        for attempt in range(1, MAX_ATTEMPTS + 1):
            try:
                response = requests.post(
                    KRUTRIM_ENDPOINT, headers=self._headers(), json=payload, timeout=timeout
                )
                response.raise_for_status()
                text = self._extract_response_text(response.json())
                if not text:
                    raise KrutrimLLMError("Krutrim returned an empty completion")
                return CompletionResponse(text=text)
            except (requests.RequestException, KrutrimLLMError) as e:
                last_err = e
                if attempt < MAX_ATTEMPTS:
                    time.sleep(BACKOFF_SECONDS * attempt)

        raise KrutrimLLMError(f"Krutrim request failed after {MAX_ATTEMPTS} attempts: {last_err}")

    # ────────────────────────────────────────────────────────────────
    #  Non-streaming async completion
    # ────────────────────────────────────────────────────────────────
    @llm_completion_callback()
    async def acomplete(self, prompt: str, **kwargs: Any) -> CompletionResponse:
        import asyncio

        timeout = kwargs.get("timeout", DEFAULT_TIMEOUT)
        payload = self._payload(prompt, stream=False, **kwargs)
        last_err: Exception | None = None

        for attempt in range(1, MAX_ATTEMPTS + 1):
            try:
                async with httpx.AsyncClient(timeout=timeout) as client:
                    response = await client.post(
                        KRUTRIM_ENDPOINT, headers=self._headers(), json=payload
                    )
                    response.raise_for_status()
                    text = self._extract_response_text(response.json())
                    if not text:
                        raise KrutrimLLMError("Krutrim returned an empty completion")
                    return CompletionResponse(text=text)
            except (httpx.HTTPError, KrutrimLLMError) as e:
                last_err = e
                if attempt < MAX_ATTEMPTS:
                    await asyncio.sleep(BACKOFF_SECONDS * attempt)

        raise KrutrimLLMError(f"Krutrim request failed after {MAX_ATTEMPTS} attempts: {last_err}")

    @staticmethod
    def _extract_response_text(data: Mapping[str, Any]) -> str:
        choices = data.get("choices") or []
        if not choices:
            return ""

        first = choices[0] or {}
        message = first.get("message") or {}
        content = message.get("content")

        if isinstance(content, list):
            chunks: list[str] = []
            for item in content:
                if isinstance(item, dict):
                    txt = item.get("text")
                    if isinstance(txt, str):
                        chunks.append(txt)
            return "".join(chunks).strip()

        if isinstance(content, str):
            return content.strip()

        for key in ("text", "output_text"):
            alt = first.get(key)
            if isinstance(alt, str) and alt.strip():
                return alt.strip()

        return ""

    # ────────────────────────────────────────────────────────────────
    #  Synchronous streaming completion
    #  Connection/HTTP errors before the first token raise (caught by the
    #  SSE generator in query.py, which emits an [ERROR] frame). A mid-stream
    #  error yields an error marker token so the client isn't left hanging.
    # ────────────────────────────────────────────────────────────────
    @llm_completion_callback()
    def stream_complete(self, prompt: str, **kwargs: Any) -> CompletionResponseGen:
        timeout = kwargs.get("timeout", STREAM_TIMEOUT)
        payload = self._payload(prompt, stream=True, **kwargs)

        try:
            response = requests.post(
                KRUTRIM_ENDPOINT, headers=self._headers(stream=True),
                json=payload, stream=True, timeout=timeout,
            )
            response.raise_for_status()
        except requests.RequestException as e:
            raise KrutrimLLMError(f"Krutrim streaming request failed: {e}")

        accumulated_text = ""
        try:
            with response:
                for line in response.iter_lines():
                    if not line:
                        continue
                    line = line.decode("utf-8").strip()
                    if not line.startswith("data: "):
                        continue

                    data_str = line[6:].strip()
                    if data_str == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data_str)
                    except json.JSONDecodeError:
                        continue

                    choices = chunk.get("choices", [])
                    if not choices:
                        continue
                    delta_content = choices[0].get("delta", {}).get("content", "")
                    if delta_content:
                        accumulated_text += delta_content
                        yield CompletionResponse(text=accumulated_text, delta=delta_content)
        except Exception as e:
            yield CompletionResponse(
                text=accumulated_text + f"\n[स्ट्रीमिंग त्रुटि: {e}]",
                delta=f"\n[स्ट्रीमिंग त्रुटि: {e}]",
            )
