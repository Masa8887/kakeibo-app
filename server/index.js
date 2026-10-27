import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import multer from "multer";
import { analyzeReceipt, ReceiptError, SUPPORTED_MEDIA_TYPES } from "./receipt.js";

const PORT = Number(process.env.PORT) || 3001;
// Claude API の画像サイズ上限(5MB)に合わせる
const MAX_FILE_SIZE = 5 * 1024 * 1024;

if (!process.env.ANTHROPIC_API_KEY) {
  console.warn("⚠ ANTHROPIC_API_KEY が設定されていません。.env.example を参考に .env を作成してください。");
}

const app = express();

// アップロード画像はディスクに保存せずメモリ上で扱う
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
});

// レシート画像を受け取り、Claude で読み取った結果を返す
app.post("/api/receipts/analyze", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "画像ファイルが送信されていません。" });
  }
  if (!SUPPORTED_MEDIA_TYPES.includes(req.file.mimetype)) {
    return res.status(400).json({ error: "対応していない画像形式です(JPEG / PNG / GIF / WebP のみ)。" });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "サーバーに ANTHROPIC_API_KEY が設定されていません。" });
  }

  try {
    const result = await analyzeReceipt(req.file.buffer, req.file.mimetype);
    res.json(result);
  } catch (err) {
    if (err instanceof ReceiptError) {
      return res.status(err.status).json({ error: err.message });
    }
    // Claude API のエラーは種類ごとに利用者向けメッセージを分ける
    if (err instanceof Anthropic.AuthenticationError) {
      console.error("Claude API 認証エラー:", err.message);
      return res.status(500).json({ error: "サーバーの API キー設定に問題があります。" });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: "混み合っています。少し待ってから再度お試しください。" });
    }
    if (err instanceof Anthropic.APIConnectionError) {
      console.error("Claude API 接続エラー:", err.message);
      return res.status(502).json({ error: "Claude API に接続できませんでした。" });
    }
    if (err instanceof Anthropic.APIError) {
      console.error(`Claude API エラー (${err.status}):`, err.message);
      return res.status(502).json({ error: "レシートの読み取りに失敗しました。" });
    }
    console.error("予期しないエラー:", err);
    res.status(500).json({ error: "サーバー内部でエラーが発生しました。" });
  }
});

// multer のファイルサイズ超過などのエラー処理
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ error: "画像サイズが大きすぎます(5MBまで)。" });
  }
  next(err);
});

// 本番時はビルド済みのフロントエンドを配信する
const distDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");
app.use(express.static(distDir));

app.listen(PORT, () => {
  console.log(`サーバー起動: http://localhost:${PORT}`);
});
