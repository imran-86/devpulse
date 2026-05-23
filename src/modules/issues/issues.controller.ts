import type { Request, Response } from "express"
import { issuesService } from "./issues.service"


const createIssues = async(req : Request, res : Response)=>{
    req.body.id = req.user?.id;
    console.log("user data from req ",req.user);
    console.log("user data from body ",req.body);
    

     
    try {
   const result = await issuesService.createIssuesInDB(req.body);
    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
     
}

const getSingleIssues = async(req: Request,res : Response)=> {
   const {id} = req.params;
//    console.log(id);
    try {
    const result = await issuesService.getSingleIssuesFromDB(id as string);
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Issues Not found!",
        data: {},
      });
    }
    // console.log(result);
    
    res.status(200).json({
      success: true,
      data: result.rows[0],
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
      error: error,
    });
  }
   
}

const deleteIssue = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
        const result = await issuesService.deleteIssueFromDB(id as string);

        res.status(200).json({
            success: true,
            message: "Issue deleted successfully",
        });
    } catch (error: any) {
        if (error.message === "Issue not found") {
            res.status(404).json({
                success: false,
                message: error.message,
            });
        } else {
            res.status(500).json({
                success: false,
                message: error.message,
                error: error,
            });
        }
    }
};

const updateIssue = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, description, type } = req.body;
    try {
        const result = await issuesService.updateIssueInDB(id as string, {
            title,
            description,
            type,
        });
        res.status(200).json({
            success: true,
            message: "Issue updated successfully",
            data: result.rows[0],
        });
    } catch (error: any) {
        if (error.message === "Issue not found") {
            res.status(404).json({
                success: false,
                message: error.message,
            });
        } else {
            res.status(500).json({
                success: false,
                message: error.message,
                error: error,
            });
        }
    }
};
export const issuesController = {
    createIssues,
    getSingleIssues,
    deleteIssue,
    updateIssue
}