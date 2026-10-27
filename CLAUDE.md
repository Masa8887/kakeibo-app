# CLAUDE.md

このファイルは、このリポジトリで作業する Claude Code 向けのガイドです。

## プロジェクト概要

**kakeibo-app** — 家計簿アプリ。収入・支出を記録し、カテゴリ別・月別に集計して家計を把握するためのアプリケーション。

レシート画像を Claude API で読み取り、商品をカテゴリ別に自動分類して集計する。

## 技術スタック

- フロントエンド: React + Vite、グラフは Chart.js(react-chartjs-2)
- バックエンド: Node.js + Express(Claude API の呼び出しはここだけで行う)
- Claude API: `@anthropic-ai/sdk`、モデルは `claude-haiku-5-5`、Structured Outputs(zod)で JSON を受け取る
- データ保存: ブラウザのローカルストレージ(キー `kakeibo:receipts`)
- パッケージ管理: npm
- API キー: `.env` の `ANTHROPIC_API_KEY`(`.gitignore` 済み。`.env.example` を参照)

## よく使うコマンド

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動(バックエンド :3001 とフロントエンド :5173 を同時起動)
npm run dev

# テストの実行
npm test

# ビルド
npm run build

# Lint / フォーマット
# (未導入)
```

## ディレクトリ構成

```
server/
  index.js        Express サーバー(/api/receipts/analyze)
  receipt.js      Claude API でレシートを読み取る処理
src/
  App.jsx         画面全体と状態管理
  components/     アップロード・確認フォーム・グラフ・明細一覧
  utils/          カテゴリ定義・日付・集計・ローカルストレージ・画像縮小
```

## 開発ルール

- UI の文言・コメントは日本語で記述する
- 金額は浮動小数点の誤差を避けるため、整数(円単位)で扱う
- 日付はタイムゾーンを意識して扱う(基本は日本時間 / Asia/Tokyo)
- 変更を加えたら、テストやLintがある場合は実行して通ることを確認する

## Git 運用ルール

- **コードを変更するたびに、コミットして GitHub にプッシュすること。**
  - 1つのまとまった変更(機能追加・バグ修正・リファクタリングなど)が終わるごとに `git add` → `git commit` → `git push` を行う
  - 変更をローカルに溜め込まず、こまめにプッシュする
- コミットメッセージは日本語で、変更内容が分かるように簡潔に書く
  - 例: `支出入力フォームを追加`、`月別集計の計算ミスを修正`
- プッシュ前に、テスト・Lint がある場合は通ることを確認する
- `.env` や認証情報などの秘密情報はコミットしない(`.gitignore` に追加する)
- force push(`git push --force`)は行わない
