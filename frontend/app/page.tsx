"use client";
import { useState, useRef, useEffect } from "react";
import {
  Database,
  Upload,
  FileUp,
  CheckCircle,
  AlertCircle,
  Search,
  Trash2,
  Menu,
  X,
  Server,
  Cloud,
  HardDrive,
  Clock,
  MessageSquare,
  Sparkles,
  Loader2,
  Info,
  ChevronRight,
  Network,
  Zap,
  BarChart3,
  Table,
  FileText,
  AlertTriangle,
  Bot,
  Send,
  ArrowRight,
  Shield,
  Cpu,
  LineChart,
  PieChart,
} from "lucide-react";

// Types
interface HistoryItem {
  id: string;
  question: string;
  answer: string;
  sql: string;
  timestamp: Date;
  success: boolean;
}

interface QueryResult {
  question?: string;
  generated_sql?: string;
  answer: string;
  confidence?: number;
  data_found?: boolean;
}

export default function Home() {
  // State
  const [file, setFile] = useState<File | null>(null);
  const [isUploaded, setIsUploaded] = useState(false);
  const [columns, setColumns] = useState<string[]>([]);
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [showStorageInfo, setShowStorageInfo] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("chatHistory");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory).map((item: HistoryItem) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })));
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("chatHistory", JSON.stringify(history));
    }
  }, [history]);

  // Handle File Upload
  const handleFileUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 100);

    try {
      const response = await fetch("http://127.0.0.1:8000/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      if (data.message) {
        setTimeout(() => {
          setIsUploaded(true);
          setColumns(data.columns);
          setIsUploading(false);
        }, 500);
      } else {
        alert("Upload failed: " + (data.error || "Unknown error"));
        setIsUploading(false);
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error(error);
      alert("Error uploading file");
      setIsUploading(false);
    }
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      setFile(droppedFile);
    } else {
      alert("Please upload a CSV file");
    }
  };

  // Handle Asking Questions
  const askAI = async () => {
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question }),
      });
      const data: QueryResult = await response.json();
      setResult(data);

      const historyItem: HistoryItem = {
        id: Date.now().toString(),
        question: question,
        answer: data.answer,
        sql: data.generated_sql || "",
        timestamp: new Date(),
        success: !data.answer.toLowerCase().includes("error") && 
                 !data.answer.toLowerCase().includes("no data found"),
      };
      setHistory((prev) => [historyItem, ...prev]);
    } catch (error) {
      const errorResult = { answer: "Error connecting to backend. Please ensure the server is running." };
      setResult(errorResult);
    } finally {
      setLoading(false);
    }
  };

  // Load history item
  const loadHistoryItem = (item: HistoryItem) => {
    setQuestion(item.question);
    setResult({
      question: item.question,
      answer: item.answer,
      generated_sql: item.sql,
    });
    setSidebarOpen(false);
  };

  // Clear history
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("chatHistory");
    setShowClearConfirm(false);
  };

  // Filter history
  const filteredHistory = history.filter(
    (item) =>
      item.question.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.answer.toLowerCase().includes(historySearch.toLowerCase())
  );

  // Check if response indicates an error or no data
  const isErrorResponse = (answer: string) => {
    return answer.toLowerCase().includes("error") || 
           answer.toLowerCase().includes("no data found") ||
           answer.toLowerCase().includes("not found");
  };

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full w-80 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-5">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Query History</h2>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search history..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* History List */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-gray-400">No history yet</p>
                <p className="text-sm text-gray-300 mt-1">Your queries will appear here</p>
              </div>
            ) : (
              filteredHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => loadHistoryItem(item)}
                  className="w-full text-left p-4 rounded-xl bg-gray-50 hover:bg-blue-50 transition-all group border border-transparent hover:border-blue-200"
                >
                  <div className="flex items-start gap-3">
                    {item.success ? (
                      <CheckCircle className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{item.question}</p>
                      <p className="text-xs text-gray-500 truncate mt-1">
                        {item.answer.substring(0, 60)}...
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        {item.timestamp.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Clear History */}
          {history.length > 0 && (
            <div className="pt-4 border-t border-gray-100">
              {showClearConfirm ? (
                <div className="flex gap-2">
                  <button
                    onClick={clearHistory}
                    className="flex-1 py-3 bg-red-500 hover:bg-red-600 rounded-xl text-white text-sm font-medium transition-colors"
                  >
                    Confirm Clear
                  </button>
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowClearConfirm(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Clear All History
                </button>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="min-h-screen">
        {/* Header - Dark navbar like AskYourDatabase */}
        <header className="bg-slate-900 sticky top-0 z-30">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            {/* Left: Logo & Menu */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors lg:hidden"
              >
                <Menu className="w-5 h-5 text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold text-lg">ChatWithDB</span>
              </div>
            </div>

            {/* Center: Nav Links (desktop) */}
            <nav className="hidden lg:flex items-center gap-8">
              <a href="#features" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">Features</a>
              <a href="#how-it-works" className="text-gray-300 hover:text-white transition-colors text-sm font-medium">How it Works</a>
              <button
                onClick={() => setSidebarOpen(true)}
                className="text-gray-300 hover:text-white transition-colors text-sm font-medium"
              >
                History
              </button>
            </nav>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowStorageInfo(!showStorageInfo)}
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-gray-300 hover:text-white transition-colors text-sm"
              >
                <Info className="w-4 h-4" />
                Storage
              </button>
              {isUploaded && (
                <button
                  onClick={() => {
                    setIsUploaded(false);
                    setFile(null);
                    setResult(null);
                  }}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-medium"
                >
                  New Upload
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Storage Info Panel */}
        {showStorageInfo && (
          <div className="bg-amber-50 border-b border-amber-200">
            <div className="max-w-7xl mx-auto px-6 py-4">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <p className="text-sm text-amber-800">
                  <strong>Local Storage:</strong> Files are stored at <code className="bg-amber-100 px-2 py-0.5 rounded text-amber-900">./dynamic.db</code>. 
                  For production, use cloud storage (AWS S3, Azure Blob).
                </p>
                <button onClick={() => setShowStorageInfo(false)} className="ml-auto text-amber-600 hover:text-amber-800">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section - Gradient Background */}
        {!isUploaded && (
          <section className="hero-gradient">
            <div className="max-w-7xl mx-auto px-6 pt-20 pb-32">
              {/* Main Hero Content */}
              <div className="text-center max-w-4xl mx-auto">
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight mb-6">
                  Chat with Your Data
                  <br />
                  <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
                    using AI
                  </span>
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-600 mb-4">
                  The best <span className="text-blue-600 font-semibold">AI</span> for your CSV data
                </p>
                
                <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-12">
                  No SQL knowledge required. Upload your CSV file and chat with your data naturally.
                  Get instant insights powered by AI.
                </p>

                {/* Upload Card */}
                <div className="max-w-2xl mx-auto">
                  <div className="bg-white rounded-3xl shadow-2xl shadow-blue-500/10 p-8 border border-gray-100">
                    <div
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`upload-area rounded-2xl p-10 text-center cursor-pointer ${
                        isDragOver ? "drag-over" : ""
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".csv"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="hidden"
                      />

                      {file ? (
                        <div className="fade-in">
                          <div className="w-20 h-20 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-4">
                            <CheckCircle className="w-10 h-10 text-green-500" />
                          </div>
                          <p className="text-xl font-semibold text-gray-800">{file.name}</p>
                          <p className="text-gray-500 mt-2">
                            {(file.size / 1024).toFixed(2)} KB • Ready to upload
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="w-20 h-20 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-4">
                            <FileUp className="w-10 h-10 text-blue-500" />
                          </div>
                          <p className="text-xl font-semibold text-gray-800 mb-2">
                            Drop your CSV file here
                          </p>
                          <p className="text-gray-500">or click to browse from your computer</p>
                          <p className="text-sm text-gray-400 mt-4">
                            Supports CSV files up to 50MB
                          </p>
                        </>
                      )}
                    </div>

                    {/* Progress Bar */}
                    {isUploading && (
                      <div className="mt-6">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600 font-medium">Uploading...</span>
                          <span className="text-blue-600 font-semibold">{uploadProgress}%</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full progress-bar rounded-full transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Upload Button */}
                    {file && !isUploading && (
                      <button
                        onClick={handleFileUpload}
                        className="w-full mt-6 py-4 btn-gradient rounded-xl text-white font-semibold text-lg flex items-center justify-center gap-3"
                      >
                        <Sparkles className="w-5 h-5" />
                        Start Chatting with Your Data
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Features Section */}
        {!isUploaded && (
          <section id="features" className="py-24 bg-white">
            <div className="max-w-7xl mx-auto px-6">
              <div className="text-center mb-16">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                  The AI Chatbot that <span className="text-blue-600">just works</span>
                </h2>
                <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                  Query, visualize, and analyze your data by asking questions with the help of AI
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-8">
                {/* Feature 1 */}
                <div className="feature-card text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-100 flex items-center justify-center mx-auto mb-6">
                    <Zap className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Instant Analysis</h3>
                  <p className="text-gray-500">
                    Get answers in seconds. No waiting, no complex queries. Just ask and receive insights instantly.
                  </p>
                </div>

                {/* Feature 2 */}
                <div className="feature-card text-center">
                  <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Natural Language</h3>
                  <p className="text-gray-500">
                    Ask questions in plain English. Our AI understands context and delivers accurate results.
                  </p>
                </div>

                {/* Feature 3 */}
                <div className="feature-card text-center">
                  <div className="w-16 h-16 rounded-2xl bg-green-100 flex items-center justify-center mx-auto mb-6">
                    <Shield className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">Secure & Private</h3>
                  <p className="text-gray-500">
                    Your data stays on your machine. We prioritize security and never store your sensitive information.
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Chat Interface - When Uploaded */}
        {isUploaded && (
          <div className="max-w-4xl mx-auto px-6 py-8">
            {/* Database Status */}
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-6 mb-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                    <Database className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      <h3 className="text-lg font-bold text-gray-900">Database Connected</h3>
                    </div>
                    <p className="text-gray-500 text-sm mt-1">
                      {columns.length} columns: {columns.join(", ")}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Chat Input */}
            <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-6 mb-6 border border-gray-100">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && askAI()}
                    placeholder="Ask anything about your data..."
                    className="w-full px-6 py-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg"
                  />
                </div>
                <button
                  onClick={askAI}
                  disabled={loading || !question.trim()}
                  className="px-8 btn-gradient rounded-xl text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Ask
                    </>
                  )}
                </button>
              </div>

              {/* Quick Suggestions */}
              <div className="flex flex-wrap gap-2 mt-4">
                {columns.slice(0, 3).map((col) => (
                  <button
                    key={col}
                    onClick={() => setQuestion(`What are all the ${col} values?`)}
                    className="px-4 py-2 text-sm bg-gray-100 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-200 rounded-lg text-gray-600 transition-all"
                  >
                    Show {col}
                  </button>
                ))}
                <button
                  onClick={() => setQuestion("How many rows are in the table?")}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-200 rounded-lg text-gray-600 transition-all"
                >
                  Count rows
                </button>
                <button
                  onClick={() => setQuestion("Show me a summary of the data")}
                  className="px-4 py-2 text-sm bg-gray-100 hover:bg-blue-50 hover:text-blue-600 border border-gray-200 hover:border-blue-200 rounded-lg text-gray-600 transition-all"
                >
                  Data summary
                </button>
              </div>
            </div>

            {/* Result Display */}
            {result && (
              <div className={`rounded-2xl p-6 fade-in border ${
                isErrorResponse(result.answer) 
                  ? "bg-red-50 border-red-200" 
                  : "bg-white shadow-lg shadow-gray-200/50 border-gray-100"
              }`}>
                {isErrorResponse(result.answer) ? (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-6 h-6 text-red-500" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-red-600">Query Issue</h3>
                        <p className="text-gray-600 mt-2">{result.answer}</p>
                        <div className="mt-4 p-4 bg-white rounded-xl border border-red-100">
                          <p className="text-sm text-gray-500">
                            <strong className="text-blue-600">Tip:</strong> Try asking about: {columns.join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shrink-0">
                        <Bot className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900">Answer</h3>
                        <p className="text-gray-700 mt-2 text-lg leading-relaxed">{result.answer}</p>
                      </div>
                    </div>

                    {result.generated_sql && (
                      <div className="mt-6 p-4 bg-slate-900 rounded-xl overflow-x-auto">
                        <p className="text-xs text-gray-400 mb-2 font-medium">Generated SQL</p>
                        <code className="text-sm text-emerald-400 font-mono">
                          {result.generated_sql}
                        </code>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <footer className="bg-slate-900 text-white py-12 mt-auto">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">ChatWithDB</span>
              </div>
              <p className="text-gray-400 text-sm">
                Powered by AI • Built with FastAPI & Next.js
              </p>
              <div className="flex items-center gap-6 text-sm text-gray-400">
                <span>© 2025 ChatWithDB</span>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
