const TIME_ZONE = "Asia/Tokyo";

/** 日本時間での今日の日付を YYYY-MM-DD で返す */
export function todayInTokyo(now = new Date()) {
  // sv-SE ロケールは YYYY-MM-DD 形式で出力される
  return now.toLocaleDateString("sv-SE", { timeZone: TIME_ZONE });
}

/** YYYY-MM-DD 形式として正しい日付かどうか */
export function isValidDateString(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split("-").map(Number);
  // 日付文字列をそのまま UTC として解釈し、繰り上がりがないか確認する
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** YYYY-MM-DD から月キー(YYYY-MM)を取り出す */
export function toMonthKey(dateString) {
  return dateString.slice(0, 7);
}

/** 月キー(YYYY-MM)を「2026年10月」の形式にする */
export function formatMonth(monthKey) {
  const [y, m] = monthKey.split("-");
  return `${y}年${Number(m)}月`;
}
