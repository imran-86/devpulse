import type { NextFunction, Request, Response } from "express";
import { pool } from "../db";


const isMaintainerOrContributor = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        const issueId = req.params.id;
        // console.log(issueId);
        
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized: No user found",
            });
            return;
        }
        const userResult = await pool.query(
            `SELECT role FROM "users" WHERE id = $1`, [userId]
        );
        if (userResult.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        const userRole = userResult.rows[0].role;
        // console.log(userRole);
        

        if (userRole === "maintainer") {
            next();
            return;
        }
        if (userRole === "contributor") {
            const issueResult = await pool.query(
                `SELECT reporter_id, status FROM "issues" WHERE id = $1`,
                [issueId]
            );
            if (issueResult.rows.length === 0) {
                res.status(404).json({
                    success: false,
                    message: "Issue not found",
                });
                return;
            }
            const issue = issueResult.rows[0];
        
            if (issue.reporter_id !== userId) {
                res.status(403).json({
                    success: false,
                    message: "Forbidden: You can only update your own issues",
                });
                return;
            }
            if (issue.status !== "open") {
                res.status(403).json({
                    success: false,
                    message: "Forbidden: You can only update issues with status 'open'",
                });
                return;
            }

            next();
            return;
        }

        return;

    } catch (error) {
        next(error);
    }
};

export default isMaintainerOrContributor;