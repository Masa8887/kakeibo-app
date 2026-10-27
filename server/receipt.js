import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { z } from "zod";
import { CATEGORIES } from "../src/utils/categories.js";

// 使用するモデル(Claude Haiku の最新版)
export const MODEL = "claude-haiku-5-5";

// Claude API が対応している画像形式
export const SUPPORTED_MEDIA_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

// Claude に返してもらうレシートの構造(Structured Outputs でこの形を保証する)
const ReceiptSchema = z.object({
  store: z.string().describe("店名。読み取れない場合は空文字"),
  date: z.string().describe("購入日(YYYY-MM-DD)。読み取れない場合は空文字"),
  items: z.array(
    z.object({
      name: z.string().describe("商品名"),
      amount: z.number().int().describe("金額(円・整数)。値引きは負の数"),
      category: z.enum(CATEGORIES).describe("商品のカテゴリ"),
    }),
  ),
  total: z.number().int().describe("レシートの合計金額(円・整数)。読み取れない場合は 0"),
});

const PROMPT = `この画像は日本のレシートです。内容を読み取ってください。

ルール:
- items には購入した商品を1行ずつ入れる。金額はその行の支払額(数量×単価)を円単位の整数で入れる。
- 値引き・割引の行は、負の金額の項目として入れる(カテゴリは対象商品と同じにする)。
- 外税表記で商品金額に消費税が含まれていない場合は、「消費税」という項目を1つ追加する(カテゴリは「その他」)。
- 小計・合計・お預り・お釣り・ポイントなどの行は items に入れない。
- category は次から選ぶ: ${CATEGORIES.join("、")}。
  - スーパー等で買った食材・飲み物・お菓子は「食費」、飲食店での食事は「外食」。
  - 洗剤・ティッシュ・消耗品などは「日用品」。
- 日付は和暦なら西暦に変換して YYYY-MM-DD で答える。
- 画像がレシートでない場合や読み取れない場合は items を空配列にする。`;

// API キーは環境変数 ANTHROPIC_API_KEY から SDK が自動で読み込む
const client = new Anthropic();

/**
 * レシート画像を Claude に読み取らせ、店名・日付・商品一覧を返す
 * @param {Buffer} imageBuffer 画像データ
 * @param {string} mediaType 画像の MIME タイプ
 */
export async function analyzeReceipt(imageBuffer, mediaType) {
  const response = await client.messages.parse({
    model: MODEL,
    max_tokens: 16000,
    output_config: {
      effort: "medium",
      format: zodOutputFormat(ReceiptSchema),
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: imageBuffer.toString("base64") },
          },
          { type: "text", text: PROMPT },
        ],
      },
    ],
  });

  // 安全上の理由で応答が拒否された場合
  if (response.stop_reason === "refusal") {
    throw new ReceiptError("画像の読み取りが拒否されました。別の画像でお試しください。", 422);
  }
  // 出力が途中で切れた場合
  if (response.stop_reason === "max_tokens" || !response.parsed_output) {
    throw new ReceiptError("レシートの読み取り結果が不完全でした。もう一度お試しください。", 502);
  }

  return response.parsed_output;
}

// 利用者に表示してよいメッセージとステータスコードを持つエラー
export class ReceiptError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}
