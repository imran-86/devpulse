import { pool } from "../../db";
import bcrypt from "bcrypt";

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

export const authService = {
    registerUserIntoDB,
}