import { Suspense } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { FilterProvider } from '@/components/filters/FilterContext';
import { GlobalFilters } from '@/components/filters/GlobalFilters';

export const dynamic = 'force-dynamic';

function DashboardInner({ children }: { children: React.ReactNode }) {
  return (
    <FilterProvider>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="shrink-0 border-b bg-background p-4">
            <GlobalFilters />
          </div>
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </FilterProvider>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Загрузка...</div>}>
      <DashboardInner>{children}</DashboardInner>
    </Suspense>
  );
}
