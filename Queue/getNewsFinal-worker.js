import { Worker } from 'bullmq';

import dotenv from 'dotenv';
import connection from '../DB/redis/config.js';

import getNewsJson from '../AI-Chat/geminiCall.js';

// import insertNews from "../DB/router/utils/saveFinalNews.js";
import handleAIAndSave from '../functions/handleAIAndSave.js';

// import data from "../NewsRef/mockData.js";

dotenv.config();

function sleep(ms) {
  return new Promise((res) => {
    setTimeout(res, ms);
  });
}

const workerFinal = new Worker(
  'final-save',
  async (job) => {
    console.log('[Final] Processing transcript:', job.data.id);
    const newsJson = await getNewsJson(job.data.transcript);

    // /fix change back to 1 min
    await sleep(30000); // for 30 sec

    if (!newsJson) {
      throw new Error('unable to get newsJson');
    }

    console.log(
      `[Final] AI extracted ${newsJson.length} news items for transcript ${job.data.id}`
    );
    const save = new handleAIAndSave(newsJson);
    const result = await save.saveData();
    console.log('[Final] Save complete for transcript:', job.data.id);
    return result;
  },
  {
    connection,
    lockDuration: process.env.LOCK_DURATION,
  }
);

// console.log('working _ before completed');
// workerFinal.on('completed', (job, result) => {
//   console.log(`[Event] Job ${job.id} completed:`, result);
// });
// console.log('working _ after completed');

// workerFinal.on('failed', (job, err) => {
//   console.error(`[Event] Job ${job.id} failed: ${err.message}`);
// });

export default workerFinal;
