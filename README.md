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
