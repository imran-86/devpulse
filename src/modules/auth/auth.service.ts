import { pool } from "../../db";

const registerUserIntoDB = async(payload : {
    name : string,
    email : string,
    password : string,
    role : string,
}) =>{
    const {name , email , password , role  } = payload;
     
    // Add User To DB

    const result = await pool.query(

        ` INSERT INTO "users"(name,email,password,role) VALUES($1,$2,$3,COALESCE($4,'user')) RETURNING *`,
         [name, email, password,  role],
    ) 
    delete result.rows[0].password;
    return result;
}

export const authService = {
    registerUserIntoDB,
}