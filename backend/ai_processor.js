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

  const MAX_CONCURRENT_ITEMS = 50;
  const itemsToProcess = newsItems.slice(0, MAX_CONCURRENT_ITEMS);

  console.log(`🤖 Processing ${itemsToProcess.length} news items with Gemini AI (Batch Mode)...`);

  // AIに渡すための記事リスト文字列を作成
  const newsListString = itemsToProcess.map((item, index) =>
    `[${index}] ${item.title} (Source: ${item.source})\nSnippet: ${item.contentSnippet}\n`
  ).join('\n---\n');

  // 試行するモデルの優先順位リスト
  const MODELS_TO_TRY = [
    'gemini-3.1-flash-lite-preview',
    'gemini-2.5-flash-lite',
    'gemini-2.5-flash'
  ];

  async function callGemini(prompt, modelName) {
    console.log(`🤖 Calling Gemini with model: ${modelName}...`);
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        temperature: 0.2,
        responseMimeType: 'application/json',
        maxOutputTokens: 8192,
      }
    });
    
    if (!response || !response.text) {
      throw new Error('Empty response from AI');
    }
    
    // JSON文字列を抽出（念のため）
    let text = response.text;
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) text = jsonMatch[0];
    
    return JSON.parse(text);
  }

  async function tryWithModels(prompt) {
    for (const modelName of MODELS_TO_TRY) {
      try {
        const data = await callGemini(prompt, modelName);
        return { data, modelName };
      } catch (error) {
        console.warn(`⚠️ Error with model ${modelName}: ${error.message}.`);
        if (error.message?.includes('404') || error.message?.includes('not found')) {
            console.warn(`Model ${modelName} not found, trying next...`);
            continue;
        }
        // 他のエラーでも次を試す
        continue;
      }
    }
    return null;
  }

  try {
    // --- STEP 1: Selection & Major News ---
    const step1Prompt = `
あなたはプロのITジャーナリストです。以下のAI関連ニュース記事リストから、最も重要な3件を「headlines」、次に重要な10件を「subNews」として選別し、要約してください。
また、選ばれなかった残りの記事のインデックス番号を「remainingIndices」としてすべてリストアップしてください。

【要件】
- headlines: 各200文字程度の日本語で詳しく要約。
- subNews: 各150文字程度の日本語で詳しく要約。

【出力JSON形式】
{
  "headlines": [{ "id": "インデックス番号", "title": "タイトル", "summary": "200文字要約", "source": "ソース" }],
  "subNews": [{ "id": "インデックス番号", "title": "タイトル", "summary": "150文字要約", "source": "ソース" }],
  "remainingIndices": [数字の配列]
}

【ニュース記事リスト】
${newsListString}
`;

    const step1Result = await tryWithModels(step1Prompt);
    if (!step1Result) throw new Error('Step 1 AI processing failed');

    const { data: step1Data, modelName: usedModel } = step1Result;
    console.log(`✅ Step 1 complete using ${usedModel}. Selected ${step1Data.headlines.length} headlines and ${step1Data.subNews.length} subNews.`);

    // --- STEP 2: Process Remaining News ---
    let otherNewsResults = [];
    const remainingIndices = step1Data.remainingIndices || [];

    if (remainingIndices.length > 0) {
      // 残りが多い場合はさらに分割して処理
      const batchSize = 20;
      for (let i = 0; i < remainingIndices.length; i += batchSize) {
        const batchIndices = remainingIndices.slice(i, i + batchSize);
        const batchListString = batchIndices.map(idx => {
          const item = itemsToProcess[idx];
          return `[${idx}] ${item.title} (Source: ${item.source})\nSnippet: ${item.contentSnippet}\n`;
        }).join('\n---\n');

        console.log(`🤖 Processing Batch ${Math.floor(i / batchSize) + 1} of remaining news (${batchIndices.length} items)...`);
        
        const step2Prompt = `
以下のニュース記事リストを「その他のニュース（otherNews）」として、それぞれ150文字程度の日本語で詳しく要約してください。
情報量が少ない場合でも、背景や関連カテゴリーについて解説を加え、必ず150文字程度のボリュームを確保してください。

【出力JSON形式】
{
  "otherNews": [{ "id": "インデックス番号", "title": "タイトル", "summary": "150文字要約", "source": "ソース" }]
}

【ニュース記事リスト】
${batchListString}
`;
        const step2Result = await tryWithModels(step2Prompt);
        if (step2Result) {
          otherNewsResults = otherNewsResults.concat(step2Result.data.otherNews);
        }
      }
    }

    // --- Data Reconstruction & MetaData Recovery ---
    const processedData = {
      headlines: step1Data.headlines,
      subNews: step1Data.subNews,
      otherNews: otherNewsResults,
      generatedAt: new Date().toISOString(),
      aiModelUsed: usedModel
    };

    const restoreMetadata = (item) => {
      const original = itemsToProcess[parseInt(item.id)];
      if (original) {
        return {
          ...item,
          link: original.link,
          pubDate: original.pubDate,
          source: original.source
        };
      }
      return item;
    };

    processedData.headlines = (processedData.headlines || []).map(restoreMetadata);
    processedData.subNews = (processedData.subNews || []).map(restoreMetadata);
    processedData.otherNews = (processedData.otherNews || []).map(restoreMetadata);

    // Save Data
    const dataDir = path.resolve('data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

    const outputPath = path.resolve(dataDir, 'latest_news.json');
    fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));

    console.log(`✅ AI processing complete. Total ${processedData.headlines.length + processedData.subNews.length + processedData.otherNews.length} items processed.`);
    return processedData;

  } catch (error) {
    console.error('❌ AI response processing error:', error);
    return null;
  }
}
