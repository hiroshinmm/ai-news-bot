import { fetchNews } from './fetcher.js';
import { processNewsWithAI } from './ai_processor.js';
import { sendEmailWithNews } from './mailer.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Node.js v20.11+以降で必須な dirname の代用
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

async function runDailyNewsWorkflow() {
    console.log(`\n===========================================`);
    console.log(`🚀 Starting Daily AI News Workflow (GitHub Actions) - ${new Date().toLocaleString()}`);
    console.log(`===========================================\n`);

    try {
        // dataディレクトリが存在しない場合は作成 (GitHub Actions用)
        const dataDir = path.join(__dirname, '..', 'data');
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
            console.log(`Created data directory at ${dataDir}`);
        }

        // Step 1: Fetch News
        console.log('[Step 1/3] Fetching news...');
        const rawNews = await fetchNews();
        if (!rawNews || rawNews.length === 0) {
            console.log('No news found today. Exiting workflow.');
            return;
        }

        // Step 2: Process with AI
        console.log('\n[Step 2/3] Processing news with AI...');
        const processedNews = await processNewsWithAI(rawNews);
        if (!processedNews) {
            console.error('Failed to process news with AI. Exiting workflow.');
            process.exit(1); // 失敗としてCIを停止
        }

        // Step 3: Send Email
        console.log('\n[Step 3/3] Sending email summary...');
        const emailSent = await sendEmailWithNews(processedNews);
        if (emailSent) {
            console.log('Email sent successfully!');
        } else {
            console.error('Could not send email. Please check your credentials.');
            process.exit(1); // 失敗としてCIを停止
        }

        console.log(`\n🎉 Workflow completed successfully at ${new Date().toLocaleString()}`);

    } catch (error) {
        console.error('\n❌ Workflow failed with error:', error);
        process.exit(1);
    }
}

// すぐに実行する
runDailyNewsWorkflow();
