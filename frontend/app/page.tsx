"use client";
import { useState } from "react";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [columns, setColumns] = useState([]);
  
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // 1. Handle File Upload
  const handleFileUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (data.message) {
        setIsUploaded(true);
        setColumns(data.columns);
      } else {
        alert("Upload failed");
      }
    } catch (error) {
      console.error(error);
      alert("Error uploading file");
    }
  };

  // 2. Handle Asking Questions
  const askAI = async () => {
    if (!question) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question }),
      });
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ answer: "Error connecting to backend." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-12 bg-gray-900 text-white">
      <div className="max-w-3xl w-full">
        <h1 className="text-4xl font-bold mb-8 text-center text-blue-400">
          Dynamic Data Chat 📊
        </h1>

        {/* STEP 1: UPLOAD SECTION */}
        {!isUploaded ? (
          <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
            <h2 className="text-xl mb-4">Step 1: Upload your Data (CSV)</h2>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="mb-4 block w-full text-sm text-gray-400
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-blue-600 file:text-white
                hover:file:bg-blue-700"
            />
            <button
              onClick={handleFileUpload}
              className="px-6 py-2 bg-green-600 rounded font-bold hover:bg-green-700"
            >
              Upload & Start Chatting
            </button>
          </div>
        ) : (
          /* STEP 2: CHAT SECTION */
          <div className="space-y-6">
            <div className="bg-gray-800 p-4 rounded text-sm text-gray-400">
              <p>✅ Database Active. Columns detected: {columns.join(", ")}</p>
              <button 
                onClick={() => setIsUploaded(false)} 
                className="text-red-400 underline mt-2"
              >
                Upload different file
              </button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                className="w-full p-3 rounded bg-gray-800 border border-gray-700 focus:outline-none focus:border-blue-500"
                placeholder="Ask something about your data..."
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
              <button
                onClick={askAI}
                disabled={loading}
                className="p-3 bg-blue-600 rounded hover:bg-blue-700 font-bold"
              >
                {loading ? "..." : "Ask"}
              </button>
            </div>

            {result && (
              <div className="p-6 bg-gray-800 rounded-lg border border-gray-700">
                <h2 className="text-xl font-bold text-green-400 mb-2">Answer:</h2>
                <p className="text-lg mb-4">{result.answer}</p>
                <code className="block bg-black p-2 rounded text-yellow-500 text-xs">
                  {result.generated_sql}
                </code>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}