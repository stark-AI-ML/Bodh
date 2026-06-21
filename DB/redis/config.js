import dotenv from 'dotenv';

dotenv.config();

const connection = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
};

export default connection;
