import { Job, Queue, Worker } from "bullmq";
import { defaultQueueOptions, redisConnection } from "../config/queue.js";
import { sendMail } from "../config/mail.js";

export const emailQueueName = "emailQueue"

interface EmailJobDataType {
    to: string;
    subject: string;
    htmlContent: string;
}

export const emailQueue = new Queue(emailQueueName, {
    connection: redisConnection,
    defaultJobOptions: defaultQueueOptions
})

export const queueWorker = new Worker(emailQueueName, async(job:Job)=>
    {
        const data:EmailJobDataType = job.data;
        await sendMail(data.to, data.subject, data.htmlContent)
        console.log('the data is', data)
    },
    {
        connection: redisConnection,
    }
)