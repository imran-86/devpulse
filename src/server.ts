
import app from "./app"
import config from "./config"
import { createDB } from "./db"
const main = () =>{
    createDB();
    app.listen(config.port,()=>{
        console.log(`Server is listening on port ${config.port}`);
        
    })
}
main();