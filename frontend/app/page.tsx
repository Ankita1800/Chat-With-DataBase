"use client";
import { useState } from "react";

export default function Home() {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const askAI = async () => {
    if (!question) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: question }),
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error:", error);
      setResult({ answer: "Error connecting to the backend." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-gray-900 text-white">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex-col">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-400">
          Chat with your Database
        </h1>

        <div className="w-full max-w-md mx-auto">
          {/* Input Area */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              className="w-full p-3 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500"
              placeholder="Ask e.g., How many Laptops sold?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && askAI()}
            />
            <button
              onClick={askAI}
              disabled={loading}
              className="p-3 bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50 font-bold"
            >
              {loading ? "..." : "Ask"}
            </button>
          </div>

          {/* Results Area */}
          {result && (
            <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
              <h2 className="text-xl font-bold text-green-400 mb-2">Answer:</h2>
              <p className="text-lg mb-4">{result.answer}</p>
              
              <div className="pt-4 border-t border-gray-700">
                <p className="text-xs text-gray-400 uppercase">AI Generated SQL:</p>
                <code className="block bg-black p-2 rounded mt-1 text-yellow-500 font-mono text-xs">
                  {result.generated_sql}
                </code>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}