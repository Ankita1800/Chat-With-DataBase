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
import { supabase } from "../lib/supabase";
import { shouldShowStorageWarning, dismissStorageWarning } from "../lib/config";
import { saveAppState, loadAppState, clearAppState } from "../lib/persistence";
import type { User, Session, AuthChangeEvent } from "@supabase/supabase-js";

// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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

interface Dataset {
  id: string;
  dataset_name: string;
  original_filename: string;
  table_name: string;
  column_names: string[];
  row_count: number;
  created_at: string;
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
  const [showStorageInfo, setShowStorageInfo] = useState(shouldShowStorageWarning());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [showDocsSidebar, setShowDocsSidebar] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [hasRestoredState, setHasRestoredState] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<any>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Atomically select a dataset and update all related state
   * Prevents state synchronization bugs
   */
  const selectDataset = (dataset: Dataset | null) => {
    setSelectedDataset(dataset);
    setColumns(dataset?.column_names || []);
    setIsUploaded(dataset !== null);
    
    // Update persistence
    if (dataset) {
      saveAppState({
        selectedDatasetId: dataset.id,
        columns: dataset.column_names,
        isUploaded: true,
      });
    }
  };

  /**
   * New Chat: Complete hard reset of application state
   * Clears localStorage, React state, and UI history
   */
  const handleNewChat = () => {
    // Clear localStorage persistence
    clearAppState();
    
    // Reset all React state
    setSelectedDataset(null);
    setColumns([]);
    setIsUploaded(false);
    setFile(null);
    setQuestion("");
    setResult(null);
    setHistory([]);
    localStorage.removeItem("chatHistory");
    
    // Reset upload states
    setIsUploading(false);
    setUploadProgress(0);
    
    // Close duplicate modal if open
    setShowDuplicateModal(false);
    setDuplicateInfo(null);
    setPendingFile(null);
    
    console.log("[INFO] New Chat: All state cleared");
  };

  /**
   * Delete Dataset: Complete cleanup
   * - Deletes PostgreSQL table
   * - Deletes file from storage
   * - Deletes metadata and query history
   * - Updates UI state
   */
  const handleDeleteDataset = async (datasetId: string, datasetName: string) => {
    if (!confirm(`Are you sure you want to delete "${datasetName}"?\n\nThis will permanently remove:\n• The dataset and all its data\n• Related query history\n• The uploaded file\n\nThis action cannot be undone.`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(`${API_URL}/datasets/${datasetId}`, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Delete failed" }));
        throw new Error(errorData.detail || "Failed to delete dataset");
      }

      const data = await response.json();
      
      // If deleted dataset was selected, clear selection
      if (selectedDataset?.id === datasetId) {
        setSelectedDataset(null);
        setColumns([]);
        setIsUploaded(false);
        setResult(null);
        clearAppState();
      }

      // Reload datasets to update the list
      await loadDatasets();
      
      console.log(`[INFO] Dataset deleted: ${datasetName}`);
    } catch (error) {
      console.error("Delete error:", error);
      alert(`Error deleting dataset: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  // Mount detection for hydration safety
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Setup Supabase auth state listener
  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadDatasets();
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadDatasets();
      } else {
        setDatasets([]);
        setSelectedDataset(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Load persisted app state on mount (ONCE ONLY)
  useEffect(() => {
    if (datasets.length > 0 && !hasRestoredState) {
      const persistedState = loadAppState();
      if (persistedState?.selectedDatasetId) {
        const dataset = datasets.find(d => d.id === persistedState.selectedDatasetId);
        if (dataset) {
          selectDataset(dataset);
        }
      }
      setHasRestoredState(true); // Prevent re-triggering
    }
  }, [datasets, hasRestoredState]);

  // Save app state whenever it changes
  useEffect(() => {
    if (selectedDataset) {
      saveAppState({
        selectedDatasetId: selectedDataset.id,
        columns,
        isUploaded,
      });
    }
  }, [selectedDataset, columns, isUploaded]);

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

  // Load user's datasets from backend
  const loadDatasets = async (selectDatasetId?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch(`${API_URL}/datasets`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const fetchedDatasets = data.datasets || [];
        setDatasets(fetchedDatasets);
        
        // If selectDatasetId is provided, select that dataset atomically
        if (selectDatasetId && fetchedDatasets.length > 0) {
          const datasetToSelect = fetchedDatasets.find((d: Dataset) => d.id === selectDatasetId);
          if (datasetToSelect) {
            selectDataset(datasetToSelect);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load datasets:', error);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setDatasets([]);
    setSelectedDataset(null);
    setIsUploaded(false);
  };

  // Handle successful authentication
  const handleAuthSuccess = () => {
    setShowAuthModal(false);
    loadDatasets();
  };

  // Handle File Upload
  const handleFileUpload = async (forceUpload: boolean = false) => {
    if (!file) return;
    if (!user) {
      alert("Please sign in to upload files");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", file);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 100);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Build URL with query params for duplicate handling
      const uploadUrl = new URL(`${API_URL}/upload`);
      if (forceUpload) {
        uploadUrl.searchParams.append('force_upload', 'true');
      }

      const response = await fetch(uploadUrl.toString(), {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(errorData.detail || `Upload failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Check if duplicate detected (user needs to make a choice)
      if (data.duplicate && data.existing_dataset) {
        console.log("[INFO] Duplicate detected, showing modal");
        setIsUploading(false);
        setUploadProgress(0);
        setDuplicateInfo(data.existing_dataset);
        setPendingFile(file); // Save file for reuse/force upload decision
        setShowDuplicateModal(true);
        return;
      }

      setUploadProgress(100);

      // Handle successful upload or reuse - only switch dataset context after success
      if (data.success && data.dataset_id) {
        const newDatasetId = data.dataset_id;
        
        setTimeout(async () => {
          setIsUploading(false);
          setUploadProgress(100);
          
          // Reload datasets and automatically select the newly uploaded one
          // This ensures we only switch dataset context after receiving successful response
          await loadDatasets(newDatasetId);
          setHasRestoredState(true); // Prevent localStorage restoration after upload
          
          setFile(null); // Clear file input for next upload
          
          // Show appropriate message
          if (data.reused) {
            console.log("[INFO] Reused existing dataset");
          } else {
            console.log("[INFO] Successfully uploaded new dataset");
          }
        }, 500);
      } else {
        throw new Error(data.error || "Upload failed");
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Upload error:", error);
      alert(`Error uploading file: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Handle reusing existing dataset
  const handleReuseDataset = async () => {
    if (!pendingFile || !user || !duplicateInfo) return;

    setShowDuplicateModal(false);
    setIsUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", pendingFile);

    const progressInterval = setInterval(() => {
      setUploadProgress((prev) => Math.min(prev + 10, 90));
    }, 100);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      // Request reuse
      const uploadUrl = new URL(`${API_URL}/upload`);
      uploadUrl.searchParams.append('reuse', 'true');

      const response = await fetch(uploadUrl.toString(), {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      clearInterval(progressInterval);
      
      if (!response.ok) {
        throw new Error("Failed to reuse dataset");
      }

      const data = await response.json();
      setUploadProgress(100);

      if (data.success && data.dataset_id) {
        setTimeout(async () => {
          setIsUploading(false);
          setUploadProgress(100);
          
          // Only switch dataset context after successful reuse response
          await loadDatasets(data.dataset_id);
          setHasRestoredState(true);
          
          setFile(null);
          setPendingFile(null);
          setDuplicateInfo(null);
          console.log("[INFO] Successfully reused existing dataset");
        }, 500);
      } else {
        throw new Error("Reuse failed: Missing dataset_id in response");
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Reuse error:", error);
      alert(`Error reusing dataset: ${error instanceof Error ? error.message : "Unknown error"}`);
      setIsUploading(false);
      setUploadProgress(0);
      setShowDuplicateModal(true); // Show modal again
    }
  };

  // Handle uploading as new dataset (force upload)
  const handleUploadAsNew = () => {
    setShowDuplicateModal(false);
    setPendingFile(null);
    setDuplicateInfo(null);
    handleFileUpload(true); // Pass force_upload=true
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

  // Handle file selection - clear persisted state to prevent reuse of old datasets
  const handleFileSelection = (selectedFile: File | null) => {
    if (selectedFile) {
      // Clear all persisted state when new file is selected
      clearAppState();
      console.log("[INFO] File selected: cleared persisted state");
    }
    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.name.endsWith(".csv")) {
      handleFileSelection(droppedFile);
    } else {
      alert("Please upload a CSV file");
    }
  };

  // Handle Asking Questions
  const askAI = async () => {
    if (!question.trim()) return;
    if (!user) {
      alert("Please sign in to ask questions");
      return;
    }
    if (!selectedDataset) {
      alert("Please upload a dataset first");
      return;
    }

    setLoading(true);
    setResult(null);

    const currentQuestion = question;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(`${API_URL}/ask`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          question: currentQuestion,
          dataset_id: selectedDataset.id,
        }),
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          {/* Logo & Nav Toggle */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-1.5 sm:p-2 rounded-lg transition-colors"
              style={{ backgroundColor: 'transparent' }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <Menu className="w-5 h-5" style={{ color: '#713600' }} />
            </button>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#C17817' }}>
                <Database className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#FDFBD4' }} />
              </div>
              <span className="text-lg sm:text-xl font-bold" style={{ color: '#713600' }}>ChatWithDB</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="https://ankitaatech700.blogspot.com/2025/12/chat-with-database-ai-powered-natural.html" target="_blank" rel="noopener noreferrer" className="transition-colors text-sm font-medium" style={{ color: '#8B5A00' }} onMouseEnter={(e) => e.currentTarget.style.color = '#713600'} onMouseLeave={(e) => e.currentTarget.style.color = '#8B5A00'}>Blog</a>
            <button onClick={() => setShowDocsSidebar(true)} className="transition-colors text-sm font-medium" style={{ color: '#8B5A00' }} onMouseEnter={(e) => e.currentTarget.style.color = '#713600'} onMouseLeave={(e) => e.currentTarget.style.color = '#8B5A00'}>Docs</button>
            <button onClick={() => setShowContactModal(true)} className="transition-colors text-sm font-medium" style={{ color: '#8B5A00' }} onMouseEnter={(e) => e.currentTarget.style.color = '#713600'} onMouseLeave={(e) => e.currentTarget.style.color = '#8B5A00'}>Contact</button>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {user ? (
              <>
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 rounded-lg" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)' }}>
                  <UserIcon className="w-4 h-4" style={{ color: '#713600' }} />
                  <span className="text-sm font-medium" style={{ color: '#713600' }}>
                    {user.user_metadata?.full_name || user.email}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shadow-sm flex items-center gap-1.5 sm:gap-2" 
                  style={{ backgroundColor: '#C17817', color: '#FDFBD4' }} 
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#A66212'} 
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C17817'}
                >
                  <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Logout</span>
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
                <strong>Development Mode:</strong> Using Supabase cloud storage. 
                All files are securely stored per user with Row Level Security enabled.
              </p>
              <button 
                onClick={() => { 
                  setShowStorageInfo(false); 
                  dismissStorageWarning(); 
                }} 
                style={{ color: '#C17817' }} 
                onMouseEnter={(e) => e.currentTarget.style.color = '#8B5A00'} 
                onMouseLeave={(e) => e.currentTarget.style.color = '#C17817'}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-1 relative">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Collapsible Sidebar */}
        <aside
          className={`${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } lg:translate-x-0 w-80 sm:w-96 lg:w-80 xl:w-96 fixed lg:sticky inset-y-0 left-0 z-50 lg:z-auto transition-all duration-300 flex flex-col overflow-hidden`}
          style={{ backgroundColor: '#F8F4E6', borderRight: '1px solid #E8DFC8', top: '0', height: '100vh' }}
        >
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto mt-16 lg:mt-0">
            {/* Close button for mobile */}
            <div className="flex items-center justify-between mb-4 lg:hidden">
              <span className="text-sm font-semibold" style={{ color: '#713600' }}>Menu</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg transition-colors"
                style={{ backgroundColor: 'transparent' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X className="w-5 h-5" style={{ color: '#713600' }} />
              </button>
            </div>

            {/* Database Connections / Datasets */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#8B5A00' }}>
                  Your Datasets
                </h3>
                {user && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 rounded-lg transition-colors flex-shrink-0"
                    style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)', color: '#C17817' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.2)'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.1)'}
                    title="Upload new dataset"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>
              
              {/* New Chat Button */}
              {user && selectedDataset && (
                <button
                  onClick={handleNewChat}
                  className="w-full mb-3 p-2.5 sm:p-3 rounded-lg transition-all font-medium text-xs sm:text-sm flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#C17817', color: '#FDFBD4', border: '1px solid #C17817' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#A66212'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C17817'}
                >
                  <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>New Chat</span>
                </button>
              )}
              
              {datasets.length > 0 ? (
                <div className="space-y-2">
                  {datasets.map((dataset) => (
                    <div
                      key={dataset.id}
                      className={`group relative w-full p-2.5 sm:p-3 rounded-lg transition-all ${
                        selectedDataset?.id === dataset.id ? 'ring-2' : ''
                      }`}
                      style={{
                        backgroundColor: selectedDataset?.id === dataset.id ? '#FDFBD4' : '#F8F4E6',
                        border: '1px solid #E8DFC8',
                        ringColor: '#C17817',
                      }}
                    >
                      <button
                        onClick={() => selectDataset(dataset)}
                        className="w-full text-left"
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            selectedDataset?.id === dataset.id ? 'ring-2' : ''
                          }`} style={{ 
                            backgroundColor: 'rgba(193, 120, 23, 0.15)',
                            ringColor: '#C17817'
                          }}>
                            <Database className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#C17817' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                              {selectedDataset?.id === dataset.id && (
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#C17817' }} />
                              )}
                              <span className="text-xs sm:text-sm font-medium truncate" style={{ color: '#713600' }}>
                                {dataset.dataset_name}
                              </span>
                            </div>
                            <p className="text-[10px] sm:text-xs truncate" style={{ color: '#8B5A00' }}>
                              {dataset.row_count} rows • {dataset.column_names.length} columns
                            </p>
                          </div>
                        </div>
                      </button>
                      
                      {/* Delete Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDataset(dataset.id, dataset.dataset_name);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#dc2626' }}
                        onMouseEnter={(e) => { 
                          e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.2)'; 
                          e.currentTarget.style.color = '#991b1b';
                        }}
                        onMouseLeave={(e) => { 
                          e.currentTarget.style.backgroundColor = 'rgba(220, 38, 38, 0.1)'; 
                          e.currentTarget.style.color = '#dc2626';
                        }}
                        title="Delete dataset"
                      >
                        <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center gap-2 p-2.5 sm:p-3 border-2 border-dashed rounded-lg transition-all text-xs sm:text-sm font-medium"
                  style={{ borderColor: '#E8DFC8', color: '#8B5A00', backgroundColor: 'transparent' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.05)'; e.currentTarget.style.color = '#C17817'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#8B5A00'; }}
                >
                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span>Upload Your First Dataset</span>
                </button>
              )}
              
              {/* Show selected dataset columns */}
              {selectedDataset && (
                <div className="mt-3 p-2.5 sm:p-3 rounded-lg" style={{ backgroundColor: '#FDFBD4', border: '1px solid #E8DFC8' }}>
                  <p className="text-[10px] sm:text-xs font-semibold mb-2" style={{ color: '#8B5A00' }}>COLUMNS:</p>
                  <div className="flex flex-wrap gap-1 sm:gap-1.5">
                    {selectedDataset.column_names.map((col) => (
                      <span key={col} className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium" style={{ backgroundColor: '#F8F4E6', color: '#713600', border: '1px solid #E8DFC8' }}>
                        {col}
                      </span>
                    ))}
                  </div>
                </div>
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
          {!isUploaded || datasets.length === 0 ? (
            /* Hero Section & Upload */
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
              {/* Hero */}
              <div className="text-center mb-8 sm:mb-12">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-tight" style={{ color: '#713600' }}>
                  Chat with Your Database<br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>using AI
                </h1>
                <p className="text-lg sm:text-xl mb-2" style={{ color: '#8B5A00' }}>
                  The best <span className="font-semibold" style={{ color: '#C17817' }}>AI</span> for your CSV data
                </p>
                <p className="max-w-2xl mx-auto text-sm sm:text-base" style={{ color: '#A66212' }}>
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
                  className="upload-area border-2 border-dashed rounded-xl p-6 sm:p-8 lg:p-12 text-center cursor-pointer transition-all"
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
                    onChange={(e) => handleFileSelection(e.target.files?.[0] || null)}
                    className="hidden"
                  />

                  {file ? (
                    <div className="fade-in">
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4" style={{ backgroundColor: 'rgba(193, 120, 23, 0.15)' }}>
                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#C17817' }} />
                      </div>
                      <p className="text-base sm:text-lg font-semibold break-all px-2" style={{ color: '#713600' }}>{file.name}</p>
                      <p className="mt-1 text-sm sm:text-base" style={{ color: '#8B5A00' }}>
                        {(file.size / 1024).toFixed(2)} KB • Ready to upload
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4" style={{ backgroundColor: 'rgba(193, 120, 23, 0.1)' }}>
                        <FileUp className="w-6 h-6 sm:w-8 sm:h-8" style={{ color: '#C17817' }} />
                      </div>
                      <p className="text-base sm:text-lg font-semibold mb-2" style={{ color: '#713600' }}>
                        Drop your CSV file here
                      </p>
                      <p className="text-sm sm:text-base" style={{ color: '#8B5A00' }}>or click to browse from your computer</p>
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
                    onClick={() => handleFileUpload()}
                    className="w-full mt-4 sm:mt-6 py-3 sm:py-4 rounded-xl font-semibold text-base sm:text-lg flex items-center justify-center gap-2 sm:gap-3 transition-all shadow-sm"
                    style={{ backgroundColor: '#C17817', color: '#FDFBD4' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#A66212'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(113, 54, 0, 0.1), 0 2px 4px -1px rgba(113, 54, 0, 0.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#C17817'; e.currentTarget.style.boxShadow = '0 1px 2px 0 rgba(113, 54, 0, 0.05)'; }}
                  >
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Start Analyzing Your Data</span>
                    <span className="sm:hidden">Analyze Data</span>
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Chat Interface */
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
              {/* Database Info */}
              <div className="rounded-xl p-4 sm:p-6 mb-4 sm:mb-6" style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8' }}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                  <div className="flex items-center gap-3 sm:gap-4 flex-1">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'rgba(193, 120, 23, 0.15)' }}>
                      <Database className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#C17817' }} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full animate-pulse flex-shrink-0" style={{ backgroundColor: '#C17817' }} />
                        <h3 className="text-base sm:text-lg font-semibold truncate" style={{ color: '#713600' }}>
                          {selectedDataset ? selectedDataset.dataset_name : 'Database Connected'}
                        </h3>
                      </div>
                      <p className="text-xs sm:text-sm mt-1 truncate" style={{ color: '#8B5A00' }}>
                        {selectedDataset ? `${selectedDataset.row_count} rows • ` : ''}
                        {columns.length} columns: {columns.slice(0, 3).join(", ")}
                        {columns.length > 3 && "..."}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors flex-shrink-0 font-medium"
                      style={{ color: '#FDFBD4', backgroundColor: '#C17817' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#A66212'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C17817'}
                    >
                      + Upload New
                    </button>
                  </div>
                </div>
              </div>

              {/* Query Input */}
              <div className="rounded-xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm" style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8' }}>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <div className="flex-1 relative">
                    <Bot className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#C17817' }} />
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && !loading && selectedDataset && askAI()}
                      placeholder={selectedDataset ? "Ask about your data..." : "Select or upload a dataset first..."}
                      disabled={!selectedDataset}
                      className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2"
                      style={{ backgroundColor: '#FDFBD4', border: '1px solid #E8DFC8', color: '#713600', cursor: selectedDataset ? 'text' : 'not-allowed', opacity: selectedDataset ? 1 : 0.6 }}
                      onFocus={(e) => { if (selectedDataset) { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(193, 120, 23, 0.2)'; } }}
                      onBlur={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>
                  <button
                    onClick={askAI}
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

      {/* Duplicate Dataset Modal */}
      {showDuplicateModal && duplicateInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => {
              setShowDuplicateModal(false);
              setPendingFile(null);
              setDuplicateInfo(null);
              setFile(null);
            }}
          />
          
          {/* Modal */}
          <div className="relative max-w-md w-full rounded-2xl shadow-2xl p-6" style={{ backgroundColor: '#FDFBD4' }}>
            {/* Icon */}
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(193, 120, 23, 0.15)' }}>
              <AlertTriangle className="w-8 h-8" style={{ color: '#C17817' }} />
            </div>
            
            {/* Title */}
            <h2 className="text-2xl font-bold text-center mb-2" style={{ color: '#713600' }}>
              Duplicate File Detected
            </h2>
            
            {/* Message */}
            <p className="text-center mb-6" style={{ color: '#8B5A00' }}>
              This file already exists in your datasets. Would you like to reuse the existing data or upload it as a new version?
            </p>
            
            {/* Existing Dataset Info */}
            <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: '#8B5A00' }}>Existing Dataset:</p>
              <p className="font-medium mb-1" style={{ color: '#713600' }}>{duplicateInfo.dataset_name}</p>
              <p className="text-sm" style={{ color: '#8B5A00' }}>
                {duplicateInfo.row_count} rows • {duplicateInfo.original_filename}
              </p>
              <p className="text-xs mt-1" style={{ color: '#A66212' }}>
                Created: {new Date(duplicateInfo.created_at).toLocaleDateString()}
              </p>
            </div>
            
            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleReuseDataset}
                className="w-full py-3 rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: '#C17817', color: '#FDFBD4' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#A66212'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C17817'}
              >
                <Database className="w-5 h-5" />
                <span>Reuse Existing Dataset</span>
              </button>
              
              <button
                onClick={handleUploadAsNew}
                className="w-full py-3 rounded-xl font-semibold transition-all"
                style={{ backgroundColor: '#F8F4E6', color: '#713600', border: '1px solid #E8DFC8' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.backgroundColor = '#F8F4E6'; }}
              >
                <FileUp className="w-5 h-5 inline mr-2" />
                <span>Upload as New Version</span>
              </button>
              
              <button
                onClick={() => {
                  setShowDuplicateModal(false);
                  setPendingFile(null);
                  setDuplicateInfo(null);
                  setFile(null);
                }}
                className="w-full py-2 rounded-xl font-medium transition-all text-sm"
                style={{ color: '#8B5A00' }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#713600'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#8B5A00'}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
