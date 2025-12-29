"use client";
import { Bot, Send, Loader2 } from "lucide-react";
import type { Dataset } from "../../types";

interface ChatInputProps {
  question: string;
  loading: boolean;
  selectedDataset: Dataset | null;
  columns: string[];
  onQuestionChange: (value: string) => void;
  onSubmit: () => void;
  onSuggestionClick: (suggestion: string) => void;
}

export default function ChatInput({
  question,
  loading,
  selectedDataset,
  columns,
  onQuestionChange,
  onSubmit,
  onSuggestionClick
}: ChatInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !loading && selectedDataset) {
      onSubmit();
    }
  };

  return (
    <div className="rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm" style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8' }}>
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 relative">
          <Bot className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#C17817' }} />
          <input
            type="text"
            value={question}
            onChange={(e) => onQuestionChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedDataset ? "Ask about your data..." : "Select or upload a dataset first..."}
            disabled={!selectedDataset}
            className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2"
            style={{ backgroundColor: '#FDFBD4', border: '1px solid #E8DFC8', color: '#713600', cursor: selectedDataset ? 'text' : 'not-allowed', opacity: selectedDataset ? 1 : 0.6 }}
            onFocus={(e) => { if (selectedDataset) { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(193, 120, 23, 0.2)'; } }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.boxShadow = 'none'; }}
          />
        </div>
        <button
          onClick={onSubmit}
          disabled={loading || !question.trim() || !selectedDataset}
          className="px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all shadow-sm w-full sm:w-auto"
          style={{ backgroundColor: '#C17817', color: '#FDFBD4' }}
          onMouseEnter={(e) => { if (!loading && question.trim() && selectedDataset) e.currentTarget.style.backgroundColor = '#A66212'; }}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C17817'}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
          ) : (
            <>
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Ask AI</span>
            </>
          )}
        </button>
      </div>

      {/* Quick Suggestions */}
      <div className="flex flex-wrap gap-2 mt-4">
        <span className="text-xs font-medium" style={{ color: '#8B5A00' }}>Try:</span>
        {columns.slice(0, 3).map((col) => (
          <button
            key={col}
            onClick={() => onSuggestionClick(`Show all ${col} values`)}
            className="px-3 py-1.5 text-xs rounded-lg transition-all"
            style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8', color: '#713600' }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.1)'; e.currentTarget.style.color = '#C17817'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.backgroundColor = '#F8F4E6'; e.currentTarget.style.color = '#713600'; }}
          >
            Show {col}
          </button>
        ))}
        <button
          onClick={() => onSuggestionClick("How many rows are in the table?")}
          className="px-3 py-1.5 text-xs rounded-lg transition-all"
          style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8', color: '#713600' }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.1)'; e.currentTarget.style.color = '#C17817'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.backgroundColor = '#F8F4E6'; e.currentTarget.style.color = '#713600'; }}
        >
          Count rows
        </button>
      </div>
    </div>
  );
}
