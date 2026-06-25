import { Queue, Worker } from 'bullmq';

import connection from '../DB/redis/config.js';

import ChannelsConfig from '../NewsRef/channelList.js';

function getRandomTimeInWindow(startHour, endHour) {
  const now = new Date();

  const randomHour =
    Math.floor(Math.random() * (endHour - startHour)) + startHour;

  const randomMinute = Math.floor(Math.random() * 60);
  const randomSecond = Math.floor(Math.random() * 60);

  const target = new Date(now);
  target.setHours(randomHour, randomMinute, randomSecond, 0);

  return target;
}
function getNextRunTime() {
  const now = new Date();

  const morning = getRandomTimeInWindow(8, 9);
  const evening = getRandomTimeInWindow(16, 17);

  if (now < morning) {
    return morning;
  }

  if (now < evening) {
    return evening;
  }

  // both above failed  so next day
  const tomorrowMorning = getRandomTimeInWindow(8, 10);
  tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);

  return tomorrowMorning;
}

function getNextDelay() {
  const nextRun = getNextRunTime();
  return nextRun.getTime() - Date.now();
}

const schedulerQueue = new Queue('scheduler-queue', { connection });
const channelsQueue = new Queue('channels-queue', { connection });

const schedulerWorker = new Worker(
  'scheduler-queue',
  async () => {
    console.log('\n[Scheduler] Woke up');

    // Add jobs into the worker queue, not scheduler queue
    const jobsToAdd = ChannelsConfig.map((channel) => ({
      name: 'getTranscript',
      data: channel,
      opts: { removeOnComplete: true },
    }));

    await channelsQueue.addBulk(jobsToAdd);

    console.log(`[Scheduler] Added ${jobsToAdd.length} jobs to worker queue.`);

    const nextDelay = getNextDelay();
    // /fix /test
    // const nextDelay = 60 * 1000;

    console.log(
      `[Scheduler] Sleeping for ${(nextDelay / 1000).toFixed(1)} seconds...`
    );

    await schedulerQueue.add(
      'repeat-cycle',
      {},
      {
        delay: nextDelay,
        // delay: 30000,
        removeOnComplete: true,
        removeOnFail: { age: 40 * 60 },
      }
    );
  },
  { connection }
);

schedulerWorker.on('failed', (job, err) => {
  console.error(`[scheduler errrrors] Error: ${err.message}`);
});

async function start() {
  console.log('Starting Manager...');
  await schedulerQueue.obliterate({ force: true });

  await schedulerQueue.add('dispatch-cycle', {}, { removeOnComplete: true });
}

export default start;
