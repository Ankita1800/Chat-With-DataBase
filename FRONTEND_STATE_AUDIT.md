# Frontend State Management Audit & Fixes
**Date:** December 23, 2025
**Issue:** Newly uploaded datasets show columns from previously uploaded datasets

---

## 🔍 ROOT CAUSE ANALYSIS

### Critical Issues Identified

#### 1. **Race Condition in State Restoration**
```tsx
// PROBLEM: Lines 139-148 in page.tsx
useEffect(() => {
  const persistedState = loadAppState();
  if (persistedState && datasets.length > 0) {
    const dataset = datasets.find(d => d.id === persistedState.selectedDatasetId);
    if (dataset) {
      setSelectedDataset(dataset);
      setColumns(dataset.column_names);
      setIsUploaded(true);
    }
  }
}, [datasets]);  // ⚠️ Runs EVERY TIME datasets changes
```

**Why this breaks:**
1. User uploads `job.csv` → sets `selectedDataset` to job
2. `loadDatasets()` fetches all datasets including old `data.csv`
3. `datasets` array changes → **triggers useEffect**
4. LocalStorage still has old `data.csv` ID
5. useEffect **overwrites** the newly selected job dataset with old data.csv

#### 2. **Redundant State Management**
```tsx
const [isUploaded, setIsUploaded] = useState(false);
const [columns, setColumns] = useState<string[]>([]);
const [selectedDataset, setSelectedDataset] = useState<Dataset | null>(null);
```

**Problem:** 
- `columns` duplicates `selectedDataset.column_names`
- `isUploaded` duplicates `selectedDataset !== null`
- Three sources of truth cause synchronization bugs

#### 3. **Persistence Logic Conflicts**
```tsx
// Lines 153-160: Saves on EVERY state change
useEffect(() => {
  if (selectedDataset) {
    saveAppState({
      selectedDatasetId: selectedDataset.id,
      columns,
      isUploaded,
    });
  }
}, [selectedDataset, columns, isUploaded]);
```

**Problem:**
- Saves stale `columns` array instead of `selectedDataset.column_names`
- Creates inconsistency between persisted and actual state

---

## 📊 STATE FLOW DIAGRAM

### Current (Broken) Flow:
```
Upload job.csv
    ↓
Set selectedDataset = job
    ↓
Save to localStorage (job.id)
    ↓
Call loadDatasets()
    ↓
Datasets array changes
    ↓
useEffect [datasets] triggers  ← 🔴 PROBLEM
    ↓
Load from localStorage
    ↓
Find dataset by old ID (data.csv)  ← 🔴 OVERWRITES
    ↓
setSelectedDataset(data.csv)
    ↓
UI shows wrong columns ❌
```

### Corrected Flow:
```
Upload job.csv
    ↓
Call loadDatasets(job.id)  ← Pass new ID
    ↓
Fetch all datasets from backend
    ↓
Find & select job.csv by ID
    ↓
Update localStorage atomically
    ↓
UI shows correct columns ✅
```

---

## ✅ SOLUTION: REFACTORED STATE MODEL

### Principles:
1. **Single Source of Truth:** `selectedDataset` is the only dataset state
2. **Explicit Selection:** Never auto-restore from localStorage during normal operation
3. **Controlled Restoration:** Only restore on initial mount, not on data changes
4. **Atomic Updates:** Update all related state together

### New State Model:
```tsx
// ✅ SINGLE SOURCE OF TRUTH
const [datasets, setDatasets] = useState<Dataset[]>([]);
const [activeDatasetId, setActiveDatasetId] = useState<string | null>(null);

// ✅ DERIVED STATE (computed, never stored separately)
const activeDataset = datasets.find(d => d.id === activeDatasetId) || null;
const isUploaded = activeDataset !== null;
const columns = activeDataset?.column_names || [];
```

---

## 🔧 CODE FIXES

### Fix 1: Controlled State Restoration
**File:** `frontend/app/page.tsx`

Replace the broken useEffect with controlled restoration:

```tsx
// ❌ REMOVE THIS (Lines 139-148)
useEffect(() => {
  const persistedState = loadAppState();
  if (persistedState && datasets.length > 0) {
    const dataset = datasets.find(d => d.id === persistedState.selectedDatasetId);
    if (dataset) {
      setSelectedDataset(dataset);
      setColumns(dataset.column_names);
      setIsUploaded(true);
    }
  }
}, [datasets]);

// ✅ ADD THIS - Only restore once on mount after datasets load
const [hasRestoredState, setHasRestoredState] = useState(false);

useEffect(() => {
  if (datasets.length > 0 && !hasRestoredState) {
    const persistedState = loadAppState();
    if (persistedState?.selectedDatasetId) {
      const dataset = datasets.find(d => d.id === persistedState.selectedDatasetId);
      if (dataset) {
        setSelectedDataset(dataset);
        setColumns(dataset.column_names);
        setIsUploaded(true);
      }
    }
    setHasRestoredState(true); // Prevent re-triggering
  }
}, [datasets, hasRestoredState]);
```

### Fix 2: Atomic Dataset Selection Helper
```tsx
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
  } else {
    clearAppState();
  }
};
```

### Fix 3: Guaranteed New Dataset Selection
```tsx
// In handleFileUpload
if (data.success) {
  const newDatasetId = data.dataset_id;
  
  setTimeout(async () => {
    setIsUploading(false);
    setUploadProgress(100);
    
    // ✅ Clear old state first
    clearAppState();
    
    // ✅ Reload datasets and select new one
    await loadDatasets(newDatasetId);
    
    setFile(null);
  }, 500);
}
```

### Fix 4: Updated loadDatasets Function
```tsx
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
      
      // ✅ Explicit selection takes priority over restoration
      if (selectDatasetId && fetchedDatasets.length > 0) {
        const datasetToSelect = fetchedDatasets.find((d: Dataset) => d.id === selectDatasetId);
        if (datasetToSelect) {
          selectDataset(datasetToSelect); // Use atomic helper
        }
      }
    }
  } catch (error) {
    console.error('Failed to load datasets:', error);
  }
};
```

---

## 📋 COMPLETE STATE MANAGEMENT RULES

### Rule 1: Dataset Selection Priority
```
1. Explicit selection (user clicks or new upload) → HIGHEST
2. Persisted state (localStorage restore) → MEDIUM (once only)
3. Auto-selection (first dataset) → LOWEST (never do this)
```

### Rule 2: State Update Order
```
For ANY dataset change:
1. Clear old persistence (if needed)
2. Update selectedDataset
3. Update derived state (columns, isUploaded)
4. Save new persistence
5. Trigger UI re-render
```

### Rule 3: useEffect Dependencies
```tsx
// ❌ NEVER: Restore state on datasets change
useEffect(() => { /* restore logic */ }, [datasets])

// ✅ ALWAYS: Restore state once on mount
useEffect(() => { 
  if (!hasRestored) { /* restore logic */ }
}, [datasets, hasRestored])

// ✅ ALWAYS: Use cleanup flags to prevent re-triggers
```

### Rule 4: Backend Synchronization
```tsx
// ✅ ALWAYS: Use activeDataset.id for queries
const askAI = async () => {
  if (!selectedDataset) {
    alert("Please select a dataset");
    return;
  }
  
  // Use selectedDataset.id - guaranteed to be current
  const response = await fetch(`${API_URL}/ask`, {
    method: "POST",
    body: JSON.stringify({
      question: currentQuestion,
      dataset_id: selectedDataset.id, // ✅ From selectedDataset
    }),
  });
};
```

---

## 🎯 VERIFICATION CHECKLIST

After implementing fixes, verify:

- [ ] Upload `data.csv` → Shows data columns
- [ ] Upload `job.csv` → Shows job columns (not data columns)
- [ ] Refresh page → Shows last selected dataset
- [ ] Switch datasets in sidebar → Correct columns appear
- [ ] Upload third dataset → Auto-selected, correct columns
- [ ] Query dataset → Uses correct dataset_id in backend request
- [ ] Logout/login → State cleared, no stale data
- [ ] Multiple tabs → Each maintains independent state

---

## 📦 FILES TO MODIFY

### Priority 1 (Critical):
1. `frontend/app/page.tsx` - State management fixes
2. `frontend/lib/persistence.ts` - Add clearAppState usage

### Priority 2 (Important):
3. Dataset switching logic in sidebar
4. Upload handler success callback

### Priority 3 (Optional):
5. Add TypeScript strict mode for state
6. Add state debugging utilities
7. Add Zustand or Context for global state

---

## 🚀 RECOMMENDED NEXT STEPS

### Immediate (Today):
1. ✅ Implement `hasRestoredState` flag
2. ✅ Add `selectDataset()` atomic helper
3. ✅ Call `clearAppState()` before new upload
4. ✅ Test upload flow

### Short-term (This Week):
1. Refactor to single `activeDatasetId` state
2. Remove redundant `columns` and `isUploaded` state
3. Add comprehensive state logging
4. Add error boundaries

### Long-term (Next Sprint):
1. Migrate to Zustand for predictable state
2. Add React DevTools integration
3. Implement state time-travel debugging
4. Add E2E tests for state transitions

---

## 📚 REFERENCES

### State Management Patterns:
- **Single Source of Truth:** React state should have one canonical source
- **Derived State:** Compute from primary state, don't store separately
- **Controlled Restoration:** Only restore persisted state once, explicitly

### React Best Practices:
- Dependencies in useEffect must be exhaustive or controlled
- Use flags to prevent useEffect re-triggering
- Atomic updates prevent race conditions

### Testing Strategy:
```tsx
// Unit test for selectDataset
test('selectDataset updates all related state atomically', () => {
  const dataset = { id: '123', column_names: ['A', 'B'] };
  selectDataset(dataset);
  
  expect(selectedDataset).toBe(dataset);
  expect(columns).toEqual(['A', 'B']);
  expect(isUploaded).toBe(true);
  expect(loadAppState()?.selectedDatasetId).toBe('123');
});
```

---

## ⚠️ WARNINGS & PITFALLS

### Don't:
- ❌ Auto-restore on datasets change
- ❌ Store derived state separately
- ❌ Update state in multiple places
- ❌ Rely on useState setter timing

### Do:
- ✅ Use explicit selection only
- ✅ Derive state from primary source
- ✅ Update state atomically
- ✅ Use callbacks for sequential updates

---

**End of Audit**
