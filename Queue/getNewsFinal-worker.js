import { Worker } from 'bullmq';

import dotenv from 'dotenv';
import connection from '../DB/redis/config.js';

import getNewsJson from '../AI-Chat/geminiCall.js';

// import insertNews from "../DB/router/utils/saveFinalNews.js";
import handleAIAndSave from '../functions/handleAIAndSave.js';
import pool from '../DB/postgres/dbConfig.js';

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
    console.log(job.data);
    const newsJson = await getNewsJson(job.data.transcript);

    // console.log(newsJson);
    // loading temp data remember you can only insert at a time so you directly pushed all newJson
    //  it was wrong in the first place

    /* your task is to create the class with validation if head != null and all not null must be available 

    then also you have to loop trhough each then save the whole list of aray then return true 
    so take this whole json data and save each of the object
    */

    // /fix change back to 1 min
    await sleep(60000); // for one min

    // temp data
    // const newsJson = data;

    if (!newsJson) {
      throw new Error('unable to get newsJson');
    } else {
      let attempt = 0;

      while (attempt < 3) {
        try {
          console.log('Attempt', attempt + 1, 'news:', newsJson);
          const save = new handleAIAndSave(newsJson);
          return await save.saveData();

          // setting up the second flag is_used as ai has generated the result
          // now i don't have to worry about transcript anymore should i delete it?
          // fuck perfectionism in me bacteria for my growth i will delete this after 10hr for any issue to arrive
          //fuuuuuuuck me

          // don't worry i have delted is_queued wasn't worth

          const transcriptId = job.data.id;

          // const query = `UPDATE channel_transcripts SET is_used = TRUE
          //               WHERE id = $1`;

          // await pool.query(query, [transcriptId]);
        } catch (error) {
          attempt++;
          console.error('Insert failed:', error);
          if (attempt >= 3) {
            throw new Error(`Failed after ${attempt} attempts`);
          }

          await sleep(attempt * 5000);
        }
      }
    }
  },
  { connection }
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
