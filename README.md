# SprintSync

A modern full-stack task management app for teams, built with **Next.js**, **PostgreSQL**, **Prisma**, **Supabase**, and more.

---

## Live Demo

👉 [https://sprintsync-psi.vercel.app/](https://sprintsync-psi.vercel.app/)

---

## Demo Credentials

- **Admin**
  - Email: `admin@sprintsync.com`
  - Password: `admin123`
- **User**
  - Email: `user@sprintsync.com`
  - Password: `user123`

---

## 🛠 Tech Stack & Choices

- **Next.js** → Unified frontend & backend framework with SSR and API routes.  
- **PostgreSQL** → Reliable & scalable relational database.  
- **Supabase** → Managed PostgreSQL hosting.  
- **Prisma** → Type-safe ORM for queries & migrations.  
- **Zod** → Schema validation and type-safe request handling.  
- **Swagger UI React** → Interactive API documentation.  
- **Vercel** → Optimized deployment platform for Next.js.  
- **Docker & Docker Compose** → Containerized local development.  
- **OpenAI API** → AI-powered task suggestions.  

---

## 📦 Prerequisites

- Node.js **v20**  
- npm  
- Docker & Docker Compose (optional for containerized setup)   
- (Optional) OpenAI API key  

---

## 📂 Project Structure

sprintsync/
├── app/ # Next.js app routes & pages
├── components/ # UI components (TaskCard, Modals, etc.)
├── lib/ # Utilities (Prisma client, OpenAI integration)
├── prisma/ # Prisma schema
├── public/ # Static assets
├── supabase/ # SQL migrations for Supabase
├── scripts/ # DB initialization scripts
├── .env # Environment variables
├── Dockerfile # Docker build config
├── docker-compose.yml# Multi-service orchestration
├── package.json # Dependencies & scripts
└── README.md # Project documentation


---

## ⚙️ Setup

1. **Clone the repository**
   ```sh
   git clone https://github.com/yourusername/sprintsync.git
   cd sprintsync
   ```

2. **Install dependencies**
    ```npm install```

3. **Configure environment variables**
  Fill in .env:
  DATABASE_URL
  JWT_SECRET
  OPENAI_API_KEY (optional)

4. **Run locally**
 ```npm run dev```

5. **Run with Docker**
  ```docker compose up --build```

6. **Database migrations**
  Prisma migrations run automatically on startup.

## 📖 API Documentation
  Swagger UI available at /swagger
  Built using swagger-ui-react and OpenAPI spec

## ✨ Features
1. Task management with status, priority & time tracking
2. Admin & user roles
3. AI-powered task suggestions (OpenAI)
4. Zod for request validation
5. Swagger API docs
6. Secure authentication (JWT / bcrypt)
7. Fully containerized with Docker
8. Production-ready deployment on Vercel

## Why These Choices?
Next.js → Modern, full-stack, SSR support.
PostgreSQL + Supabase → Scalable managed database.
Prisma → Safer, cleaner database access.
Zod → Type-safe validation.
Swagger → Easy API testing & docs.
Vercel → Seamless deployment for Next.js.

## Conclusion
SprintSync is built for modern teams, optimized for speed, reliability, and developer experience.

---