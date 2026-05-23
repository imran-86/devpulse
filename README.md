# DevPulse – Issue Tracker for Dev Teams

DevPulse is a backend-driven issue tracking system where developers can report bugs, feature requests, and manage software development tasks.  
It includes role‑based access (Maintainer / Contributor), full CRUD on issues, filtering, sorting, and reporter details without SQL JOINs.

🔗 **Live URL:** [https://devpulse-imran-86-imran-ahmeds-projects-a9351889.vercel.app/](https://devpulse-imran-86-imran-ahmeds-projects-a9351889.vercel.app/)

---

## 📌 Features

- **Authentication & Authorization**  
  JWT‑based login with role‑protected routes (`maintainer` / `contributor`).

- **Issue Management**  
  - Create, view, update, delete issues  
  - Update restriction: maintainer (any issue) / contributor (own issue, only when `status = open`)

- **Filtering & Sorting**  
  Get all issues with optional filters:  
  `type` (bug / feature_request), `status` (open / in_progress / resolved),  
  `sort` (newest / oldest)

- **Clean Data Presentation**  
  Reporter details (id, name, role) are attached to each issue **without using SQL JOINs** – two separate queries + in‑memory mapping.

- **PostgreSQL** database with proper timestamps (`created_at` / `updated_at`).

---

## 🧰 Tech Stack

| Category       | Technology                               |
|----------------|------------------------------------------|
| Runtime        | Node.js                                  |
| Framework      | Express.js                               |
| Language       | TypeScript                               |
| Database       | PostgreSQL                               |
| Authentication | JWT (jsonwebtoken) + bcrypt              |
| Environment    | dotenv                                   |
| Deployment     | Vercel                                   |

---

## 🚀 Setup Instructions (Local Development)

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/devpulse.git
   cd devpulse
  2. **Install dependencies**    
    
     npm install
  3.**Create .env**   

  PORT=5000  
  DATABASE_URL=postgresql://user:password@localhost:5432/devpulse  
J WT_ACCESS_SECRET=your_super_secret_jwt_key  
4. **Start the development server**  
npm start  


## 📁 Database Schema Summary

### `users` table

| Column     | Type                        | Description                 |
|------------|-----------------------------|-----------------------------|
| id         | SERIAL PRIMARY KEY          | Auto‑increment user ID      |
| name       | VARCHAR NOT NULL            | User's full name            |
| email      | VARCHAR UNIQUE NOT NULL     | Login email                 |
| password   | TEXT NOT NULL               | bcrypt hash                 |
| role       | VARCHAR NOT NULL            | `maintainer` / `contributor`|
| created_at | TIMESTAMP DEFAULT NOW()     | Auto‑generated timestamp    |
| updated_at | TIMESTAMP DEFAULT NOW()     | Auto‑updated timestamp      |

### `issues` table

| Column       | Type                        | Description                         |
|--------------|-----------------------------|-------------------------------------|
| id           | SERIAL PRIMARY KEY          | Auto‑increment issue ID             |
| title        | VARCHAR(150) NOT NULL       | Short headline (max 150 chars)      |
| description  | TEXT NOT NULL               | Detailed explanation                |
| type         | VARCHAR(20) NOT NULL        | `bug` / `feature_request`           |
| status       | VARCHAR(20) DEFAULT 'open'  | `open`, `in_progress`, `resolved`   |
| reporter_id  | INTEGER NOT NULL            | References `users.id`               |
| created_at   | TIMESTAMP DEFAULT NOW()     | Auto‑generated timestamp            |
| updated_at   | TIMESTAMP DEFAULT NOW()     | Auto‑updated on change              |

> **Note:** No foreign key constraint is used on `reporter_id` – validation is handled in application logic (as per project requirements).
