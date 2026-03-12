import { NextRequest, NextResponse } from 'next/server';
import { getAllPrizes } from '@/services/queries/prizes';
import { getSpinsExcludingAdmins } from '@/services/queries/spins';
import { computePrizeStats } from '@/services/metrics/prizes';
import { getTotalEligibleWeight, filterWheelSpins } from '@/services/metrics/fairness';
import { parseFiltersFromSearchParams } from '@/lib/date/searchParams';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params: Record<string, string | string[] | undefined> = {};
    searchParams.forEach((v, k) => {
      params[k] = v;
    });
    const { range } = parseFiltersFromSearchParams(params);

    const [prizes, spinsInPeriod, allSpins] = await Promise.all([
      getAllPrizes(),
      getSpinsExcludingAdmins({
        from: range.from,
        to: range.to,
        includeWelcome: true,
        limit: 50000,
      }),
      getSpinsExcludingAdmins({
        from: new Date('2000-01-01'),
        to: range.to,
        includeWelcome: true,
        limit: 100000,
      }),
    ]);

    const wheelSpinsInPeriod = filterWheelSpins(spinsInPeriod);
    const allWheelSpins = filterWheelSpins(allSpins);
    const totalWeight = getTotalEligibleWeight(prizes);

    const prizeStats = prizes.map((prize) => {
      const spinsForPrizeInPeriod = spinsInPeriod.filter(
        (s) => s.prize_id === prize.id
      );
      const allSpinsForPrize = allSpins.filter((s) => s.prize_id === prize.id);

      return computePrizeStats(
        prize,
        wheelSpinsInPeriod,
        allWheelSpins,
        wheelSpinsInPeriod.length,
        totalWeight,
        spinsForPrizeInPeriod,
        allSpinsForPrize
      );
    });

    const fairnessData = prizeStats
      .filter((s) => !s.isWelcome && s.expectedProb !== null)
      .map((s) => ({
        name: s.prize.name ?? `#${s.prize.id}`,
        expected: (s.expectedProb ?? 0) * 100,
        actual: (s.actualProb ?? 0) * 100,
        deviation: (s.deviation ?? 0) * 100,
      }));

    return NextResponse.json({
      prizes: prizeStats,
      fairness: {
        totalWeight,
        wheelSpinsCount: wheelSpinsInPeriod.length,
        data: fairnessData,
      },
    });
  } catch (error) {
    console.error('Error in /api/prizes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
