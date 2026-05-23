

   import { createRequire } from 'module';

   const require = createRequire(import.meta.url);

  

// src/app.ts
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  port: process.env.PORT,
  connection_string: process.env.CONNECTIONSTRING,
  jwt_accessSecret: process.env.JWTACCESSSECRET
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.connection_string
});
var createDB = async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS "users"(
        id SERIAL PRIMARY KEY,
        name VARCHAR(20),
        email VARCHAR(30) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'contributor',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        )
        `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "issues"(
      id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('bug', 'feature_request')),
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')),
    reporter_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW() 
    )
        `);
    console.log("Database connected successfully!");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/auth/auth.service.ts
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
var registerUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const hashPassword = await bcrypt.hash(password, 15);
  const result = await pool.query(
    ` INSERT INTO "users"(name,email,password,role) VALUES($1,$2,$3,COALESCE($4,'user')) RETURNING *`,
    [name, email, hashPassword, role]
  );
  delete result.rows[0].password;
  return result;
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  const getDataOfUser = await pool.query(`
        SELECT * FROM "users" WHERE email=$1
        `, [email]);
  if (getDataOfUser.rows.length === 0) {
    throw new Error("Invalid Credentials!");
  }
  const userInfo = getDataOfUser.rows[0];
  const checkPassword = await bcrypt.compare(password, userInfo.password);
  if (!checkPassword) {
    throw new Error("Invalid Credentials!!");
  }
  const jwtTokenPayload = {
    id: userInfo.id,
    name: userInfo.name,
    role: userInfo.role
  };
  const token = jwt.sign(jwtTokenPayload, config_default.jwt_accessSecret, {
    expiresIn: "1d"
  });
  const { password: _, ...userInformation } = userInfo;
  return {
    token,
    user: userInformation
  };
};
var authService = {
  registerUserIntoDB,
  loginUserIntoDB
};

// src/utils/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data,
    error: data.error
  });
};
var sendResponse_default = sendResponse;

// src/modules/auth/auth.controller.ts
var registerUser = async (req, res) => {
  try {
    const result = await authService.registerUserIntoDB(req.body);
    sendResponse_default(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result.rows[0]
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var loginUser = async (req, res) => {
  try {
    const result = await authService.loginUserIntoDB(req.body);
    const { token, user } = result;
    res.cookie("Token", token, {
      secure: false,
      httpOnly: true,
      sameSite: "lax"
    });
    res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user
      }
    });
  } catch (error) {
    sendResponse_default(res, {
      statusCode: 500,
      success: false,
      message: error.message,
      error
    });
  }
};
var authController = {
  registerUser,
  loginUser
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", authController.registerUser);
router.post("/login", authController.loginUser);
var authRoute = router;

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issues.service.ts
var createIssuesInDB = async (payload) => {
  const { title, description, type, id } = payload;
  const result = await pool.query(
    `
        INSERT INTO "issues"(title,description,type,reporter_id) VALUES($1,$2,$3,$4) RETURNING *
        `,
    [title, description, type, id]
  );
  return result;
};
var getSingleIssuesFromDB = async (id) => {
  const result = await pool.query(`
    SELECT * FROM "issues" WHERE id=$1
    `, [id]);
  if (result.rows.length === 0) {
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
    reporter
  };
  delete finalResult.reporter_id;
  return { rows: [finalResult] };
};
var deleteIssueFromDB = async (id) => {
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
var updateIssueInDB = async (id, payload) => {
  const checkIssues = await pool.query(
    `SELECT * FROM "issues" WHERE id = $1`,
    [id]
  );
  if (checkIssues.rows.length === 0) {
    throw new Error("Issue not found");
  }
  const existingIssue = checkIssues.rows[0];
  const title = payload.title ?? existingIssue.title;
  const description = payload.description ?? existingIssue.description;
  const type = payload.type ?? existingIssue.type;
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
var getAllIssuesFromDB = async (params) => {
  const { sort = "newest", type, status } = params;
  let query = `SELECT * FROM issues WHERE 1=1`;
  const queryParams = [];
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
  if (sort === "newest") {
    query += ` ORDER BY created_at DESC`;
  } else if (sort === "oldest") {
    query += ` ORDER BY created_at ASC`;
  }
  const issuesResult = await pool.query(query, queryParams);
  const issues = issuesResult.rows;
  if (issues.length === 0) {
    return { rows: [] };
  }
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
  const usersResult = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1::int[])`,
    [reporterIds]
  );
  const userMap = /* @__PURE__ */ new Map();
  usersResult.rows.forEach((user) => {
    userMap.set(user.id, {
      id: user.id,
      name: user.name,
      role: user.role
    });
  });
  const finalResults = issues.map((issue) => ({
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: userMap.get(issue.reporter_id) || null,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  }));
  return { rows: finalResults };
};
var issuesService = {
  createIssuesInDB,
  getSingleIssuesFromDB,
  deleteIssueFromDB,
  updateIssueInDB,
  getAllIssuesFromDB
};

// src/modules/issues/issues.controller.ts
var createIssues = async (req, res) => {
  req.body.id = req.user?.id;
  try {
    const result = await issuesService.createIssuesInDB(req.body);
    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var getSingleIssues = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issuesService.getSingleIssuesFromDB(id);
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "Issues Not found!",
        data: {}
      });
    }
    res.status(200).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var deleteIssue = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await issuesService.deleteIssueFromDB(id);
    res.status(200).json({
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    if (error.message === "Issue not found") {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message,
        error
      });
    }
  }
};
var updateIssue = async (req, res) => {
  const { id } = req.params;
  const { title, description, type } = req.body;
  try {
    const result = await issuesService.updateIssueInDB(id, {
      title,
      description,
      type
    });
    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result.rows[0]
    });
  } catch (error) {
    if (error.message === "Issue not found") {
      res.status(404).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(500).json({
        success: false,
        message: error.message,
        error
      });
    }
  }
};
var getAllIssues = async (req, res) => {
  try {
    const sort = req.query.sort;
    const type = req.query.type;
    const status = req.query.status;
    const result = await issuesService.getAllIssuesFromDB({
      sort: sort || "newest",
      type,
      status
    });
    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
      error
    });
  }
};
var issuesController = {
  createIssues,
  getSingleIssues,
  deleteIssue,
  updateIssue,
  getAllIssues
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (...roles) => {
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization;
      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized access"
        });
        return;
      }
      const decode = jwt2.verify(
        token,
        config_default.jwt_accessSecret
      );
      const userInformation = await pool.query(
        `
                SELECT * FROM "users" WHERE id=$1
                `,
        [decode.id]
      );
      const user = userInformation.rows[0];
      if (userInformation.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "User not found!"
        });
        return;
      }
      if (roles.length && !roles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden!!,This role have no access!"
        });
        return;
      }
      req.user = decode;
      next();
    } catch (error) {
      next(error);
    }
  };
};
var auth_default = auth;

// src/types/index.ts
var USER_ROLE = {
  contributor: "contributor",
  maintainer: "maintainer"
};

// src/middleware/maintainer.ts
var isMaintainer = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized access"
      });
      return;
    }
    const result = await pool.query(
      `SELECT role FROM "users" WHERE id = $1`,
      [userId]
    );
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found"
      });
      return;
    }
    const userRole = result.rows[0].role;
    if (userRole !== "maintainer") {
      res.status(403).json({
        success: false,
        message: "Forbidden! Only maintainers can delete issues."
      });
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
};
var maintainer_default = isMaintainer;

// src/middleware/maintainerOrContributor.ts
var isMaintainerOrContributor = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const issueId = req.params.id;
    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized: No user found"
      });
      return;
    }
    const userResult = await pool.query(
      `SELECT role FROM "users" WHERE id = $1`,
      [userId]
    );
    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "User not found"
      });
      return;
    }
    const userRole = userResult.rows[0].role;
    if (userRole === "maintainer") {
      next();
      return;
    }
    if (userRole === "contributor") {
      const issueResult = await pool.query(
        `SELECT reporter_id, status FROM "issues" WHERE id = $1`,
        [issueId]
      );
      if (issueResult.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: "Issue not found"
        });
        return;
      }
      const issue = issueResult.rows[0];
      if (issue.reporter_id !== userId) {
        res.status(403).json({
          success: false,
          message: "Forbidden: You can only update your own issues"
        });
        return;
      }
      if (issue.status !== "open") {
        res.status(403).json({
          success: false,
          message: "Forbidden: You can only update issues with status 'open'"
        });
        return;
      }
      next();
      return;
    }
    return;
  } catch (error) {
    next(error);
  }
};
var maintainerOrContributor_default = isMaintainerOrContributor;

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.post("/", auth_default(USER_ROLE.contributor, USER_ROLE.maintainer), issuesController.createIssues);
router2.get("/:id", issuesController.getSingleIssues);
router2.delete(
  "/:id",
  auth_default(USER_ROLE.contributor, USER_ROLE.maintainer),
  maintainer_default,
  issuesController.deleteIssue
);
router2.patch(
  "/:id",
  auth_default(USER_ROLE.contributor, USER_ROLE.maintainer),
  maintainerOrContributor_default,
  issuesController.updateIssue
);
router2.get("/", issuesController.getAllIssues);
var issuesRouter = router2;

// src/app.ts
var app = express();
app.use(express.json());
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Express Server",
    author: "Imran Ahmed"
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRouter);
var app_default = app;

// src/server.ts
var main = () => {
  createDB();
  app_default.listen(config_default.port, () => {
    console.log(`Server is listening on port ${config_default.port}`);
  });
};
main();
//# sourceMappingURL=server.js.map