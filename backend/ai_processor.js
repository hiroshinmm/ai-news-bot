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
2. 次に重要と思われる「次点のニュース」を10件選び、それぞれ100文字程度の日本語の要約を付けてください。
3. 出力には、選んだ計13件のニュースのみを含めてください。「その他のニュース」は出力に含めないでください。

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
      "summary": "要約文（100文字程度）",
      "source": "ニュース元の名前",
      "link": "記事のURL",
      "pubDate": "記事の日時文字列"
    }
  ]
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
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      responseText = jsonMatch[0];
    }

    let processedData = {};
    try {
      processedData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ Failed to parse JSON from AI response:', parseError);
      console.log('--- RAW AI RESPONSE ---');
      console.log(responseText);
      console.log('-----------------------');
      return null;
    }

    // 選ばれた記事のURLをセットにまとめる
    const selectedUrls = new Set([
      ...(processedData.headlines || []).map(n => n.link),
      ...(processedData.subNews || []).map(n => n.link)
    ]);

    // 選ばれなかった残りの記事を otherNews としてスクリプト側で追加する
    processedData.otherNews = newsItems
      .filter(n => !selectedUrls.has(n.link))
      .map(n => ({
        title: n.title,
        source: n.source,
        link: n.link,
        pubDate: n.pubDate
      }));

    // generatedAtを付加して正確な時間に
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
