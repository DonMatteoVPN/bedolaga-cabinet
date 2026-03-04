import { apiClient } from './client';

export interface AIFaqMediaResponse {
  id: number;
  article_id: number;
  media_type: 'photo' | 'video' | 'animation';
  file_id: string;
  caption: string | null;
  tag: string;
  created_at: string;
}

export interface AIFaqMediaCreateRequest {
  file_id: string;
  media_type: 'photo' | 'video' | 'animation';
  tag: string;
  caption?: string | null;
}

export interface AIFaqArticleResponse {
  id: number;
  title: string;
  content: string;
  keywords: string | null;
  is_active: boolean;
  media: AIFaqMediaResponse[];
  created_at: string;
  updated_at: string;
}

export interface AIFaqArticleCreateRequest {
  title: string;
  content: string;
  keywords?: string | null;
  is_active?: boolean;
}

export interface AIFaqArticleUpdateRequest {
  title?: string;
  content?: string;
  keywords?: string | null;
  is_active?: boolean;
}

export const aiFaqApi = {
  getFaqArticles: async (activeOnly: boolean = false) => {
    const { data } = await apiClient.get<AIFaqArticleResponse[]>('/cabinet/admin/ai-faq', {
      params: activeOnly ? { active_only: true } : {},
    });
    return data;
  },

  getFaqArticle: async (id: number) => {
    const { data } = await apiClient.get<AIFaqArticleResponse>(`/cabinet/admin/ai-faq/${id}`);
    return data;
  },

  createFaqArticle: async (payload: AIFaqArticleCreateRequest) => {
    const { data } = await apiClient.post<AIFaqArticleResponse>('/cabinet/admin/ai-faq', payload);
    return data;
  },

  updateFaqArticle: async (id: number, payload: AIFaqArticleUpdateRequest) => {
    const { data } = await apiClient.put<AIFaqArticleResponse>(
      `/cabinet/admin/ai-faq/${id}`,
      payload,
    );
    return data;
  },

  deleteFaqArticle: async (id: number) => {
    const { data } = await apiClient.delete(`/cabinet/admin/ai-faq/${id}`);
    return data;
  },

  // Media management
  getArticleMedia: async (articleId: number) => {
    const { data } = await apiClient.get<AIFaqMediaResponse[]>(
      `/cabinet/admin/ai-faq/${articleId}/media`,
    );
    return data;
  },

  addArticleMedia: async (articleId: number, payload: AIFaqMediaCreateRequest) => {
    const { data } = await apiClient.post<AIFaqMediaResponse>(
      `/cabinet/admin/ai-faq/${articleId}/media`,
      payload,
    );
    return data;
  },

  deleteArticleMedia: async (articleId: number, mediaId: number) => {
    const { data } = await apiClient.delete(`/cabinet/admin/ai-faq/${articleId}/media/${mediaId}`);
    return data;
  },
};
