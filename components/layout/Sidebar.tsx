'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  BarChart3,
  Users,
  Trophy,
  CheckCircle2,
  Activity,
  AlertTriangle,
  Wrench,
} from 'lucide-react';
import { LABELS } from '@/config/labels';
import { cn } from '@/lib/utils/format';

const navItems = [
  {
    href: '/overview',
    label: LABELS.pages.overview,
    icon: BarChart3,
  },
  {
    href: '/players',
    label: LABELS.pages.players,
    icon: Users,
  },
  {
    href: '/prizes',
    label: LABELS.pages.prizes,
    icon: Trophy,
  },
  {
    href: '/redemptions',
    label: LABELS.pages.redemptions,
    icon: CheckCircle2,
  },
  {
    href: '/behavior',
    label: LABELS.pages.behavior,
    icon: Activity,
  },
  {
    href: '/anomalies',
    label: LABELS.pages.anomalies,
    icon: AlertTriangle,
  },
  {
    href: '/diagnostics',
    label: LABELS.pages.diagnostics,
    icon: Wrench,
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">USH Dashboard</h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <button
          type="button"
          onClick={async () => {
            try {
              await fetch('/api/logout', { method: 'POST' });
              router.push('/login');
            } catch {
              router.push('/login');
            }
          }}
          className="w-full rounded-md border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}
