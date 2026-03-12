import { NextRequest, NextResponse } from 'next/server';
import {
  getNonAdminUsers,
  getUsersByIds,
  getUsersByIdsFull,
} from '@/services/queries/users';
import {
  getSpinsExcludingAdmins,
  getSpinsCountForUser,
} from '@/services/queries/spins';
import { computePlayerStats } from '@/services/metrics/players';
import { parseFiltersFromSearchParams } from '@/lib/date/searchParams';
import { formatDateTime } from '@/lib/date/ranges';
import { formatDuration } from '@/lib/utils/format';
import { NO_PRIZE_ID, WELCOME_PRIZE_ID, VALUABLE_PRIZE_IDS } from '@/config/prizes';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params: Record<string, string | string[] | undefined> = {};
    searchParams.forEach((v, k) => {
      params[k] = v;
    });

    const { range } = parseFiltersFromSearchParams(params);
    const search = typeof params.search === 'string' ? params.search : undefined;

    const pageStr = searchParams.get('page');
    const pageSizeStr = searchParams.get('pageSize');
    const page = Math.max(1, pageStr ? parseInt(pageStr, 10) || 1 : 1);
    const pageSizeRaw = pageSizeStr ? parseInt(pageSizeStr, 10) || 20 : 20;
    const pageSize = Math.min(Math.max(1, pageSizeRaw), 100);
    const offset = (page - 1) * pageSize;

    const sortParam = searchParams.get('sort');
    const sortKey =
      sortParam === 'redeemed' ||
      sortParam === 'won' ||
      sortParam === 'valuable' ||
      sortParam === 'expired'
        ? sortParam
        : 'spins';

    const allSpinsInPeriod = await getSpinsExcludingAdmins({
      from: range.from,
      to: range.to,
      includeWelcome: true,
      limit: 50000,
    });

    const userSpinsInPeriod = new Map<number, typeof allSpinsInPeriod>();
    for (const spin of allSpinsInPeriod) {
      const arr = userSpinsInPeriod.get(spin.user_id) ?? [];
      arr.push(spin);
      userSpinsInPeriod.set(spin.user_id, arr);
    }

    // Глобальные лидерборды по всем не-админам, а не только по текущей странице
    type LeaderboardEntry = { userId: number; userName: string; value: number };

    const bySpinsMap = new Map<number, number>();
    const byRedeemedMap = new Map<number, number>();
    const byWonMap = new Map<number, number>();
    const byValuableMap = new Map<number, number>();
    const byExpiredMap = new Map<number, number>();

    const now = new Date();
    for (const s of allSpinsInPeriod) {
      const uid = s.user_id;
      bySpinsMap.set(uid, (bySpinsMap.get(uid) ?? 0) + 1);

      if (s.used_at !== null) {
        byRedeemedMap.set(uid, (byRedeemedMap.get(uid) ?? 0) + 1);
      }

      if (s.prize_id !== NO_PRIZE_ID && s.prize_id !== WELCOME_PRIZE_ID) {
        byWonMap.set(uid, (byWonMap.get(uid) ?? 0) + 1);
      }

      if (VALUABLE_PRIZE_IDS.includes(s.prize_id as (typeof VALUABLE_PRIZE_IDS)[number])) {
        byValuableMap.set(uid, (byValuableMap.get(uid) ?? 0) + 1);
      }

      if (
        s.used_at === null &&
        s.valid_until !== null &&
        new Date(s.valid_until) < now
      ) {
        byExpiredMap.set(uid, (byExpiredMap.get(uid) ?? 0) + 1);
      }
    }

    const allUserIds = new Set<number>();
    [bySpinsMap, byRedeemedMap, byWonMap, byValuableMap, byExpiredMap].forEach(
      (m) => m.forEach((_, uid) => allUserIds.add(uid))
    );

    const userNamesMap = await getUsersByIds(Array.from(allUserIds));
    const getName = (id: number) =>
      userNamesMap.get(id) ?? `User #${id}`;

    const buildLeaderboard = (map: Map<number, number>): LeaderboardEntry[] =>
      Array.from(map.entries())
        .map(([userId, value]) => ({
          userId,
          userName: getName(userId),
          value,
        }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

    // Build ordering of users by importance in the selected period.
    // Primary metric is chosen by sortKey.
    let metricMap: Map<number, number> =
      sortKey === 'redeemed'
        ? byRedeemedMap
        : sortKey === 'won'
        ? byWonMap
        : sortKey === 'valuable'
        ? byValuableMap
        : sortKey === 'expired'
        ? byExpiredMap
        : bySpinsMap;

    // If there is no data for the chosen metric (for example, no expired prizes),
    // fall back to ordering by spins so that the table is still populated.
    if (metricMap.size === 0) {
      metricMap = bySpinsMap;
    }

    const orderedUserIdsByMetric = Array.from(metricMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([userId]) => userId);

    let orderedUserIds: number[];

    if (search && search.trim()) {
      // If there is a search term, intersect ordered users with search results.
      const matchingUsers = await getNonAdminUsers({
        search: search.trim(),
        limit: 5000,
        offset: 0,
      });
      const allowedIds = new Set(matchingUsers.map((u) => u.id));
      orderedUserIds = orderedUserIdsByMetric.filter((id) => allowedIds.has(id));
    } else {
      orderedUserIds = orderedUserIdsByMetric;
    }

    const pagedUserIds = orderedUserIds.slice(offset, offset + pageSize);
    const users = await getUsersByIdsFull(pagedUserIds);

    const totalSpinsByUser = new Map<number, number>();
    await Promise.all(
      users.map(async (user) => {
        const count = await getSpinsCountForUser(user.id);
        totalSpinsByUser.set(user.id, count);
      })
    );

    const playerStats = users.map((user) => {
      const spinsInPeriod = userSpinsInPeriod.get(user.id) ?? [];
      const totalSpins = totalSpinsByUser.get(user.id) ?? 0;
      return computePlayerStats(user, spinsInPeriod, totalSpins);
    });

    // Sort players on the page so that the primary metric
    // matches the selected leaderboard (sortKey).
    playerStats.sort((a, b) => {
      const getPrimary = (p: typeof a) => {
        switch (sortKey) {
          case 'redeemed':
            return p.redeemedPrizes;
          case 'won':
            return p.wonPrizes;
          case 'valuable':
            return p.valuablePrizes;
          case 'expired':
            return p.expiredPrizes;
          case 'spins':
          default:
            return p.spinsInPeriod;
        }
      };

      const primaryDiff = getPrimary(b) - getPrimary(a);
      if (primaryDiff !== 0) return primaryDiff;

      // Secondary tie‑breakers
      if (b.spinsInPeriod !== a.spinsInPeriod) {
        return b.spinsInPeriod - a.spinsInPeriod;
      }
      if (b.valuablePrizes !== a.valuablePrizes) {
        return b.valuablePrizes - a.valuablePrizes;
      }
      if (b.redeemedPrizes !== a.redeemedPrizes) {
        return b.redeemedPrizes - a.redeemedPrizes;
      }
      return b.totalSpins - a.totalSpins;
    });

    const rows = playerStats.map((s) => ({
      ...s,
      userName:
        s.user.first_name || s.user.username || `User #${s.user.id}`,
      registrationDate: s.user.created_at
        ? formatDateTime(s.user.created_at)
        : '—',
      lastActivityFormatted: s.lastActivity
        ? formatDateTime(s.lastActivity)
        : '—',
      avgIntervalFormatted: s.avgInterval
        ? formatDuration(s.avgInterval)
        : '—',
    }));

    const leaderboards = {
      bySpins: buildLeaderboard(bySpinsMap),
      byRedeemed: buildLeaderboard(byRedeemedMap),
      byWon: buildLeaderboard(byWonMap),
      byValuable: buildLeaderboard(byValuableMap),
      byExpired: buildLeaderboard(byExpiredMap),
    };

    const hasMore = offset + pageSize < orderedUserIds.length;

    return NextResponse.json({
      players: rows,
      leaderboards,
      hasMore,
      page,
    });
  } catch (error) {
    console.error('Error in /api/players:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
