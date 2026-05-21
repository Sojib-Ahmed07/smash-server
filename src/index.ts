import "dotenv/config";
import express, { urlencoded } from "express";
import type { Application, Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import ejs from "ejs"
import { sendMail } from "./config/mail.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app: Application = express();
const port: number = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//set view engine
app.set("view engine", "ejs");
app.set("views", path.resolve(__dirname, "./views"));

app.get("/", async (req: Request, res: Response) => {

    const html = await ejs.renderFile(__dirname + `/views/email/welcome.ejs`, {
        user: {
            name: "batman"
        }
    })

    await sendMail("rofaf73675@okcpress.com", "testing smtp", html)

  return res.json({message: "email send successfully"})
});
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
