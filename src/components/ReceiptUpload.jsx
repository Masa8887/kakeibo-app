import { useEffect, useState } from "react";
import { resizeImage } from "../utils/image.js";

/**
 * レシート画像を選択してバックエンドに送り、読み取り結果を親に渡す
 * @param {{ onAnalyzed: (result: object) => void }} props
 */
export default function ReceiptUpload({ onAnalyzed }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  // プレビュー用 URL を不要になったら解放する
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const selectFile = (selected) => {
    if (!selected) return;
    if (!selected.type.startsWith("image/")) {
      setError("画像ファイルを選択してください。");
      return;
    }
    setError("");
    setFile(selected);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const image = await resizeImage(file);
      const body = new FormData();
      body.append("image", image, "receipt.jpg");

      const res = await fetch("/api/receipts/analyze", { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "読み取りに失敗しました。");
      if (data.items.length === 0) throw new Error("商品を読み取れませんでした。レシートが写っているか確認してください。");

      onAnalyzed(data);
      setFile(null);
      setPreviewUrl(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="card">
      <h2>レシートを読み込む</h2>
      <label
        className={`dropzone${dragging ? " dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          selectFile(e.dataTransfer.files[0]);
        }}
      >
        <input type="file" accept="image/*" hidden onChange={(e) => selectFile(e.target.files[0])} />
        {previewUrl ? (
          <img src={previewUrl} alt="選択したレシート" className="preview" />
        ) : (
          <span>ここに画像をドロップ、またはクリックして選択</span>
        )}
      </label>
      {error && <p className="error">{error}</p>}
      <button className="primary" onClick={handleAnalyze} disabled={!file || loading}>
        {loading ? "読み取り中…" : "読み取る"}
      </button>
    </section>
  );
}
