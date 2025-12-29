"use client";
import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { saveAppState, loadAppState, clearAppState } from "../../lib/persistence";
import { datasetsService } from "../services/datasets.service";
import type { Dataset } from "../types";

export function useDatasets(user: any) {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
  const [hasRestoredState, setHasRestoredState] = useState(false);

  /**
   * Load datasets from backend
   */
  const loadDatasets = async (selectDatasetId?: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const fetchedDatasets = await datasetsService.loadDatasets(session.access_token);
      setDatasets(fetchedDatasets);
      
      // If selectDatasetId is provided, select that dataset atomically
      if (selectDatasetId && fetchedDatasets.length > 0) {
        const datasetToSelect = fetchedDatasets.find((d: Dataset) => d.id === selectDatasetId);
        if (datasetToSelect) {
          selectDataset(datasetToSelect);
        }
      }
    } catch (error) {
      console.error('Failed to load datasets:', error);
    }
  };

  /**
   * Atomically select a dataset and update all related state
   */
  const selectDataset = (dataset: Dataset | null) => {
    setSelectedDataset(dataset);
    
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
   * Delete a dataset
   */
  const deleteDataset = async (datasetId: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");

    await datasetsService.deleteDataset(datasetId, session.access_token);
    
    // If deleted dataset was selected, clear selection
    if (selectedDataset?.id === datasetId) {
      setSelectedDataset(null);
      clearAppState();
    }

    // Reload datasets to update the list
    await loadDatasets();
  };

  /**
   * Clear all dataset-related state (New Chat)
   */
  const clearDatasetState = () => {
    clearAppState();
    setSelectedDataset(null);
  };

  // Load datasets when user changes
  useEffect(() => {
    if (user) {
      loadDatasets();
    } else {
      setDatasets([]);
      setSelectedDataset(null);
    }
  }, [user]);

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
      setHasRestoredState(true);
    }
  }, [datasets, hasRestoredState]);

  return {
    datasets,
    selectedDataset,
    selectDataset,
    loadDatasets,
    deleteDataset,
    clearDatasetState,
    setHasRestoredState,
  };
}
