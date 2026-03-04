import { apiClient } from './client';

export interface MediaUploadResponse {
  media_type: string;
  file_id: string;
  file_unique_id?: string;
  media_url: string;
}

export const mediaApi = {
  uploadMedia: async (file: File, mediaType: 'photo' | 'video' | 'document' = 'photo') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('media_type', mediaType);

    const { data } = await apiClient.post<MediaUploadResponse>('/cabinet/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  getMediaUrl: (fileId: string) => {
    return `${apiClient.defaults.baseURL}/cabinet/media/${fileId}`;
  },
};
