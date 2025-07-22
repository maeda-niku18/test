# 📘 ジェビケン（Jebiken）- 勤怠管理システム

Firestoreをバックエンドに用いた、ログイン情報を保持せずに運用可能なサーバーレス勤怠管理システムです。

## 🚀 特徴

- **サーバーレス構成**: Firebase/Firestoreを使用
- **パスワード暗号化**: SHA-256による安全なパスワード管理
- **GPS対応**: 出勤・退勤時の位置情報記録
- **有給管理**: 申請・承認ワークフロー
- **CSV出力**: 月別勤怠データのエクスポート機能
- **役割ベース**: 管理者・一般ユーザーの権限分離

## 📋 機能一覧

### 👥 ユーザー種別

| 種別 | 機能 |
|------|------|
| **管理者** | ユーザー作成、勤怠設定、有給承認、CSV出力、ユーザー管理 |
| **一般ユーザー** | 出勤・退勤・休憩記録、有給申請、自己勤怠確認 |

### 🕹️ 一般ユーザー機能

- **勤怠記録**
  - 出勤登録（GPS位置記録付き）
  - 休憩開始・終了
  - 退勤登録（GPS位置記録付き）
  - リアルタイム時計表示
  - 勤務状態の視覚的表示
- **有給管理**
  - 有給申請（日付・理由入力）
  - 申請状況確認（承認済み/未承認）
  - 申請履歴一覧

### 🧑‍💼 管理者機能

- **ユーザー管理**
  - 新規ユーザー作成（メール・パスワード・名前・役割）
  - ユーザー一覧表示
  - ユーザー削除
  - パスワード暗号化（SHA-256）
- **有給承認**
  - 全ユーザーの申請一覧表示
  - ワンクリック承認機能
  - 承認履歴管理
- **データ出力**
  - 月別勤怠データCSV出力（予定）
  - レポート機能（予定）

## 🔧 技術構成

- **フロントエンド**: HTML, CSS, JavaScript (ES6+)
- **バックエンド**: Firebase Firestore
- **認証**: カスタム認証（SHA-256暗号化）
- **位置情報**: Geolocation API

## 🗂️ Firestore データ構造

```
jebiken/
├── users/{userId}
│   ├── name: "ユーザー名"
│   ├── email: "メールアドレス"
│   ├── role: "admin" | "user"
│   └── encryptedPassword: "SHA-256ハッシュ"
│
├── attendances/{userId}/records/{date}
│   ├── startTime: timestamp
│   ├── breakStartTime: timestamp
│   ├── breakEndTime: timestamp
│   ├── endTime: timestamp
│   └── location: { lat, lng }
│
└── paidLeaves/{userId}/requests/{requestId}
    ├── date: "YYYY-MM-DD"
    ├── reason: "理由"
    ├── approved: boolean
    ├── requestedAt: timestamp
    ├── approvedAt: timestamp (optional)
    └── approvedBy: "管理者ID" (optional)
```

## 🚦 セットアップ

### 1. Firebase設定

1. Firebaseプロジェクトを作成
2. Firestoreを有効化
3. `firebase-config.js`の設定情報を更新

```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-auth-domain",
  projectId: "your-project-id",
  storageBucket: "your-storage-bucket",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id"
};
```

### 2. ローカル実行

```bash
# HTTPサーバーで実行（例：Live Server）
npx live-server .

# または
python -m http.server 8000

# またはVSCodeのLive Server拡張機能を使用
```

## 🔐 初期ログイン情報

**管理者アカウント**
- メール: `aaa@bbb.com`
- パスワード: `123`

## 📁 ファイル構成

```
jebiken/
├── index.html              # エントリーポイント（login.htmlにリダイレクト）
├── login.html              # ログイン画面
├── admin-dashboard.html    # 管理者ダッシュボード
├── user-dashboard.html     # 一般ユーザーダッシュボード
├── firebase-app.js         # Firebase連携・アプリケーションロジック
├── style.css              # 共通スタイルシート
└── README.md              # このファイル
```

## 🌍 対応ブラウザ

- Chrome 60+
- Firefox 55+
- Safari 11+
- Edge 79+

## 📍 GPS機能について

- 出勤・退勤時に自動で位置情報を取得
- ブラウザの位置情報許可が必要
- GPS取得失敗時は (0, 0) で記録

## 📊 CSV出力形式

出力されるCSVファイルには以下の項目が含まれます：

| 項目 | 説明 |
|------|------|
| ユーザー名 | 従業員名 |
| メール | メールアドレス |
| 日付 | 勤務日 |
| 出勤時刻 | 出勤時刻 |
| 休憩開始 | 休憩開始時刻 |
| 休憩終了 | 休憩終了時刻 |
| 退勤時刻 | 退勤時刻 |
| 労働時間 | 実労働時間（休憩時間除く） |
| 有給 | 有給取得日の場合は「有給」と表示 |

## 🔒 セキュリティ

- パスワードはSHA-256で暗号化して保存
- ログインセッションは保持せず、毎回認証
- Firestoreのセキュリティルールで適切なアクセス制御を推奨

## 🚀 使用方法

### ログインから利用開始まで

1. `jebiken/index.html` をブラウザで開く（自動でlogin.htmlにリダイレクト）
2. 管理者でログイン: `aaa@bbb.com` / `123`
3. **管理者の場合**: ユーザー作成 → 有給承認 → レポート確認
4. **一般ユーザーの場合**: 勤怠記録 → 有給申請 → 記録確認

### 画面遷移

```
login.html → admin-dashboard.html (管理者)
           → user-dashboard.html   (一般ユーザー)
```

## ⚠️ 注意事項

- このシステムはデモ・モック用途として設計されています
- 勤怠記録は一部ローカルストレージを使用（Firebaseとの連携は部分的）
- 本格運用には追加のセキュリティ対策が必要です
- Firestoreのセキュリティルールを適切に設定してください

## 🤝 貢献

バグ報告や機能提案はIssueまでお願いします。

## 📄 ライセンス

MIT License