import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { AdminBackButton } from '../components/admin';
import { aiProvidersApi, type AIProvider, type AIPrompt, type AIProviderTestResult } from '../api/aiProviders';

// ─── Provider color/icon map ───

const PROVIDER_META: Record<string, { emoji: string; color: string }> = {
    groq: { emoji: '🟢', color: 'emerald' },
    openai: { emoji: '🔵', color: 'blue' },
    anthropic: { emoji: '🟠', color: 'orange' },
    google: { emoji: '🔴', color: 'red' },
    openrouter: { emoji: '🟣', color: 'purple' },
};

function ProviderIcon({ name }: { name: string }) {
    const meta = PROVIDER_META[name] || { emoji: '⚪', color: 'gray' };
    return <span className="text-lg">{meta.emoji}</span>;
}

// ─── Provider Card ───

function ProviderCard({
    provider,
    isExpanded,
    onToggleExpand,
}: {
    provider: AIProvider;
    isExpanded: boolean;
    onToggleExpand: () => void;
}) {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [newKey, setNewKey] = useState('');
    const [testResult, setTestResult] = useState<AIProviderTestResult | null>(null);
    const [selectedModel, setSelectedModel] = useState<string | null>(null);
    const [isTesting, setIsTesting] = useState(false);

    const toggleMutation = useMutation({
        mutationFn: (enabled: boolean) => aiProvidersApi.toggleProvider(provider.name, enabled),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-providers'] }),
    });

    const addKeyMutation = useMutation({
        mutationFn: (apiKey: string) => aiProvidersApi.addKey(provider.name, apiKey),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
            setNewKey('');
        },
    });

    const removeKeyMutation = useMutation({
        mutationFn: (keyIndex: number) => aiProvidersApi.removeKey(provider.name, keyIndex),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-providers'] }),
    });

    const setModelMutation = useMutation({
        mutationFn: (model: string) => aiProvidersApi.setModel(provider.name, model),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-providers'] }),
    });

    const priorityMutation = useMutation({
        mutationFn: (priority: number) => aiProvidersApi.setPriority(provider.name, priority),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ai-providers'] }),
    });

    const handleTest = async () => {
        setIsTesting(true);
        setTestResult(null);
        try {
            const result = await aiProvidersApi.testConnection(provider.name);
            setTestResult(result);
        } catch {
            setTestResult({ ok: false, models: [], count: 0, error: 'Connection failed' });
        } finally {
            setIsTesting(false);
        }
    };

    const handleAddKey = (e: React.FormEvent) => {
        e.preventDefault();
        if (newKey.trim()) {
            addKeyMutation.mutate(newKey.trim());
        }
    };

    const handleModelSelect = (model: string) => {
        setSelectedModel(model);
        setModelMutation.mutate(model);
    };

    return (
        <div className="card overflow-hidden">
            {/* Header — always visible */}
            <button
                onClick={onToggleExpand}
                className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-dark-800/50"
            >
                <div className="flex items-center gap-3">
                    <ProviderIcon name={provider.name} />
                    <div>
                        <div className="font-semibold uppercase text-dark-100">{provider.name}</div>
                        <div className="text-xs text-dark-500">
                            {provider.keys_count} 🔑 · {t('admin.aiProviders.priority')}: {provider.priority}
                            {provider.selected_model && ` · ${provider.selected_model}`}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <span
                        className={`inline-flex h-2.5 w-2.5 rounded-full ${provider.enabled ? 'bg-emerald-400' : 'bg-dark-600'}`}
                    />
                    <svg
                        className={`h-4 w-4 text-dark-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Expanded panel */}
            {isExpanded && (
                <div className="space-y-4 border-t border-dark-800 p-4">
                    {/* Toggle */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-dark-300">{t('admin.aiProviders.enableProvider')}</span>
                        <button
                            onClick={() => toggleMutation.mutate(!provider.enabled)}
                            disabled={toggleMutation.isPending}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${provider.enabled ? 'bg-emerald-500' : 'bg-dark-700'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${provider.enabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {/* Priority */}
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-dark-300">{t('admin.aiProviders.priority')}</span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => priorityMutation.mutate(Math.max(0, provider.priority - 1))}
                                disabled={provider.priority <= 0 || priorityMutation.isPending}
                                className="rounded bg-dark-800 px-2 py-1 text-xs text-dark-300 hover:bg-dark-700 disabled:opacity-40"
                            >
                                ⬆️
                            </button>
                            <span className="w-6 text-center text-sm font-medium text-dark-200">
                                {provider.priority}
                            </span>
                            <button
                                onClick={() => priorityMutation.mutate(provider.priority + 1)}
                                disabled={priorityMutation.isPending}
                                className="rounded bg-dark-800 px-2 py-1 text-xs text-dark-300 hover:bg-dark-700 disabled:opacity-40"
                            >
                                ⬇️
                            </button>
                        </div>
                    </div>

                    {/* API Keys */}
                    <div>
                        <h4 className="mb-2 text-sm font-medium text-dark-300">
                            {t('admin.aiProviders.apiKeys')} ({provider.keys_count})
                        </h4>
                        {provider.keys.length > 0 && (
                            <div className="mb-2 space-y-1">
                                {provider.keys.map((key) => (
                                    <div
                                        key={key.index}
                                        className="flex items-center justify-between rounded-lg bg-dark-900/50 px-3 py-2"
                                    >
                                        <span className="font-mono text-xs text-dark-400">
                                            {key.is_active && '✅ '}
                                            {key.masked}
                                        </span>
                                        <button
                                            onClick={() => removeKeyMutation.mutate(key.index)}
                                            disabled={removeKeyMutation.isPending}
                                            className="text-xs text-error-400 hover:text-error-300"
                                        >
                                            🗑
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        <form onSubmit={handleAddKey} className="flex gap-2">
                            <input
                                type="password"
                                value={newKey}
                                onChange={(e) => setNewKey(e.target.value)}
                                placeholder={t('admin.aiProviders.keyPlaceholder')}
                                className="input flex-1 text-xs"
                            />
                            <button
                                type="submit"
                                disabled={!newKey.trim() || addKeyMutation.isPending}
                                className="btn btn-primary whitespace-nowrap text-xs"
                            >
                                ➕ {t('admin.aiProviders.addKey')}
                            </button>
                        </form>
                    </div>

                    {/* Test & Models */}
                    <div>
                        <button
                            onClick={handleTest}
                            disabled={isTesting || provider.keys_count === 0}
                            className="btn btn-secondary w-full text-sm"
                        >
                            {isTesting ? '⏳ ...' : `🔍 ${t('admin.aiProviders.testConnection')}`}
                        </button>

                        {testResult && (
                            <div
                                className={`mt-2 rounded-lg p-3 text-sm ${testResult.ok
                                        ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                                        : 'border border-error-500/30 bg-error-500/10 text-error-400'
                                    }`}
                            >
                                {testResult.ok
                                    ? `✅ ${t('admin.aiProviders.connectionOk')} · ${testResult.count} ${t('admin.aiProviders.modelsFound')}`
                                    : `❌ ${testResult.error}`}
                            </div>
                        )}

                        {/* Model selector */}
                        {(testResult?.models?.length || provider.available_models.length > 0) && (
                            <div className="mt-3">
                                <h4 className="mb-2 text-sm font-medium text-dark-300">
                                    {t('admin.aiProviders.selectModel')}
                                </h4>
                                <div className="max-h-40 space-y-1 overflow-y-auto">
                                    {(testResult?.models || provider.available_models).map((model) => (
                                        <button
                                            key={model}
                                            onClick={() => handleModelSelect(model)}
                                            className={`w-full rounded-lg px-3 py-1.5 text-left text-xs transition-colors ${(selectedModel || provider.selected_model) === model
                                                    ? 'bg-accent-500/20 text-accent-400'
                                                    : 'bg-dark-900/50 text-dark-400 hover:bg-dark-800'
                                                }`}
                                        >
                                            {model}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Prompt Editor ───

function PromptEditor() {
    const { t } = useTranslation();
    const queryClient = useQueryClient();
    const [editedPrompt, setEditedPrompt] = useState<string | null>(null);

    const { data: prompt, isLoading } = useQuery<AIPrompt>({
        queryKey: ['ai-prompt'],
        queryFn: aiProvidersApi.getPrompt,
    });

    const updateMutation = useMutation({
        mutationFn: (text: string) => aiProvidersApi.updatePrompt(text),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-prompt'] });
            setEditedPrompt(null);
        },
    });

    const resetMutation = useMutation({
        mutationFn: () => aiProvidersApi.resetPrompt(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['ai-prompt'] });
            setEditedPrompt(null);
        },
    });

    if (isLoading) {
        return (
            <div className="card p-4">
                <div className="h-6 w-40 animate-pulse rounded bg-dark-800" />
            </div>
        );
    }

    const currentText = editedPrompt ?? prompt?.prompt ?? '';
    const isEdited = editedPrompt !== null && editedPrompt !== prompt?.prompt;

    return (
        <div className="card p-4">
            <div className="mb-3 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-dark-100">
                    📝 {t('admin.aiProviders.systemPrompt')}
                </h3>
                {prompt?.is_custom && (
                    <span className="rounded-full bg-accent-500/20 px-2 py-0.5 text-xs text-accent-400">
                        {t('admin.aiProviders.customPrompt')}
                    </span>
                )}
            </div>

            <textarea
                value={currentText}
                onChange={(e) => setEditedPrompt(e.target.value)}
                rows={8}
                className="input w-full resize-y font-mono text-xs"
            />

            <div className="mt-3 flex gap-2">
                <button
                    onClick={() => updateMutation.mutate(currentText)}
                    disabled={!isEdited || updateMutation.isPending}
                    className="btn btn-primary text-sm"
                >
                    {updateMutation.isPending ? '⏳' : '💾'} {t('common.save')}
                </button>
                <button
                    onClick={() => resetMutation.mutate()}
                    disabled={resetMutation.isPending || !prompt?.is_custom}
                    className="btn btn-secondary text-sm"
                >
                    🔄 {t('admin.aiProviders.resetPrompt')}
                </button>
            </div>
        </div>
    );
}

// ─── Main Page ───

export default function AdminAIProviders() {
    const { t } = useTranslation();
    const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

    const {
        data: providers,
        isLoading,
        error,
    } = useQuery<AIProvider[]>({
        queryKey: ['ai-providers'],
        queryFn: aiProvidersApi.getProviders,
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent-500 border-t-transparent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="animate-fade-in">
                <div className="mb-6 flex items-center gap-3">
                    <AdminBackButton to="/admin/tickets/settings" />
                    <h1 className="text-xl font-semibold text-dark-100">
                        {t('admin.aiProviders.title')}
                    </h1>
                </div>
                <div className="rounded-xl border border-error-500/30 bg-error-500/10 p-6 text-center">
                    <p className="text-error-400">{t('admin.aiProviders.loadError')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            {/* Header */}
            <div className="mb-6 flex items-center gap-3">
                <AdminBackButton to="/admin/tickets/settings" />
                <div className="rounded-lg bg-accent-500/20 p-2 text-accent-400">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                    </svg>
                </div>
                <div>
                    <h1 className="text-xl font-semibold text-dark-100">{t('admin.aiProviders.title')}</h1>
                    <p className="text-sm text-dark-400">{t('admin.aiProviders.subtitle')}</p>
                </div>
            </div>

            {/* Provider Cards */}
            <div className="mb-6 space-y-3">
                {providers?.map((provider) => (
                    <ProviderCard
                        key={provider.name}
                        provider={provider}
                        isExpanded={expandedProvider === provider.name}
                        onToggleExpand={() =>
                            setExpandedProvider((prev) => (prev === provider.name ? null : provider.name))
                        }
                    />
                ))}
            </div>

            {/* Prompt Editor */}
            <PromptEditor />
        </div>
    );
}
