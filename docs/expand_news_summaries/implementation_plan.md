# 実装計画：全ニュース記事の要約対応

計50件程度のニュース記事すべてに対して、重要度に応じた要約（200字、150字、100字）を付与し、メールおよびブラウザで見やすく表示するための修正を行います。

## ユーザーレビューが必要な項目
- **AI処理の負荷**: 50件すべての記事に要約を付けるため、AIの回答生成時間が少し長くなる可能性があります。

## 変更内容

### [Backend] ニュース処理・メール送信層

#### [MODIFY] [ai_processor.js](file:///c:/Users/hiros/OneDrive/デスクトップ/Antigravity/AI%20News/backend/ai_processor.js)
- **AIプロンプトの更新**:
  - ヘッドライン（3件、200文字程度）
  - 次点のニュース（10件、150文字程度）
  - その他のニュース（残りの全件、100文字程度）
  の3つのカテゴリと要約文字数を明示。
- **JSON構造の統一**:
  - 出力キーを `headlines`, `subNews`, `otherNews` に固定。
- **ロジックの修正**:
  - 全記事をAIに渡し、すべてに対して要約を生成させるようにプロンプトを調整。
  - スクリプト側で `otherNews` を上書きしていたバグ（10件の要約付きニュースが消えていた問題）の修正。

#### [MODIFY] [mailer.js](file:///c:/Users/hiros/OneDrive/デスクトップ/Antigravity/AI%20News/backend/mailer.js)
- 「その他のニュース」セクションにおいても、`summary` フィールドがある場合は表示するようにHTMLテンプレートを更新。

---

### [Frontend] UI表示層

#### [MODIFY] [main.js](file:///c:/Users/hiros/OneDrive/デスクトップ/Antigravity/AI%20News/frontend/main.js)
- `renderOtherNews` 関数を更新し、記事タイトルだけでなく要約も表示されるように修正。
- `subNews` と `otherNews` の表示形式を統一し、一貫性を持たせる。

#### [MODIFY] [style.css](file:///c:/Users/hiros/OneDrive/デスクトップ/Antigravity/AI%20News/frontend/style.css)
- 「その他のニュース」セクションにおける要約文のスタイリング（フォントサイズ、色、余白など）を調整。

---

## 検証プラン

### 自動テスト / スクリプト実行
- `node backend/fetcher.js` (単体テスト) で記事取得が正常であることを確認。
- `node backend/ai_processor.js --test` (または `index.js --run-now`) を実行し、全記事に要約が含まれた `latest_news.json` が生成されることを確認。

### 手動検証
1. **データの確認**: `data/latest_news.json` を開き、以下のキーと内容が含まれているか確認。
   - `headlines` (3件)
   - `subNews` (10件)
   - `otherNews` (残りすべて)
   - 各記事に `summary` フィールドが存在すること。
2. **UIの確認**: `npm run dev` でローカルサーバーを起動し、ブラウザ上で全記事に要約が表示されているか確認。
3. **メールの確認**: テスト実行で送信されたメールを開き、下部のリストにも要約が含まれているか確認。
