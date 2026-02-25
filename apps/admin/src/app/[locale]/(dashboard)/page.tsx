'use client';

import { useTranslations } from 'next-intl';
import { Users, Wifi, BarChart3, DollarSign, ArrowUpDown, Clock, Globe } from 'lucide-react';
import { useUsageStats, useActiveSessions, useSubscribers } from '@/lib/api/hooks';

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}) {
  return (
    <div className="bg-card border rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

function formatDuration(startTime: string): string {
  const start = new Date(startTime).getTime();
  const now = Date.now();
  const diffSec = Math.floor((now - start) / 1000);
  const hours = Math.floor(diffSec / 3600);
  const minutes = Math.floor((diffSec % 3600) / 60);
  if (hours > 0) return `${hours}s ${minutes}dk`;
  return `${minutes}dk`;
}

export default function DashboardPage() {
  const t = useTranslations('dashboard');

  const { data: stats } = useUsageStats();
  const { data: sessionsData } = useActiveSessions(1, 10);
  const { data: subscribersData } = useSubscribers(1, 1);

  const activeSessions = stats?.totalActiveSessions ?? 0;
  const totalSubscribers = subscribersData?.total ?? 0;
  const todayDataIn = Number(stats?.todayDataIn ?? 0);
  const todayDataOut = Number(stats?.todayDataOut ?? 0);
  const todayBandwidth = formatBytes(todayDataIn + todayDataOut);
  const todayNewSessions = stats?.todayNewSessions ?? 0;

  const recentSessions: any[] = sessionsData?.data ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{t('title')}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title={t('activeUsers')}
          value={String(activeSessions)}
          subtitle={`${todayNewSessions} yeni oturum bugün`}
          icon={Wifi}
          color="bg-green-500"
        />
        <StatCard
          title={t('totalSubscribers')}
          value={String(totalSubscribers)}
          icon={Users}
          color="bg-blue-500"
        />
        <StatCard
          title={t('bandwidth')}
          value={todayBandwidth}
          subtitle="Bugünkü kullanım"
          icon={BarChart3}
          color="bg-purple-500"
        />
        <StatCard
          title={t('todaySessions')}
          value={String(todayNewSessions)}
          icon={ArrowUpDown}
          color="bg-orange-500"
        />
      </div>

      {/* Recent Active Sessions */}
      <div className="bg-card border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="font-semibold">{t('recentSessions')}</h2>
        </div>
        {recentSessions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            Henüz aktif oturum yok.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left px-4 py-3 font-medium">Kullanıcı</th>
                  <th className="text-left px-4 py-3 font-medium">IP Adresi</th>
                  <th className="text-left px-4 py-3 font-medium">MAC</th>
                  <th className="text-left px-4 py-3 font-medium">Süre</th>
                  <th className="text-left px-4 py-3 font-medium">Veri Kullanımı</th>
                </tr>
              </thead>
              <tbody>
                {recentSessions.map((session: any) => {
                  const dataIn = Number(session.acctInputOctets ?? 0);
                  const dataOut = Number(session.acctOutputOctets ?? 0);
                  return (
                    <tr key={session.radacctId || session.acctSessionId} className="border-b last:border-b-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{session.username}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Globe className="w-3.5 h-3.5" />
                          {session.framedIpAddress || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground font-mono text-xs">
                        {session.callingStationId || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {session.acctStartTime ? formatDuration(session.acctStartTime) : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-green-600">{formatBytes(dataIn)}</span>
                        {' / '}
                        <span className="text-blue-600">{formatBytes(dataOut)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
