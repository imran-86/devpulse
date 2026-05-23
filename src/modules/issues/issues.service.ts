import { pool } from "../../db";

const createIssuesInDB = async(payload :{
    title : string,
    description : string,
    type : string,
    id : number,
})=>{
    const {title , description,type,id} = payload;
    // console.log("Title ", title);
    // console.log("Description ",description);

    console.log("payload data ",payload);
    


    const result = await pool.query(`
        INSERT INTO "issues"(title,description,type,reporter_id) VALUES($1,$2,$3,$4) RETURNING *
        `,
    [title,description,type,id]);
    return result;
    
    
}

export const issuesService = {
    createIssuesInDB,
}