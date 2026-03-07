# AIニュース自動収集・要約ツール 実装計画

本プロジェクトは、毎朝自動でAI関連のニュースを収集し、Gemini APIを用いて重要トピックの抽出・要約を行い、ブラウザで美しく表示するとともにGmailに通知を送るシステムを構築します。

## ユーザー要件（User Requirements）
* AI関連のニュースを毎朝自動収集
* ブラウザで表示（美しく、プレミアムなデザインで）
* Gmail宛てに要約、次点10件、およびその他の全ニュース一覧をメール通知
* ヘッドライン：最も重要なニュース3件をピックアップし要約、ソースへのリンク付き
* 次点：収集ソースからさらに10件のニュースをピックアップ
* その他：取得した全ニュースのリスト一覧を表示
* ニュースソース：信頼できる主要なAIニュース・テックニュース系サイトから選定

## 実装概要 (Architecture)
バックエンド（Node.jsスクリプト）とフロントエンド（Webアプリ）の構成をとります。
データはバックエンド側で生成し、JSON形式で保存してフロントエンドで読み込みます。

1. **データ収集と要約 (Backend)**
   - **ニュース収集**: `rss-parser` を用いて、主要ニュースサイト（Google News, TechCrunch, The Verge, ITmedia, Zenn等）から最新記事を取得。
   - **AI要約・選定**: 取得した記事一覧を `@google/genai` (Gemini API) に渡し、以下の指定でプロンプト処理。
     - 最も重要なニュース3件を選定し日本語で要約。
     - 次点として重要なニュース10件を選定し、短い日本語の要約を追加する。
     - 残りのニュースを「その他のニュース」へ分類。
   - **保存**: 処理完了後、 `data/latest_news.json` として結果を保存。
   - **メール通知**: `nodemailer` を使用し、要約内容とWebアプリへのリンクを含むHTMLメールをユーザーのGmail宛てに送信。
2. **ブラウザ表示 (Frontend)**
   - Vite + Vanilla JS + CSS で構築。
   - リッチでプレミアムなデザイン（ダークモード、美しいフォント、グラスモーフィズムやホバーアニメーション）を採用。
   - APIではなく、生成された `data/latest_news.json` をFetchしてDOMを生成。
3. **自動化 (GitHub Actions)**
   - ユーザーのPCが起動していなくても実行できるよう、GitHub Actionsのcronスケジュールトリガーを利用し、毎朝7時に自動でクラウド上でNodeスクリプトを実行する構成に変更。

## User Review Required

> [!IMPORTANT]  
> 以下の事項について準備・設定が必要となります。ご確認をお願いします。
> 1. **Gemini APIキー**: AI要約のために必要です。`.env` ファイルに設定します。
> 2. **Gmail アプリパスワード**: プログラムからメールを送信するために、ご自身のGoogleアカウントで「アプリパスワード」の生成が必要です。
> 3. **送信先・送信元メールアドレス**: いずれもご自身のGmailアドレスで設定します。

## Proposed Changes

### バックエンド (データ処理・通知)
#### [NEW] `package.json`
必要なパッケージ（`rss-parser`, `@google/genai`, `nodemailer`, `dotenv`, `node-cron`等）の定義。
#### [NEW] `backend/fetcher.js`
各RSSフィードから記事を取得・整形する処理。
#### [NEW] `backend/ai_processor.js`
Gemini APIを呼び出し、記事を選定・要約する処理。
#### [NEW] `backend/mailer.js`
Gmail経由でのメール送信処理。
#### [NEW] `backend/index.js`
全体のワークフローを統合し、スクリプト実行時に1度だけ処理を回すメインスクリプト（GitHub Actions用）。

#### [NEW] `.github/workflows/daily_news.yml`
毎朝7時（JST）および手動で実行できるように設定したGitHub Actionsのワークフロー定義ファイル。

### フロントエンド (Webアプリ表示)
#### [MODIFY] `frontend/index.html`
ヘッドライン(3件)、次点(10件:要約付き)、その他一覧が縦に並ぶフルウィズのレイアウ構造に変更。
#### [NEW] `frontend/style.css`
洗練されたモダンUIのためのCSS（CSS Variables, Grid/Flexbox, Transitions）。
#### [NEW] `frontend/main.js`
`latest_news.json` を読み込み、画面を描画するロジック。
#### [NEW] `data/latest_news.json`
プレースホルダーとなるデータファイル。

## Verification Plan

### 自動・手動テスト
1. **バックエンドテスト**: 
   - `node backend/index.js`を手動実行し、エラーなくRSSの取得〜AI処理〜JSONファイルの生成が完了するか検証。
   - `.env`にテスト用の情報を設定し、実際にメール送信が行われるか確認。
2. **フロントエンドテスト**:
   - `npm run dev` でローカルサーバーを起動し、生成された `latest_news.json` のデータが正しく、かつ美しくブラウザ上にレンダリングされるか確認。レスポンシブデザインも検証。
3. **定期実行テスト**:
   - 一時的にcronのスケジューリングを数分後に設定し、自動でプロセスが動くか検証。
