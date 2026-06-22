import workerFinal from './Queue/getNewsFinal-worker';

import start from './Queue/getNewsScheduler';
import channelQueueWorker from './Queue/getNewsWorkerAndFinalProducer';

await start();

workerFinal.on('completed', (job, result) => {
  console.log(`[Event] Job ${job.id} completed:`, result);
});
console.log('working _ after completed');

workerFinal.on('failed', (job, err) => {
  console.error(`[Event] Job ${job.id} failed: ${err.message}`);
});
