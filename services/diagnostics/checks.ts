import { getOptionalServerSupabaseClient } from '@/lib/supabase/server';
import { WELCOME_PRIZE_ID } from '@/config/prizes';

export interface DiagnosticResult {
  name: string;
  passed: boolean;
  count: number;
  message: string;
  details?: unknown[];
}

export interface TableStats {
  tableName: string;
  rowCount: number;
}

export async function runDiagnostics(): Promise<{
  checks: DiagnosticResult[];
  tableStats: TableStats[];
  connected: boolean;
}> {
  const supabase = getOptionalServerSupabaseClient();
  const checks: DiagnosticResult[] = [];
  const tableStats: TableStats[] = [];

  if (!supabase) {
    return {
      checks: [
        {
          name: 'Подключение к БД',
          passed: false,
          count: 0,
          message: 'Переменные окружения Supabase не настроены',
        },
      ],
      tableStats: [],
      connected: false,
    };
  }

  try {
    const { count: usersCount } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });
    tableStats.push({ tableName: 'users', rowCount: usersCount ?? 0 });

    const { count: spinsCount } = await supabase
      .from('spins')
      .select('*', { count: 'exact', head: true });
    tableStats.push({ tableName: 'spins', rowCount: spinsCount ?? 0 });

    const { count: prizesCount } = await supabase
      .from('prizes')
      .select('*', { count: 'exact', head: true });
    tableStats.push({ tableName: 'prizes', rowCount: prizesCount ?? 0 });

    const { data: nullUserSpins } = await supabase
      .from('spins')
      .select('id', { count: 'exact', head: true })
      .is('user_id', null);
    const nullUserIdCount = (nullUserSpins as unknown[] | null)?.length ?? 0;
    const { count: nullUserCount } = await supabase
      .from('spins')
      .select('*', { count: 'exact', head: true })
      .is('user_id', null);
    checks.push({
      name: 'Вращения без user_id',
      passed: (nullUserCount ?? 0) === 0,
      count: nullUserCount ?? 0,
      message: (nullUserCount ?? 0) === 0 ? 'Нет' : `Найдено ${nullUserCount}`,
    });

    const { count: nullPrizeCount } = await supabase
      .from('spins')
      .select('*', { count: 'exact', head: true })
      .is('prize_id', null);
    checks.push({
      name: 'Вращения без prize_id',
      passed: (nullPrizeCount ?? 0) === 0,
      count: nullPrizeCount ?? 0,
      message: (nullPrizeCount ?? 0) === 0 ? 'Нет' : `Найдено ${nullPrizeCount}`,
    });

    const { data: spinUsers } = await supabase
      .from('spins')
      .select('user_id');
    const uniqueUserIds = new Set((spinUsers ?? []).map((r: { user_id: number }) => r.user_id));
    const { data: existingUsers } = await supabase
      .from('users')
      .select('id')
      .in('id', Array.from(uniqueUserIds));
    const existingIds = new Set((existingUsers ?? []).map((r: { id: number }) => r.id));
    const brokenUserRefs = Array.from(uniqueUserIds).filter((id) => !existingIds.has(id)).length;
    checks.push({
      name: 'Ссылки на несуществующих пользователей',
      passed: brokenUserRefs === 0,
      count: brokenUserRefs,
      message: brokenUserRefs === 0 ? 'Нет' : `Найдено ${brokenUserRefs}`,
    });

    const { data: spinPrizes } = await supabase
      .from('spins')
      .select('prize_id');
    const uniquePrizeIds = new Set((spinPrizes ?? []).map((r: { prize_id: number }) => r.prize_id));
    const { data: existingPrizes } = await supabase
      .from('prizes')
      .select('id')
      .in('id', Array.from(uniquePrizeIds));
    const existingPrizeIds = new Set((existingPrizes ?? []).map((r: { id: number }) => r.id));
    const brokenPrizeRefs = Array.from(uniquePrizeIds).filter((id) => !existingPrizeIds.has(id)).length;
    checks.push({
      name: 'Ссылки на несуществующие призы',
      passed: brokenPrizeRefs === 0,
      count: brokenPrizeRefs,
      message: brokenPrizeRefs === 0 ? 'Нет' : `Найдено ${brokenPrizeRefs}`,
    });

    const { data: dupRows } = await supabase
      .from('spins')
      .select('user_id, created_at, prize_id')
      .limit(10000);
    const keyCount = new Map<string, { count: number; user_id: number; date: string }>();
    for (const r of dupRows ?? []) {
      const row = r as { user_id: number; created_at: string; prize_id: number };
      // Для проверки "дубликатов" по пользователю и дню учитываем только вращения колеса,
      // welcome-призы (system welcome) не считаем отдельными вращениями.
      if (row.prize_id === WELCOME_PRIZE_ID) continue;
      const date = row.created_at.split('T')[0];
      const key = `${row.user_id}-${date}`;
      const existing = keyCount.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        keyCount.set(key, { count: 1, user_id: row.user_id, date });
      }
    }
    const duplicateDetails = Array.from(keyCount.values()).filter((v) => v.count > 1);
    const duplicateDays = duplicateDetails.length;
    checks.push({
      name: 'Дубликаты (user+день)',
      passed: duplicateDays === 0,
      count: duplicateDays,
      message: duplicateDays === 0 ? 'Нет' : `Потенциально ${duplicateDays} дней с >1 вращением`,
      details: duplicateDetails,
    });
  } catch (e) {
    checks.push({
      name: 'Ошибка проверок',
      passed: false,
      count: 0,
      message: e instanceof Error ? e.message : 'Unknown error',
    });
  }

  return {
    checks,
    tableStats,
    connected: true,
  };
}
