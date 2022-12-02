import { migrationQueue } from './connection';

const jobId = process.argv.slice(2)[0];

const main = async (jobId: string | number) => {
  const job = await migrationQueue.getJob(String(jobId));

  if (!job) {
    throw new Error(`Job #${jobId} not found`);
  }

  await job.remove();
  process.exit(0);
};

main(jobId).catch((error) => {
  console.log(error);
  process.exit(1);
});
