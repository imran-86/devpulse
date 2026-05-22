import { pool } from "../../db";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import config from "../../config";
import { log } from "console";

const registerUserIntoDB = async(payload : {
    name : string,
    email : string,
    password : string,
    role : string,
}) =>{
    const {name , email , password , role  } = payload;
     
    const hashPassword = await bcrypt.hash(password,15);


    // Add User To DB

    const result = await pool.query(

        ` INSERT INTO "users"(name,email,password,role) VALUES($1,$2,$3,COALESCE($4,'user')) RETURNING *`,
         [name, email, hashPassword,  role],
    ) 
    delete result.rows[0].password;
    return result;
}

const loginUserIntoDB = async(payload :{
    email : string,
    password : string,
}) =>{
    const {email , password}= payload;

    const getDataOfUser = await pool.query(`
        SELECT * FROM "users" WHERE email=$1
        `,[email])

        // console.log(getDataOfUser.rows[0]);

        if(getDataOfUser.rows.length===0){
        throw new Error("Invalid Credentials!");
      }

      const userInfo = getDataOfUser.rows[0];
    //   console.log("Getting pass " , password);
      
    //   console.log(userInfo.password); // securePassword123
      
      const checkPassword = await bcrypt.compare(password,userInfo.password);
      
    //   console.log("Checking " , checkPassword);
      

      if(!checkPassword){
        throw new Error("Invalid Credentials!!");
      }
    //   else{
    //     console.log("OK fine");
        
    //   }

    
    const jwtTokenPayload = {
        id : userInfo.id,
        name : userInfo.name,
        role : userInfo.role,
    }
    // console.log("Access secret ",config.jwt_accessSecret);
    
    
    const token = jwt.sign(jwtTokenPayload,config.jwt_accessSecret as string,{
        expiresIn : "1d",
    })

    
    const {password : _,...userInformation} = userInfo;

     return { token,
        user : userInformation,
      };
        
}

export const authService = {
    registerUserIntoDB,
    loginUserIntoDB,
}