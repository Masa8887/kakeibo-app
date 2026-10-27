import { CATEGORIES } from "../utils/categories.js";
import { flattenItems, formatYen } from "../utils/summary.js";

/**
 * 登録済みの明細一覧
 * @param {{ receipts: object[], onChangeCategory: Function, onDeleteItem: Function }} props
 */
export default function ExpenseList({ receipts, onChangeCategory, onDeleteItem }) {
  const items = flattenItems(receipts);

  return (
    <section className="card">
      <h2>明細一覧</h2>
      {items.length === 0 ? (
        <p className="muted">まだデータがありません。レシートを読み込んでください。</p>
      ) : (
        <div className="table-scroll">
          <table className="table">
            <thead>
              <tr>
                <th>日時</th>
                <th>店名</th>
                <th>商品名</th>
                <th className="num">金額</th>
                <th>カテゴリ</th>
                <th aria-label="操作" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="nowrap">
                    {item.date} {item.time}
                  </td>
                  <td>{item.store || "—"}</td>
                  <td>{item.name}</td>
                  <td className="num">{formatYen(item.amount)}</td>
                  <td>
                    <select
                      value={item.category}
                      onChange={(e) => onChangeCategory(item.receiptId, item.id, e.target.value)}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <button className="link danger" onClick={() => onDeleteItem(item.receiptId, item.id)}>
                      削除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
