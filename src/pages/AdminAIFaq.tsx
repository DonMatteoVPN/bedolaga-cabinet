import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Edit2, Save, X, GripVertical } from 'lucide-react';
import {
  aiFaqApi,
  AIFaqArticleResponse,
  AIFaqArticleCreateRequest,
  AIFaqArticleUpdateRequest,
} from '../api/aiFaq';
import { toast } from 'react-hot-toast';
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
      toast.success(t('aiFaq.createdSuccess'));
    },
    onError: () => {
      toast.error(t('aiFaq.createError'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: AIFaqArticleUpdateRequest }) =>
      aiFaqApi.updateFaqArticle(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiFaqArticles'] });
      setEditingId(null);
      setFormData({ title: '', content: '', keywords: '', is_active: true });
      toast.success(t('aiFaq.updatedSuccess'));
    },
    onError: () => {
      toast.error(t('aiFaq.updateError'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => aiFaqApi.deleteFaqArticle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aiFaqArticles'] });
      toast.success(t('aiFaq.deletedSuccess'));
    },
    onError: () => {
      toast.error(t('aiFaq.deleteError'));
    },
  });

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
    if (window.confirm(t('aiFaq.deleteConfirm') + '\\n\\n' + t('aiFaq.deleteConfirmText'))) {
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('aiFaq.title')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{t('aiFaq.subtitle')}</p>
        </div>
      </div>

      <div className="flex justify-end">
        {!isCreating && !editingId && (
          <button
            onClick={() => setIsCreating(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            {t('aiFaq.createPage')}
          </button>
        )}
      </div>

      {(isCreating || editingId) && (
        <div className="card border-indigo-100 ring-1 ring-indigo-500/10 dark:border-indigo-900/30">
          <form onSubmit={handleSubmit} className="space-y-4 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {editingId ? t('aiFaq.editPage') : t('aiFaq.createPage')}
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
                  {t('aiFaq.pageTitle')}
                </label>
                <input
                  value={formData.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder={t('aiFaq.pageTitlePlaceholder')}
                  required
                  className="input"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  {t('aiFaq.pageKeywords')}
                </label>
                <input
                  value={formData.keywords}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setFormData({ ...formData, keywords: e.target.value })
                  }
                  placeholder={t('aiFaq.pageKeywordsPlaceholder')}
                  className="input"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                  {t('aiFaq.pageContent')}
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  placeholder={t('aiFaq.pageContentPlaceholder')}
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
                  {t('aiFaq.isActive')}
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                {t('aiFaq.cancel')}
              </button>
              <button
                type="submit"
                className="btn btn-primary flex items-center gap-2"
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                <Save size={18} />
                {t('aiFaq.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {!isCreating && !editingId && pages.length === 0 && (
        <div className="card bg-gray-50 p-8 text-center dark:bg-slate-800/50">
          <p className="text-gray-500 dark:text-slate-400">{t('aiFaq.noPages')}</p>
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
                      {page.is_active ? t('aiFaq.statusEnabled') : t('aiFaq.statusDisabled')}
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
                  title={t('aiFaq.editPage')}
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDelete(page.id)}
                  className="rounded-lg border border-gray-100 bg-white p-2 text-gray-400 shadow-sm transition-colors hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:hover:text-red-400"
                  title={t('aiFaq.deletePage')}
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
