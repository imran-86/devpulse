import type { NextFunction, Request, Response } from "express";
import type { ROLES } from "../types";
import jwt, { type JwtPayload } from "jsonwebtoken"
import config from "../config";
import { pool } from "../db";

const auth = (...roles : ROLES[])=>{
    return async (req : Request,res: Response,next : NextFunction)=>{
        // console.log("Roles are ",roles);

        try{
         
            const token = req.headers.authorization;

            if(!token){
                res.status(401).json({
                    success : false,
                    message : "Unauthorized access",
                })
            }

            const decode = jwt.verify(token as string,
                config.jwt_accessSecret as string,
            ) as JwtPayload;
            console.log("decoded value ",decode);
            

            
            const userInformation = await pool.query(

                `
                SELECT * FROM "users" WHERE id=$1
                `,[decode.id]
            )
           const user = userInformation.rows[0];

        //    console.log("user information ", user);
           

           if(userInformation.rows.length===0){
             res.status(404).json({
          success: false,
          message: "User not found!",
        });
           }

        if (roles.length && !roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden!!,This role have no access!",
        });
      }

      req.user = decode;

      next();

        }catch(error){
            next(error);
        }

        
    }
}

export default auth;