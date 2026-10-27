// ローカルストレージのキー
const STORAGE_KEY = "kakeibo:receipts";

/** 保存済みのレシート一覧を読み込む(読めない場合は空配列) */
export function loadReceipts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/** レシート一覧を保存する */
export function saveReceipts(receipts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
  } catch (err) {
    // 容量超過やプライベートモードなどで保存できない場合
    console.error("ローカルストレージへの保存に失敗しました:", err);
  }
}
