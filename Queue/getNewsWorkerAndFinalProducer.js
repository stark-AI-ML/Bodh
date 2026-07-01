import { Worker, Queue } from 'bullmq';

import VIDEO_LIST from '../NewsRef/ytVideoList.js';
import saveTranscript from '../playwright/yt.js';

import connection from '../DB/redis/config.js';

import dotenv from 'dotenv';

import pool from '../DB/postgres/dbConfig.js';

dotenv.configDotenv();

const finalNewsQueue = new Queue('final-save', {
  connection,
});

/* all the news channel list with thier config will be created by scheduler(producer) :

 - channlequeue worker will pick  channel config 
 - get the news with videoList creator -yt api 
 - then run playwright -> save the transcript to db 

 - create a job for final-save querying transcripts & make job-data for final-save

 - so if you ever think it is not optimised and we are creating this job with transcript data
   why to push in postgres
   my anwser is it is for fall back as a flag of is_used even if job fails with the trascript 
   it will not be an issue 

 - but i also avoded little of overengineering i had two flag onw was is_queued and other is_used
   so i removed is_queued at all because it was hard to maintain or i was burning out 
    - is_queued : refers to job queue created flag
    - is_used : was at final layer when we have done creating json with ai and saves the json
       and that was better solution but i removed :) 

    - so you can make that optimisation for fall_back if job is not queued for the transcript
    - or job is failed to create json and so 

    but still i think it is overoptimisation : i did because transcript is hard to get we are 
    scraping yt with chances of being block as we are not going to buy a proxy

    but we don't need that much optimisation you still get too much news by channel list and 
    the number of transcript you are getting is more than enough


 */

const channelQueueWorker = new Worker(
  'channels-queue',
  async (job) => {
    console.log('[Channel] Processing:', job.data.channelName);

    const key = process.env.GEMINI_KEY_YT;

    const getList = new VIDEO_LIST(job.data, key);
    // console.log(getList);

    const videoList = await getList.fetchNewsUrl();

    //remove log /fix
    // console.log(videoList);

    if (!videoList || videoList.length === 0) {
      return 'NO-LIST found graceful return  so unusual playwright run';
    }

    console.log(
      '[Channel]',
      videoList.length,
      'videos matched for',
      job.data.channelName
    );

    await saveTranscript(
      job.data.channelId,
      job.data.state,
      job.data.type,
      false,
      videoList
    );

    console.log('[Channel] Transcripts scraped for', job.data.channelName);

    // Atomically grab and mark unused transcripts — prevents race condition
    // where multiple channel workers could grab the same transcripts
    const result = await pool.query(
      'UPDATE channel_transcripts SET is_used = TRUE WHERE is_used = FALSE RETURNING *'
    );

    console.log(`[Channel] ${result.rows.length} unused transcripts claimed`);

    if (result.rows.length === 0) {
      return { id: job.data.id, status: 'success', transcripts: 0 };
    }

    try {
      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows[i];
        await finalNewsQueue.add('get-transcript-json', row, {
          jobId: `transcript-${row.id}`,
          delay: i * 15000, // adding this delay as production gets high cpu spikes so,
          //  this stagger the final-save job  might not be best but will do the task
          removeOnComplete: true,
          removeOnFail: { age: 40 * 60 },
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 10000,
          },
        });
        console.log(
          `[Channel] Queued transcript ${row.id} (${i + 1}/${result.rows.length})`
        );
      }
      console.log('[Channel] All transcript jobs queued');
    } catch (error) {
      console.error('[Channel] Error queuing jobs:', error);
    }

    return { id: job.data.id, status: 'success' };
  },
  {
    connection: connection,
    concurrency: 1,
    lockDuration: process.env.LOCK_DURATION,
  }
);

export default channelQueueWorker;
