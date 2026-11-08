"use client";

import { useState, useCallback, useRef } from "react";
import { sendQuery, RateLimitError, SourceNode } from "./api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceNode[];
  suggestedQuestions?: string[];
  isStreaming?: boolean;
  sessionId?: string;
  isRateLimit?: boolean;  // true when this message is a rate-limit notice
}

export function useStreamChat(sessionIdRef: React.MutableRefObject<string | undefined>) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Synchronous in-flight lock. `isLoading` state only updates on the next
  // render, so two calls in the same tick (React Strict Mode re-running an
  // effect, double-click, Enter + click) would both pass a state check.
  const inFlightRef = useRef(false);

  const sendMessage = useCallback(
    async (question: string) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: question,
      };

      const assistantId = `assistant-${Date.now()}`;
      const assistantMsg: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await sendQuery(question, 12, sessionIdRef.current);

        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  content: response.answer,
                  sources: response.sources,
                  suggestedQuestions: response.suggested_questions ?? [],
                  isStreaming: false,
                }
              : m
          )
        );
      } catch (err) {
        if (err instanceof RateLimitError) {
          // Replace the blank assistant bubble with the rate-limit notice
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: err.message,
                    isStreaming: false,
                    isRateLimit: true,
                  }
                : m
            )
          );
        } else {
          const errMsg = err instanceof Error ? err.message : "Unknown error";
          setError(errMsg);
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    content: "I apologize — there was an error processing your question. Please try again.",
                    isStreaming: false,
                  }
                : m
            )
          );
        }
      } finally {
        inFlightRef.current = false;
        setIsLoading(false);
      }
    },
    [sessionIdRef]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat };
}
