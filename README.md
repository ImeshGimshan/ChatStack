# ChatStack

A production-grade, full-stack real-time chat and social platform built with a microservices architecture. ChatStack combines real-time messaging, user authentication, social posting, media management, and user profiles — all independently deployed and communicating via HTTP and RabbitMQ.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Services](#2-services)
3. [Technology Stack](#3-technology-stack)
4. [Cloud Infrastructure](#4-cloud-infrastructure)
5. [CI/CD Pipeline](#5-cicd-pipeline)
6. [Service Communication](#6-service-communication)
7. [Database Design](#7-database-design)
8. [API Reference](#8-api-reference)
9. [Environment Variables](#9-environment-variables)
10. [Running Locally](#10-running-locally)
11. [Deployment](#11-deployment)
12. [Project Structure](#12-project-structure)

---

## 1. Architecture Overview

ChatStack is built as a **microservices system** where each service is independently developed, containerized, deployed, and scaled. Services communicate via REST (synchronous) and RabbitMQ (asynchronous).

```
+-------------------------------------------------------------------------+
|                              CLIENTS                                    |
|                     Browser (Next.js Frontend)                          |
+----------------------------+--------------------------------------------+
                             |  HTTP / WebSocket
         +-------------------+--------------------+
         |                   |                    |
         v                   v                    v
  +-------------+    +--------------+    +-----------------+
  | Auth Service|    | Chat Service |    |  Media Service  |
  | Spring Boot |    |   NestJS     |    |    NestJS       |
  |  Port 8080  |    |  Port 3333   |    |   Port 3004     |
  +------+------+    +------+-------+    +-----------------+
         |                  | Redis
         | RabbitMQ         | (Socket.IO Adapter)
         v                  |
  +-------------+    +------v-------+    +-----------------+
  |Email Service|    |Social Service|    |  User Service   |
  |   NestJS    |    |   NestJS     |    |  Node/Express   |
  |(Microservice|    |  Port 3334   |    |   Port 5010     |
  |  no HTTP)   |    +--------------+    +-----------------+
  +-------------+
         |
  +------v----------------------------------------------------------+
  |                  MANAGED CLOUD SERVICES                          |
  |  Neon (PostgreSQL)  |  MongoDB Atlas  |  Upstash Redis           |
  |  CloudAMQP (RabbitMQ)  |  Cloudinary                            |
  +-----------------------------------------------------------------+
```

---

## 2. Services

### Auth Service
| Property | Value |
|----------|-------|
| Language | Java 17 |
| Framework | Spring Boot 4.0.1 |
| Port | 8080 |
| Database | PostgreSQL (Neon) |
| ORM | JPA / Hibernate |

Handles all authentication and authorization for the platform. Issues JWT tokens used by all other services to verify user identity.

**Responsibilities:**
- User registration with email validation
- Email verification via OTP (sent through RabbitMQ to Email Service)
- Login and JWT token generation
- Password reset flow
- User profile retrieval
- Internal APIs for other services to look up users by ID

---

### Chat Service
| Property | Value |
|----------|-------|
| Language | TypeScript |
| Framework | NestJS |
| Port | 3333 |
| Database | PostgreSQL (Neon) |
| ORM | Prisma v7 |
| Realtime | Socket.IO + Redis Adapter (Upstash) |

Handles real-time messaging, servers, channels, direct conversations, and social posts. Uses Socket.IO with a Redis adapter (Upstash) to support multiple replicas sharing WebSocket state.

**Responsibilities:**
- Real-time WebSocket chat (channels and DMs)
- Server/channel management (Discord-like)
- Direct conversations between users
- Social posts and comments
- Message reactions and read receipts
- End-to-end encryption support
- Role-based permissions per server

---

### Email Service
| Property | Value |
|----------|-------|
| Language | TypeScript |
| Framework | NestJS Microservice |
| Transport | RabbitMQ (CloudAMQP) |
| Queue | `email.queue` |
| Event | `email.otp.key` |

A pure message-queue microservice with no HTTP server. It only consumes events from RabbitMQ and sends transactional emails via Gmail (Nodemailer).

**Responsibilities:**
- Consume `email.otp.key` events from RabbitMQ
- Send OTP verification emails
- Send password reset emails

---

### Media Service
| Property | Value |
|----------|-------|
| Language | TypeScript |
| Framework | NestJS |
| Port | 3004 |
| Storage | Cloudinary |

Handles all file uploads and media management. Stores images in Cloudinary and returns signed URLs.

**Responsibilities:**
- Upload images (JPG, JPEG, PNG, GIF — max 5MB)
- Delete images from Cloudinary
- Generate signed access URLs for private media

---

### Social Service
| Property | Value |
|----------|-------|
| Language | TypeScript |
| Framework | NestJS |
| Port | 3334 |
| Database | PostgreSQL (Neon) |
| ORM | Prisma v7 |

Manages social graph relationships between users.

**Responsibilities:**
- Friend requests (send, accept, reject)
- Friendship status queries
- Block/unblock users

---

### User Service
| Property | Value |
|----------|-------|
| Language | JavaScript |
| Framework | Express.js |
| Port | 5010 |
| Database | MongoDB Atlas |
| ODM | Mongoose |

Manages extended user profile data (separate from auth credentials).

**Responsibilities:**
- Create user profile
- Retrieve profile by user ID
- Update profile information
- JWT verification against Auth Service

---

### Frontend
| Property | Value |
|----------|-------|
| Language | TypeScript |
| Framework | Next.js 16.1.0 |
| Port | 3000 |
| Styling | Tailwind CSS + Radix UI |
| State | React Context |
| Realtime | Socket.IO Client |

**Pages:**
- `/` — Landing page
- `/register` — User registration
- `/login` — User login
- `/verify-email` — OTP verification
- `/chat` — Real-time chat interface

---

## 3. Technology Stack

### Backend
| Technology | Version | Usage |
|------------|---------|-------|
| Java | 17 | Auth Service runtime |
| Spring Boot | 4.0.1 | Auth Service framework |
| Spring Security | 6.x | JWT authentication filter |
| NestJS | 11.x | Chat, Email, Media, Social services |
| Node.js | 20 | NestJS / Express runtime |
| Prisma | 7.x | ORM for PostgreSQL services |
| Mongoose | 8.x | ODM for MongoDB user service |
| Socket.IO | 4.x | WebSocket server (chat) |
| Passport.js | 0.7 | Auth middleware for NestJS |

### Frontend
| Technology | Version | Usage |
|------------|---------|-------|
| Next.js | 16.1.0 | React framework |
| React | 19.2.3 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |
| Radix UI | latest | Accessible UI primitives |
| Socket.IO Client | 4.x | WebSocket client |
| Axios | 1.x | HTTP client |
| js-cookie | 3.x | Cookie management |

### Infrastructure
| Technology | Usage |
|------------|-------|
| Docker | Container builds |
| Docker Compose | Local orchestration |
| GitHub Actions | CI/CD pipelines |
| GitHub Container Registry | Docker image storage |
| AWS ECS Fargate | Container hosting |
| Neon | Serverless PostgreSQL |
| MongoDB Atlas | Managed MongoDB |
| Upstash | Serverless Redis |
| CloudAMQP | Managed RabbitMQ |
| Cloudinary | Media storage |

---

## 4. Cloud Infrastructure

### AWS ECS (ap-southeast-1 — Singapore)

**Cluster:** `chatstack-cluster`

| Service | Task Definition | Port |
|---------|----------------|------|
| auth-service | auth-service-td | 8080 |
| chat-service | chat-service-td | 3333 |
| email-service | email-service-td | — |
| media-service | media-service-td | 3004 |
| social-service | social-service-td | 3334 |
| user-service | user-service-td | 5010 |
| chatstack-frontend | frontend-td | 3000 |

Each service runs as a Fargate task with a public IP. Images are pulled from GitHub Container Registry (ghcr.io).

### Managed Database Services

| Service | Provider | Database |
|---------|----------|----------|
| auth_db | Neon (PostgreSQL) | User accounts, verification |
| chat_db | Neon (PostgreSQL) | Messages, servers, channels |
| social_db | Neon (PostgreSQL) | Friend relationships |
| User profiles | MongoDB Atlas | Extended user profiles |
| Session cache | Upstash (Redis) | Socket.IO adapter state |
| Message queue | CloudAMQP (RabbitMQ) | Email event queue |

### Container Registry

Images are stored at: `ghcr.io/imeshgimshan/<service-name>`

Each push creates two tags:
- `sha-<git-commit-hash>` — immutable, for rollbacks
- `latest` — always points to newest image

---

## 5. CI/CD Pipeline

Every service has a GitHub Actions workflow (`.github/workflows/<service>-ci.yml`) with 3 jobs:

```
git push origin main
        |
        v
+---------------+
|  1. TEST/BUILD|  Run unit tests + build app
|  (always runs)|  Fails fast if tests break
+-------+-------+
        | passes
        v
+---------------+
| 2. BUILD &    |  docker build
|    PUSH       |  docker push -> ghcr.io
| (main only)   |
+-------+-------+
        |
        v
+---------------+
|  3. DEPLOY    |  aws ecs update-service
|  (main only)  |  --force-new-deployment
+---------------+
```

**Triggers:**
- Automatic: `git push` to `main` (only when files in service folder change via `paths:` filter)
- Manual: "Run workflow" button in GitHub Actions tab (`workflow_dispatch`)

**Required GitHub Secrets:**

| Secret | Used by |
|--------|---------|
| `AWS_ACCESS_KEY_ID` | All deploy jobs |
| `AWS_SECRET_ACCESS_KEY` | All deploy jobs |
| `AWS_REGION` | All deploy jobs |
| `ECS_CLUSTER` | All deploy jobs |
| `JWT_SECRET` | Auth, Chat, User |
| `CHAT_DATABASE_URL` | Chat build + ECS |
| `SOCIAL_DATABASE_URL` | Social build + ECS |
| `SPRING_DATASOURCE_URL` | Auth ECS |
| `SPRING_DATASOURCE_USERNAME` | Auth ECS |
| `SPRING_DATASOURCE_PASSWORD` | Auth ECS |
| `MONGO_URI` | User ECS |
| `REDIS_URL` | Chat ECS |
| `RABBIT_MQ_URL` | Email ECS |
| `CLOUDINARY_CLOUD_NAME` | Media ECS |
| `CLOUDINARY_API_KEY` | Media ECS |
| `CLOUDINARY_API_SECRET` | Media ECS |
| `GMAIL_USER` | Auth, Email ECS |
| `GMAIL_PASS` | Auth, Email ECS |

---

## 6. Service Communication

### Synchronous (HTTP/REST)
```
Frontend  -------->  Auth Service   (register, login, verify)
Frontend  -------->  Chat Service   (posts, history, WebSocket)
Frontend  -------->  Media Service  (upload files)
Frontend  -------->  User Service   (profiles)
Chat Svc  -------->  Auth Service   (validate tokens)
User Svc  -------->  Auth Service   (validate tokens)
```

### Asynchronous (RabbitMQ)
```
Auth Service
    | publishes event: "email.otp.key"
    | payload: { email, otp, type: "VERIFY" | "RESET" }
    v
CloudAMQP (armadillo.rmq.cloudamqp.com:5671 SSL)
    | queue: "email.queue"
    v
Email Service
    | consumes event
    v
Gmail SMTP  -->  User inbox
```

Services are decoupled. Auth does not wait for email delivery. If the email service is down, messages are queued and delivered when it recovers.

### Real-time (WebSocket)
```
Frontend Browser
    | socket.io connect: ws://chat-service-ip:3333
    | auth: { token: "Bearer <JWT>" }
    v
Chat Service (Socket.IO Gateway)
    | Redis Adapter (Upstash)
    | Allows multiple ECS replicas to share socket state
    v
All connected clients receive messages
```

---

## 7. Database Design

### Auth Service — PostgreSQL (auth_db)

**users table**
| Column | Type | Constraints |
|--------|------|-------------|
| id | BIGSERIAL | PRIMARY KEY |
| username | VARCHAR | UNIQUE, NOT NULL, 3-20 chars |
| email | VARCHAR | UNIQUE, NOT NULL |
| password | VARCHAR | NOT NULL, BCrypt hashed |
| enabled | BOOLEAN | DEFAULT false |
| verficationCode | VARCHAR | OTP code |
| verficationCodeExpiresAt | TIMESTAMP | OTP expiry |

### Chat Service — PostgreSQL (chat_db)

Key models managed by Prisma:
- **User** — lightweight reference (actual data in Auth Service)
- **Server** — Discord-like server with name, description, owner
- **Channel** — belongs to a server
- **ChannelMessage** — messages in a channel
- **ConversationMessage** — direct messages between users
- **Role** — permission roles per server
- **Post** — social feed posts
- **Comment** — comments on posts
- **MessageReaction** — emoji reactions
- **UserKey** — encryption public keys

### Social Service — PostgreSQL (social_db)

**friendship table**
| Column | Type |
|--------|------|
| id | BIGINT PK |
| requesterId | BIGINT |
| addresseeId | BIGINT |
| status | ENUM(PENDING, FRIENDS, BLOCKED) |

### User Service — MongoDB (User database)

**profiles collection** (Mongoose):
- userId (reference to Auth Service user id)
- display name, bio, avatar, and other profile fields

---

## 8. API Reference

### Auth Service (base: `/api/auth`)

#### Register
```
POST /api/auth/register
Content-Type: application/json

{
  "username": "johndoe",        // 3-20 characters, unique
  "email": "john@email.com",    // valid email, unique
  "password": "password123"     // min 8 characters
}

Response 200: { id, username, email, enabled: false, ... }
```

#### Verify Email
```
POST /api/auth/verify
Content-Type: application/json

{
  "email": "john@email.com",
  "code": "123456"
}

Response 200: { "message": "User verified successfully" }
```

#### Login
```
POST /api/auth/login
Content-Type: application/json

{
  "username": "johndoe",
  "password": "password123"
}

Response 200: { "token": "<JWT>", "id": 1, "username": "johndoe", "email": "..." }
```

#### Forgot Password
```
POST /api/auth/forgotPassword
{ "email": "john@email.com" }
Response 200: { "message": "Password reset OTP sent..." }
```

#### Reset Password
```
POST /api/auth/resetPassword
{
  "email": "john@email.com",
  "code": "654321",
  "newPassword": "newpassword123"
}
Response 200: { "message": "Password reset successfully" }
```

#### Resend OTP
```
POST /api/auth/resendOtp
{ "email": "john@email.com" }
Response 200: { "message": "New OTP sent to your email successfully" }
```

#### Get My Profile
```
GET /api/auth/me
Authorization: Bearer <token>
Response 200: { "id": 1, "username": "johndoe" }
```

---

### Media Service (base: `/media`)

#### Upload Image
```
POST /media/upload
Content-Type: multipart/form-data
Body: file (jpg/jpeg/png/gif, max 5MB)

Response 200: { "publicId": "...", "format": "jpg" }
```

#### Delete Image
```
DELETE /media/:publicId
Response 200: { "message": "File deleted successfully" }
```

#### Get Signed URL
```
GET /media/access/:publicId
Response 200: { "url": "https://res.cloudinary.com/..." }
```

---

### User Service (base: `/profile`)

All routes require `Authorization: Bearer <token>`

```
GET    /profile/me          Get own profile
POST   /profile/me          Create own profile
PUT    /profile/me          Update own profile
GET    /profile/:userId     Get profile by user ID
```

---

## 9. Environment Variables

### Auth Service
```env
SPRING_DATASOURCE_URL=jdbc:postgresql://<host>/auth_db?sslmode=require
SPRING_DATASOURCE_USERNAME=<username>
SPRING_DATASOURCE_PASSWORD=<password>
JWT_SECRET=<long-random-string>
SPRING_RABBITMQ_HOST=armadillo.rmq.cloudamqp.com
SPRING_RABBITMQ_PORT=5671
SPRING_RABBITMQ_USERNAME=<vhost>
SPRING_RABBITMQ_PASSWORD=<password>
SPRING_RABBITMQ_VIRTUAL_HOST=<vhost>
SPRING_RABBITMQ_SSL_ENABLED=true
GMAIL_USER=your@gmail.com
GMAIL_PASS=<gmail-app-password>
```

### Chat Service
```env
CHAT_DATABASE_URL=postgresql://<user>:<pass>@<host>/chat_db?sslmode=require
JWT_SECRET=<same-as-auth-service>
REDIS_URL=rediss://default:<pass>@<host>:6379
NODE_ENV=production
PORT=3333
```

### Email Service
```env
RABBIT_MQ_URL=amqps://<user>:<pass>@armadillo.rmq.cloudamqp.com/<vhost>
GMAIL_USER=your@gmail.com
GMAIL_PASS=<gmail-app-password>
```

### Media Service
```env
CLOUDINARY_CLOUD_NAME=<name>
CLOUDINARY_API_KEY=<key>
CLOUDINARY_API_SECRET=<secret>
PORT=3004
```

### Social Service
```env
SOCIAL_DATABASE_URL=postgresql://<user>:<pass>@<host>/social_db?sslmode=require
PORT=3334
NODE_ENV=production
```

### User Service
```env
MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/
JWT_SECRET=<same-as-auth-service>
PORT=5010
AUTH_SERVICE_URL=http://<auth-service-ip>:8080
NODE_ENV=production
CORS_ORIGIN=*
```

### Frontend
```env
NEXT_PUBLIC_AUTH_API=http://<auth-service-ip>:8080
NEXT_PUBLIC_CHAT_API=http://<chat-service-ip>:3333
```

> See the `env-examples/` folder for dummy example files safe to reference.

---

## 10. Running Locally

### Prerequisites
- Docker Desktop
- Java 17+
- Node.js 20+
- Git

### Steps

1. **Clone the repository**
```bash
git clone https://github.com/imeshgimshan/chatstack.git
cd ChatStack
```

2. **Create a `.env` file** in the project root and fill in your cloud database credentials (see Section 9, or copy from `env-examples/`).

3. **Start all services with Docker Compose**
```bash
docker-compose up --build
```

| Service | URL |
|---------|-----|
| Auth Service | http://localhost:8080 |
| Chat Service | http://localhost:3333 |
| Media Service | http://localhost:3004 |
| Social Service | http://localhost:3334 |
| User Service | http://localhost:5010 |

4. **Run the frontend**
```bash
cd Frontend
cp env-examples/.env.frontend .env.local   # then fill in values
npm install
npm run dev
# Open: http://localhost:3000
```

### Running Services Individually (without Docker)

**Auth Service:**
```bash
cd AuthService
./mvnw spring-boot:run
```

**Any NestJS service:**
```bash
cd chat-service   # or email-service, media-service, social-service
npm install
npx prisma generate   # for Prisma-based services
npm run start:dev
```

**User Service:**
```bash
cd user-service
npm install
npm run dev
```

---

## 11. Deployment

ChatStack is deployed to AWS ECS Fargate via GitHub Actions CI/CD pipelines.

### Deploying via git push

```bash
git add .
git commit -m "your message"
git push origin main
```

GitHub Actions automatically runs: Test → Build Docker image → Push to GHCR → Deploy to ECS.

### Manual Trigger (no code change)

GitHub → **Actions** tab → select any workflow → **Run workflow** → branch: `main` → **Run workflow**

### Making GHCR Packages Public (required first time)

ECS pulls images from GHCR. Packages must be public for ECS to pull without auth:

1. `github.com` → your profile → **Packages**
2. Click each package → **Package Settings → Change visibility → Public**
3. Do this for all 7 packages after the first CI/CD run

### Rollback

To roll back a service to a previous version:
1. ECS → Task Definitions → select the service → find previous revision
2. ECS → Service → **Update** → select previous task definition revision
3. ECS drains old task and starts the previous version

### Monitoring & Logs

- **Logs**: ECS → Cluster → Service → **Tasks** tab → click task → **Logs** (CloudWatch)
- **Health**: ECS Services shows `1/1 Tasks running` when healthy
- **Failed tasks**: Check stopped tasks under **Tasks** tab → View logs for crash reason

---

## 12. Project Structure

```
ChatStack/
|
+-- .github/
|   +-- workflows/
|       +-- auth-ci.yml           # Auth Service CI/CD
|       +-- chat-ci.yml           # Chat Service CI/CD
|       +-- email-ci.yml          # Email Service CI/CD
|       +-- media-ci.yml          # Media Service CI/CD
|       +-- social-ci.yml         # Social Service CI/CD
|       +-- frontend-ci.yml       # Frontend CI/CD
|
+-- AuthService/                   # Java Spring Boot
|   +-- src/main/java/com/chatstack/authservice/
|   |   +-- config/               # SecurityConfig, RabbitMQConfig
|   |   +-- controllers/          # AuthController, InternalUserController
|   |   +-- dto/                  # LoginRequest, AuthResponse, UserDto
|   |   +-- entities/             # User JPA entity
|   |   +-- repositories/         # UserRepository
|   |   +-- security/             # JwtUtil, JwtAuthenticationFilter
|   |   +-- services/             # AuthService (business logic)
|   +-- src/main/resources/application.properties
|   +-- Dockerfile
|   +-- pom.xml
|
+-- chat-service/                  # NestJS + Prisma + Socket.IO
|   +-- src/
|   |   +-- auth/                 # JWT guard and strategy
|   |   +-- chat/                 # WebSocket gateway + Redis adapter
|   |   +-- channel/              # Channel CRUD
|   |   +-- server/               # Server management
|   |   +-- conversation/         # Direct messages
|   |   +-- post/                 # Social posts
|   |   +-- comment/              # Post comments
|   |   +-- permission/           # Role-based permissions
|   |   +-- encryption/           # E2E encryption keys
|   |   +-- prisma/               # Prisma service module
|   |   +-- main.ts
|   +-- prisma/schema.prisma
|   +-- prisma.config.ts
|   +-- Dockerfile
|
+-- email-service/                 # NestJS Microservice (RabbitMQ only)
|   +-- src/
|   |   +-- app.controller.ts     # RabbitMQ event handlers
|   |   +-- app.service.ts        # Nodemailer email logic
|   |   +-- main.ts               # RabbitMQ transport setup
|   +-- Dockerfile
|
+-- media-service/                 # NestJS + Cloudinary
|   +-- src/media/                # Upload, delete, signed URL controllers
|   +-- Dockerfile
|
+-- social-service/                # NestJS + Prisma
|   +-- src/prisma/
|   +-- prisma/schema.prisma      # friendship model
|   +-- Dockerfile
|
+-- user-service/                  # Express.js + Mongoose
|   +-- src/
|   |   +-- controllers/          # Profile CRUD handlers
|   |   +-- middleware/           # JWT auth middleware
|   |   +-- models/               # Profile.model.js (Mongoose)
|   |   +-- routes/               # profile.routes.js
|   +-- Dockerfile
|
+-- Frontend/                      # Next.js 16
|   +-- app/                      # App Router pages
|   |   +-- page.tsx              # Landing page
|   |   +-- login/                # Login page
|   |   +-- register/             # Register page
|   |   +-- verify-email/         # OTP page
|   |   +-- chat/                 # Chat interface
|   +-- components/               # Reusable UI components
|   +-- context/AuthContext.tsx   # Global auth state
|   +-- hooks/useSocket.ts        # WebSocket hook
|   +-- api/authApi.ts            # Axios instance for auth
|   +-- services/auth.service.ts  # Auth business logic
|   +-- Dockerfile
|
+-- env-examples/                  # Safe dummy env files for reference
|   +-- .env.auth-service
|   +-- .env.chat-service
|   +-- .env.email-service
|   +-- .env.media-service
|   +-- .env.social-service
|   +-- .env.user-service
|   +-- .env.frontend
|
+-- docker-compose.yml             # Local development orchestration
+-- README.md
```

---

## Security Notes

- Never commit `.env` files — use `env-examples/` as reference only
- JWT secret must be identical across Auth Service, Chat Service, and User Service
- All database connections use TLS/SSL (`sslmode=require`)
- RabbitMQ uses SSL on port 5671 (not the default 5672)
- All sensitive credentials are stored in GitHub Secrets for CI/CD
- AWS IAM user for CI/CD should have minimal ECS-only permissions
- ECS security groups should only open the ports each service actually listens on
