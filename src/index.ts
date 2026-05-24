import "dotenv/config";
import express from "express";
import type { Application, Request, Response } from "express";
import cookieParser from "cookie-parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ejs from "ejs";
import authRoute from "./routes/authRoute.js";

// Initialize your background queue worker on server boot
import "./jobs/index.js";
import { emailQueue, emailQueueName } from "./jobs/EmailJob.js";

// Safe __dirname resolution for ECMAScript Modules (ESM)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Application = express();
const port: number = Number(process.env.PORT) || 3000;

// Middleware for parsing request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

// Setup View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views")); // 👈 Fixed path resolution alignment

// Mount Authentication Routes
app.use("/api/auth", authRoute);

// Test Endpoint for SMTP Pipeline
app.get("/", async (req: Request, res: Response) => {
  try {
    // 👈 FIXED: Using path.join prevents directory slash blunders across OS types
    const templatePath = path.join(__dirname, "views", "email", "welcome.ejs");

    const html = await ejs.renderFile(templatePath, {
      user: { name: "batman" },
    });

    // Push the compiled HTML to your background processing worker
    await emailQueue.add(emailQueueName, {
      to: "rofaf73675@okcpress.com",
      subject: "testing smtp",
      htmlContent: html,
    });

    return res.json({
      status: "success",
      message: "Test email added to queue successfully.",
    });
  } catch (error) {
    console.error("Root route email generation error:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Failed to process test email." });
  }
});

// Start the Application Server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
