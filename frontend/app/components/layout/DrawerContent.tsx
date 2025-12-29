"use client";
import { Plus, MessageSquare, Database, Trash2, Folder } from "lucide-react";
import ChatHistory from "../chat/ChatHistory";
import type { Dataset } from "../../types";

interface DrawerContentProps {
  user: any;
  datasets: Dataset[];
  selectedDataset: Dataset | null;
  selectDataset: (dataset: Dataset) => void;
  handleNewChat: () => void;
  handleFileClick: () => void;
  handleDeleteDataset: (datasetId: string, datasetName: string) => void;
  chatHistory: any[];
  historySearch: string;
  onHistorySearchChange: (search: string) => void;
  onHistoryItemClick: (item: any) => void;
  onClearHistory: () => void;
}

export default function DrawerContent({
  user,
  datasets,
  selectedDataset,
  selectDataset,
  handleNewChat,
  handleFileClick,
  handleDeleteDataset,
  chatHistory,
  historySearch,
  onHistorySearchChange,
  onHistoryItemClick,
  onClearHistory,
}: DrawerContentProps) {
  return (
    <>
      {/* Database Connections / Datasets */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8B5A00]">
            Your Datasets
          </h3>
          {user && (
            <button
              onClick={handleFileClick}
              className="p-1.5 rounded-lg bg-[rgba(193,120,23,0.1)] text-[#C17817] hover:bg-[rgba(193,120,23,0.2)] transition-colors shrink-0"
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
            className="w-full mb-3 p-2.5 sm:p-3 rounded-lg bg-[#C17817] text-[#FDFBD4] border border-[#C17817] hover:bg-[#A66212] transition-all font-medium text-xs sm:text-sm flex items-center justify-center gap-2"
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
                className={`group relative w-full p-2.5 sm:p-3 rounded-lg transition-all border border-[#E8DFC8] ${
                  selectedDataset?.id === dataset.id ? "ring-2 ring-[#C17817] bg-[#FDFBD4]" : "bg-[#F8F4E6]"
                }`}
              >
                <button
                  onClick={() => selectDataset(dataset)}
                  className="w-full text-left"
                >
                  <div className="flex items-start gap-2 sm:gap-3">
                    <div
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center shrink-0 bg-[rgba(193,120,23,0.15)] ${
                        selectedDataset?.id === dataset.id ? "ring-2 ring-[#C17817]" : ""
                      }`}
                    >
                      <Database className="w-4 h-4 sm:w-5 sm:h-5 text-[#C17817]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
                        {selectedDataset?.id === dataset.id && (
                          <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0 bg-[#C17817]" />
                        )}
                        <span className="text-xs sm:text-sm font-medium truncate text-[#713600]">
                          {dataset.dataset_name}
                        </span>
                      </div>
                      <p className="text-[10px] sm:text-xs truncate text-[#8B5A00]">
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
                  className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-[rgba(220,38,38,0.1)] text-[#dc2626] hover:bg-[rgba(220,38,38,0.2)] hover:text-[#991b1b] transition-all"
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
            className="w-full flex items-center gap-2 p-2.5 sm:p-3 border-2 border-dashed rounded-lg border-[#E8DFC8] text-[#8B5A00] hover:border-[#C17817] hover:bg-[rgba(193,120,23,0.05)] hover:text-[#C17817] transition-all text-xs sm:text-sm font-medium"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Upload Your First Dataset</span>
          </button>
        )}

        {/* Show selected dataset columns */}
        {selectedDataset && (
          <div className="mt-3 p-2.5 sm:p-3 rounded-lg bg-[#FDFBD4] border border-[#E8DFC8]">
            <p className="text-[10px] sm:text-xs font-semibold mb-2 text-[#8B5A00]">COLUMNS:</p>
            <div className="flex flex-wrap gap-1 sm:gap-1.5">
              {selectedDataset.column_names.map((col) => (
                <span
                  key={col}
                  className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-[10px] sm:text-xs font-medium bg-[#F8F4E6] text-[#713600] border border-[#E8DFC8]"
                >
                  {col}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chat History */}
      <ChatHistory
        history={chatHistory}
        historySearch={historySearch}
        onSearchChange={onHistorySearchChange}
        onItemClick={onHistoryItemClick}
        onClear={onClearHistory}
      />

      {/* Quick Actions */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider mb-3 text-[#8B5A00]">
          Quick Actions
        </h3>
        <div className="space-y-2">
          <button
            disabled={true}
            className="w-full flex items-center gap-2 p-3 rounded-lg bg-[#FDFBD4] border border-[#E8DFC8] opacity-50 cursor-not-allowed transition-all text-left"
          >
            <Folder className="w-4 h-4 text-[#8B5A00]" />
            <span className="text-sm text-[#713600]">Export Data</span>
          </button>
        </div>
      </div>
    </>
  );
}
