"use client";
import { CheckCircle, AlertCircle, AlertTriangle, Loader2 } from "lucide-react";
import type { QueryResult } from "../../types";

interface ChatResultProps {
  result: QueryResult | null;
  loading: boolean;
  columns: string[];
}

// Check if response indicates no data
const isNoDataResponse = (result: QueryResult) => {
  return result.status === "no_data" || 
         result.answer.toLowerCase().includes("no data found") ||
         result.answer.toLowerCase().includes("no matching records");
};

// Check if response is error
const isErrorResponse = (answer: string) => {
  return answer.toLowerCase().includes("error") || 
         answer.toLowerCase().includes("failed");
};

export default function ChatResult({ result, loading, columns }: ChatResultProps) {
  if (loading) {
    return (
      <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(193, 120, 23, 0.08)', border: '1px solid rgba(193, 120, 23, 0.2)' }}>
        <div className="flex items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C17817' }} />
          <div>
            <p className="font-medium" style={{ color: '#713600' }}>Analyzing your data...</p>
            <p className="text-sm mt-1" style={{ color: '#8B5A00' }}>Generating SQL query and fetching results</p>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Query Display */}
      <div className="rounded-xl p-4" style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8' }}>
        <p className="text-sm mb-2" style={{ color: '#8B5A00' }}>Your Question:</p>
        <p className="font-medium" style={{ color: '#713600' }}>{result.question}</p>
      </div>

      {/* SQL Display */}
      {result.generated_sql && (
        <div className="rounded-xl p-5 overflow-x-auto" style={{ backgroundColor: '#2A1810' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold uppercase" style={{ color: '#D4B896' }}>Generated SQL</span>
            <button className="text-xs" style={{ color: '#C17817' }} onMouseEnter={(e) => e.currentTarget.style.color = '#D4A574'} onMouseLeave={(e) => e.currentTarget.style.color = '#C17817'}>Copy</button>
          </div>
          <code className="text-sm font-mono" style={{ color: '#D4A574' }}>
            {result.generated_sql}
          </code>
        </div>
      )}

      {/* Answer Display */}
      {isNoDataResponse(result) ? (
        /* No Data Found State */
        <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(193, 120, 23, 0.08)', border: '1px solid rgba(193, 120, 23, 0.2)' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(193, 120, 23, 0.15)' }}>
              <AlertTriangle className="w-6 h-6" style={{ color: '#C17817' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#713600' }}>No Data Found</h3>
              <p className="mb-4" style={{ color: '#8B5A00' }}>{result.message || result.answer}</p>
              <div className="rounded-lg p-4" style={{ backgroundColor: '#FDFBD4', border: '1px solid #E8DFC8' }}>
                <p className="text-sm font-medium mb-2" style={{ color: '#713600' }}>Available columns to query:</p>
                <div className="flex flex-wrap gap-2">
                  {columns.map((col) => (
                    <span key={col} className="px-3 py-1 rounded-md text-xs font-medium" style={{ backgroundColor: '#F8F4E6', color: '#713600' }}>
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : isErrorResponse(result.answer) ? (
        /* Error State */
        <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)', border: '1px solid rgba(193, 120, 23, 0.25)' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(193, 120, 23, 0.2)' }}>
              <AlertCircle className="w-6 h-6" style={{ color: '#C17817' }} />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#713600' }}>Query Error</h3>
              <p style={{ color: '#8B5A00' }}>{result.answer}</p>
            </div>
          </div>
        </div>
      ) : (
        /* Success State */
        <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(193, 120, 23, 0.05)', border: '1px solid rgba(193, 120, 23, 0.15)' }}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(193, 120, 23, 0.15)' }}>
              <CheckCircle className="w-6 h-6" style={{ color: '#C17817' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2" style={{ color: '#713600' }}>Result</h3>
              <div className="whitespace-pre-wrap rounded-lg p-4" style={{ color: '#713600', backgroundColor: '#FDFBD4', border: '1px solid rgba(193, 120, 23, 0.15)' }}>
                {result.answer}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
