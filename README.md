# 教科書クイズアプリ

教科書の写真またはテキストからAIが問題を自動生成するアプリです。

## セットアップ手順

### 1. APIキーを取得する
1. https://console.anthropic.com にアクセス
2. アカウント登録 → クレジットカード登録（$5程度チャージ）
3. 「API Keys」からAPIキーをコピー

### 2. 環境変数を設定する
```bash
cp .env.local.example .env.local
```
`.env.local` を開いて `your_api_key_here` を実際のAPIキーに書き換える。

### 3. 依存関係をインストールして起動
```bash
npm install
npm run dev
```
ブラウザで http://localhost:3000 を開く。

---

## Vercelにデプロイする手順

### 1. GitHubにプッシュ
```bash
git init
git add .
git commit -m "initial commit"
# GitHubで新しいリポジトリを作成して push
git remote add origin https://github.com/あなたのユーザー名/quiz-app.git
git push -u origin main
```

### 2. Vercelにデプロイ
1. https://vercel.com にアクセス（GitHubアカウントでログイン）
2. 「New Project」→ 作成したリポジトリを選択
3. 「Environment Variables」に以下を追加:
   - Name: `ANTHROPIC_API_KEY`
   - Value: （APIキーを貼り付け）
4. 「Deploy」ボタンを押す

数分でURLが発行され、スマホからも使えるようになります。

---

## 料金の目安
- 写真1枚＋問題5問生成 ≒ 約0.2〜0.5円
- 毎日10回使っても月150円程度
