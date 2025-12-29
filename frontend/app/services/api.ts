// API Configuration
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

/**
 * Fetch wrapper with auth token
 */
async function fetchWithAuth(
  endpoint: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    },
  });
}

export const api = {
  /**
   * Generic authenticated GET request
   */
  async get<T>(endpoint: string, token: string): Promise<T> {
    const response = await fetchWithAuth(endpoint, token);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(errorData.detail || `Request failed: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Generic authenticated POST request
   */
  async post<T>(endpoint: string, token: string, body?: any, isFormData = false): Promise<T> {
    const options: RequestInit = {
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    };

    if (!isFormData) {
      options.headers = {
        'Content-Type': 'application/json',
      };
    }

    const response = await fetchWithAuth(endpoint, token, options);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Request failed" }));
      throw new Error(errorData.detail || `Request failed: ${response.status}`);
    }
    return response.json();
  },

  /**
   * Generic authenticated DELETE request
   */
  async delete<T>(endpoint: string, token: string): Promise<T> {
    const response = await fetchWithAuth(endpoint, token, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Delete failed" }));
      throw new Error(errorData.detail || "Failed to delete");
    }
    return response.json();
  },
};
