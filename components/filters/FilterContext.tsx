'use client';

import { createContext, useContext, useMemo, ReactNode } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { DateRange, DatePreset, FilterState } from '@/types';
import { parseFiltersFromSearchParams } from '@/lib/date/searchParams';

interface FilterContextType {
  filterState: FilterState;
  dateRange: DateRange;
  setPreset: (preset: DatePreset) => void;
  setCustomRange: (range: DateRange) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { range: dateRange, preset } = useMemo(() => {
    const params: Record<string, string | string[] | undefined> = {};
    searchParams.forEach((v, k) => {
      params[k] = v;
    });
    return parseFiltersFromSearchParams(params);
  }, [searchParams]);

  const filterState: FilterState = useMemo(
    () => ({
      preset,
      customRange: searchParams.has('from') && searchParams.has('to')
        ? dateRange
        : null,
    }),
    [preset, searchParams, dateRange]
  );

  const setPreset = (newPreset: DatePreset) => {
    const params = new URLSearchParams(searchParams);
    params.set('preset', newPreset);
    params.delete('from');
    params.delete('to');
    router.push(`${pathname}?${params.toString()}`);
  };

  const setCustomRange = (range: DateRange) => {
    const params = new URLSearchParams(searchParams);
    params.set('from', range.from.toISOString().split('T')[0]);
    params.set('to', range.to.toISOString().split('T')[0]);
    params.delete('preset');
    router.push(`${pathname}?${params.toString()}`);
  };

  // setPreset and setCustomRange are stable (router-based) but recreated each render
  const value = useMemo(
    () => ({
      filterState,
      dateRange,
      setPreset,
      setCustomRange,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filterState, dateRange]
  );

  return (
    <FilterContext.Provider value={value}>{children}</FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}
