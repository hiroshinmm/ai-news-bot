import { fetchNews } from './fetcher.js';
import { processNewsWithAI } from './ai_processor.js';
import { sendEmailWithNews } from './mailer.js';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

async function runDailyNewsWorkflow() {
    console.log(`\n===========================================`);
    console.log(`🚀 Starting Daily AI News Workflow - ${new Date().toLocaleString()}`);
    console.log(`===========================================\n`);

    try {
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
            return;
        }

        // Step 3: Send Email
        console.log('\n[Step 3/3] Sending email summary...');
        const emailSent = await sendEmailWithNews(processedNews);
        if (emailSent) {
            console.log('Email sent successfully!');
        } else {
            console.log('Could not send email. Please check your credentials.');
        }

        console.log(`\n🎉 Workflow completed successfully at ${new Date().toLocaleString()}`);

    } catch (error) {
        console.error('\n❌ Workflow failed with error:', error);
    }
}

// コマンドライン引数に '--run-now' があれば即時実行する
if (process.argv.includes('--run-now')) {
    runDailyNewsWorkflow();
}

// 毎朝7:00に自動実行するスケジュール設定
const CRON_SCHEDULE = '0 7 * * *';
console.log(`\n🕒 Cron Job Scheduled: Will run automatically at ${CRON_SCHEDULE} (Every day at 07:00 AM local time).`);
console.log(`To run manually immediately, append '--run-now'.\n`);

cron.schedule(CRON_SCHEDULE, () => {
    runDailyNewsWorkflow();
});
