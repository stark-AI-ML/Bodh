import workerFinal from './Queue/getNewsFinal-worker.js';
import channelQueueWorker from './Queue/getNewsWorkerAndFinalProducer.js';
import start from './Queue/getNewsScheduler.js';
import { cleanupBrowser } from './playwright/yt.js';

// start scheduler

await start();

// events
workerFinal.on('completed', (job) => {
  console.log(`[Final] Job ${job.id} completed`);
});

workerFinal.on('failed', (job, err) => {
  console.error(`[Final] Job ${job.id} failed: ${err.message}`);
});

channelQueueWorker.on('failed', (job, err) => {
  console.error(`[Channel] Job ${job.id} failed: ${err.message}`);
});

console.log('Workers running...');

// shutdown
const shutdown = async () => {
  console.log('Shutting down...');

  await workerFinal.close();
  await channelQueueWorker.close();
  await cleanupBrowser();

  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
