from typing import Optional, List, Mapping, Any, Generator
import json
import os
import requests
import httpx

from llama_index.core.llms import (
    CustomLLM,
    CompletionResponse,
    CompletionResponseGen,
    LLMMetadata,
    ChatResponse,
    ChatMessage,
)
from llama_index.core.llms.callbacks import llm_completion_callback, llm_chat_callback


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

    # ────────────────────────────────────────────────────────────────
    #  Non-streaming synchronous completion
    # ────────────────────────────────────────────────────────────────
    @llm_completion_callback()
    def complete(self, prompt: str, **kwargs: Any) -> CompletionResponse:
        url = "https://cloud.olakrutrim.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": kwargs.get("temperature", float(os.getenv("LLM_TEMPERATURE", "0.7"))),
            "max_tokens": kwargs.get("max_tokens", self.num_output),
            "stream": False,
        }

        try:
            response = requests.post(url, headers=headers, json=payload, timeout=120)
            response.raise_for_status()
            data = response.json()
            text = self._extract_response_text(data)
            return CompletionResponse(text=text)
        except requests.RequestException as e:
            return CompletionResponse(text=f"Request error: {str(e)}")

    # ────────────────────────────────────────────────────────────────
    #  Non-streaming async completion
    # ────────────────────────────────────────────────────────────────
    @llm_completion_callback()
    async def acomplete(self, prompt: str, **kwargs: Any) -> CompletionResponse:
        url = "https://cloud.olakrutrim.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": kwargs.get("temperature", float(os.getenv("LLM_TEMPERATURE", "0.7"))),
            "max_tokens": kwargs.get("max_tokens", self.num_output),
            "stream": False,
        }

        try:
            async with httpx.AsyncClient(timeout=120) as client:
                response = await client.post(url, headers=headers, json=payload)
                response.raise_for_status()
                data = response.json()
                text = self._extract_response_text(data)
                return CompletionResponse(text=text)
        except httpx.RequestError as e:
            return CompletionResponse(text=f"HTTP error: {str(e)}")

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
    # ────────────────────────────────────────────────────────────────
    @llm_completion_callback()
    def stream_complete(self, prompt: str, **kwargs: Any) -> CompletionResponseGen:
        url = "https://cloud.olakrutrim.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "Accept": "text/event-stream",
        }
        payload = {
            "model": self.model_name,
            "messages": [{"role": "user", "content": prompt}],
            "temperature": kwargs.get("temperature", float(os.getenv("LLM_TEMPERATURE", "0.7"))),
            "max_tokens": kwargs.get("max_tokens", self.num_output),
            "stream": True,
        }

        accumulated_text = ""

        try:
            with requests.post(
                url, headers=headers, json=payload, stream=True, timeout=180
            ) as response:
                response.raise_for_status()

                for line in response.iter_lines():
                    if not line:
                        continue
                    line = line.decode("utf-8").strip()

                    if line.startswith("data: "):
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
                            yield CompletionResponse(
                                text=accumulated_text,
                                delta=delta_content,
                            )

        except Exception as e:
            yield CompletionResponse(text=f"[Streaming error: {str(e)}]")
