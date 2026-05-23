import type { Request, Response } from "express";
import { authService } from "./auth.service";
import sendResponse from "../../utils/sendResponse";

const registerUser = async(req : Request,res : Response)=>{
   try{
    const result = await authService.registerUserIntoDB(req.body);
    // console.log(result.rows[0]);
    
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0],
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
}
const loginUser = async(req : Request,res : Response)=>{
   try{
      const result = await authService.loginUserIntoDB(req.body);
      // console.log(result);
      
      const {token , user} = result;

      
   res.cookie("Token",token, {
      secure: false,
      httpOnly: true,
      sameSite: "lax",
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token : token,
        user : user
      }
    });
  } catch (error: any) {
    sendResponse(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error: error,
    });
  }
}
export const authController = {
    registerUser,
    loginUser,
}