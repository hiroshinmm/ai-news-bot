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

- [x] 5. GitHub Actionsによる完全自動化 (クラウド運用)
  - [x] プロジェクトのGitリポジトリ初期化 (`git init` など)
  - [x] GitHub Actions用のワークフローファイル (`.github/workflows/daily_news.yml`) の作成
  - [x] GitHubへのプッシュとユーザーへのSecret設定 (.envの内容) の案内

- [x] 6. GitHub Pagesを使ったダッシュボードのWeb公開
  - [x] `vite.config.js` および `package.json` にビルド設定を追加
  - [x] GitHub Actionsのワークフローに Pages Deploy ステップを追加
  - [x] 変更内容をGitHubにPush
  - [x] GitHub Pagesでのデータ取得パスの修正 (`main.js`)
  - [x] ユーザーによるリポジトリのPublic化とPages有効化の完了

- [x] 7. Google Newsリンクのユーザビリティ改善
  - [x] `backend/fetcher.js` にGoogle NewsのURLデコードロジックを追加
  - [x] 取得されるリンクがオリジナルの記事URLになることを確認
  - [x] 変更内容をGitHubにPush

- [x] 8. モバイルUIの微調整
  - [x] `frontend/style.css` で「その他のニュース」のタイトルが折り返されるように修正
  - [x] 変更内容をGitHubにPush

- [x] 9. リンク・日付・バッジの最終修正
  - [x] `backend/ai_processor.js` でAIによるリンク/日付の改変を防止（インデックスによる復元）
  - [x] `frontend/main.js` または `style.css` で「その他のニュース」のバッジを削除
  - [x] `main.js` の `formatDate` で無効な日付をハンドリング
  - [x] 変更内容をGitHubにPush

- [x] 10. APIクォータと404エラーの修正
  - [x] `backend/ai_processor.js` のモデルを `gemini-3.1-flash-lite-preview` に変更
  - [x] `backend/fetcher.js` から TechCrunch Japan のフィードを削除
  - [x] 変更内容をGitHubにPush

- [x] 11. デザイン刷新 (Concept B-3: Soft Gallery) & 全件要約
  - [x] `backend/ai_processor.js` のプロンプトを修正し、全てのニュースに要約を作成するように変更
  - [x] Google Fonts (Outfit, Inter) のインポート追加 (`frontend/index.html`)
  - [x] `frontend/style.css` をSoft Galleryデザイン（白背景、大きな角丸、ソフトシャドウ、パステル色）に全面書き換え
  - [x] `frontend/main.js` で全てのニュース項目に要約を表示するようにDOM構築ロジックを修正
  - [x] レスポンシブ表示の最終確認
  - [x] 変更内容をGitHubにPush
