"use client";
import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import { FileUp, AlertTriangle, X, Database } from "lucide-react";
import { shouldShowStorageWarning, dismissStorageWarning } from "../lib/config";

// Layout
import AppShell from "./components/layout/AppShell";
import DrawerContent from "./components/layout/DrawerContent";

// Components
import UploadArea from "./components/upload/UploadArea";
import UploadProgress from "./components/upload/UploadProgress";
import UploadButton from "./components/upload/UploadButton";
import DatasetInfo from "./components/upload/DatasetInfo";
import ChatInput from "./components/chat/ChatInput";
import ChatResult from "./components/chat/ChatResult";

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
  
  const drawerContent = (
    <DrawerContent
      user={user}
      datasets={datasets}
      selectedDataset={selectedDataset}
      selectDataset={selectDataset}
      handleNewChat={handleNewChat}
      handleFileClick={handleFileClick}
      handleDeleteDataset={handleDeleteDataset}
      chatHistory={chatState.history}
      historySearch={chatState.historySearch}
      onHistorySearchChange={chatState.setHistorySearch}
      onHistoryItemClick={chatState.loadHistoryItem}
      onClearHistory={() => showConfirm("Clear History", "Are you sure you want to clear all history?", chatState.clearHistory)}
    />
  );
  
  return (
    <>
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

      <AppShell
        user={user}
        onLogout={handleLogout}
        onSignIn={() => { setAuthModalMode("signin"); setShowAuthModal(true); }}
        onSignUp={() => { setAuthModalMode("signup"); setShowAuthModal(true); }}
        onDocsOpen={() => setShowDocsSidebar(true)}
        onContactOpen={() => setShowContactModal(true)}
        drawerContent={drawerContent}
      >
        {/* Storage Info Banner */}
        {showStorageInfo && (
          <div className="bg-[rgba(193,120,23,0.08)] border-b border-[rgba(193,120,23,0.2)]">
            <div className="max-w-7xl mx-auto px-6 py-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 shrink-0 text-[#C17817]" />
                <p className="text-sm flex-1 text-[#8B5A00]">
                  <strong>Development Mode:</strong> Using Supabase cloud storage. 
                  All files are securely stored per user with Row Level Security enabled.
                </p>
                <button 
                  onClick={() => { 
                    setShowStorageInfo(false); 
                    dismissStorageWarning(); 
                  }} 
                  className="text-[#C17817] hover:text-[#8B5A00]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Main Content Area */}
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
      </AppShell>

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
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}