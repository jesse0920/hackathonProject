export const VALUE_TIERS: { key: string; min: number; max: number | null }[] = [
  { key: "5 coins and below", min: 0, max: 5 },
  { key: "5-25 coins", min: 5.01, max: 25 },
  { key: "25-50 coins", min: 25.01, max: 50 },
  { key: "50-75 coins", min: 50.01, max: 75 },
  { key: "75-100 coins", min: 75.01, max: 100 },
  { key: "100-250 coins", min: 100.01, max: 250 },
  { key: "250-500 coins", min: 250.01, max: 500 },
  { key: "500+ coins", min: 500.01, max: null },
];

export function getValueTier(value: number) {
  const tier = VALUE_TIERS.find(
    (entry) => value >= entry.min && value <= (entry.max ?? Number.POSITIVE_INFINITY),
  );

  return tier?.key ?? "Unrated";
}

export function isSameValueTier(a: number, b: number) {
  return getValueTier(a) === getValueTier(b);
}
