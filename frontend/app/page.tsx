"use client";
import { useState, useRef, useEffect } from "react";
import {
  Database,
  FileUp,
  CheckCircle,
  AlertCircle,
  Search,
  Trash2,
  Menu,
  X,
  Clock,
  MessageSquare,
  Sparkles,
  Loader2,
  AlertTriangle,
  Bot,
  Send,
  ArrowRight,
  Shield,
  TrendingUp,
  Zap,
  BarChart3,
  Eye,
  Brain,
  Folder,
  Plus,
  ChevronRight,
  Github,
  Twitter,
  Linkedin,
  Mail,
  Lock,
  Server,
  HardDrive,
  LogOut,
  User as UserIcon,
} from "lucide-react";
import AuthModal from "./AuthModal";
import DocsSidebar from "./DocsSidebar";
import ContactModal from "./ContactModal";

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
  status?: string;
  message?: string;
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
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historySearch, setHistorySearch] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showStorageInfo, setShowStorageInfo] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [showDocsSidebar, setShowDocsSidebar] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [user, setUser] = useState<{ email: string; full_name?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history and user from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("chatHistory");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory).map((item: HistoryItem) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      })));
    }

    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Save history to localStorage
  useEffect(() => {
    if (history.length > 0) {
      localStorage.setItem("chatHistory", JSON.stringify(history));
    }
  }, [history]);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  // Handle successful authentication
  const handleAuthSuccess = (token: string, user: any) => {
    setUser(user);
    setShowAuthModal(false);
  };

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

    const currentQuestion = question;

    try {
      const response = await fetch("http://127.0.0.1:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: currentQuestion }),
      });
      const data: QueryResult = await response.json();
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
      const errorResult = { question: currentQuestion, answer: "Error connecting to backend. Please ensure the server is running." };
      setResult(errorResult);
    } finally {
      setLoading(false);
      setQuestion("");
    }
  };

  // Load history item
  const loadHistoryItem = (item: HistoryItem) => {
    setResult({
      question: item.question,
      answer: item.answer,
      generated_sql: item.sql,
    });
  };

  // Clear history
  const clearHistory = () => {
    if (confirm("Are you sure you want to clear all history?")) {
      setHistory([]);
      localStorage.removeItem("chatHistory");
    }
  };

  // Filter history
  const filteredHistory = history.filter(
    (item) =>
      item.question.toLowerCase().includes(historySearch.toLowerCase()) ||
      item.answer.toLowerCase().includes(historySearch.toLowerCase())
  );

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

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FDFBD4' }}>
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 shadow-sm" style={{ backgroundColor: '#FDFBD4', borderBottom: '1px solid #E8DFC8' }}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo & Nav Toggle */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Menu className="w-5 h-5" style={{ color: '#713600' }} />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#C17817' }}>
                <Database className="w-5 h-5" style={{ color: '#FDFBD4' }} />
              </div>
              <span className="text-xl font-bold" style={{ color: '#713600' }}>ChatWithDB</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="https://ankitaatech700.blogspot.com/2025/12/chat-with-database-ai-powered-natural.html" target="_blank" rel="noopener noreferrer" className="transition-colors text-sm font-medium" style={{ color: '#8B5A00' }} onMouseEnter={(e) => e.currentTarget.style.color = '#713600'} onMouseLeave={(e) => e.currentTarget.style.color = '#8B5A00'}>Blog</a>
            <button onClick={() => setShowDocsSidebar(true)} className="transition-colors text-sm font-medium" style={{ color: '#8B5A00' }} onMouseEnter={(e) => e.currentTarget.style.color = '#713600'} onMouseLeave={(e) => e.currentTarget.style.color = '#8B5A00'}>Docs</button>
            <button onClick={() => setShowContactModal(true)} className="transition-colors text-sm font-medium" style={{ color: '#8B5A00' }} onMouseEnter={(e) => e.currentTarget.style.color = '#713600'} onMouseLeave={(e) => e.currentTarget.style.color = '#8B5A00'}>Contact</button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-3 px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)' }}>
                  <UserIcon className="w-4 h-4" style={{ color: '#713600' }} />
                  <span className="text-sm font-medium" style={{ color: '#713600' }}>
                    {user.full_name || user.email}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm flex items-center gap-2" 
                  style={{ backgroundColor: '#C17817', color: '#FDFBD4' }} 
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#A66212'} 
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C17817'}
                >
                  <LogOut className="w-4 h-4" />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => { setAuthModalMode("signin"); setShowAuthModal(true); }}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm" 
                  style={{ backgroundColor: '#C17817', color: '#FDFBD4' }} 
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#A66212'} 
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C17817'}
                >
                  Sign In
                </button>
                <button 
                  onClick={() => { setAuthModalMode("signup"); setShowAuthModal(true); }}
                  className="px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-sm" 
                  style={{ backgroundColor: '#C17817', color: '#FDFBD4' }} 
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#A66212'} 
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C17817'}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Storage Info Banner */}
      {showStorageInfo && (
        <div style={{ backgroundColor: 'rgba(193, 120, 23, 0.08)', borderBottom: '1px solid rgba(193, 120, 23, 0.2)' }}>
          <div className="max-w-7xl mx-auto px-6 py-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0" style={{ color: '#C17817' }} />
              <p className="text-sm flex-1" style={{ color: '#8B5A00' }}>
                <strong>Local Storage:</strong> Files stored at <code className="px-2 py-0.5 rounded" style={{ backgroundColor: 'rgba(193, 120, 23, 0.15)' }}>./dynamic.db</code>. 
                For production, consider using cloud storage (AWS S3, Azure Blob).
              </p>
              <button onClick={() => setShowStorageInfo(false)} style={{ color: '#C17817' }} onMouseEnter={(e) => e.currentTarget.style.color = '#8B5A00'} onMouseLeave={(e) => e.currentTarget.style.color = '#C17817'}>
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Collapsible Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "w-80" : "w-0"
          } transition-all duration-300 overflow-hidden flex flex-col`}
          style={{ backgroundColor: '#F8F4E6', borderRight: '1px solid #E8DFC8' }}
        >
          <div className="p-6 flex-1 overflow-y-auto">
            {/* Database Connections */}
            <div className="mb-6">
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8B5A00' }}>
                Database Connections
              </h3>
              {isUploaded ? (
                <div className="p-3 rounded-lg" style={{ backgroundColor: '#FDFBD4', border: '1px solid #E8DFC8' }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: 'rgba(193, 120, 23, 0.15)' }}>
                      <Database className="w-5 h-5" style={{ color: '#C17817' }} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#C17817' }} />
                        <span className="text-sm font-medium" style={{ color: '#713600' }}>Connected</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {columns.map((col) => (
                      <span key={col} className="px-2 py-1 rounded text-xs font-medium" style={{ backgroundColor: '#F8F4E6', color: '#713600', border: '1px solid #E8DFC8' }}>
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-2 p-3 border-2 border-dashed rounded-lg transition-all text-sm font-medium"
                  style={{ borderColor: '#E8DFC8', color: '#8B5A00', backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.05)'; e.currentTarget.style.color = '#C17817'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8B5A00'; }}
                >
                  <Plus className="w-4 h-4" />
                  <span className="text-sm font-medium">Add Database</span>
                </button>
              )}
            </div>

            {/* Chat History */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B5A00' }}>
                  Chat History
                </h3>
                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
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
                  onChange={(e) => setHistorySearch(e.target.value)}
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
                      onClick={() => loadHistoryItem(item)}
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

            {/* Quick Actions */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8B5A00' }}>
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button 
                  onClick={() => {
                    if (file) {
                      const link = document.createElement('a');
                      link.href = URL.createObjectURL(file);
                      link.download = file.name;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      URL.revokeObjectURL(link.href);
                    }
                  }}
                  disabled={!isUploaded}
                  className="w-full flex items-center gap-2 p-3 rounded-lg transition-all text-left" 
                  style={{ backgroundColor: '#FDFBD4', border: '1px solid #E8DFC8', opacity: isUploaded ? 1 : 0.5, cursor: isUploaded ? 'pointer' : 'not-allowed' }} 
                  onMouseEnter={(e) => { if (isUploaded) { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.05)'; } }} 
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.backgroundColor = '#FDFBD4'; }}
                >
                  <Folder className="w-4 h-4" style={{ color: '#8B5A00' }} />
                  <span className="text-sm" style={{ color: '#713600' }}>Export Data</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto">
          {!isUploaded ? (
            /* Hero Section & Upload */
            <div className="max-w-4xl mx-auto px-6 py-16">
              {/* Hero */}
              <div className="text-center mb-12">
                <h1 className="text-5xl font-bold mb-4" style={{ color: '#713600' }}>
                  Chat with Your Database<br />using AI
                </h1>
                <p className="text-xl mb-2" style={{ color: '#8B5A00' }}>
                  The best <span className="font-semibold" style={{ color: '#C17817' }}>AI</span> for your CSV data
                </p>
                <p className="max-w-2xl mx-auto" style={{ color: '#A66212' }}>
                  No SQL knowledge required. Upload your CSV file and chat with your data naturally. Get instant insights powered by AI.
                </p>
              </div>

              {/* Upload Area */}
              <div className="max-w-2xl mx-auto">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="upload-area border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all"
                  style={{
                    borderColor: isDragOver ? '#C17817' : '#E8DFC8',
                    backgroundColor: isDragOver ? 'rgba(193, 120, 23, 0.05)' : 'rgba(248, 244, 230, 0.5)'
                  }}
                  onMouseEnter={(e) => { if (!isDragOver) { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.05)'; } }}
                  onMouseLeave={(e) => { if (!isDragOver) { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.backgroundColor = 'rgba(248, 244, 230, 0.5)'; } }}
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
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(193, 120, 23, 0.15)' }}>
                        <CheckCircle className="w-8 h-8" style={{ color: '#C17817' }} />
                      </div>
                      <p className="text-lg font-semibold" style={{ color: '#713600' }}>{file.name}</p>
                      <p className="mt-1" style={{ color: '#8B5A00' }}>
                        {(file.size / 1024).toFixed(2)} KB • Ready to upload
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)' }}>
                        <FileUp className="w-8 h-8" style={{ color: '#C17817' }} />
                      </div>
                      <p className="text-lg font-semibold mb-2" style={{ color: '#713600' }}>
                        Drop your CSV file here
                      </p>
                      <p style={{ color: '#8B5A00' }}>or click to browse from your computer</p>
                    </>
                  )}
                </div>

                {/* Progress Bar */}
                {isUploading && (
                  <div className="mt-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium" style={{ color: '#8B5A00' }}>Uploading...</span>
                      <span className="font-semibold" style={{ color: '#C17817' }}>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#E8DFC8' }}>
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%`, backgroundColor: '#C17817' }}
                      />
                    </div>
                  </div>
                )}

                {/* Upload Button */}
                {file && !isUploading && (
                  <button
                    onClick={handleFileUpload}
                    className="w-full mt-6 py-4 rounded-xl font-semibold text-lg flex items-center justify-center gap-3 transition-all shadow-sm"
                    style={{ backgroundColor: '#C17817', color: '#FDFBD4' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#A66212'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(113, 54, 0, 0.1), 0 2px 4px -1px rgba(113, 54, 0, 0.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#C17817'; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(113, 54, 0, 0.05)'; }}
                  >
                    <Sparkles className="w-5 h-5" />
                    Start Analyzing Your Data
                    <ArrowRight className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Chat Interface */
            <div className="max-w-5xl mx-auto px-6 py-8">
              {/* Database Info */}
              <div className="rounded-xl p-6 mb-6" style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: 'rgba(193, 120, 23, 0.15)' }}>
                      <Database className="w-6 h-6" style={{ color: '#C17817' }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#C17817' }} />
                        <h3 className="text-lg font-semibold" style={{ color: '#713600' }}>Database Connected</h3>
                      </div>
                      <p className="text-sm mt-1" style={{ color: '#8B5A00' }}>
                        {columns.length} columns available: {columns.slice(0, 5).join(", ")}
                        {columns.length > 5 && "..."}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setIsUploaded(false);
                      setFile(null);
                      setResult(null);
                    }}
                    className="px-4 py-2 text-sm rounded-lg transition-colors"
                    style={{ color: '#8B5A00', backgroundColor: 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#713600'; e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.1)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#8B5A00'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Query Input */}
              <div className="rounded-xl p-6 mb-6 shadow-sm" style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8' }}>
                <div className="flex gap-4">
                  <div className="flex-1 relative">
                    <Bot className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: '#C17817' }} />
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !loading && askAI()}
                      placeholder="Ask anything about your data... (e.g., 'What are the top 5 products by revenue?')"
                      className="w-full pl-12 pr-4 py-4 rounded-xl text-base focus:outline-none focus:ring-2"
                      style={{ backgroundColor: '#FDFBD4', border: '1px solid #E8DFC8', color: '#713600' }}
                      onFocus={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(193, 120, 23, 0.2)'; }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <button
                    onClick={askAI}
                    disabled={loading || !question.trim()}
                    className="px-6 py-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all shadow-sm"
                    style={{ backgroundColor: '#C17817', color: '#FDFBD4' }}
                    onMouseEnter={(e) => { if (!loading && question.trim()) e.currentTarget.style.backgroundColor = '#A66212'; }}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C17817'}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-5 h-5" />
                        Ask AI
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
                      onClick={() => setQuestion(`Show all ${col} values`)}
                      className="px-3 py-1.5 text-xs rounded-lg transition-all"
                      style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8', color: '#713600' }}
                      onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.1)'; e.currentTarget.style.color = '#C17817'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.backgroundColor = '#F8F4E6'; e.currentTarget.style.color = '#713600'; }}
                    >
                      Show {col}
                    </button>
                  ))}
                  <button
                    onClick={() => setQuestion("How many rows are in the table?")}
                    className="px-3 py-1.5 text-xs rounded-lg transition-all"
                    style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8', color: '#713600' }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.1)'; e.currentTarget.style.color = '#C17817'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.backgroundColor = '#F8F4E6'; e.currentTarget.style.color = '#713600'; }}
                  >
                    Count rows
                  </button>
                </div>
              </div>

              {/* Results Display */}
              {result && (
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
              )}

              {/* Loading State */}
              {loading && (
                <div className="rounded-xl p-6" style={{ backgroundColor: 'rgba(193, 120, 23, 0.08)', border: '1px solid rgba(193, 120, 23, 0.2)' }}>
                  <div className="flex items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#C17817' }} />
                    <div>
                      <p className="font-medium" style={{ color: '#713600' }}>Analyzing your data...</p>
                      <p className="text-sm mt-1" style={{ color: '#8B5A00' }}>Generating SQL query and fetching results</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />

      {/* Docs Sidebar */}
      <DocsSidebar 
        isOpen={showDocsSidebar} 
        onClose={() => setShowDocsSidebar(false)}
      />

      {/* Contact Modal */}
      <ContactModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)}
      />
    </div>
  );
}
