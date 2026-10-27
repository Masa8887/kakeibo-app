/** 明細の合計金額 */
export function receiptTotal(items) {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

/** 金額が負の値の明細を返す */
export function findNegativeItems(items) {
  return items.filter((item) => item.amount < 0);
}

/**
 * 同じ日時・合計金額の登録済みレシートを探す
 * 時刻はどちらかが不明(空文字)なら比較せず、日付と合計金額だけで判定する
 * @param {object[]} receipts 登録済みのレシート
 * @param {{ date: string, time?: string, items: object[] }} target 登録しようとしているレシート
 * @returns {object|null} 重複している登録済みレシート
 */
export function findDuplicateReceipt(receipts, target) {
  const total = receiptTotal(target.items);
  return (
    receipts.find(
      (r) =>
        r.date === target.date &&
        (!r.time || !target.time || r.time === target.time) &&
        receiptTotal(r.items) === total,
    ) ?? null
  );
}
