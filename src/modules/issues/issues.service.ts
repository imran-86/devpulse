const createIssuesInDB = async(payload :{
    title : string,
    description : string,
})=>{
    const {title , description} = payload;
}

export const issuesService = {
    createIssuesInDB,
}