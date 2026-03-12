import { NextRequest, NextResponse } from 'next/server';
import { getNonAdminUsers, getUsersByIds } from '@/services/queries/users';
import { getSpinsExcludingAdmins } from '@/services/queries/spins';
import { getAllPrizes } from '@/services/queries/prizes';
import { runAnomalyDetection } from '@/services/anomalies/engine';
import { parseFiltersFromSearchParams } from '@/lib/date/searchParams';
import { ANOMALY_RULES } from '@/config/anomaly-thresholds';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const params: Record<string, string | string[] | undefined> = {};
    searchParams.forEach((v, k) => {
      params[k] = v;
    });
    const { range } = parseFiltersFromSearchParams(params);

    const [spins, users, prizes] = await Promise.all([
      getSpinsExcludingAdmins({
        from: range.from,
        to: range.to,
        includeWelcome: true,
        limit: 50000,
      }),
      getNonAdminUsers({ limit: 1000 }),
      getAllPrizes(),
    ]);

    const userIds = [...new Set(spins.map((s) => s.user_id))];
    const userNames = await getUsersByIds(userIds);
    const userNameGetter = (id: number) =>
      userNames.get(id) ?? users.find((u) => u.id === id)?.first_name ?? `User #${id}`;

    const anomalies = runAnomalyDetection(
      spins,
      users,
      prizes,
      userNameGetter
    );

    const rulesMap = new Map(ANOMALY_RULES.map((r) => [r.id, r]));

    const enriched = anomalies.map((a) => ({
      ...a,
      ruleName: rulesMap.get(a.ruleId)?.name ?? a.ruleId,
    }));

    return NextResponse.json({
      anomalies: enriched,
      total: enriched.length,
      bySeverity: {
        high: enriched.filter((a) => a.severity === 'high').length,
        medium: enriched.filter((a) => a.severity === 'medium').length,
        low: enriched.filter((a) => a.severity === 'low').length,
      },
    });
  } catch (error) {
    console.error('Error in /api/anomalies:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
