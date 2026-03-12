import { DbPrize, DbSpin } from '@/types';
import { WELCOME_PRIZE_ID } from '@/config/prizes';

/**
 * Compute total weight of eligible wheel prizes (is_active, weight > 0, id != 14).
 */
export function getTotalEligibleWeight(prizes: DbPrize[]): number {
  return prizes
    .filter(
      (p) =>
        p.is_active === true &&
        (p.weight ?? 0) > 0 &&
        p.id !== WELCOME_PRIZE_ID
    )
    .reduce((sum, p) => sum + (p.weight ?? 0), 0);
}

/**
 * Wheel spins = spins excluding prize_id 14 (welcome).
 */
export function filterWheelSpins(spins: DbSpin[]): DbSpin[] {
  return spins.filter((s) => s.prize_id !== WELCOME_PRIZE_ID);
}
