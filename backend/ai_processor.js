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
あなたはプロのITジャーナリストです。以下のAI関連ニュース記事のリストすべてを分析し、指定されたJSON形式で出力してください。

【タスク】
1. リストの中で最も重要と思われる「ヘッドラインニュース」を3件選び、それぞれ200文字程度の日本語で詳しく要約してください。
2. 次に重要と思われる「次点のニュース」を10件選び、それぞれ150文字程度の日本語で詳しく要約してください。
3. 残りのすべてのニュース記事（約30〜40件程度）を「その他のニュース」として、それぞれ150文字程度の日本語で要約してください。
   - 情報量が少ない場合でも、そのニュースの背景や関連するカテゴリーについて解説を加え、必ず150文字程度のボリュームを確保してください。

【出力形式】
以下の構造の有効なJSONのみを出力してください。マークダウンの記法（\`\`\`json など）は含めないでください。各要約フィールド（summary）は指示された文字数を満たすよう注意してください。

{
  "headlines": [
    {
      "id": "リストの[n]に相当する番号",
      "title": "記事のタイトル",
      "summary": "要約文（200文字程度。詳しく記述してください）",
      "source": "ニュース元の名前"
    }
  ],
  "subNews": [
    {
      "id": "リストの[n]に相当する番号",
      "title": "記事のタイトル",
      "summary": "要約文（150文字程度。詳しく記述してください）",
      "source": "ニュース元の名前"
    }
  ],
  "otherNews": [
    {
      "id": "リストの[n]に相当する番号",
      "title": "記事のタイトル",
      "summary": "要約文（150文字程度。記事の内容と背景を詳しく記述してください）",
      "source": "ニュース元の名前"
    }
  ]
}

【ニュース記事リスト】
${newsListString}
`;

  // 試行するモデルの優先順位リスト
  const MODELS_TO_TRY = [
    'gemini-3.1-flash-lite-preview',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash'
  ];

  let response;
  let usedModel = '';

  for (const modelName of MODELS_TO_TRY) {
    try {
      console.log(`🤖 Trying AI processing with model: ${modelName}...`);
      response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.2,
        }
      });
      usedModel = modelName;
      console.log(`✅ AI processing successful with model: ${modelName}`);
      break; // 成功したらループを抜ける
    } catch (error) {
      if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('429')) {
        console.warn(`⚠️ Quota exceeded for model ${modelName}. Trying next model...`);
        continue;
      }
      // クォータ以外のエラー（404など）でも次を試す
      console.warn(`❌ Error with model ${modelName}: ${error.message}. Trying next model...`);
      continue;
    }
  }

  if (!response) {
    console.error('❌ All AI models failed or exceeded quota.');
    return null;
  }

  try {
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

    // AIの回答をもとに、オリジナルのデータを紐付け直す（リンクと日付の改変防止）
    const restoreMetadata = (item) => {
      const original = newsItems[parseInt(item.id)];
      if (original) {
        return {
          ...item,
          link: original.link,
          pubDate: original.pubDate,
          source: original.source // ソース名もオリジナルを優先
        };
      }
      return item;
    };

    if (processedData.headlines) {
      processedData.headlines = processedData.headlines.map(restoreMetadata);
    }
    if (processedData.subNews) {
      processedData.subNews = processedData.subNews.map(restoreMetadata);
    }
    if (processedData.otherNews) {
      processedData.otherNews = processedData.otherNews.map(restoreMetadata);
    }

    // generatedAtを付加して正確な時間に
    processedData.generatedAt = new Date().toISOString();
    processedData.aiModelUsed = usedModel; // どのモデルが使われたか記録

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
    console.error('❌ Unexpected error during AI response processing:', error);
    return null;
  }
}
