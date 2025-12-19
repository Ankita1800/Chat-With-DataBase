/**
 * State Persistence Utility
 * Manages app state persistence across page refreshes
 */

interface PersistedState {
  selectedDatasetId: string | null;
  isUploaded: boolean;
  columns: string[];
  lastUpdated: number;
}

const STATE_KEY = 'app_persisted_state';
const STATE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

export const saveAppState = (state: {
  selectedDatasetId: string;
  isUploaded: boolean;
  columns: string[];
}): void => {
  if (typeof window === 'undefined') return;
  
  const persistedState: PersistedState = {
    selectedDatasetId: state.selectedDatasetId,
    isUploaded: state.isUploaded,
    columns: state.columns,
    lastUpdated: Date.now(),
  };
  
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(persistedState));
  } catch (error) {
    console.error('Failed to save app state:', error);
  }
};

export const loadAppState = (): PersistedState | null => {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STATE_KEY);
    if (!stored) return null;
    
    const state: PersistedState = JSON.parse(stored);
    
    // Check if state is expired
    if (Date.now() - state.lastUpdated > STATE_EXPIRY) {
      localStorage.removeItem(STATE_KEY);
      return null;
    }
    
    return state;
  } catch (error) {
    console.error('Failed to load app state:', error);
    return null;
  }
};

export const clearAppState = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STATE_KEY);
};
