"use client";
import { useMemo } from "react";
import { Search, Clock, CheckCircle, AlertCircle } from "lucide-react";
import type { HistoryItem } from "../../types";
import { useDebounce } from "../../hooks/useDebounce";

interface ChatHistoryProps {
  history: HistoryItem[];
  historySearch: string;
  onSearchChange: (value: string) => void;
  onItemClick: (item: HistoryItem) => void;
  onClear: () => void;
}

export default function ChatHistory({
  history,
  historySearch,
  onSearchChange,
  onItemClick,
  onClear
}: ChatHistoryProps) {
  // Debounce search input for better performance
  const debouncedSearch = useDebounce(historySearch, 300);

  // Memoize filtered history to avoid recalculating on every render
  const filteredHistory = useMemo(() => {
    if (!debouncedSearch) return history;
    
    const searchLower = debouncedSearch.toLowerCase();
    return history.filter(
      (item) =>
        item.question.toLowerCase().includes(searchLower) ||
        item.answer.toLowerCase().includes(searchLower)
    );
  }, [history, debouncedSearch]);

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B5A00' }}>
          Chat History
        </h3>
        {history.length > 0 && (
          <button
            onClick={onClear}
            className="text-xs"
            style={{ color: '#C17817' }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#A66212'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#C17817'}
          >
            Clear
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#A66212' }} />
        <input
          type="text"
          placeholder="Search history..."
          value={historySearch}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2"
          style={{ backgroundColor: '#FDFBD4', border: '1px solid #E8DFC8', color: '#713600' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(193, 120, 23, 0.2)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.boxShadow = 'none'; }}
        />
      </div>

      {/* History List */}
      <div className="space-y-2">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: '#D4B896' }} />
            <p className="text-sm" style={{ color: '#8B5A00' }}>No history yet</p>
          </div>
        ) : (
          filteredHistory.slice(0, 10).map((item) => (
            <button
              key={item.id}
              onClick={() => onItemClick(item)}
              className="w-full text-left p-3 rounded-lg transition-all group"
              style={{ backgroundColor: '#FDFBD4', border: '1px solid #E8DFC8' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.boxShadow = '0 1px 2px rgba(113, 54, 0, 0.05)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <div className="flex items-start gap-2">
                {item.success ? (
                  <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#C17817' }} />
                ) : (
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#C17817' }} />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: '#713600' }}>{item.question}</p>
                  <p className="text-xs mt-1" style={{ color: '#8B5A00' }}>
                    {item.timestamp.toLocaleDateString()} {item.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
