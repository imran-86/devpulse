import express from "express"
import type { Application, Request, Response } from "express";
import { authRoute } from "./modules/auth/auth.route";
import { issuesRouter } from "./modules/issues/issues.route";




const app : Application = express();

app.use(express.json());

app.get("/" ,(req : Request, res:Response)=>{
    res.status(200).json({
        message : "Express Server",
        author : "Imran Ahmed"
    })
})
app.use("/api/auth" , authRoute);
app.use("/api/issues", issuesRouter);


export default app;