import { api } from "./api";
import type { QueryResult } from "../types";

export interface AskRequest {
  question: string;
  dataset_id: string;
}

export const chatService = {
  /**
   * Ask a question about the dataset
   */
  async askQuestion(question: string, datasetId: string, token: string): Promise<QueryResult> {
    const payload: AskRequest = {
      question,
      dataset_id: datasetId,
    };
    return api.post<QueryResult>('/ask', token, payload);
  },
};
