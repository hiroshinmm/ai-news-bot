# AIニュース自動収集・要約ツール タスクリスト

- [x] 1. プロジェクト基盤のセットアップ
  - [x] Node.js プロジェクトの初期化 (`package.json`)
  - [x] 必要なライブラリのインストール
  - [x] `.env` ファイルの用意と環境変数の設定枠作成
  - [x] フロントエンド基盤構築 (Vite + Vanilla JS)

- [x] 2. バックエンドロジックの実装
  - [x] ニュース取得モジュール作成 (`fetcher.js`: 複数RSSリーダー機能)
  - [x] AI処理モジュール作成 (`ai_processor.js`: GeminiAPIを使った要約・仕分け)
  - [x] JSON書き出し処理の実装
  - [x] メール送信モジュール作成 (`mailer.js`: Nodemailer設定)
  - [x] 統合スクリプトの作成（`index.js`: 一連のフロー実行とcron設定）

- [x] 3. フロントエンドのUIレイアウト改修・要約追加
  - [x] バックエンド(`ai_processor.js`)の修正：次点10件の出力JSONにも要約(summary)を含めるようプロンプト変更
  - [x] フロントエンド(`style.css`)の修正：横長2カラムレイアウトを廃止し、縦積みのフルウィズレイアウトに変更
  - [x] フロントエンド(`main.js`, `index.html`)の修正：次点ニュース(Top10)にも要約文を表示するようDOM構築ロジックを変更
  - [x] UI崩れがないかフロントエンドの再確認

- [x] 4. テストとデバッグ
  - [x] バックエンド単体動作確認 (手動実行)
  - [x] フロントエンドUI確認 (Notable Newsの横幅と要約文、Other Newsの配置)
  - [x] 定期実行(cron)の動作確認

- [ ] 5. GitHub Actionsによる完全自動化 (クラウド運用)
  - [ ] プロジェクトのGitリポジトリ初期化 (`git init` など)
  - [x] GitHub Actions用のワークフローファイル (`.github/workflows/daily_news.yml`) の作成
  - [ ] GitHubへのプッシュとユーザーへのSecret設定 (.envの内容) の案内
