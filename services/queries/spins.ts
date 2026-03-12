import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { DbSpin } from '@/lib/supabase/types';
import { WELCOME_PRIZE_ID } from '@/config/prizes';

export interface SpinsQueryParams {
  from: Date;
  to: Date;
  includeWelcome?: boolean;
  userId?: number;
  prizeId?: number;
  limit?: number;
  offset?: number;
}

/**
 * Spins with user relation, excluding admins.
 * All spins = non-admin users only.
 */
export async function getSpinsWithUser(
  params: SpinsQueryParams
): Promise<{ spin: DbSpin; isAdmin: boolean }[]> {
  const supabase = createServerSupabaseClient();
  const {
    from,
    to,
    includeWelcome = true,
    userId,
    prizeId,
    limit = 5000,
    offset = 0,
  } = params;

  const fromStr = from.toISOString();
  const toStr = to.toISOString();

  const { data: spins, error: spinsError } = await supabase
    .from('spins')
    .select(`
      *,
      users!inner(admin)
    `)
    .gte('created_at', fromStr)
    .lte('created_at', toStr)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (spinsError) throw spinsError;

  let filtered = (spins ?? []) as Array<DbSpin & { users: { admin: boolean | null } }>;

  if (userId) {
    filtered = filtered.filter((s) => s.user_id === userId);
  }
  if (prizeId) {
    filtered = filtered.filter((s) => s.prize_id === prizeId);
  }
  if (!includeWelcome) {
    filtered = filtered.filter((s) => s.prize_id !== WELCOME_PRIZE_ID);
  }

  const result: { spin: DbSpin; isAdmin: boolean }[] = [];
  for (const row of filtered) {
    const isAdmin = row.users?.admin === true;
    if (isAdmin) continue;
    const { users, ...spin } = row;
    result.push({ spin, isAdmin });
  }
  return result;
}

/**
 * Raw spins for a user (no join), for metrics.
 * Caller must ensure admin exclusion at user level.
 */
export async function getSpins(
  params: SpinsQueryParams
): Promise<DbSpin[]> {
  const supabase = createServerSupabaseClient();
  const {
    from,
    to,
    includeWelcome = true,
    userId,
    prizeId,
    limit = 10000,
    offset = 0,
  } = params;

  const fromStr = from.toISOString();
  const toStr = to.toISOString();

  let query = supabase
    .from('spins')
    .select('*')
    .gte('created_at', fromStr)
    .lte('created_at', toStr)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (userId) query = query.eq('user_id', userId);
  if (prizeId) query = query.eq('prize_id', prizeId);
  if (!includeWelcome) query = query.neq('prize_id', WELCOME_PRIZE_ID);

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as DbSpin[];
}

/**
 * Count total spins for a user (all time). Used for totalSpins metric.
 */
export async function getSpinsCountForUser(userId: number): Promise<number> {
  const supabase = createServerSupabaseClient();
  const { count, error } = await supabase
    .from('spins')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) throw error;
  return count ?? 0;
}

/**
 * Get user IDs that are non-admin, for filtering spins.
 */
export async function getNonAdminUserIds(): Promise<Set<number>> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('id')
    .or('admin.is.null,admin.eq.false');

  if (error) throw error;
  return new Set((data ?? []).map((r: { id: number }) => r.id));
}

/**
 * Spins for metrics: must be joined with users to exclude admins.
 * Returns spins where user is NOT admin.
 */
export async function getSpinsExcludingAdmins(
  params: Omit<SpinsQueryParams, 'userId' | 'prizeId'>
): Promise<DbSpin[]> {
  const supabase = createServerSupabaseClient();
  const { from, to, includeWelcome = true } = params;

  const fromStr = from.toISOString();
  const toStr = to.toISOString();

  const pageSize = 1000;
  let offset = 0;
  let hasMore = true;
  const rows: Array<DbSpin & { users: { admin: boolean | null } }> = [];

  while (hasMore) {
    let query = supabase
      .from('spins')
      .select('*, users!inner(admin)')
      .gte('created_at', fromStr)
      .lte('created_at', toStr)
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (!includeWelcome) query = query.neq('prize_id', WELCOME_PRIZE_ID);

    const { data, error } = await query;
    if (error) throw error;

    const batch = (data ?? []) as Array<DbSpin & { users: { admin: boolean | null } }>;
    rows.push(...batch);

    if (batch.length < pageSize || offset + pageSize > 10000) {
      hasMore = false;
    } else {
      offset += pageSize;
    }
  }

  const result: DbSpin[] = [];
  for (const row of rows) {
    if (row.users?.admin === true) continue;
    const { users, ...spin } = row;
    result.push(spin);
  }

  return result;
}
