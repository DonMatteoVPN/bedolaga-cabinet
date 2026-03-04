import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { adminApi } from '../api/admin';
import { AdminBackButton } from '../components/admin';
import { toNumber } from '../utils/inputHelpers';

type NumberOrEmpty = number | '';

const SettingsIcon = () => (
  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z"
    />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function AdminTicketSettings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: settings,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['ticket-settings'],
    queryFn: adminApi.getTicketSettings,
  });

  const [formData, setFormData] = useState<{
    sla_enabled: boolean;
    sla_minutes: NumberOrEmpty;
    sla_check_interval_seconds: NumberOrEmpty;
    sla_reminder_cooldown_minutes: NumberOrEmpty;
    support_system_mode: string;
    cabinet_user_notifications_enabled: boolean;
    cabinet_admin_notifications_enabled: boolean;
  }>({
    sla_enabled: true,
    sla_minutes: 5,
    sla_check_interval_seconds: 60,
    sla_reminder_cooldown_minutes: 15,
    support_system_mode: 'both',
    cabinet_user_notifications_enabled: true,
    cabinet_admin_notifications_enabled: true,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        sla_enabled: settings.sla_enabled,
        sla_minutes: settings.sla_minutes,
        sla_check_interval_seconds: settings.sla_check_interval_seconds,
        sla_reminder_cooldown_minutes: settings.sla_reminder_cooldown_minutes,
        support_system_mode: settings.support_system_mode,
        cabinet_user_notifications_enabled: settings.cabinet_user_notifications_enabled ?? true,
        cabinet_admin_notifications_enabled: settings.cabinet_admin_notifications_enabled ?? true,
      });
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: adminApi.updateTicketSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-settings'] });
      navigate('/admin/tickets');
    },
  });

  // Validation
  const isSlaMinutesValid =
    formData.sla_minutes !== '' && formData.sla_minutes >= 1 && formData.sla_minutes <= 1440;
  const isCheckIntervalValid =
    formData.sla_check_interval_seconds !== '' &&
    formData.sla_check_interval_seconds >= 30 &&
    formData.sla_check_interval_seconds <= 600;
  const isReminderCooldownValid =
    formData.sla_reminder_cooldown_minutes !== '' &&
    formData.sla_reminder_cooldown_minutes >= 1 &&
    formData.sla_reminder_cooldown_minutes <= 120;
  const isValid =
    !formData.sla_enabled || (isSlaMinutesValid && isCheckIntervalValid && isReminderCooldownValid);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    updateMutation.mutate({
      ...formData,
      sla_minutes: toNumber(formData.sla_minutes, 5),
      sla_check_interval_seconds: toNumber(formData.sla_check_interval_seconds, 60),
      sla_reminder_cooldown_minutes: toNumber(formData.sla_reminder_cooldown_minutes, 15),
    });
  };

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
          <AdminBackButton to="/admin/tickets" />
          <h1 className="text-xl font-semibold text-dark-100">{t('admin.tickets.settings')}</h1>
        </div>
        <div className="rounded-xl border border-error-500/30 bg-error-500/10 p-6 text-center">
          <p className="text-error-400">{t('admin.tickets.settingsLoadError')}</p>
          <button
            onClick={() => navigate('/admin/tickets')}
            className="mt-4 text-sm text-dark-400 hover:text-dark-200"
          >
            {t('common.back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <AdminBackButton to="/admin/tickets" />
        <div className="rounded-lg bg-accent-500/20 p-2 text-accent-400">
          <SettingsIcon />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-dark-100">{t('admin.tickets.settings')}</h1>
          <p className="text-sm text-dark-400">{t('admin.tickets.settingsSubtitle')}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Support System Mode */}
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-dark-100">
            {t('admin.tickets.supportMode')}
          </h3>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {/* Tickets */}
            <label
              className={`relative flex cursor-pointer rounded-xl border p-4 transition-all hover:bg-dark-800/50 ${
                formData.support_system_mode === 'tickets'
                  ? 'border-accent-500 bg-accent-500/10 ring-1 ring-accent-500'
                  : 'border-dark-700 bg-dark-800/20'
              }`}
            >
              <input
                type="radio"
                name="support_mode"
                value="tickets"
                className="sr-only"
                checked={formData.support_system_mode === 'tickets'}
                onChange={(e) => setFormData({ ...formData, support_system_mode: e.target.value })}
              />
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${formData.support_system_mode === 'tickets' ? 'text-accent-400' : 'text-dark-200'}`}
                  >
                    🎫 {t('admin.tickets.modeTickets')}
                  </span>
                  {formData.support_system_mode === 'tickets' && (
                    <div className="h-2 w-2 rounded-full bg-accent-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                  )}
                </div>
              </div>
            </label>

            {/* Contact */}
            <label
              className={`relative flex cursor-pointer rounded-xl border p-4 transition-all hover:bg-dark-800/50 ${
                formData.support_system_mode === 'contact'
                  ? 'border-accent-500 bg-accent-500/10 ring-1 ring-accent-500'
                  : 'border-dark-700 bg-dark-800/20'
              }`}
            >
              <input
                type="radio"
                name="support_mode"
                value="contact"
                className="sr-only"
                checked={formData.support_system_mode === 'contact'}
                onChange={(e) => setFormData({ ...formData, support_system_mode: e.target.value })}
              />
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${formData.support_system_mode === 'contact' ? 'text-accent-400' : 'text-dark-200'}`}
                  >
                    💬 {t('admin.tickets.modeContact')}
                  </span>
                  {formData.support_system_mode === 'contact' && (
                    <div className="h-2 w-2 rounded-full bg-accent-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                  )}
                </div>
              </div>
            </label>

            {/* Both */}
            <label
              className={`relative flex cursor-pointer rounded-xl border p-4 transition-all hover:bg-dark-800/50 ${
                formData.support_system_mode === 'both'
                  ? 'border-accent-500 bg-accent-500/10 ring-1 ring-accent-500'
                  : 'border-dark-700 bg-dark-800/20'
              }`}
            >
              <input
                type="radio"
                name="support_mode"
                value="both"
                className="sr-only"
                checked={formData.support_system_mode === 'both'}
                onChange={(e) => setFormData({ ...formData, support_system_mode: e.target.value })}
              />
              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-medium ${formData.support_system_mode === 'both' ? 'text-accent-400' : 'text-dark-200'}`}
                  >
                    🎭 {t('admin.tickets.modeBoth')}
                  </span>
                  {formData.support_system_mode === 'both' && (
                    <div className="h-2 w-2 rounded-full bg-accent-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                  )}
                </div>
              </div>
            </label>

            {/* AI Tiket */}
            <label
              className={`relative flex cursor-pointer rounded-xl border p-4 transition-all hover:bg-emerald-900/30 ${
                formData.support_system_mode === 'ai_tiket'
                  ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                  : 'border-dark-700 bg-dark-800/20'
              }`}
            >
              <input
                type="radio"
                name="support_mode"
                value="ai_tiket"
                className="sr-only"
                checked={formData.support_system_mode === 'ai_tiket'}
                onChange={(e) => setFormData({ ...formData, support_system_mode: e.target.value })}
              />
              <div className="relative flex w-full flex-col gap-1 overflow-hidden">
                <div className="relative z-10 flex items-center justify-between">
                  <span
                    className={`flex items-center gap-2 text-sm font-semibold ${formData.support_system_mode === 'ai_tiket' ? 'text-emerald-400' : 'text-dark-200'}`}
                  >
                    🤖 {t('admin.tickets.modeAiTiket', 'DonMatteo-AI-Tiket')}
                  </span>
                  {formData.support_system_mode === 'ai_tiket' && (
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
                  )}
                </div>
                {formData.support_system_mode === 'ai_tiket' && (
                  <div className="pointer-events-none absolute -bottom-6 -right-4 text-emerald-500/10">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v2h2a2 2 0 0 1 2 2v2h-2v4a2 2 0 0 1-2 2h-2v2a2 2 0 0 1-2 2h-4a2 2 0 0 1-2-2v-2H6a2 2 0 0 1-2-2v-4H2v-2a2 2 0 0 1 2-2V8a2 2 0 0 1 2-2h2V4a2 2 0 0 1 2-2h4zm0 2h-4v2H6v4H4v2h2v4h2v2h4v-2h2v-4h2v-2h-2V8h-2V6h-2V4z" />
                    </svg>
                  </div>
                )}
              </div>
            </label>
          </div>

          <p className="mt-4 text-sm text-dark-500">{t('admin.tickets.supportModeDesc')}</p>

          {formData.support_system_mode === 'ai_tiket' && (
            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 sm:flex-row">
              <Link
                to="/admin/ai-providers"
                className="flex flex-1 items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
              >
                <span className="text-xl">⚙️</span>
                <div className="flex flex-col">
                  <span>{t('admin.tickets.configureAiProviders', 'Провайдеры ИИ / Промпт')}</span>
                  <span className="mt-0.5 text-xs font-normal text-emerald-500/70">
                    API ключи и модель поведения
                  </span>
                </div>
                <svg
                  className="ml-auto h-5 w-5 opacity-50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>

              <Link
                to="/admin/ai-faq"
                className="flex flex-1 items-center gap-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20"
              >
                <span className="text-xl">📚</span>
                <div className="flex flex-col">
                  <span>{t('admin.tickets.configureAiFaq', 'База знаний FAQ')}</span>
                  <span className="mt-0.5 text-xs font-normal text-emerald-500/70">
                    Статьи и инструкции для ИИ
                  </span>
                </div>
                <svg
                  className="ml-auto h-5 w-5 opacity-50"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          )}
        </div>

        {/* Cabinet Notifications */}
        <div className="card">
          <h3 className="mb-4 text-lg font-semibold text-dark-100">
            {t('admin.tickets.cabinetNotifications')}
          </h3>

          {/* User Notifications */}
          <div className="mb-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={formData.cabinet_user_notifications_enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cabinet_user_notifications_enabled: e.target.checked,
                  })
                }
                className="h-5 w-5 rounded border-dark-700 bg-dark-800 text-accent-500 focus:ring-2 focus:ring-accent-500 focus:ring-offset-0"
              />
              <div>
                <div className="font-medium text-dark-100">
                  {t('admin.tickets.userNotificationsEnabled')}
                </div>
                <div className="text-sm text-dark-500">
                  {t('admin.tickets.userNotificationsEnabledDesc')}
                </div>
              </div>
            </label>
          </div>

          {/* Admin Notifications */}
          <div>
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={formData.cabinet_admin_notifications_enabled}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cabinet_admin_notifications_enabled: e.target.checked,
                  })
                }
                className="h-5 w-5 rounded border-dark-700 bg-dark-800 text-accent-500 focus:ring-2 focus:ring-accent-500 focus:ring-offset-0"
              />
              <div>
                <div className="font-medium text-dark-100">
                  {t('admin.tickets.adminNotificationsEnabled')}
                </div>
                <div className="text-sm text-dark-500">
                  {t('admin.tickets.adminNotificationsEnabledDesc')}
                </div>
              </div>
            </label>
          </div>
        </div>

        {/* SLA Settings — hidden in ai_tiket mode */}
        {formData.support_system_mode !== 'ai_tiket' && (
          <div className="card">
            <h3 className="mb-4 text-lg font-semibold text-dark-100">
              {t('admin.tickets.slaSettings')}
            </h3>

            {/* SLA Enabled */}
            <div className="mb-6">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={formData.sla_enabled}
                  onChange={(e) => setFormData({ ...formData, sla_enabled: e.target.checked })}
                  className="h-5 w-5 rounded border-dark-700 bg-dark-800 text-accent-500 focus:ring-2 focus:ring-accent-500 focus:ring-offset-0"
                />
                <div>
                  <div className="font-medium text-dark-100">{t('admin.tickets.slaEnabled')}</div>
                  <div className="text-sm text-dark-500">{t('admin.tickets.slaEnabledDesc')}</div>
                </div>
              </label>
            </div>

            {/* SLA Minutes */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-dark-300">
                {t('admin.tickets.slaMinutes')}
              </label>
              <input
                type="number"
                min={1}
                max={1440}
                value={formData.sla_minutes}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '') return setFormData({ ...formData, sla_minutes: '' });
                  const num = parseInt(val);
                  if (!isNaN(num)) setFormData({ ...formData, sla_minutes: num });
                }}
                className={`input ${formData.sla_enabled && !isSlaMinutesValid && formData.sla_minutes !== '' ? 'border-error-500/50' : ''}`}
                disabled={!formData.sla_enabled}
              />
              {formData.sla_enabled && formData.sla_minutes !== '' && !isSlaMinutesValid && (
                <p className="mt-1 text-xs text-error-400">
                  {t('admin.tickets.validation.slaMinutesRange')}
                </p>
              )}
              <p className="mt-1 text-xs text-dark-500">{t('admin.tickets.slaMinutesDesc')}</p>
            </div>

            {/* Check Interval */}
            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-dark-300">
                {t('admin.tickets.checkInterval')}
              </label>
              <input
                type="number"
                min={30}
                max={600}
                value={formData.sla_check_interval_seconds}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '')
                    return setFormData({ ...formData, sla_check_interval_seconds: '' });
                  const num = parseInt(val);
                  if (!isNaN(num)) setFormData({ ...formData, sla_check_interval_seconds: num });
                }}
                className={`input ${formData.sla_enabled && !isCheckIntervalValid && formData.sla_check_interval_seconds !== '' ? 'border-error-500/50' : ''}`}
                disabled={!formData.sla_enabled}
              />
              {formData.sla_enabled &&
                formData.sla_check_interval_seconds !== '' &&
                !isCheckIntervalValid && (
                  <p className="mt-1 text-xs text-error-400">
                    {t('admin.tickets.validation.checkIntervalRange')}
                  </p>
                )}
              <p className="mt-1 text-xs text-dark-500">{t('admin.tickets.checkIntervalDesc')}</p>
            </div>

            {/* Reminder Cooldown */}
            <div>
              <label className="mb-2 block text-sm font-medium text-dark-300">
                {t('admin.tickets.reminderCooldown')}
              </label>
              <input
                type="number"
                min={1}
                max={120}
                value={formData.sla_reminder_cooldown_minutes}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '')
                    return setFormData({ ...formData, sla_reminder_cooldown_minutes: '' });
                  const num = parseInt(val);
                  if (!isNaN(num)) setFormData({ ...formData, sla_reminder_cooldown_minutes: num });
                }}
                className={`input ${formData.sla_enabled && !isReminderCooldownValid && formData.sla_reminder_cooldown_minutes !== '' ? 'border-error-500/50' : ''}`}
                disabled={!formData.sla_enabled}
              />
              {formData.sla_enabled &&
                formData.sla_reminder_cooldown_minutes !== '' &&
                !isReminderCooldownValid && (
                  <p className="mt-1 text-xs text-error-400">
                    {t('admin.tickets.validation.reminderCooldownRange')}
                  </p>
                )}
              <p className="mt-1 text-xs text-dark-500">
                {t('admin.tickets.reminderCooldownDesc')}
              </p>
            </div>
          </div>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/admin/tickets')}
            className="btn-secondary"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            disabled={!isValid || updateMutation.isPending}
            className="btn-primary"
          >
            {updateMutation.isPending ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                {t('common.saving')}
              </span>
            ) : (
              t('common.save')
            )}
          </button>
        </div>

        {updateMutation.isError && (
          <div className="rounded-lg border border-error-500/30 bg-error-500/10 p-3 text-sm text-error-400">
            {t('admin.tickets.settingsUpdateError')}
          </div>
        )}
      </form>
    </div>
  );
}
