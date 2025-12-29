"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Database,
  FileUp,
  Menu,
  X,
  Trash2,
  MessageSquare,
  AlertTriangle,
  Plus,
  LogOut,
  User as UserIcon,
  Folder,
} from "lucide-react";
import { shouldShowStorageWarning, dismissStorageWarning } from "../lib/config";
import type { User } from "@supabase/supabase-js";

// Components
import UploadArea from "./components/upload/UploadArea";
import UploadProgress from "./components/upload/UploadProgress";
import UploadButton from "./components/upload/UploadButton";
import DatasetInfo from "./components/upload/DatasetInfo";
import ChatInput from "./components/chat/ChatInput";
import ChatResult from "./components/chat/ChatResult";
import ChatHistory from "./components/chat/ChatHistory";

// Modals (lazy loaded for performance)
const AuthModal = dynamic(() => import("./AuthModal"), { ssr: false });
const DocsSidebar = dynamic(() => import("./DocsSidebar"), { ssr: false });
const ContactModal = dynamic(() => import("./ContactModal"), { ssr: false });
const InfoModal = dynamic(() => import("./InfoModal"), { ssr: false });
const ConfirmModal = dynamic(() => import("./ConfirmModal"), { ssr: false });

// Hooks
import { useAuth } from "./hooks/useAuth";
import { useDatasets } from "./hooks/useDatasets";
import { useUpload } from "./hooks/useUpload";
import { useChat } from "./hooks/useChat";
import type { Dataset } from "./types";

export default function Home() {
  // ═══════════════════════════════════════
  // HOOKS - Business Logic
  // ═══════════════════════════════════════
  
  const [isMounted, setIsMounted] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoModalData, setInfoModalData] = useState<{ title: string; message: string; type: "error" | "info" }>({ 
    title: "", message: "", type: "info" 
  });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmModalData, setConfirmModalData] = useState<{ title: string; message: string; onConfirm: () => void }>({ 
    title: "", message: "", onConfirm: () => {} 
  });

  // Helper functions for modals
  const showInfo = useCallback((title: string, message: string, type: "error" | "info" = "info") => {
    setInfoModalData({ title, message, type });
    setShowInfoModal(true);
  }, []);

  const showConfirm = useCallback((title: string, message: string, onConfirm: () => void) => {
    setConfirmModalData({ title, message, onConfirm });
    setShowConfirmModal(true);
  }, []);

  // Authentication
  const { user, loading: authLoading, logout } = useAuth();

  // Dataset management
  const {
    datasets,
    selectedDataset,
    selectDataset,
    loadDatasets,
    deleteDataset: deleteDatasetService,
    clearDatasetState,
    setHasRestoredState,
  } = useDatasets(user);

  // Upload management
  const uploadState = useUpload(
    (datasetId: string) => {
      loadDatasets(datasetId);
      setHasRestoredState(true);
    },
    showInfo
  );

  // Chat management
  const chatState = useChat(selectedDataset, isMounted, showInfo);

  // ═══════════════════════════════════════
  // LOCAL UI STATE
  // ═══════════════════════════════════════
  
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showStorageInfo, setShowStorageInfo] = useState(shouldShowStorageWarning());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"signin" | "signup">("signin");
  const [showDocsSidebar, setShowDocsSidebar] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ═══════════════════════════════════════
  // COMPUTED VALUES (Memoized)
  // ═══════════════════════════════════════
  
  const columns = useMemo(() => selectedDataset?.column_names || [], [selectedDataset]);
  const isUploaded = useMemo(() => selectedDataset !== null, [selectedDataset]);

  // ═══════════════════════════════════════
  // HANDLERS (Stable with useCallback)
  // ═══════════════════════════════════════
  
  const handleNewChat = useCallback(() => {
    clearDatasetState();
    chatState.setQuestion("");
    chatState.clearHistory();
    console.log("[INFO] New Chat: All state cleared");
  }, [clearDatasetState, chatState]);

  const handleDeleteDataset = useCallback((datasetId: string, datasetName: string) => {
    showConfirm(
      "Delete Dataset",
      `Are you sure you want to delete "${datasetName}"?\n\nThis will permanently remove:\n• The dataset and all its data\n• Related query history\n• The uploaded file\n\nThis action cannot be undone.`,
      async () => {
        try {
          await deleteDatasetService(datasetId);
          console.log(`[INFO] Dataset deleted: ${datasetName}`);
        } catch (error) {
          console.error("Delete error:", error);
          showInfo("Delete Error", `Error deleting dataset: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
        }
      }
    );
  }, [deleteDatasetService, showConfirm, showInfo]);

  const handleLogout = useCallback(async () => {
    await logout();
    clearDatasetState();
  }, [logout, clearDatasetState]);

  const handleAuthSuccess = useCallback(() => {
    setShowAuthModal(false);
    loadDatasets();
  }, [loadDatasets]);

  const handleFileClick = useCallback(() => {
    console.log("[DEBUG] handleFileClick called");
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      console.log("[DEBUG] After RAF, fileInputRef.current:", fileInputRef.current);
      if (fileInputRef.current) {
        fileInputRef.current.click();
      } else {
        console.error("[ERROR] fileInputRef.current is still null after RAF!");
        // Fallback: try to find the input by selector
        const input = document.querySelector<HTMLInputElement>('input[type="file"][accept=".csv"]');
        if (input) {
          console.log("[DEBUG] Found input via querySelector, clicking it");
          input.click();
        } else {
          console.error("[ERROR] Could not find file input in DOM!");
        }
      }
    });
  }, []);

  // ═══════════════════════════════════════
  // EFFECTS
  // ═══════════════════════════════════════
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ═══════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════
  
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FDFBD4' }}>
      {/* Hidden file input - MUST be at top level, always rendered */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={(e) => {
          const file = e.target.files?.[0] || null;
          if (file) {
            // Auto-upload when selecting file from chat interface (when datasets exist)
            if (user && isUploaded && datasets.length > 0) {
              uploadState.handleFileUpload(false, file);
            } else {
              uploadState.setFile(file);
            }
          }
          // Reset input value to allow selecting same file again
          e.target.value = '';
        }}
        className="hidden"
      />

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
            <button onClick={() => { setSidebarOpen(false); setShowDocsSidebar(true); }} className="transition-colors text-sm font-medium" style={{ color: '#8B5A00' }} onMouseEnter={(e) => e.currentTarget.style.color = '#713600'} onMouseLeave={(e) => e.currentTarget.style.color = '#8B5A00'}>Docs</button>
            <button onClick={() => { setSidebarOpen(false); setShowContactModal(true); }} className="transition-colors text-sm font-medium" style={{ color: '#8B5A00' }} onMouseEnter={(e) => e.currentTarget.style.color = '#713600'} onMouseLeave={(e) => e.currentTarget.style.color = '#8B5A00'}>Contact</button>
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

      {/* App Layout - Grid on desktop, overlay on mobile */}
      <div className="app-layout">
        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div 
            className="sidebar-overlay md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={`sidebar ${sidebarOpen ? "open" : ""}`}
          style={{ backgroundColor: '#F8F4E6', borderRight: '1px solid #E8DFC8' }}
        >
          <div className="p-4 sm:p-6 flex-1 overflow-y-auto">
            {/* Close button */}
            <div className="flex items-center justify-between mb-4">
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
                    onClick={handleFileClick}
                    className="p-1.5 rounded-lg transition-colors shrink-0"
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
                        selectedDataset?.id === dataset.id ? 'ring-2 ring-[#C17817]' : ''
                      }`}
                      style={{
                        backgroundColor: selectedDataset?.id === dataset.id ? '#FDFBD4' : '#F8F4E6',
                        border: '1px solid #E8DFC8',
                      }}
                    >
                      <button
                        onClick={() => selectDataset(dataset)}
                        className="w-full text-left"
                      >
                        <div className="flex items-start gap-2 sm:gap-3">
                          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            selectedDataset?.id === dataset.id ? 'ring-2 ring-[#C17817]' : ''
                          }`} style={{ 
                            backgroundColor: 'rgba(193, 120, 23, 0.15)',
                          }}>
                            <Database className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: '#C17817' }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                              {selectedDataset?.id === dataset.id && (
                                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0" style={{ backgroundColor: '#C17817' }} />
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
                  onClick={handleFileClick}
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
            <ChatHistory
              history={chatState.history}
              historySearch={chatState.historySearch}
              onSearchChange={chatState.setHistorySearch}
              onItemClick={chatState.loadHistoryItem}
              onClear={() => showConfirm("Clear History", "Are you sure you want to clear all history?", chatState.clearHistory)}
            />

            {/* Quick Actions */}
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#8B5A00' }}>
                Quick Actions
              </h3>
              <div className="space-y-2">
                <button 
                  disabled={true}
                  className="w-full flex items-center gap-2 p-3 rounded-lg transition-all text-left" 
                  style={{ backgroundColor: '#FDFBD4', border: '1px solid #E8DFC8', opacity: 0.5, cursor: 'not-allowed' }} 
                >
                  <Folder className="w-4 h-4" style={{ color: '#8B5A00' }} />
                  <span className="text-sm" style={{ color: '#713600' }}>Export Data</span>
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {!isUploaded || datasets.length === 0 ? (
            /* Hero Section & Upload */
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12 lg:py-16">
              {/* Hero */}
              <div className="text-center mb-8 sm:mb-12">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4 leading-tight" style={{ color: '#713600' }}>
                  Chat with Your Data<br className="hidden sm:block" />
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
              <UploadArea
                file={uploadState.file}
                isDragOver={uploadState.isDragOver}
                onFileChange={uploadState.setFile}
                onDragOver={uploadState.handleDragOver}
                onDragLeave={uploadState.handleDragLeave}
                onDrop={uploadState.handleDrop}
                onClick={handleFileClick}
              />

              {/* Progress Bar */}
              {uploadState.isUploading && <UploadProgress uploadProgress={uploadState.uploadProgress} />}

              {/* Upload Button */}
              {uploadState.file && !uploadState.isUploading && !user && (
                <div className="max-w-2xl mx-auto mt-4">
                  <p className="text-center text-sm mb-4" style={{ color: '#8B5A00' }}>
                    Please sign in to upload your dataset
                  </p>
                </div>
              )}
              
              {uploadState.file && !uploadState.isUploading && user && (
                <div className="max-w-2xl mx-auto">
                  <UploadButton onClick={() => uploadState.handleFileUpload()} />
                </div>
              )}
            </div>
          ) : (
            /* Chat Interface */
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8">
              {/* Database Info */}
              <DatasetInfo
                selectedDataset={selectedDataset}
                columns={columns}
                onUploadNew={handleFileClick}
              />

              {/* Query Input */}
              <ChatInput
                question={chatState.question}
                loading={chatState.loading}
                selectedDataset={selectedDataset}
                columns={columns}
                onQuestionChange={chatState.setQuestion}
                onSubmit={chatState.askAI}
                onSuggestionClick={chatState.setQuestion}
              />

              {/* Results Display */}
              <ChatResult
                result={chatState.result}
                loading={chatState.loading}
                columns={columns}
              />
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authModalMode}
      />

      <DocsSidebar 
        isOpen={showDocsSidebar} 
        onClose={() => setShowDocsSidebar(false)}
      />

      <ContactModal 
        isOpen={showContactModal} 
        onClose={() => setShowContactModal(false)}
      />

      <InfoModal 
        isOpen={showInfoModal} 
        onClose={() => setShowInfoModal(false)}
        title={infoModalData.title}
        message={infoModalData.message}
        type={infoModalData.type}
      />

      <ConfirmModal 
        isOpen={showConfirmModal} 
        onClose={() => setShowConfirmModal(false)}
        onConfirm={confirmModalData.onConfirm}
        title={confirmModalData.title}
        message={confirmModalData.message}
      />

      {/* Duplicate Dataset Modal */}
      {uploadState.showDuplicateModal && uploadState.duplicateInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={uploadState.closeDuplicateModal}
          />
          
          <div className="relative max-w-md w-full rounded-2xl shadow-2xl p-6" style={{ backgroundColor: '#FDFBD4' }}>
            <div className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(193, 120, 23, 0.15)' }}>
              <AlertTriangle className="w-8 h-8" style={{ color: '#C17817' }} />
            </div>
            
            <h2 className="text-2xl font-bold text-center mb-2" style={{ color: '#713600' }}>
              Duplicate File Detected
            </h2>
            
            <p className="text-center mb-6" style={{ color: '#8B5A00' }}>
              This file already exists in your datasets. Would you like to reuse the existing data or upload it as a new version?
            </p>
            
            <div className="rounded-lg p-4 mb-6" style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8' }}>
              <p className="text-sm font-semibold mb-2" style={{ color: '#8B5A00' }}>Existing Dataset:</p>
              <p className="font-medium mb-1" style={{ color: '#713600' }}>{uploadState.duplicateInfo.dataset_name}</p>
              <p className="text-sm" style={{ color: '#8B5A00' }}>
                {uploadState.duplicateInfo.row_count} rows • {uploadState.duplicateInfo.original_filename}
              </p>
              <p className="text-xs mt-1" style={{ color: '#A66212' }}>
                Created: {new Date(uploadState.duplicateInfo.created_at).toLocaleDateString()}
              </p>
            </div>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={uploadState.handleReuseDataset}
                className="w-full py-3 rounded-xl font-semibold transition-all shadow-sm flex items-center justify-center gap-2"
                style={{ backgroundColor: '#C17817', color: '#FDFBD4' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#A66212'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C17817'}
              >
                <Database className="w-5 h-5" />
                <span>Reuse Existing Dataset</span>
              </button>
              
              <button
                onClick={uploadState.handleUploadAsNew}
                className="w-full py-3 rounded-xl font-semibold transition-all"
                style={{ backgroundColor: '#F8F4E6', color: '#713600', border: '1px solid #E8DFC8' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C17817'; e.currentTarget.style.backgroundColor = 'rgba(193, 120, 23, 0.1)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E8DFC8'; e.currentTarget.style.backgroundColor = '#F8F4E6'; }}
              >
                <FileUp className="w-5 h-5 inline mr-2" />
                <span>Upload as New Version</span>
              </button>
              
              <button
                onClick={uploadState.closeDuplicateModal}
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
