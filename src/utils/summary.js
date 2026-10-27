import { CATEGORIES } from "./categories.js";
import { toMonthKey } from "./date.js";

/** 全レシートの明細を、日付・店名付きの1次元配列にする(新しい日付順) */
export function flattenItems(receipts) {
  return receipts
    .flatMap((receipt) =>
      receipt.items.map((item) => ({
        ...item,
        receiptId: receipt.id,
        date: receipt.date,
        // 時刻のない古いデータもあるため空文字で補う
        time: receipt.time ?? "",
        store: receipt.store,
      })),
    )
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
}

/** 登録済みデータに含まれる月(YYYY-MM)を古い順に返す */
export function listMonths(receipts) {
  return [...new Set(receipts.map((r) => toMonthKey(r.date)))].sort();
}

/**
 * カテゴリ別の合計金額を返す
 * @param {string|null} monthKey 指定した月(YYYY-MM)だけを集計する。null なら全期間
 */
export function sumByCategory(receipts, monthKey = null) {
  const totals = Object.fromEntries(CATEGORIES.map((c) => [c, 0]));
  for (const receipt of receipts) {
    if (monthKey && toMonthKey(receipt.date) !== monthKey) continue;
    for (const item of receipt.items) {
      // 未知のカテゴリは「その他」に寄せる
      const category = item.category in totals ? item.category : "その他";
      totals[category] += item.amount;
    }
  }
  return totals;
}

/** 月別の合計金額を古い順に返す */
export function sumByMonth(receipts) {
  const totals = {};
  for (const receipt of receipts) {
    const key = toMonthKey(receipt.date);
    totals[key] = (totals[key] ?? 0) + receipt.items.reduce((sum, item) => sum + item.amount, 0);
  }
  return Object.keys(totals)
    .sort()
    .map((month) => ({ month, total: totals[month] }));
}

/** 金額を「¥1,234」形式にする */
export function formatYen(amount) {
  return `¥${amount.toLocaleString("ja-JP")}`;
}
