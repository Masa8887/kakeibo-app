import { useState } from "react";
import { CATEGORIES } from "../utils/categories.js";
import { isValidDateString, isValidTimeString, todayInTokyo } from "../utils/date.js";
import { formatYen } from "../utils/summary.js";
import { findDuplicateReceipt, findNegativeItems, receiptTotal } from "../utils/validation.js";

/**
 * 読み取り結果を確認・修正してから登録するフォーム
 * @param {{ result: object, receipts: object[], onSave: (receipt: object) => void, onCancel: () => void }} props
 */
export default function ReceiptReview({ result, receipts, onSave, onCancel }) {
  // 日付が読み取れなかった場合は日本時間の今日を初期値にする
  const [date, setDate] = useState(isValidDateString(result.date) ? result.date : todayInTokyo());
  // 時刻は読み取れなかった場合は空欄(不明)のままにする
  const [time, setTime] = useState(isValidTimeString(result.time) ? result.time : "");
  const [store, setStore] = useState(result.store);
  const [items, setItems] = useState(() => result.items.map((item) => ({ ...item, id: crypto.randomUUID() })));

  const updateItem = (id, patch) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

  const itemsTotal = receiptTotal(items);
  const canSave = isValidDateString(date) && items.length > 0 && items.every((it) => it.name.trim());

  // 警告(登録自体は可能。値引き行や同じ買い物の2回目など、正当な場合もあるため)
  const negativeItems = findNegativeItems(items);
  const duplicate = findDuplicateReceipt(receipts, { date, time, items });

  const handleSave = () => {
    onSave({
      id: crypto.randomUUID(),
      date,
      time,
      store: store.trim(),
      items: items.map((it) => ({ ...it, name: it.name.trim() })),
      createdAt: new Date().toISOString(),
    });
  };

  return (
    <section className="card">
      <h2>読み取り結果の確認</h2>
      <div className="form-row">
        <label>
          日付
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </label>
        <label>
          時刻
          <input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        </label>
        <label>
          店名
          <input type="text" value={store} onChange={(e) => setStore(e.target.value)} />
        </label>
      </div>

      <table className="table">
        <thead>
          <tr>
            <th>商品名</th>
            <th className="num">金額(円)</th>
            <th>カテゴリ</th>
            <th aria-label="操作" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className={item.amount < 0 ? "row-warn" : undefined}>
              <td>
                <input type="text" value={item.name} onChange={(e) => updateItem(item.id, { name: e.target.value })} />
              </td>
              <td className="num">
                <input
                  type="number"
                  step="1"
                  value={item.amount}
                  // 金額は円単位の整数で扱う
                  onChange={(e) => updateItem(item.id, { amount: Math.trunc(Number(e.target.value) || 0) })}
                />
              </td>
              <td>
                <select value={item.category} onChange={(e) => updateItem(item.id, { category: e.target.value })}>
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </td>
              <td>
                <button className="link danger" onClick={() => removeItem(item.id)}>
                  削除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="totals">
        明細合計 <strong>{formatYen(itemsTotal)}</strong>
        {result.total > 0 && (
          <>
            ／ レシート記載の合計 {formatYen(result.total)}
            {result.total !== itemsTotal && <span className="warn">(差額 {formatYen(result.total - itemsTotal)})</span>}
          </>
        )}
      </p>

      {negativeItems.length > 0 && (
        <div className="alert" role="alert">
          ⚠ 金額が負の値の明細があります({negativeItems.map((it) => it.name || "名称なし").join("、")})。
          値引き・割引の行でなければ金額を修正してください。
        </div>
      )}
      {duplicate && (
        <div className="alert" role="alert">
          ⚠ 同じ日時・合計金額のレシートが既に登録されています(
          {[duplicate.date, duplicate.time, duplicate.store || "店名なし"].filter(Boolean).join(" ")}、
          {formatYen(receiptTotal(duplicate.items))})。二重登録でないか確認してください。
        </div>
      )}

      <div className="actions">
        <button onClick={onCancel}>キャンセル</button>
        <button className="primary" onClick={handleSave} disabled={!canSave}>
          登録する
        </button>
      </div>
    </section>
  );
}
