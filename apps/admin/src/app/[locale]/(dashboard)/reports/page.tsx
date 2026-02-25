'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef } from 'react';
import {
  useActiveSessions,
  useSessionHistory,
  useAuthLogs,
  useDisconnectSession,
} from '@/lib/api/hooks';
import { toast } from 'sonner';
import { Wifi, History, ShieldCheck, Power, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

type Tab = 'active' | 'history' | 'authLogs';

interface Session {
  radacctId: string;
  username: string;
  nasIpAddress: string;
  acctStartTime: string;
  acctStopTime?: string;
  acctInputOctets: number;
  acctOutputOctets: number;
  framedIpAddress: string;
  callingStationId: string;
  acctSessionId: string;
  acctTerminateCause?: string;
}

interface AuthLog {
  id: string;
  username: string;
  pass: string;
  reply: string;
  authdate: string;
  nasIpAddress: string;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

function formatDuration(startTime: string, endTime?: string): string {
  const start = new Date(startTime).getTime();
  const end = endTime ? new Date(endTime).getTime() : Date.now();
  const diff = Math.floor((end - start) / 1000);

  if (diff < 0) return '-';

  const hours = Math.floor(diff / 3600);
  const minutes = Math.floor((diff % 3600) / 60);
  const seconds = diff % 60;

  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString();
}

export default function ReportsPage() {
  const t = useTranslations('reports');
  const tc = useTranslations('common');

  const [activeTab, setActiveTab] = useState<Tab>('active');

  // Active sessions state
  const [activePage, setActivePage] = useState(1);

  // Session history state
  const [historyPage, setHistoryPage] = useState(1);
  const [historyUsername, setHistoryUsername] = useState('');
  const [debouncedHistoryUsername, setDebouncedHistoryUsername] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Auth logs state
  const [authPage, setAuthPage] = useState(1);
  const [authUsername, setAuthUsername] = useState('');
  const [debouncedAuthUsername, setDebouncedAuthUsername] = useState('');

  const limit = 20;

  // Debounce refs
  const historyDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const authDebounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
    historyDebounceRef.current = setTimeout(() => {
      setDebouncedHistoryUsername(historyUsername);
      setHistoryPage(1);
    }, 300);
    return () => {
      if (historyDebounceRef.current) clearTimeout(historyDebounceRef.current);
    };
  }, [historyUsername]);

  useEffect(() => {
    if (authDebounceRef.current) clearTimeout(authDebounceRef.current);
    authDebounceRef.current = setTimeout(() => {
      setDebouncedAuthUsername(authUsername);
      setAuthPage(1);
    }, 300);
    return () => {
      if (authDebounceRef.current) clearTimeout(authDebounceRef.current);
    };
  }, [authUsername]);

  // Queries
  const { data: activeData, isLoading: activeLoading } = useActiveSessions(activePage, limit);
  const { data: historyData, isLoading: historyLoading } = useSessionHistory(
    historyPage,
    limit,
    debouncedHistoryUsername || undefined,
    startDate || undefined,
    endDate || undefined,
  );
  const { data: authData, isLoading: authLoading } = useAuthLogs(
    authPage,
    limit,
    debouncedAuthUsername || undefined,
  );

  const disconnectSession = useDisconnectSession();

  const activeSessions: Session[] = activeData?.data ?? [];
  const activeTotalPages: number = activeData?.totalPages ?? 1;

  const historySessions: Session[] = historyData?.data ?? [];
  const historyTotalPages: number = historyData?.totalPages ?? 1;

  const authLogs: AuthLog[] = authData?.data ?? [];
  const authTotalPages: number = authData?.totalPages ?? 1;

  const handleDisconnect = async (sessionId: string) => {
    try {
      await disconnectSession.mutateAsync(sessionId);
      toast.success(t('disconnect') + ' - OK');
    } catch {
      toast.error(t('disconnect') + ' - Error');
    }
  };

  const downloadCsv = async (url: string, filename: string, params?: Record<string, string | undefined>) => {
    try {
      const response = await apiClient.get(url, { params, responseType: 'blob' });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      toast.success('CSV indirildi');
    } catch {
      toast.error('Export başarısız');
    }
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'active', label: t('activeSessions'), icon: <Wifi className="w-4 h-4" /> },
    { key: 'history', label: t('sessionHistory'), icon: <History className="w-4 h-4" /> },
    { key: 'authLogs', label: t('authLogs'), icon: <ShieldCheck className="w-4 h-4" /> },
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">{t('title')}</h1>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 border-b">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Active Sessions Tab */}
      {activeTab === 'active' && (
        <div>
          <div className="flex items-center justify-end mb-4">
            <button
              onClick={() => downloadCsv('/v1/radius/sessions/active/export', 'active-sessions.csv')}
              className="border px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-muted inline-flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
          </div>
        <div className="bg-card border rounded-xl overflow-hidden">
          {activeLoading ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {tc('loading')}
            </div>
          ) : activeSessions.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
              <Wifi className="w-8 h-8" />
              {tc('noData')}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left px-4 py-3 font-medium">{t('username')}</th>
                    <th className="text-left px-4 py-3 font-medium">{t('ipAddress')}</th>
                    <th className="text-left px-4 py-3 font-medium">{t('mac')}</th>
                    <th className="text-left px-4 py-3 font-medium">{t('startTime')}</th>
                    <th className="text-left px-4 py-3 font-medium">{t('duration')}</th>
                    <th className="text-left px-4 py-3 font-medium">{t('dataIn')}</th>
                    <th className="text-left px-4 py-3 font-medium">{t('dataOut')}</th>
                    <th className="text-left px-4 py-3 font-medium">{t('nasIp')}</th>
                    <th className="text-left px-4 py-3 font-medium">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {activeSessions.map((session) => (
                    <tr key={session.radacctId} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{session.username}</td>
                      <td className="px-4 py-3 text-muted-foreground">{session.framedIpAddress || '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{session.callingStationId || '-'}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(session.acctStartTime)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDuration(session.acctStartTime)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatBytes(session.acctInputOctets)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatBytes(session.acctOutputOctets)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{session.nasIpAddress || '-'}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleDisconnect(session.acctSessionId)}
                          disabled={disconnectSession.isPending}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-600 transition-colors disabled:opacity-50"
                          title={t('disconnect')}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {activeTotalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <span className="text-sm text-muted-foreground">
                {activePage} / {activeTotalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActivePage((p) => Math.max(1, p - 1))}
                  disabled={activePage <= 1}
                  className="border px-3 py-2 rounded-lg text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {tc('back')}
                </button>
                <button
                  onClick={() => setActivePage((p) => Math.min(activeTotalPages, p + 1))}
                  disabled={activePage >= activeTotalPages}
                  className="border px-3 py-2 rounded-lg text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                >
                  {tc('next')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
        </div>
      )}

      {/* Session History Tab */}
      {activeTab === 'history' && (
        <div>
          {/* Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <input
              type="text"
              value={historyUsername}
              onChange={(e) => setHistoryUsername(e.target.value)}
              placeholder={t('filterByUsername')}
              className="border rounded-lg px-3 py-2 text-sm bg-background w-64"
            />
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">{t('startDate')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setHistoryPage(1);
                }}
                className="border rounded-lg px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">{t('endDate')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setHistoryPage(1);
                }}
                className="border rounded-lg px-3 py-2 text-sm bg-background"
              />
            </div>
            <div className="ml-auto">
              <button
                onClick={() => downloadCsv('/v1/radius/sessions/history/export', 'session-history.csv', {
                  username: debouncedHistoryUsername || undefined,
                  startDate: startDate || undefined,
                  endDate: endDate || undefined,
                })}
                className="border px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-muted inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
            </div>
          </div>

          <div className="bg-card border rounded-xl overflow-hidden">
            {historyLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                {tc('loading')}
              </div>
            ) : historySessions.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                <History className="w-8 h-8" />
                {tc('noData')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium">{t('username')}</th>
                      <th className="text-left px-4 py-3 font-medium">{t('ipAddress')}</th>
                      <th className="text-left px-4 py-3 font-medium">{t('mac')}</th>
                      <th className="text-left px-4 py-3 font-medium">{t('startTime')}</th>
                      <th className="text-left px-4 py-3 font-medium">{t('endTime')}</th>
                      <th className="text-left px-4 py-3 font-medium">{t('duration')}</th>
                      <th className="text-left px-4 py-3 font-medium">{t('dataIn')}</th>
                      <th className="text-left px-4 py-3 font-medium">{t('dataOut')}</th>
                      <th className="text-left px-4 py-3 font-medium">{t('nasIp')}</th>
                      <th className="text-left px-4 py-3 font-medium">{t('terminateCause')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historySessions.map((session) => (
                      <tr key={session.radacctId} className="border-b last:border-b-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{session.username}</td>
                        <td className="px-4 py-3 text-muted-foreground">{session.framedIpAddress || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{session.callingStationId || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(session.acctStartTime)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatDate(session.acctStopTime ?? '')}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDuration(session.acctStartTime, session.acctStopTime)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{formatBytes(session.acctInputOctets)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{formatBytes(session.acctOutputOctets)}</td>
                        <td className="px-4 py-3 text-muted-foreground">{session.nasIpAddress || '-'}</td>
                        <td className="px-4 py-3 text-muted-foreground">{session.acctTerminateCause || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {historyTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-sm text-muted-foreground">
                  {historyPage} / {historyTotalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    disabled={historyPage <= 1}
                    className="border px-3 py-2 rounded-lg text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {tc('back')}
                  </button>
                  <button
                    onClick={() => setHistoryPage((p) => Math.min(historyTotalPages, p + 1))}
                    disabled={historyPage >= historyTotalPages}
                    className="border px-3 py-2 rounded-lg text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                  >
                    {tc('next')}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Auth Logs Tab */}
      {activeTab === 'authLogs' && (
        <div>
          {/* Filter */}
          <div className="flex items-center gap-3 mb-4">
            <input
              type="text"
              value={authUsername}
              onChange={(e) => setAuthUsername(e.target.value)}
              placeholder={t('filterByUsername')}
              className="border rounded-lg px-3 py-2 text-sm bg-background w-64"
            />
            <div className="ml-auto">
              <button
                onClick={() => downloadCsv('/v1/radius/auth-logs/export', 'auth-logs.csv', {
                  username: debouncedAuthUsername || undefined,
                })}
                className="border px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-muted inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                CSV
              </button>
            </div>
          </div>

          <div className="bg-card border rounded-xl overflow-hidden">
            {authLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">
                {tc('loading')}
              </div>
            ) : authLogs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                <ShieldCheck className="w-8 h-8" />
                {tc('noData')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium">{t('username')}</th>
                      <th className="text-left px-4 py-3 font-medium">{t('authResult')}</th>
                      <th className="text-left px-4 py-3 font-medium">{t('authDate')}</th>
                      <th className="text-left px-4 py-3 font-medium">{t('nasIp')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {authLogs.map((log) => {
                      const isAccept = log.reply === 'Access-Accept';
                      const isReject = log.reply === 'Access-Reject';
                      return (
                        <tr key={log.id} className="border-b last:border-b-0 hover:bg-muted/30">
                          <td className="px-4 py-3 font-medium">{log.username}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                isAccept
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : isReject
                                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                    : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {isAccept ? t('accessAccept') : isReject ? t('accessReject') : log.reply}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-muted-foreground">{formatDate(log.authdate)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{log.nasIpAddress || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {authTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t">
                <span className="text-sm text-muted-foreground">
                  {authPage} / {authTotalPages}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setAuthPage((p) => Math.max(1, p - 1))}
                    disabled={authPage <= 1}
                    className="border px-3 py-2 rounded-lg text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    {tc('back')}
                  </button>
                  <button
                    onClick={() => setAuthPage((p) => Math.min(authTotalPages, p + 1))}
                    disabled={authPage >= authTotalPages}
                    className="border px-3 py-2 rounded-lg text-sm hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1"
                  >
                    {tc('next')}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
