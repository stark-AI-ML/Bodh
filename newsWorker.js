import { Worker } from "bullmq";

const worker = new Worker(
  "news-queue", // must match producer queue name
  async (job) => {
    console.log(`Working on job ${job.id}...`);

    // Simulate failure on first attempt
    if (job.attemptsMade === 0) {
      throw new Error("Simulated failure");
    }

    // Simulate success on retry
    await new Promise((res) => setTimeout(res, 3000));
    return "done";
  },

  {
    connection: { host: "127.0.0.1", port: 6379 },
  },
);

worker.on("completed", (job) => {
  console.log(`[Event] Job ${job.id} completed successfully.`);
});

worker.on("failed", (job, err) => {
  console.error(`[Event] Job ${job.id} failed: ${err.message}`);
});
