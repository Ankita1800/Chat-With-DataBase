import { api } from "./api";
import type { Dataset } from "../types";

export interface DatasetsResponse {
  datasets: Dataset[];
}

export interface UploadResponse {
  success: boolean;
  dataset_id: string;
  message?: string;
  reused?: boolean;
  duplicate?: boolean;
  existing_dataset?: Dataset;
}

export const datasetsService = {
  /**
   * Load all datasets for the authenticated user
   */
  async loadDatasets(token: string): Promise<Dataset[]> {
    const data = await api.get<DatasetsResponse>('/datasets', token);
    return data.datasets || [];
  },

  /**
   * Upload a CSV file (with optional force or reuse flags)
   */
  async uploadFile(
    file: File,
    token: string,
    options: { forceUpload?: boolean; reuse?: boolean } = {}
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append("file", file);

    const queryParams = new URLSearchParams();
    if (options.forceUpload) queryParams.append('force_upload', 'true');
    if (options.reuse) queryParams.append('reuse', 'true');

    const endpoint = `/upload${queryParams.toString() ? `?${queryParams}` : ''}`;
    return api.post<UploadResponse>(endpoint, token, formData, true);
  },

  /**
   * Delete a dataset by ID
   */
  async deleteDataset(datasetId: string, token: string): Promise<{ success: boolean }> {
    return api.delete<{ success: boolean }>(`/datasets/${datasetId}`, token);
  },
};
