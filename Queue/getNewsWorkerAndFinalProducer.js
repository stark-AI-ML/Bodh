import { Worker, Queue } from 'bullmq';

import VIDEO_LIST from '../NewsRef/ytVideoList.js';
import saveTranscript from '../playwright/yt.js';

import connection from '../DB/redis/config.js';

import dotenv from 'dotenv';

import pool from '../DB/postgres/dbConfig.js';

dotenv.configDotenv();

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

    const finalNewsQueue = new Queue('final-save', {
      connection,
    });

    const Query = 'SELECT * FROM channel_transcripts WHERE is_used= FALSE';

    const result = await pool.query(Query);

    console.log(result.rows);
    const length = result.rows.length;
    const successful = [];
    try {
      for (let i = 0; i < length; i++) {
        //fix
        // const row = result.rows[i];
        await finalNewsQueue.add('get-transcript-json', result.rows[i], {
          removeOnComplete: true,
          removeOnFail: 3,
          attempts: 3,
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

    // setting flag so next job won't hit the same transcript again and again
    // if (successful.length > 0) {
    //   await pool.query(
    //     'UPDATE channel_transcripts SET is_queued = TRUE WHERE id = ANY($1)',
    //     [successful[i]]
    //   );
    // } // not needed i was doing the overkill

    return { id: job.data.id, status: 'success' };
  },
  {
    connection: connection,
    concurrency: 1,
  }
);

export default channelQueueWorker;
