import { createServerSupabaseClient } from '@/lib/supabase/server';
import type { DbPrize } from '@/lib/supabase/types';
import { WELCOME_PRIZE_ID } from '@/config/prizes';

/**
 * Fetch all prizes.
 */
export async function getAllPrizes(): Promise<DbPrize[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('prizes')
    .select('*')
    .order('id', { ascending: true });

  if (error) throw error;
  return (data ?? []) as DbPrize[];
}

/**
 * Fetch prizes eligible for wheel fairness (is_active, weight > 0, id != 14).
 */
export async function getEligibleWheelPrizes(): Promise<DbPrize[]> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('prizes')
    .select('*')
    .eq('is_active', true)
    .gt('weight', 0)
    .neq('id', WELCOME_PRIZE_ID)
    .order('id', { ascending: true });

  if (error) throw error;
  return (data ?? []) as DbPrize[];
}

/**
 * Fetch prize by ID.
 */
export async function getPrizeById(id: number): Promise<DbPrize | null> {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase
    .from('prizes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as DbPrize;
}
