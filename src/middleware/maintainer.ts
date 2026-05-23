import type { NextFunction, Request, Response } from "express";
import { pool } from "../db";

const isMaintainer = async(req : Request , res : Response , next : NextFunction)=>{
    try{
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({
                success: false,
                message: "Unauthorized access",
            });
            return;
        }
        const result = await pool.query(
            `SELECT role FROM "users" WHERE id = $1`,
            [userId]
        );
        if (result.rows.length === 0) {
            res.status(404).json({
                success: false,
                message: "User not found",
            });
            return;
        }
        const userRole = result.rows[0].role;

        if (userRole!=="maintainer") {
            res.status(403).json({
                success: false,
                message: "Forbidden! Only maintainers can delete issues.",
            });
            return;
        }

        next();
    }catch (error) {
        next(error);
    }
}
export default isMaintainer;