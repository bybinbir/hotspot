'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/stores/auth-store';
import {
  LayoutDashboard,
  Router,
  Users,
  Package,
  Ticket,
  BarChart3,
  Palette,
  Settings,
  LogOut,
  Wifi,
  Building2,
  FileStack,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { key: 'dashboard', href: '', icon: LayoutDashboard },
  { key: 'devices', href: '/devices', icon: Router },
  { key: 'walledGarden', href: '/walled-garden', icon: ShieldCheck },
  { key: 'subscribers', href: '/subscribers', icon: Users },
  { key: 'packages', href: '/packages', icon: Package },
  { key: 'vouchers', href: '/vouchers', icon: Ticket },
  { key: 'reports', href: '/reports', icon: BarChart3 },
  { key: 'portalSettings', href: '/portal-settings', icon: Palette },
  { key: 'settings', href: '/settings', icon: Settings },
];

const superAdminNavItems = [
  { key: 'tenants', href: '/tenants', icon: Building2 },
  { key: 'templates', href: '/templates', icon: FileStack },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('nav');
  const tAuth = useTranslations('auth');
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading, isAuthenticated, initialize, logout } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/tr/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Extract locale from pathname for link building
  const locale = pathname.split('/')[1] || 'tr';

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Wifi className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-semibold text-sm">Hotspot</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const href = `/${locale}${item.href}`;
            const isActive = item.href === ''
              ? pathname === `/${locale}` || pathname === `/${locale}/`
              : pathname.startsWith(href);
            const Icon = item.icon;

            return (
              <Link
                key={item.key}
                href={href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t(item.key)}
              </Link>
            );
          })}

          {user?.role === 'super_admin' && (
            <>
              <div className="border-t my-2" />
              <p className="px-3 py-1 text-xs text-muted-foreground font-medium uppercase">
                {t('superAdmin')}
              </p>
              {superAdminNavItems.map((item) => {
                const href = `/${locale}${item.href}`;
                const isActive = pathname.startsWith(href);
                const Icon = item.icon;

                return (
                  <Link
                    key={item.key}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {t(item.key)}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-3 border-t">
          <div className="px-3 py-2 text-xs text-muted-foreground mb-2 truncate">
            {user?.email}
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground w-full transition-colors"
          >
            <LogOut className="w-4 h-4" />
            {tAuth('logout')}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-muted/30">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
