import { Router } from "express";
import { issuesController } from "./issues.controller";

import auth from "../../middleware/auth"
import { USER_ROLE } from "../../types";
import isMaintainer from "../../middleware/maintainer";
import isMaintainerOrContributor from "../../middleware/maintainerOrContributor";

const router = Router();

router.post('/' , auth(USER_ROLE.contributor,USER_ROLE.maintainer), issuesController.createIssues)

router.get('/:id' , issuesController.getSingleIssues)

router.delete('/:id' , 
auth(USER_ROLE.contributor,USER_ROLE.maintainer),
isMaintainer,
issuesController.deleteIssue)

router.patch("/:id",
    auth(USER_ROLE.contributor,USER_ROLE.maintainer),
    isMaintainerOrContributor,
    
);

export const issuesRouter = router