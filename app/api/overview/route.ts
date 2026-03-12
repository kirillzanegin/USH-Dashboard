import { NextRequest, NextResponse } from 'next/server';
import {
  countNonAdminUsers,
  countNewNonAdminUsersInPeriod,
  getUsersByIds,
} from '@/services/queries/users';
import { getSpinsExcludingAdmins } from '@/services/queries/spins';
import { getAllPrizes } from '@/services/queries/prizes';
import {
  calculateOverviewMetrics,
  groupSpinsByDate,
  groupActivePlayersByDate,
  getResultDistribution,
  getTopPrizesByCount,
  getTopPrizesByUsage,
  getTopPlayersByRedemptions,
  getTopPlayersBySpins,
  getTopPlayersByValuablePrizes,
} from '@/services/metrics/overview';
import { getDateRangeFromPreset } from '@/lib/date/ranges';
import type { DatePreset } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fromStr = searchParams.get('from');
    const toStr = searchParams.get('to');
    const preset = searchParams.get('preset') as DatePreset | null;

    let from: Date;
    let to: Date;

    if (fromStr && toStr) {
      from = new Date(fromStr);
      to = new Date(toStr);
      if (isNaN(from.getTime()) || isNaN(to.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format' },
          { status: 400 }
        );
      }
    } else {
      const range = getDateRangeFromPreset(preset ?? '7days');
      from = range.from;
      to = range.to;
    }

    const [totalUsers, newPlayers, spinsInPeriod, prizes] = await Promise.all([
      countNonAdminUsers(),
      countNewNonAdminUsersInPeriod(from, to),
      getSpinsExcludingAdmins({ from, to, includeWelcome: true }),
      getAllPrizes(),
    ]);

    const prizeNames = new Map(
      prizes.map((p) => [p.id, p.name || `Приз #${p.id}`])
    );

    const uniqueUserIds = [
      ...new Set(spinsInPeriod.map((s) => s.user_id)),
    ].slice(0, 500);
    const userNames = await getUsersByIds(uniqueUserIds);
    const userNameGetter = (id: number) =>
      userNames.get(id) ?? `User #${id}`;

    const metrics = calculateOverviewMetrics(totalUsers, spinsInPeriod, newPlayers);

    const spinsByDate = groupSpinsByDate(spinsInPeriod);
    const activePlayersByDate = groupActivePlayersByDate(spinsInPeriod);
    const resultDistribution = getResultDistribution(spinsInPeriod);
    const topPrizesByCount = getTopPrizesByCount(spinsInPeriod, prizeNames);
    const topPrizesByUsage = getTopPrizesByUsage(spinsInPeriod, prizeNames);
    const topPlayerByRedemptions = getTopPlayersByRedemptions(
      spinsInPeriod,
      userNameGetter
    );
    const topPlayerBySpins = getTopPlayersBySpins(
      spinsInPeriod,
      userNameGetter
    );
    const topPlayerByValuable = getTopPlayersByValuablePrizes(
      spinsInPeriod,
      userNameGetter
    );

    return NextResponse.json({
      metrics,
      charts: {
        spinsByDate: Object.entries(spinsByDate)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        activePlayersByDate: Object.entries(activePlayersByDate)
          .map(([date, count]) => ({ date, count }))
          .sort((a, b) => a.date.localeCompare(b.date)),
        resultDistribution,
        topPrizesByCount,
        topPrizesByUsage,
      },
      summaries: {
        topPlayerByRedemptions,
        topPlayerBySpins,
        topPlayerByValuable,
        fairness: {
          totalWeight: 0,
          wheelSpinsCount: metrics.wheelSpins,
          maxDeviation: 0,
        },
        anomalies: { count: 0, highSeverity: 0 },
      },
    });
  } catch (error) {
    console.error('Error in /api/overview:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
