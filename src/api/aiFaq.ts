import { apiClient } from './client';

export interface AIFaqArticleResponse {
    id: number;
    title: string;
    content: string;
    keywords: string | null;
    is_active: boolean;
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
        const { data } = await apiClient.get<AIFaqArticleResponse[]>('/ai-faq', {
            params: activeOnly ? { active_only: true } : {},
        });
        return data;
    },

    getFaqArticle: async (id: number) => {
        const { data } = await apiClient.get<AIFaqArticleResponse>(`/ai-faq/${id}`);
        return data;
    },

    createFaqArticle: async (payload: AIFaqArticleCreateRequest) => {
        const { data } = await apiClient.post<AIFaqArticleResponse>('/ai-faq', payload);
        return data;
    },

    updateFaqArticle: async (id: number, payload: AIFaqArticleUpdateRequest) => {
        const { data } = await apiClient.put<AIFaqArticleResponse>(`/ai-faq/${id}`, payload);
        return data;
    },

    deleteFaqArticle: async (id: number) => {
        const { data } = await apiClient.delete(`/ai-faq/${id}`);
        return data;
    },
};
