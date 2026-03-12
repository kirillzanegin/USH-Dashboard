import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { DbUser } from '@/lib/supabase/types';

export interface UsersQueryParams {
  search?: string;
  limit?: number;
  offset?: number;
}

/**
 * Fetch all non-admin users.
 * Admins (users.admin = true) are excluded from analytics.
 */
export async function getNonAdminUsers(
  params: UsersQueryParams = {}
): Promise<DbUser[]> {
  const supabase = createServerSupabaseClient();
  const { search, limit = 100, offset = 0 } = params;

  let query = supabase
    .from('users')
    .select('*')
    .or('admin.is.null,admin.eq.false')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (search && search.trim()) {
    const term = search.trim();
    const num = Number(term);
    if (!isNaN(num) && Number.isInteger(num)) {
      query = query.or(`first_name.ilike.*${term}*,last_name.ilike.*${term}*,username.ilike.*${term}*,telegram_id.eq.${num}`);
    } else {
      query = query.or(`first_name.ilike.*${term}*,last_name.ilike.*${term}*,username.ilike.*${term}*`);
    }
  }

  const { data, error } = await query;

  if (error) throw error;
  return (data ?? []) as DbUser[];
}

/**
 * Fetch user by ID.
 */
export async function getUserById(id: number): Promise<DbUser | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as DbUser;
}

/**
 * Fetch users by IDs (for display names). Excludes admins.
 */
export async function getUsersByIds(ids: number[]): Promise<Map<number, string>> {
  if (ids.length === 0) return new Map();
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('id, first_name, username')
    .in('id', ids)
    .or('admin.is.null,admin.eq.false');

  if (error) throw error;

  const map = new Map<number, string>();
  for (const row of data ?? []) {
    const r = row as { id: number; first_name: string | null; username: string | null };
    const name = r.first_name || r.username || `#${r.id}`;
    map.set(r.id, name);
  }
  return map;
}

/**
 * Fetch full user rows by IDs, preserving the order of the input array.
 * Admins are excluded.
 */
export async function getUsersByIdsFull(ids: number[]): Promise<DbUser[]> {
  if (ids.length === 0) return [];
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .in('id', ids)
    .or('admin.is.null,admin.eq.false');

  if (error) throw error;

  const byId = new Map<number, DbUser>();
  for (const row of (data ?? []) as DbUser[]) {
    byId.set(row.id, row);
  }

  return ids
    .map((id) => byId.get(id))
    .filter((u): u is DbUser => Boolean(u));
}

/**
 * Count total non-admin users.
 */
export async function countNonAdminUsers(): Promise<number> {
  const supabase = createServerSupabaseClient();
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .or('admin.is.null,admin.eq.false');

  if (error) throw error;
  return count ?? 0;
}

/**
 * Count non-admin users registered (created_at) within the given period.
 */
export async function countNewNonAdminUsersInPeriod(
  from: Date,
  to: Date
): Promise<number> {
  const supabase = createServerSupabaseClient();
  const fromStr = from.toISOString();
  const toStr = to.toISOString();
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .or('admin.is.null,admin.eq.false')
    .gte('created_at', fromStr)
    .lte('created_at', toStr);

  if (error) throw error;
  return count ?? 0;
}
