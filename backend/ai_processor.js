import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function processNewsWithAI(newsItems) {
  if (!process.env.GEMINI_API_KEY) {
    console.error('❌ GEMINI_API_KEY is not set in .env file.');
    return null;
  }

  if (!newsItems || newsItems.length === 0) {
    console.log('No news items to process.');
    return null;
  }

  console.log(`🤖 Processing ${newsItems.length} news items with Gemini AI...`);

  // AIに渡すための記事リスト文字列を作成
  const newsListString = newsItems.map((item, index) =>
    `[${index}] ${item.title} (Source: ${item.source})\nLink: ${item.link}\nSnippet: ${item.contentSnippet}\n`
  ).join('\n---\n');

  const prompt = `
あなたはプロのITジャーナリストです。以下のAI関連ニュース記事のリストから、今日の重要なトピックを選定し、指定されたJSON形式で出力してください。

【タスク】
1. リストの中で最も重要と思われる「ヘッドラインニュース」を3件選び、それぞれ150文字程度で日本語で要約してください。
2. 次に重要と思われる「次点のニュース」を10件選び、それぞれ50文字程度の簡単な日本語の要約を付けてください。
3. 選ばれなかった残りのニュースすべてを「その他のニュース」としてください。

【出力形式】
以下の構造の有効なJSONのみを出力してください。マークダウンの記法（\`\`\`json など）は含めないでください。

{
  "headlines": [
    {
      "title": "記事のタイトル",
      "summary": "要約文（150文字程度）",
      "source": "ニュース元の名前",
      "link": "記事のURL",
      "pubDate": "記事の日時文字列"
    }
  ],
  "subNews": [
    {
      "title": "記事のタイトル",
      "summary": "要約文（50文字程度）",
      "source": "ニュース元の名前",
      "link": "記事のURL",
      "pubDate": "記事の日時文字列"
    }
  ],
  "otherNews": [
    {
      "title": "記事のタイトル",
      "source": "ニュース元の名前",
      "link": "記事のURL",
      "pubDate": "記事の日時文字列"
    }
  ],
  "generatedAt": "生成した現在の日時（ISO文字列など）"
}

【ニュース記事リスト】
${newsListString}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.2,
      }
    });

    let responseText = response.text;
    // マークダウンのコードブロックが含まれている場合は除去
    responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();

    const processedData = JSON.parse(responseText);

    // generatedAtを上書きして正確な時間に
    processedData.generatedAt = new Date().toISOString();

    // データの保存ディレクトリの確認と作成
    const dataDir = path.resolve('data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const outputPath = path.resolve(dataDir, 'latest_news.json');
    fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));

    console.log(`✅ AI processing complete. Data saved to ${outputPath}`);
    return processedData;

  } catch (error) {
    console.error('❌ Error during AI processing:', error);
    return null;
  }
}
