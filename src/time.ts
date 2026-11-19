export const MINUTES_IN_DAY = 1440;

function pad2(n: number): string {
  return n.toString().padStart(2, '0');
}

export function toHHMM(minutes: number): string {
  if (minutes === MINUTES_IN_DAY) return '24:00';
  const m = ((minutes % MINUTES_IN_DAY) + MINUTES_IN_DAY) % MINUTES_IN_DAY;
  return `${pad2(Math.floor(m / 60))}:${pad2(m % 60)}`;
}

export function parseHHMM(value: string, allowMidnight = false): number | null {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (allowMidnight && h === 24 && m === 0) return MINUTES_IN_DAY;
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}
