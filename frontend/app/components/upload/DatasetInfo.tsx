"use client";
import { Database } from "lucide-react";
import type { Dataset } from "../../types";

interface DatasetInfoProps {
  selectedDataset: Dataset | null;
  columns: string[];
  onUploadNew: () => void;
}

export default function DatasetInfo({ selectedDataset, columns, onUploadNew }: DatasetInfoProps) {
  return (
    <div className="rounded-xl p-4 sm:p-6 mb-4 sm:mb-6" style={{ backgroundColor: '#F8F4E6', border: '1px solid #E8DFC8' }}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
        <div className="flex items-center gap-3 sm:gap-4 flex-1">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(193, 120, 23, 0.15)' }}>
            <Database className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: '#C17817' }} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ backgroundColor: '#C17817' }} />
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
            onClick={onUploadNew}
            className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-lg transition-colors shrink-0 font-medium"
            style={{ color: '#FDFBD4', backgroundColor: '#C17817' }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#A66212'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#C17817'}
          >
            + Upload New
          </button>
        </div>
      </div>
    </div>
  );
}
