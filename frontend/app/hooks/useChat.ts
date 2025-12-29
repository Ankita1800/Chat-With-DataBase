"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { chatService } from "../services/chat.service";
import type { QueryResult, HistoryItem, Dataset } from "../types";

export function useChat(selectedDataset: Dataset | null, isMounted: boolean, onShowInfo: (title: string, message: string, type: "error" | "info") => void) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");

  // Load history from localStorage (only after mount for hydration safety)
  useEffect(() => {
    if (!isMounted) return;
    const savedHistory = localStorage.getItem("chatHistory");
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory).map((item: HistoryItem) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (error) {
        console.error("Failed to load history:", error);
        localStorage.removeItem("chatHistory");
      }
    }
  }, [isMounted]);

  // Save history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("chatHistory", JSON.stringify(history));
    }
  }, [history]);

  /**
   * Ask AI a question
   */
  const askAI = async () => {
    if (!question.trim()) return;
    if (!selectedDataset) {
      onShowInfo("No Dataset", "Please upload a dataset first", "info");
      return;
    }

    setLoading(true);
    setResult(null);

    const currentQuestion = question;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const data = await chatService.askQuestion(currentQuestion, selectedDataset.id, session.access_token);
      data.question = currentQuestion;
      setResult(data);

      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        question: currentQuestion,
        answer: data.answer,
        sql: data.generated_sql || "",
        timestamp: new Date(),
        success: data.status !== "no_data" && !data.answer.toLowerCase().includes("error"),
      };
      setHistory((prev) => [historyItem, ...prev]);
    } catch (error) {
      const errorResult = {
        question: currentQuestion,
        answer: `Error: ${error instanceof Error ? error.message : "Failed to connect to backend"}`,
      };
      setResult(errorResult);
    } finally {
      setLoading(false);
      setQuestion("");
    }
  };

  /**
   * Load history item
   */
  const loadHistoryItem = (item: HistoryItem) => {
    setResult({
      question: item.question,
      answer: item.answer,
      generated_sql: item.sql,
    });
  };

  /**
   * Clear history
   */
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("chatHistory");
  };

  return {
    question,
    setQuestion,
    result,
    loading,
    history,
    historySearch,
    setHistorySearch,
    askAI,
    loadHistoryItem,
    clearHistory,
  };
}
