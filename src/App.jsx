import { useEffect, useState } from "react";
import Charts from "./components/Charts.jsx";
import ExpenseList from "./components/ExpenseList.jsx";
import ReceiptReview from "./components/ReceiptReview.jsx";
import ReceiptUpload from "./components/ReceiptUpload.jsx";
import { loadReceipts, saveReceipts } from "./utils/storage.js";

export default function App() {
  // 起動時にローカルストレージから復元する
  const [receipts, setReceipts] = useState(loadReceipts);
  // 読み取り直後で、まだ登録していない結果
  const [pending, setPending] = useState(null);

  // データが変わるたびに保存する
  useEffect(() => saveReceipts(receipts), [receipts]);

  const addReceipt = (receipt) => {
    setReceipts((prev) => [...prev, receipt]);
    setPending(null);
  };

  const changeCategory = (receiptId, itemId, category) => {
    setReceipts((prev) =>
      prev.map((r) =>
        r.id === receiptId ? { ...r, items: r.items.map((it) => (it.id === itemId ? { ...it, category } : it)) } : r,
      ),
    );
  };

  const deleteItem = (receiptId, itemId) => {
    if (!confirm("この明細を削除しますか?")) return;
    setReceipts((prev) =>
      prev
        .map((r) => (r.id === receiptId ? { ...r, items: r.items.filter((it) => it.id !== itemId) } : r))
        // 明細がなくなったレシートは削除する
        .filter((r) => r.items.length > 0),
    );
  };

  return (
    <div className="container">
      <header>
        <h1>レシート家計簿</h1>
      </header>

      {pending ? (
        <ReceiptReview result={pending} receipts={receipts} onSave={addReceipt} onCancel={() => setPending(null)} />
      ) : (
        <ReceiptUpload onAnalyzed={setPending} />
      )}

      <Charts receipts={receipts} />
      <ExpenseList receipts={receipts} onChangeCategory={changeCategory} onDeleteItem={deleteItem} />
    </div>
  );
}
