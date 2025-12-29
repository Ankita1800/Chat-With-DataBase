"use client";
import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { datasetsService } from "../services/datasets.service";
import type { Dataset } from "../types";

interface UploadState {
  file: File | null;
  isUploading: boolean;
  uploadProgress: number;
  isDragOver: boolean;
  showDuplicateModal: boolean;
  duplicateInfo: Dataset | null;
  pendingFile: File | null;
}

export function useUpload(onUploadSuccess: (datasetId: string) => void, onShowInfo: (title: string, message: string, type: "error" | "info") => void) {
  const [state, setState] = useState<UploadState>({
    file: null,
    isUploading: false,
    uploadProgress: 0,
    isDragOver: false,
    showDuplicateModal: false,
    duplicateInfo: null,
    pendingFile: null,
  });

  const setFile = (file: File | null) => {
    setState(prev => ({ ...prev, file }));
  };

  const setIsDragOver = (isDragOver: boolean) => {
    setState(prev => ({ ...prev, isDragOver }));
  };

  /**
   * Handle file upload
   */
  const handleFileUpload = async (forceUpload: boolean = false, fileToUpload?: File) => {
    const uploadFile = fileToUpload || state.file;
    if (!uploadFile) return;

    // Update state with the file if passed directly
    if (fileToUpload) {
      setState(prev => ({ ...prev, file: fileToUpload }));
    }

    setState(prev => ({ ...prev, isUploading: true, uploadProgress: 0 }));

    const progressInterval = setInterval(() => {
      setState(prev => ({ ...prev, uploadProgress: Math.min(prev.uploadProgress + 10, 90) }));
    }, 100);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await datasetsService.uploadFile(
        uploadFile,
        session.access_token,
        { forceUpload }
      );

      clearInterval(progressInterval);
      
      // Check if duplicate detected
      if (response.duplicate && response.existing_dataset) {
        console.log("[INFO] Duplicate detected, showing modal");
        setState(prev => ({
          ...prev,
          isUploading: false,
          uploadProgress: 0,
          duplicateInfo: response.existing_dataset!,
          pendingFile: uploadFile,
          showDuplicateModal: true,
        }));
        return;
      }

      setState(prev => ({ ...prev, uploadProgress: 100 }));

      // Handle successful upload or reuse
      if (response.success && response.dataset_id) {
        setTimeout(() => {
          setState(prev => ({ ...prev, isUploading: false, uploadProgress: 100, file: null }));
          onUploadSuccess(response.dataset_id);
          
          if (response.reused) {
            console.log("[INFO] Reused existing dataset");
          } else {
            console.log("[INFO] Successfully uploaded new dataset");
          }
        }, 500);
      } else {
        throw new Error(response.message || "Upload failed");
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Upload error:", error);
      onShowInfo("Upload Error", `Error uploading file: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
      setState(prev => ({ ...prev, isUploading: false, uploadProgress: 0 }));
    }
  };

  /**
   * Handle reusing existing dataset
   */
  const handleReuseDataset = async () => {
    if (!state.pendingFile || !state.duplicateInfo) return;

    setState(prev => ({ ...prev, showDuplicateModal: false, isUploading: true, uploadProgress: 0 }));

    const progressInterval = setInterval(() => {
      setState(prev => ({ ...prev, uploadProgress: Math.min(prev.uploadProgress + 10, 90) }));
    }, 100);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await datasetsService.uploadFile(
        state.pendingFile,
        session.access_token,
        { reuse: true }
      );

      clearInterval(progressInterval);
      setState(prev => ({ ...prev, uploadProgress: 100 }));

      if (response.success && response.dataset_id) {
        setTimeout(() => {
          setState(prev => ({
            ...prev,
            isUploading: false,
            uploadProgress: 100,
            file: null,
            pendingFile: null,
            duplicateInfo: null,
          }));
          onUploadSuccess(response.dataset_id);
          console.log("[INFO] Successfully reused existing dataset");
        }, 500);
      } else {
        throw new Error("Reuse failed: Missing dataset_id in response");
      }
    } catch (error) {
      clearInterval(progressInterval);
      console.error("Reuse error:", error);
      onShowInfo("Reuse Error", `Error reusing dataset: ${error instanceof Error ? error.message : "Unknown error"}`, "error");
      setState(prev => ({ ...prev, isUploading: false, uploadProgress: 0, showDuplicateModal: true }));
    }
  };

  /**
   * Handle uploading as new dataset (force upload)
   */
  const handleUploadAsNew = () => {
    setState(prev => ({ ...prev, showDuplicateModal: false, pendingFile: null, duplicateInfo: null }));
    handleFileUpload(true);
  };

  /**
   * Close duplicate modal
   */
  const closeDuplicateModal = () => {
    setState(prev => ({
      ...prev,
      showDuplicateModal: false,
      pendingFile: null,
      duplicateInfo: null,
      file: null,
    }));
  };

  // Drag and drop handlers
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
      onShowInfo("Invalid File Type", "Please upload a CSV file", "info");
    }
  };

  return {
    ...state,
    setFile,
    setIsDragOver,
    handleFileUpload,
    handleReuseDataset,
    handleUploadAsNew,
    closeDuplicateModal,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
