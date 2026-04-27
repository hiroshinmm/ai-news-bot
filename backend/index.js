import { runWorkflow } from './workflow.js';
import cron from 'node-cron';
import dotenv from 'dotenv';

dotenv.config();

const CRON_SCHEDULE = '0 7 * * *';
console.log(`\n🕒 Cron Job Scheduled: Will run automatically at ${CRON_SCHEDULE} (Every day at 07:00 AM local time).`);
console.log(`To run manually immediately, append '--run-now'.\n`);

if (process.argv.includes('--run-now')) {
    runWorkflow({ exitOnFailure: false });
}

cron.schedule(CRON_SCHEDULE, () => runWorkflow({ exitOnFailure: false }));
