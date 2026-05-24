import { Job, Queue, Worker } from "bullmq";
import { defaultQueueOptions, redisConnection } from "../config/queue.js";
import { sendMail } from "../config/mail.js";
export const emailQueueName = "emailQueue";
export const emailQueue = new Queue(emailQueueName, {
    connection: redisConnection,
    defaultJobOptions: defaultQueueOptions,
});
export const queueWorker = new Worker(emailQueueName, async (job) => {
    const data = job.data;
    // This will throw if Brevo rejects your API credentials
    await sendMail(data.to, data.subject, data.htmlContent);
    console.log("Email sent successfully to:", data.to);
}, {
    connection: redisConnection,
});
queueWorker.on("failed", (job, err) => {
    console.error(`[Queue Error] Job ${job?.id} failed to deliver:`, err.message);
});
