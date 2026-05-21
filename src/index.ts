import "dotenv/config"
import express from "express"
import type {Application, Request, Response} from "express"

const app: Application = express()
const port: number = Number(process.env.PORT) || 3000

app.get("/", (req: Request, res: Response)=>{
    return res.send("Hello World")
})

app.listen(port, ()=>{
    console.log(`Server is running on port ${port}`)
})