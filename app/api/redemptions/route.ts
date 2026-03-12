import { NextRequest, NextResponse } from 'next/server';
import { getSpinsExcludingAdmins } from '@/services/queries/spins';
import { getAllPrizes } from '@/services/queries/prizes';
import { computeRedemptionMetrics, groupByDate } from '@/services/metrics/redemptions';
import { parseFiltersFromSearchParams } from '@/lib/date/searchParams';
import { WELCOME_PRIZE_ID } from '@/config/prizes';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params: Record<string, string | string[] | undefined> = {};
    searchParams.forEach((v, k) => {
      params[k] = v;
    });
    const { range } = parseFiltersFromSearchParams(params);

    const [spins, prizes] = await Promise.all([
      getSpinsExcludingAdmins({
        from: range.from,
        to: range.to,
        includeWelcome: true,
        limit: 50000,
      }),
      getAllPrizes(),
    ]);

    const prizeNames = new Map(
      prizes.map((p) => [p.id, p.name ?? `Приз #${p.id}`])
    );

    const metrics = computeRedemptionMetrics(spins);

    const redeemedByDate = groupByDate(spins, (s) => s.used_at !== null);
    const now = new Date();
    const expiredSpins = spins.filter(
      (s) =>
        s.used_at === null &&
        s.valid_until !== null &&
        new Date(s.valid_until) < now
    );
    const expiredByDate = groupByDate(
      expiredSpins,
      () => true,
      'valid_until'
    );

    const welcomeSpins = spins.filter((s) => s.prize_id === WELCOME_PRIZE_ID);
    const welcomeRedeemedByDate = groupByDate(
      welcomeSpins,
      (s) => s.used_at !== null
    );

    const byRedemptionRate = prizes.map((p) => {
      const pSpins = spins.filter((s) => s.prize_id === p.id);
      const redeemed = pSpins.filter((s) => s.used_at !== null).length;
      const rate = pSpins.length > 0 ? redeemed / pSpins.length : 0;
      return {
        name: prizeNames.get(p.id) ?? `#${p.id}`,
        prizeId: p.id,
        rate,
        redeemed,
        total: pSpins.length,
      };
    }).sort((a, b) => b.rate - a.rate);

    const byExpirationRate = prizes.map((p) => {
      const pSpins = spins.filter((s) => s.prize_id === p.id);
      const expired = pSpins.filter(
        (s) =>
          s.used_at === null &&
          s.valid_until !== null &&
          new Date(s.valid_until) < new Date()
      ).length;
      const rate = pSpins.length > 0 ? expired / pSpins.length : 0;
      return {
        name: prizeNames.get(p.id) ?? `#${p.id}`,
        prizeId: p.id,
        rate,
        expired,
        total: pSpins.length,
      };
    }).sort((a, b) => b.rate - a.rate);

    const userRedeemedCount = new Map<number, number>();
    const userExpiredCount = new Map<number, number>();
    for (const s of spins) {
      if (s.used_at !== null) {
        userRedeemedCount.set(
          s.user_id,
          (userRedeemedCount.get(s.user_id) ?? 0) + 1
        );
      } else if (
        s.valid_until !== null &&
        new Date(s.valid_until) < new Date()
      ) {
        userExpiredCount.set(
          s.user_id,
          (userExpiredCount.get(s.user_id) ?? 0) + 1
        );
      }
    }

    const playersByRedeemed = Array.from(userRedeemedCount.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const playersByExpired = Array.from(userExpiredCount.entries())
      .map(([userId, count]) => ({ userId, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      metrics,
      dailyRedemptions: Object.entries(redeemedByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      dailyExpirations: Object.entries(expiredByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      welcomeRedemptions: Object.entries(welcomeRedeemedByDate)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date)),
      byRedemptionRate,
      byExpirationRate,
      playersByRedeemed,
      playersByExpired,
    });
  } catch (error) {
    console.error('Error in /api/redemptions:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
