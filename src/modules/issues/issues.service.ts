import { pool } from "../../db";
import type { GetAllIssuesParams } from "../../types";

const createIssuesInDB = async(payload :{
    title : string,
    description : string,
    type : string,
    id : number,
})=>{
    const {title , description,type,id} = payload;
    // console.log("Title ", title);
    // console.log("Description ",description);

    // console.log("payload data ",payload);
    


    const result = await pool.query(`
        INSERT INTO "issues"(title,description,type,reporter_id) VALUES($1,$2,$3,$4) RETURNING *
        `,
    [title,description,type,id]);
    return result;
    
    
}
const getSingleIssuesFromDB = async(id : string)=>{
//   console.log("Id ",typeof(id));

  const result = await pool.query(`
    SELECT * FROM "issues" WHERE id=$1
    `,[id])

    if(result.rows.length === 0){
        throw new Error("Issue not found");
    }

    const fetchIssue = result.rows[0];

    const reporterId = fetchIssue.reporter_id;

    const userResult = await pool.query(
        `SELECT id, name, role FROM users WHERE id = $1`,
        [reporterId]
    );
    const reporter = userResult.rows[0] || null;

    const finalResult = {
        ...fetchIssue,
        reporter: reporter
    };

    delete finalResult.reporter_id

    return { rows: [finalResult] };
  
}

const deleteIssueFromDB = async (id: string) => {
    const isExist = await pool.query(
        `SELECT * FROM issues WHERE id = $1`,
        [id]
    );
    if (isExist.rows.length === 0) {
        throw new Error("Issue not found");
    }
    const result = await pool.query(
        `DELETE FROM issues WHERE id = $1 RETURNING *`,
        [id]
    );
    return result;
};

const updateIssueInDB = async (
    id: string,
    payload: {
        title?: string;
        description?: string;
        type?: string;
    }
) => {
    const checkIssues = await pool.query(
        `SELECT * FROM "issues" WHERE id = $1`,
        [id]
    );
    if (checkIssues.rows.length === 0) {
        throw new Error("Issue not found");
    }
    const existingIssue = checkIssues.rows[0];
    const title = payload.title??existingIssue.title;
    const description = payload.description??existingIssue.description;
    const type = payload.type??existingIssue.type;
    const result = await pool.query(
        `UPDATE issues 
         SET title = $1, 
             description = $2, 
             type = $3, 
             updated_at = CURRENT_TIMESTAMP 
         WHERE id = $4 
         RETURNING *`,
        [title, description, type, id]
    );

    return result;
};


const getAllIssuesFromDB = async (params: GetAllIssuesParams) => {
    const { sort = 'newest', type, status } = params;

    let query = `SELECT * FROM issues WHERE 1=1`;
    const queryParams: any[] = [];
    let paramIndex = 1;
    if (type) {
        query += ` AND type = $${paramIndex}`;
        queryParams.push(type);
        paramIndex++;
    }

    if (status) {
        query += ` AND status = $${paramIndex}`;
        queryParams.push(status);
        paramIndex++;
    }

    if (sort === 'newest') {
        query += ` ORDER BY created_at DESC`;
    } else if (sort === 'oldest') {
        query += ` ORDER BY created_at ASC`;
    }

    const issuesResult = await pool.query(query, queryParams);
    const issues = issuesResult.rows;

    if (issues.length === 0) {
        return { rows: [] };
    }
    const reporterIds = [...new Set(issues.map(issue => issue.reporter_id))];
    const usersResult = await pool.query(
        `SELECT id, name, role FROM users WHERE id = ANY($1::int[])`,
        [reporterIds]
    );

    const userMap = new Map();
    usersResult.rows.forEach(user => {
        userMap.set(user.id, {
            id: user.id,
            name: user.name,
            role: user.role,
        });
    });

    const finalResults = issues.map(issue => ({
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter: userMap.get(issue.reporter_id) || null,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
    }));

    return { rows: finalResults };
};
export const issuesService = {
    createIssuesInDB,
    getSingleIssuesFromDB,
    deleteIssueFromDB,
    updateIssueInDB,
    getAllIssuesFromDB
}