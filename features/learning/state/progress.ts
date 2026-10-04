export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function nextStreak(
  previousDate: string | null,
  currentStreak: number,
  today: string,
): number {
  if (previousDate === today) return currentStreak;
  if (!previousDate) return 1;
  const current = Date.parse(`${today}T00:00:00Z`);
  const previous = Date.parse(`${previousDate}T00:00:00Z`);
  return Math.round((current - previous) / 86_400_000) === 1
    ? currentStreak + 1
    : 1;
}

export function awardOnce(
  keys: string[],
  key: string,
  amount: number,
): { keys: string[]; gained: number } {
  if (keys.includes(key)) return { keys, gained: 0 };
  return { keys: [...keys, key], gained: amount };
}
