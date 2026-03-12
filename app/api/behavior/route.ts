import { NextRequest, NextResponse } from 'next/server';
import { getSpinsExcludingAdmins } from '@/services/queries/spins';
import { getNonAdminUsers } from '@/services/queries/users';
import {
  getActivityHeatmap,
  getGapsBetweenSpins,
  getMedian,
  getDaysToRedeem,
} from '@/services/metrics/behavior';
import { parseFiltersFromSearchParams } from '@/lib/date/searchParams';
import { formatDuration } from '@/lib/utils/format';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params: Record<string, string | string[] | undefined> = {};
    searchParams.forEach((v, k) => {
      params[k] = v;
    });
    const { range } = parseFiltersFromSearchParams(params);

    const [spins, users] = await Promise.all([
      getSpinsExcludingAdmins({
        from: range.from,
        to: range.to,
        includeWelcome: true,
        limit: 50000,
      }),
      getNonAdminUsers({ limit: 500 }),
    ]);

    const heatmap = getActivityHeatmap(spins);
    const gaps = getGapsBetweenSpins(spins);
    const avgGapMinutes = gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : null;
    const medianGapMinutes = gaps.length > 0 ? getMedian(gaps) : null;

    const redeemDelays = getDaysToRedeem(spins);
    const avgDaysToRedeem =
      redeemDelays.length > 0
        ? redeemDelays.reduce((a, b) => a + b, 0) / redeemDelays.length
        : null;


    const playButRarelyRedeem = users
      .filter((u) => {
        const userSpins = spins.filter((s) => s.user_id === u.id);
        const wheelSpins = userSpins.filter((s) => s.prize_id !== 14);
        const wins = wheelSpins.filter((s) => s.prize_id !== 13);
        const redeemed = userSpins.filter((s) => s.used_at !== null).length;
        return wins.length >= 3 && redeemed < wins.length * 0.3;
      })
      .slice(0, 10);

    const redeemFrequently = users
      .filter((u) => {
        const userSpins = spins.filter((s) => s.user_id === u.id);
        const wins = userSpins.filter((s) => s.prize_id !== 13 && s.prize_id !== 14);
        const redeemed = userSpins.filter((s) => s.used_at !== null).length;
        return wins.length >= 2 && redeemed / wins.length >= 0.8;
      })
      .slice(0, 10);

    return NextResponse.json({
      heatmap,
      avgGapMinutes,
      medianGapMinutes,
      avgGapFormatted: avgGapMinutes != null ? formatDuration(avgGapMinutes) : null,
      medianGapFormatted: medianGapMinutes != null ? formatDuration(medianGapMinutes) : null,
      avgDaysToRedeem,
      gapDistribution: gaps.slice(0, 100),
      playButRarelyRedeem: playButRarelyRedeem.map((u) => ({
        id: u.id,
        name: u.first_name || u.username || `#${u.id}`,
      })),
      redeemFrequently: redeemFrequently.map((u) => ({
        id: u.id,
        name: u.first_name || u.username || `#${u.id}`,
      })),
    });
  } catch (error) {
    console.error('Error in /api/behavior:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
