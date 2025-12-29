// Shared type definitions
export interface HistoryItem {
  id: string;
  question: string;
  answer: string;
  sql: string;
  timestamp: Date;
  success: boolean;
}

export interface QueryResult {
  question?: string;
  generated_sql?: string;
  answer: string;
  status?: string;
  message?: string;
  confidence?: number;
  data_found?: boolean;
}

export interface Dataset {
  id: string;
  dataset_name: string;
  original_filename: string;
  table_name: string;
  column_names: string[];
  row_count: number;
  created_at: string;
}
