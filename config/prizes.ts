export const NO_PRIZE_ID = 13;
export const WELCOME_PRIZE_ID = 14;
export const VALUABLE_PRIZE_IDS = [1, 2, 5, 9] as const;

export type ValuablePrizeId = typeof VALUABLE_PRIZE_IDS[number];

export const isPrizeValuable = (prizeId: number): boolean => {
  return VALUABLE_PRIZE_IDS.includes(prizeId as ValuablePrizeId);
};

export const isWelcomePrize = (prizeId: number): boolean => {
  return prizeId === WELCOME_PRIZE_ID;
};

export const isNoPrize = (prizeId: number): boolean => {
  return prizeId === NO_PRIZE_ID;
};
