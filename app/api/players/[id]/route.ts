import { NextRequest, NextResponse } from 'next/server';
import { getUserById } from '@/services/queries/users';
import { getSpinsExcludingAdmins, getSpinsCountForUser } from '@/services/queries/spins';
import { computePlayerStats } from '@/services/metrics/players';
import { parseFiltersFromSearchParams } from '@/lib/date/searchParams';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = parseInt(id, 10);
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const searchParams = request.nextUrl.searchParams;
    const urlParams: Record<string, string | string[] | undefined> = {};
    searchParams.forEach((v, k) => {
      urlParams[k] = v;
    });
    const { range } = parseFiltersFromSearchParams(urlParams);

    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.admin) {
      return NextResponse.json({ error: 'Admin users are excluded' }, { status: 403 });
    }

    const spinsInPeriod = await getSpinsExcludingAdmins({
      from: range.from,
      to: range.to,
      includeWelcome: true,
      limit: 10000,
    }).then((spins) => spins.filter((s) => s.user_id === userId));

    const totalSpins = await getSpinsCountForUser(userId);
    const stats = computePlayerStats(user, spinsInPeriod, totalSpins);

    return NextResponse.json({
      user,
      stats: {
        spinsInPeriod: stats.spinsInPeriod,
        totalSpins: stats.totalSpins,
        wonPrizes: stats.wonPrizes,
        noPrizes: stats.noPrizes,
        welcomePrizes: stats.welcomePrizes,
        redeemedPrizes: stats.redeemedPrizes,
        expiredPrizes: stats.expiredPrizes,
        valuablePrizes: stats.valuablePrizes,
        lastActivity: stats.lastActivity,
      },
      spins: spinsInPeriod.slice(0, 50),
    });
  } catch (error) {
    console.error('Error in /api/players/[id]:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
