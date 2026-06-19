"use client";

import { useState, useCallback } from "react";
import { sendQuery, SourceNode } from "./api";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceNode[];
  suggestedQuestions?: string[];
  isStreaming?: boolean;
  sessionId?: string;
}

export function useStreamChat(sessionIdRef: React.MutableRefObject<string | undefined>) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(
    async (question: string) => {
      if (isLoading) return;

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
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, sessionIdRef]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, isLoading, error, sendMessage, clearChat };
}
