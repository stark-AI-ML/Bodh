import pool from '../DB/postgres/dbConfig.js';
// const Query =
//   'SELECT * FROM channel_transcripts WHERE is_used= FALSE AND is_queued = FALSE';

const Query = 'SELECT * FROM users';
const result = await pool.query(Query);

// console.log(result.rowCount);
