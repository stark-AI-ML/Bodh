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
    console.log('jobData', job.data);

    const key = process.env.GEMINI_KEY_YT;

    const getList = new VIDEO_LIST(job.data, key);

    const videoList = await getList.fetchNewsUrl();

    if (videoList == null) {
      return 'NO-LIST found graceful return  so unusual playwright run';
    }

    console.log(videoList);

    await saveTranscript(
      job.data.channelId,
      job.data.state,
      job.data.type,
      false,
      videoList
    );

    console.log('sucessfull');

    // producing the ai request queue for job should i do this without
    //  storing or not there are some pros and cons like with db reliability maybe?

    const Query = 'SELECT * FROM channel_transcripts WHERE is_used= FALSE';

    const result = await pool.query(Query);

    console.log(result.rows);
    const length = result.rows.length;

    const successful = [];

    try {
      for (let i = 0; i < length; i++) {
        const row = result.rows[i];
        //fix
        // const row = result.rows[i];
        await finalNewsQueue.add('get-transcript-json', row, {
          jobId: `transcript-${row.id}`,
          removeOnComplete: true,
          removeOnFail: { age: 40 * 60 },
          attempts: 2,
          backoff: {
            type: 'fixed',
            delay: 10000,
          },
        });
        successful.push(result.rows[i]);

        console.log(`Job added: ${i}`);
      }
      console.log('All jobs successfully added to the queue.');
    } catch (error) {
      console.error('Error adding jobs to the queue:', error);
    }

    // setting flag is_used to true so next job won't hit the same transcript again and again

    const ids = successful.map((row) => row.id);

    if (ids.length > 0) {
      await pool.query(
        'UPDATE channel_transcripts SET is_used = TRUE WHERE id = ANY($1)',
        [ids]
      );
    }

    // for (let i = 0; i < successful.length; i++) {
    //   await pool.query(
    //     'UPDATE channel_transcripts SET is_used = TRUE WHERE id = ANY($1)',
    //     [successful[i]]
    //   );
    // }

    return { id: job.data.id, status: 'success' };
  },
  {
    connection: connection,
    concurrency: 1,
  }
);

export default channelQueueWorker;
