import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, Save, X, GripVertical } from 'lucide-react';
import {
  aiFaqApi,
  AIFaqArticleResponse,
  AIFaqArticleCreateRequest,
  AIFaqArticleUpdateRequest,
  AIFaqMediaResponse,
} from '../api/aiFaq';
import { mediaApi } from '../api/media';
import { toast } from 'react-hot-toast';
import { AdminBackButton } from '../components/admin';
import { Image, Video, FileText, Upload, Loader2 } from 'lucide-react';
export default function AdminAIFaq() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    content: string;
    keywords: string;
    is_active: boolean;
  }>({
    title: '',
    content: '',
    keywords: '',
    is_active: true,
  });

  const [newMedia, setNewMedia] = useState<{
    media_type: 'photo' | 'video' | 'animation';
    file_id: string;
    tag: string;
    caption: string;
  }>({
    media_type: 'photo',
    file_id: '',
    tag: '',
    caption: '',
  });

  const [isUploading, setIsUploading] = useState(false);

  const { data: faqArticles, isLoading } = useQuery({
    queryKey: ['aiFaqArticles'],
    queryFn: () => aiFaqApi.getFaqArticles(false),
  });

  const createMutation = useMutation({
    mutationFn: (data: AIFaqArticleCreateRequest) => aiFaqApi.createFaqArticle(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiFaqArticles'] });
      setIsCreating(false);
      setFormData({ title: '', content: '', keywords: '', is_active: true });
      toast.success(t('admin.aiFaq.createdSuccess'));
    },
    onError: () => {
      toast.error(t('admin.aiFaq.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AIFaqArticleUpdateRequest }) =>
      aiFaqApi.updateFaqArticle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiFaqArticles'] });
      setEditingId(null);
      setFormData({ title: '', content: '', keywords: '', is_active: true });
      toast.success(t('admin.aiFaq.updatedSuccess'));
    },
    onError: () => {
      toast.error(t('admin.aiFaq.updateError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => aiFaqApi.deleteFaqArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiFaqArticles'] });
      toast.success(t('admin.aiFaq.deletedSuccess'));
    },
    onError: () => {
      toast.error(t('admin.aiFaq.deleteError'));
    },
  });

  const addMediaMutation = useMutation({
    mutationFn: ({ articleId, data }: { articleId: number; data: any }) =>
      aiFaqApi.addArticleMedia(articleId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiFaqArticles'] });
      setNewMedia({ media_type: 'photo', file_id: '', tag: '', caption: '' });
      toast.success(t('admin.aiFaq.media.addSuccess', 'Медиа добавлено'));
    },
    onError: () => {
      toast.error(t('admin.aiFaq.media.addError', 'Ошибка при добавлении медиа'));
    },
  });

  const deleteMediaMutation = useMutation({
    mutationFn: ({ articleId, mediaId }: { articleId: number; mediaId: number }) =>
      aiFaqApi.deleteArticleMedia(articleId, mediaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiFaqArticles'] });
      toast.success(t('admin.aiFaq.media.deleteSuccess', 'Медиа удалено'));
    },
    onError: () => {
      toast.error(t('admin.aiFaq.media.deleteError', 'Ошибка при удалении медиа'));
    },
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const type = file.type.startsWith('image/')
        ? 'photo'
        : file.type.startsWith('video/')
          ? 'video'
          : 'animation';
      const res = await mediaApi.uploadMedia(file, type as any);
      setNewMedia((prev) => ({ ...prev, file_id: res.file_id, media_type: type as any }));
      toast.success(t('admin.aiFaq.media.uploadSuccess', 'Файл загружен в Telegram'));
    } catch (err) {
      toast.error(t('admin.aiFaq.media.uploadError', 'Ошибка загрузки файла'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !newMedia.file_id || !newMedia.tag) return;
    addMediaMutation.mutate({ articleId: editingId, data: newMedia });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    const payload = {
      title: formData.title,
      content: formData.content,
      keywords: formData.keywords.trim() || null,
      is_active: formData.is_active,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const startEdit = (page: AIFaqArticleResponse) => {
    setEditingId(page.id);
    setIsCreating(false);
    setFormData({
      title: page.title,
      content: page.content,
      keywords: page.keywords || '',
      is_active: page.is_active,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ title: '', content: '', keywords: '', is_active: true });
  };

  const handleDelete = (id: number) => {
    if (
      window.confirm(t('admin.aiFaq.deleteConfirm') + '\\n\\n' + t('admin.aiFaq.deleteConfirmText'))
    ) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  const pages = faqArticles || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <AdminBackButton to="/admin/tickets/settings" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin.aiFaq.title')}
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
            {t('admin.aiFaq.subtitle')}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            {t('admin.aiFaq.createPage')}
          </button>
        )}
      </div>

      {(isCreating || editingId) && (
        <div className="card border-indigo-100 ring-1 ring-indigo-500/10 dark:border-indigo-900/30">
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingId ? t('admin.aiFaq.editPage') : t('admin.aiFaq.createPage')}
              </h3>
              <button
                type="button"
                onClick={cancelEdit}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  {t('admin.aiFaq.pageTitle')}
                </label>
                <input
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder={t('admin.aiFaq.pageTitlePlaceholder')}
                  required
                  className="input"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  {t('admin.aiFaq.pageKeywords')}
                </label>
                <input
                  value={formData.keywords}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, keywords: e.target.value })
                  }
                  placeholder={t('admin.aiFaq.pageKeywordsPlaceholder')}
                  className="input"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  {t('admin.aiFaq.pageContent')}
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder={t('admin.aiFaq.pageContentPlaceholder')}
                  required
                  rows={6}
                  className="input w-full resize-y"
                />
              </div>

              <div className="flex items-center gap-3 py-2">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="h-5 w-5 rounded border-dark-700 bg-dark-800 text-accent-500 focus:ring-2 focus:ring-accent-500 focus:ring-offset-0"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                  {t('admin.aiFaq.isActive')}
                </span>
              </div>
            </div>

            {editingId && (
              <div className="mt-8 border-t border-gray-100 pt-6 dark:border-slate-800">
                <h4 className="text-md mb-4 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                  <Image size={20} className="text-indigo-500" />
                  {t('admin.aiFaq.media.title')}
                </h4>

                {/* Existing Media */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {faqArticles
                    ?.find((a) => a.id === editingId)
                    ?.media?.map((m: AIFaqMediaResponse) => (
                      <div
                        key={m.id}
                        className="group relative rounded-xl border border-gray-100 bg-gray-50 p-3 dark:border-slate-800 dark:bg-slate-900/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white dark:bg-slate-800">
                            {m.media_type === 'photo' ? (
                              <Image size={20} />
                            ) : m.media_type === 'video' ? (
                              <Video size={20} />
                            ) : (
                              <FileText size={20} />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-mono text-xs text-indigo-500">#{m.tag}</div>
                            <div className="truncate text-sm font-medium text-gray-900 dark:text-white">
                              {m.caption || t('common.noData')}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              deleteMediaMutation.mutate({ articleId: editingId, mediaId: m.id })
                            }
                            className="p-1 text-gray-400 transition-colors hover:text-red-500"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>

                {/* Add Media Form */}
                <div className="rounded-xl border border-dashed border-gray-200 p-4 dark:border-slate-700">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        {t('admin.aiFaq.media.tag')}
                      </label>
                      <input
                        value={newMedia.tag}
                        onChange={(e) => setNewMedia({ ...newMedia, tag: e.target.value })}
                        placeholder={t('admin.aiFaq.media.tagPlaceholder')}
                        className="input text-sm"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-500">
                        {t('admin.aiFaq.media.caption')}
                      </label>
                      <input
                        value={newMedia.caption}
                        onChange={(e) => setNewMedia({ ...newMedia, caption: e.target.value })}
                        placeholder={t('admin.aiFaq.media.caption')}
                        className="input text-sm"
                      />
                    </div>
                    <div className="flex items-end gap-3 sm:col-span-2">
                      <div className="flex-1">
                        <label className="mb-1 block text-xs font-medium text-gray-500">
                          {t('admin.aiFaq.media.fileId')}
                        </label>
                        <div className="flex gap-2">
                          <input
                            value={newMedia.file_id}
                            onChange={(e) => setNewMedia({ ...newMedia, file_id: e.target.value })}
                            placeholder="AgACAgIAAx..."
                            className="input font-mono text-sm"
                          />
                          <label className="btn btn-secondary flex cursor-pointer items-center gap-2 whitespace-nowrap">
                            {isUploading ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Upload size={18} />
                            )}
                            <span className="text-sm">{t('admin.aiFaq.media.add')}</span>
                            <input
                              type="file"
                              className="hidden"
                              onChange={handleFileUpload}
                              accept="image/*,video/*"
                            />
                          </label>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddMedia}
                        disabled={!newMedia.file_id || !newMedia.tag || addMediaMutation.isPending}
                        className="btn btn-primary h-[38px]"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                {t('admin.aiFaq.cancel')}
              </button>
              <button
                type="submit"
                className="btn btn-primary flex items-center gap-2"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Save size={18} />
                {t('admin.aiFaq.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {!isCreating && !editingId && pages.length === 0 && (
        <div className="card bg-gray-50 p-8 text-center dark:bg-slate-800/50">
          <p className="text-gray-500 dark:text-slate-400">{t('admin.aiFaq.noPages')}</p>
        </div>
      )}

      <div className="grid gap-4">
        {pages.map((page) => (
          <div
            key={page.id}
            className={`card p-5 transition-all ${!page.is_active ? 'opacity-75' : ''}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-1 items-start gap-4">
                <div className="cursor-move rounded-lg bg-gray-100 p-2 text-gray-400 dark:bg-slate-800">
                  <GripVertical size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center gap-3">
                    <h3 className="truncate text-lg font-medium text-gray-900 dark:text-white">
                      {page.title}
                    </h3>
                    <div
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        page.is_active
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {page.is_active
                        ? t('admin.aiFaq.statusEnabled')
                        : t('admin.aiFaq.statusDisabled')}
                    </div>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500 dark:text-slate-400">
                    {page.content}
                  </p>
                  {page.keywords && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {page.keywords.split(',').map((kw: string, i: number) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                        >
                          {kw.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => startEdit(page)}
                  className="rounded-lg border border-gray-100 bg-white p-2 text-gray-400 shadow-sm transition-colors hover:text-indigo-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:text-indigo-400"
                  title={t('admin.aiFaq.editPage')}
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(page.id)}
                  className="rounded-lg border border-gray-100 bg-white p-2 text-gray-400 shadow-sm transition-colors hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:text-red-400"
                  title={t('admin.aiFaq.deletePage')}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
