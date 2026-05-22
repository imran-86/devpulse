import dotenv from "dotenv";
import path from "path"
dotenv.config({
  path : path.join(process.cwd(), ".env")
})

const config = {
  port : process.env.PORT,
  connection_string : process.env.CONNECTIONSTRING as string,
  jwt_accessSecret : process.env.JWTACCESSSECRET,
}

export default config;