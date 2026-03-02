import apiClient from './client';

// ─── Types ───

export interface AIProviderKey {
  index: number;
  masked: string;
  is_active: boolean;
}

export interface AIProvider {
  name: string;
  enabled: boolean;
  priority: number;
  keys_count: number;
  keys: AIProviderKey[];
  active_key_index: number;
  selected_model: string | null;
  available_models: string[];
  base_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface AIPrompt {
  is_custom: boolean;
  prompt: string;
  service_name: string;
}

export interface AIProviderTestResult {
  ok: boolean;
  models: string[];
  count: number;
  error: string | null;
}

// ─── API ───

export const aiProvidersApi = {
  // Providers
  getProviders: async (): Promise<AIProvider[]> => {
    const response = await apiClient.get<AIProvider[]>('/ai-providers');
    return response.data;
  },

  getProvider: async (name: string): Promise<AIProvider> => {
    const response = await apiClient.get<AIProvider>(`/ai-providers/${name}`);
    return response.data;
  },

  toggleProvider: async (name: string, enabled: boolean): Promise<AIProvider> => {
    const response = await apiClient.post<AIProvider>(`/ai-providers/${name}/toggle`, { enabled });
    return response.data;
  },

  setPriority: async (name: string, priority: number): Promise<AIProvider> => {
    const response = await apiClient.post<AIProvider>(`/ai-providers/${name}/priority`, {
      priority,
    });
    return response.data;
  },

  addKey: async (name: string, apiKey: string): Promise<AIProvider> => {
    const response = await apiClient.post<AIProvider>(`/ai-providers/${name}/keys`, {
      api_key: apiKey,
    });
    return response.data;
  },

  removeKey: async (name: string, keyIndex: number): Promise<AIProvider> => {
    const response = await apiClient.delete<AIProvider>(`/ai-providers/${name}/keys`, {
      data: { key_index: keyIndex },
    });
    return response.data;
  },

  testConnection: async (name: string): Promise<AIProviderTestResult> => {
    const response = await apiClient.post<AIProviderTestResult>(`/ai-providers/${name}/test`);
    return response.data;
  },

  setModel: async (name: string, model: string): Promise<AIProvider> => {
    const response = await apiClient.post<AIProvider>(`/ai-providers/${name}/model`, { model });
    return response.data;
  },

  // Prompt
  getPrompt: async (): Promise<AIPrompt> => {
    const response = await apiClient.get<AIPrompt>('/ai-providers/prompt/current');
    return response.data;
  },

  updatePrompt: async (prompt: string): Promise<AIPrompt> => {
    const response = await apiClient.put<AIPrompt>('/ai-providers/prompt/current', { prompt });
    return response.data;
  },

  resetPrompt: async (): Promise<AIPrompt> => {
    const response = await apiClient.delete<AIPrompt>('/ai-providers/prompt/current');
    return response.data;
  },
};
