import { Router } from "express";
import { routerController } from "./issues.controller";

const router = Router();

router.post('/' , routerController.createIssues)

export const issuesRouter = router