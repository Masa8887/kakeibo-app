import { useState } from "react";
import { CATEGORIES } from "../utils/categories.js";
import { isValidDateString, todayInTokyo } from "../utils/date.js";
import { formatYen } from "../utils/summary.js";

/**
 * 読み取り結果を確認・修正してから登録するフォーム
 * @param {{ result: object, onSave: (receipt: object) => void, onCancel: () => void }} props
 */
export default function ReceiptReview({ result, onSave, onCancel }) {
  // 日付が読み取れなかった場合は日本時間の今日を初期値にする
  const [date, setDate] = useState(isValidDateString(result.date) ? result.date : todayInTokyo());
  const [store, setStore] = useState(result.store);
  const [items, setItems] = useState(() => result.items.map((item) => ({ ...item, id: crypto.randomUUID() })));

  const updateItem = (id, patch) => setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const removeItem = (id) => setItems((prev) => prev.filter((it) => it.id !== id));

  const itemsTotal = items.reduce((sum, it) => sum + it.amount, 0);
  const canSave = isValidDateString(date) && items.length > 0 && items.every((it) => it.name.trim());

  const handleSave = () => {
    onSave({
      id: crypto.randomUUID(),
      date,
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
            <tr key={item.id}>
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

      <div className="actions">
        <button onClick={onCancel}>キャンセル</button>
        <button className="primary" onClick={handleSave} disabled={!canSave}>
          登録する
        </button>
      </div>
    </section>
  );
}
