import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Plus,
    Trash2,
    Edit2,
    Save,
    X,
    GripVertical
} from 'lucide-react';
import { aiFaqApi, AIFaqArticleResponse, AIFaqArticleCreateRequest, AIFaqArticleUpdateRequest } from '../api/aiFaq';
import { Card } from '../components/base/Card';
import { Button } from '../components/base/Button';
import { Input } from '../components/base/Input';
import { Switch } from '../components/base/Switch';
import { toast } from 'react-hot-toast';

export const AdminAIFaq: React.FC = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [editingId, setEditingId] = useState<number | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState<{ title: string; content: string; keywords: string; is_active: boolean }>({
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
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const pages = faqArticles || [];

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {t('aiFaq.title')}
                    </h1>
                    <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                        {t('aiFaq.subtitle')}
                    </p>
                </div>
            </div>

            <div className="flex justify-end">
                {!isCreating && !editingId && (
                    <Button onClick={() => setIsCreating(true)} className="flex items-center gap-2">
                        <Plus size={18} />
                        {t('aiFaq.createPage')}
                    </Button>
                )}
            </div>

            {(isCreating || editingId) && (
                <Card className="border-indigo-100 dark:border-indigo-900/30 ring-1 ring-indigo-500/10">
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div className="flex justify-between items-center mb-4">
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
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    {t('aiFaq.pageTitle')}
                                </label>
                                <Input
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder={t('aiFaq.pageTitlePlaceholder')}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    {t('aiFaq.pageKeywords')}
                                </label>
                                <Input
                                    value={formData.keywords}
                                    onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                                    placeholder={t('aiFaq.pageKeywordsPlaceholder')}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                    {t('aiFaq.pageContent')}
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    placeholder={t('aiFaq.pageContentPlaceholder')}
                                    required
                                    rows={6}
                                    className="w-full rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                            </div>

                            <div className="flex items-center gap-3 py-2">
                                <Switch
                                    checked={formData.is_active}
                                    onChange={(checked) => setFormData({ ...formData, is_active: checked })}
                                />
                                <span className="text-sm font-medium text-gray-700 dark:text-slate-300">
                                    {t('aiFaq.isActive')}
                                </span>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <Button type="button" variant="secondary" onClick={cancelEdit}>
                                {t('aiFaq.cancel')}
                            </Button>
                            <Button
                                type="submit"
                                className="flex items-center gap-2"
                                disabled={createMutation.isPending || updateMutation.isPending}
                            >
                                <Save size={18} />
                                {t('aiFaq.save')}
                            </Button>
                        </div>
                    </form>
                </Card>
            )}

            {!isCreating && !editingId && pages.length === 0 && (
                <Card className="p-8 text-center bg-gray-50 dark:bg-slate-800/50">
                    <p className="text-gray-500 dark:text-slate-400">{t('aiFaq.noPages')}</p>
                </Card>
            )}

            <div className="grid gap-4">
                {pages.map((page) => (
                    <Card key={page.id} className={`p-5 transition-all ${!page.is_active ? 'opacity-75' : ''}`}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="flex items-start gap-4 flex-1">
                                <div className="p-2 bg-gray-100 dark:bg-slate-800 rounded-lg text-gray-400 cursor-move">
                                    <GripVertical size={20} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                                            {page.title}
                                        </h3>
                                        <div className={`px-2 py-0.5 rounded text-xs font-medium ${page.is_active
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400'
                                            }`}>
                                            {page.is_active ? t('aiFaq.statusEnabled') : t('aiFaq.statusDisabled')}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-slate-400 line-clamp-2 mt-1">
                                        {page.content}
                                    </p>
                                    {page.keywords && (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {page.keywords.split(',').map((kw: string, i: number) => (
                                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
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
                                    className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700"
                                    title={t('aiFaq.editPage')}
                                >
                                    <Edit2 size={18} />
                                </button>
                                <button
                                    onClick={() => handleDelete(page.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700"
                                    title={t('aiFaq.deletePage')}
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
};
