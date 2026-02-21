const { Queue, Worker } = require('bullmq');
const connection = require('./redis');
const { processIngestionJob } = require('../workers/ingestion.worker');

// Queues
const ingestionQueue = new Queue('ingestion-queue', { connection });

// Workers
// We wrap the worker setup in a function to start it explicitly
const startWorkers = () => {
    console.log('👷 Initializing BullMQ Worker...');
    try {
        const ingestionWorker = new Worker('ingestion-queue', processIngestionJob, {
            connection,
            concurrency: 2 // Process 2 files at a time max
        });

        ingestionWorker.on('completed', (job) => {
            console.log(`✅ Job ${job.id} completed! Processed: ${job.returnvalue?.rows} rows`);
        });

        ingestionWorker.on('failed', (job, err) => {
            console.error(`❌ Job ${job.id} failed:`, err);
        });

        ingestionWorker.on('error', (err) => {
            console.error('❌ Worker Connection Error:', err);
        });

        console.log('👷 Ingestion Worker Started and Listening on: ingestion-queue');
    } catch (err) {
        console.error("❌ Failed to start worker:", err);
    }
};

module.exports = {
    ingestionQueue,
    startWorkers
};
