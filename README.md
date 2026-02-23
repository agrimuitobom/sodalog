# そだログ (Sodalog)

農業高校生のための栽培記録アプリ。カメラで撮影した作物の成長をFirestoreに記録し、カレンダー・タイムライン・グラフで振り返ることができます。

## 技術スタック

- **フロントエンド**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- **バックエンド**: Firebase (Authentication, Firestore, Storage)
- **気象データ**: Open-Meteo API（無料、APIキー不要）
- **ホスティング**: Firebase Hosting（静的エクスポート）

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Firebase プロジェクトの設定

1. [Firebase Console](https://console.firebase.google.com/) でプロジェクトを作成
2. Authentication で Google ログインを有効化
3. Firestore Database を作成
4. Storage を有効化
5. ウェブアプリを追加して設定情報を取得

### 3. 環境変数の設定

`.env.local` を作成し、Firebase の設定情報を記入：

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### 4. `.firebaserc` の更新

`.firebaserc` 内のプロジェクトIDを自分のFirebaseプロジェクトIDに変更：

```json
{
  "projects": {
    "default": "your-project-id"
  }
}
```

### 5. 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開きます。

## デプロイ

### Firebase Hosting へのデプロイ

```bash
# 全体デプロイ（ビルド + Hosting + Firestore Rules + Storage Rules）
npm run deploy

# Hosting のみ
npm run deploy:hosting

# Firestore / Storage ルールのみ
npm run deploy:rules

# Firestore インデックスのみ
npm run deploy:indexes
```

### 初回デプロイ時

Firebase CLI でログインが必要です：

```bash
npx firebase login
```

## 機能一覧

### Phase 1（MVP）
- Google アカウントログイン
- カメラ撮影 + 画像圧縮
- 栽培記録の作成・編集・削除
- カレンダー表示 / タイムライン表示
- 記録詳細表示

### Phase 2
- 色解析（RGB値・緑色面積比）
- 比較表示（タイムラインモード・個別モード）
- 圃場・グループ管理
- 成長グラフ（Recharts）

### Phase 3
- データエクスポート（CSV）← 実装済み
- 共有リンク + コメント機能
- 気象データ連携（Open-Meteo API）

## プロジェクト構成

```
src/
├── app/           # Next.js App Router ページ
├── components/    # 共通コンポーネント
├── contexts/      # React Context (Auth)
├── lib/           # Firebase操作、API、ユーティリティ
└── types/         # TypeScript型定義
```
