import { fetchNews } from './fetcher.js';
import { processNewsWithAI } from './ai_processor.js';
import { sendEmailWithNews } from './mailer.js';

export async function runWorkflow({ exitOnFailure = false } = {}) {
    console.log(`\n===========================================`);
    console.log(`🚀 Starting Daily AI News Workflow - ${new Date().toLocaleString()}`);
    console.log(`===========================================\n`);

    try {
        console.log('[Step 1/3] Fetching news...');
        const rawNews = await fetchNews();
        if (!rawNews || rawNews.length === 0) {
            console.log('No news found today. Exiting workflow.');
            return;
        }

        console.log('\n[Step 2/3] Processing news with AI...');
        const processedNews = await processNewsWithAI(rawNews);
        if (!processedNews) {
            console.error('Failed to process news with AI. Exiting workflow.');
            if (exitOnFailure) process.exit(1);
            return;
        }

        // メール失敗はデプロイを止めない
        console.log('\n[Step 3/3] Sending email summary...');
        const emailSent = await sendEmailWithNews(processedNews);
        if (emailSent) {
            console.log('Email sent successfully!');
        } else {
            console.error('⚠️ Could not send email. Please check your credentials.');
        }

        console.log(`\n🎉 Workflow completed successfully at ${new Date().toLocaleString()}`);

    } catch (error) {
        console.error('\n❌ Workflow failed with error:', error);
        if (exitOnFailure) process.exit(1);
    }
}
