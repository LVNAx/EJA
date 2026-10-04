const TZ = "Asia/Jakarta";

const dateLong = new Intl.DateTimeFormat("id-ID", { dateStyle: "long", timeZone: TZ });
const dateShort = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "short", timeZone: TZ });
const weekdayShort = new Intl.DateTimeFormat("id-ID", { weekday: "short", timeZone: TZ });

export const formatDateLong = (iso: string | number) => dateLong.format(new Date(iso));
export const formatDateShort = (iso: string | number) => dateShort.format(new Date(iso));
export const formatWeekdayShort = (iso: string | number) => weekdayShort.format(new Date(iso));

export const pct = (v: number | null | undefined) => (v === null || v === undefined ? "–" : `${Math.round(v * 100)}%`);

/** 0,62 gaya Indonesia. */
export const decimal = (n: number, digits = 2) => n.toFixed(digits).replace(".", ",");

export function relativeDays(days: number): string {
  if (days <= 0) return "hari ini";
  if (days === 1) return "kemarin";
  return `${days} hari lalu`;
}

export function minutesText(min: number): string {
  if (min < 60) return `${min} menit`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} jam ${m} menit` : `${h} jam`;
}
