# SaaS Transformation Plan: Tech-Debt Auditor

## CONTEXT

Currently, the Tech-Debt Auditor is a **local CLI tool** that scans the current directory and outputs findings to `findings.json`. The user wants to transform this into a **SaaS platform** where:
- Users upload/provide a GitHub repo link
- The system analyzes that repo
- Results are returned and stored
- The system is hosted on the cloud
- CI/CD is integrated

This requires a complete architectural shift from **file-based, single-tenant** to **API-first, multi-tenant, cloud-hosted**.

---

## PROJECT STATUS

### ✅ COMPLETED

1. **Architecture Design & Planning**
   - Defined complete SaaS transformation architecture (REST API, job queue, database)
   - Designed multi-tenant database schema (users, scans, findings tables)
   - Created three-pipeline CI/CD model (app deployment, worker deployment, user scans)
   - Documented all core concepts with code examples

2. **Existing Codebase Analysis**
   - `scanner/index.js`: Audit orchestrator with Promise.all for parallel file processing
   - `scanner/crawler.js`: Async recursive directory traversal (fs.promises for non-blocking I/O)
   - `scanner/adapters/git-adapter.js`: Git blame adapter using child_process.exec
   - `scanner/scorer/router.js`: Hybrid routing with Gemini API + local fallback
   - `scanner/scorer/gemini-client.js`: Google Gemini 1.5 Flash API integration
   - `scanner/scorer/local-engine.js`: Local scoring engine (FIXME=7, HACK=5, TODO=3 + age/keyword bonuses)
   - `dashboard/src/App.jsx`: React SPA with finding visualization
   - `.github/workflows/audit.yml`: Current GitHub Actions workflow (CLI → findings.json)

3. **Technology & Hosting Decisions**
   - Selected **Railway** as hosting platform (free tier, built-in PostgreSQL + Redis)
   - Selected **Vercel** for frontend deployment (free tier React hosting)
   - Confirmed **GitHub OAuth 2.0** for authentication
   - Confirmed **WebSocket** (Socket.io) for real-time updates

### 🔄 IN PROGRESS / PENDING

#### Phase 1: Backend API + Database (NEXT PRIORITY)
- [ ] Initialize backend Express.js server structure
- [ ] Create PostgreSQL database schema (users, scans, findings)
- [ ] Implement JWT authentication (generate, verify tokens)
- [ ] Create auth routes: POST /auth/login, POST /auth/logout
- [ ] Create scan routes: POST /api/scans, GET /api/scans/:id
- [ ] Implement authentication middleware
- [ ] Add input validation middleware
- [ ] Setup database connection pool & environment variables
- [ ] Write tests for auth and scan endpoints

#### Phase 2: Job Queue + Workers
- [ ] Setup Redis connection & Bull.js queue
- [ ] Create audit-worker.js process (clone → scan → score → save)
- [ ] Implement job.progress() for real-time tracking
- [ ] Add job retry logic (3 attempts with exponential backoff)
- [ ] Create temp directory management & cleanup
- [ ] Integrate existing scanner with worker (import runAudit)
- [ ] Test worker with sample repositories

#### Phase 3: Frontend SPA
- [ ] Migrate dashboard to separate frontend/ directory structure
- [ ] Create Login.jsx page (GitHub OAuth flow)
- [ ] Create Dashboard.jsx with repo upload form
- [ ] Create ScanPage.jsx with progress tracking
- [ ] Create UploadForm.jsx component
- [ ] Create ScanProgress.jsx component with WebSocket updates
- [ ] Create ResultsGrid.jsx for findings display
- [ ] Implement Zustand state management (user, scans)
- [ ] Setup Axios API wrapper service

#### Phase 4: GitHub Integration
- [ ] Setup GitHub OAuth app (settings → Developer Settings)
- [ ] Create GitHub OAuth callback handler (POST /auth/github)
- [ ] Store/retrieve GitHub access tokens securely
- [ ] Implement optional webhook listener (GitHub push → auto-scan)

#### Phase 5: Hosting + CI/CD
- [ ] Create Dockerfile for backend
- [ ] Create docker-compose.yml for local development
- [ ] Create GitHub Actions deploy workflow (.github/workflows/deploy.yml)
- [ ] Create worker deployment workflow (.github/workflows/worker-deploy.yml)
- [ ] Setup Railway PostgreSQL database
- [ ] Setup Railway Redis instance
- [ ] Deploy to Railway and Vercel
- [ ] Configure environment variables (GEMINI_API_KEY, DATABASE_URL, etc.)

#### Phase 6: Monitoring & Production
- [ ] Add error tracking (Sentry optional)
- [ ] Implement logging strategy
- [ ] Add rate limiting (max scans per hour)
- [ ] Add subscription tier logic
- [ ] Performance monitoring dashboard

---

## NEW ARCHITECTURE OVERVIEW

### High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          SAAS PLATFORM ARCHITECTURE                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                         USER BROWSER (Frontend)                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │ React SPA (Dashboard)                                              │  │
│  │ - Login/Auth UI                                                    │  │
│  │ - "Upload Repo Link" Form → Input GitHub URL                      │  │
│  │ - Live Scan Status (WebSocket polling)                            │  │
│  │ - Results Dashboard (Findings Grid, Metrics, Filters)             │  │
│  │ - Scan History / Trends                                           │  │
│  └────────────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────┘
                                    ↕ (REST API + WebSocket)
┌────────────────────────────────────────────────────────────────────────────┐
│                      EXPRESS/NODEJS BACKEND SERVER                         │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ API Routes                                                          │   │
│  │ ├─ POST /auth/login          (JWT authentication)                  │   │
│  │ ├─ POST /api/scans           (Create new scan with GitHub URL)     │   │
│  │ ├─ GET /api/scans/:id        (Get scan status + findings)          │   │
│  │ ├─ GET /api/user/scans       (List all user's scans)              │   │
│  │ ├─ WebSocket /ws             (Real-time scan progress)             │   │
│  │ └─ POST /webhooks/github     (GitHub push event trigger)          │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Middleware & Services                                               │   │
│  │ ├─ Authentication (JWT + Passport.js)                              │   │
│  │ ├─ GitHub OAuth Integration (user repos access)                    │   │
│  │ ├─ Input Validation (URL, scope checks)                            │   │
│  │ └─ Request Logging (audit trail)                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
                                    ↕ (Queue)
┌────────────────────────────────────────────────────────────────────────────┐
│                      JOB QUEUE & WORKERS                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Redis / Bull Job Queue                                              │   │
│  │ - Stores: { scanId, repoUrl, userId, gitHash }                     │   │
│  │ - Retry logic: 3 attempts if worker fails                          │   │
│  │ - Priority: User scans > scheduled scans                           │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    ↕                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Worker Processes (1+ instances)                                     │   │
│  │ ├─ Clone repo: git clone --depth 1 <URL> → temp directory          │   │
│  │ ├─ Run scanner: runAudit(tempDir) → findings array                 │   │
│  │ ├─ Score findings: Gemini API + local fallback                     │   │
│  │ └─ Save to DB: Insert findings with scanId                         │   │
│  │ (Can scale horizontally: 5+ workers for concurrency)               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
                                    ↕
┌────────────────────────────────────────────────────────────────────────────┐
│                     DATABASE LAYER (PostgreSQL)                            │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │ Tables                                                              │   │
│  │ ├─ users (id, email, passwordHash, subscription_tier)             │   │
│  │ ├─ scans (id, userId, repoUrl, status, createdAt, completedAt)    │   │
│  │ ├─ findings (id, scanId, file, line, category, riskScore, ...)    │   │
│  │ ├─ scan_history (id, userId, trend data, metrics over time)       │   │
│  │ └─ github_integrations (id, userId, githubAccessToken, ...)       │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## WHERE CI/CD FITS IN THIS NEW MODEL

### OLD CI/CD (Current)
```
GitHub Push → GitHub Actions → npm run audit → findings.json → Deployed
```

### NEW CI/CD (SaaS Model)

There are **THREE separate CI/CD pipelines** now:

#### 1. **Application CI/CD Pipeline** (Deploys the SaaS platform itself)
```
Developer pushes code → GitHub Actions
  ├─ Step: npm ci (root + dashboard)
  ├─ Step: Run tests (Jest, React Testing Library)
  ├─ Step: Lint & type-check (ESLint, TypeScript)
  ├─ Step: Build Docker image (Node + scanner)
  ├─ Step: Push to Docker Hub / AWS ECR
  ├─ Step: Deploy to AWS ECS / Heroku / Railway
  └─ Result: New version of SaaS platform live for all users
```

#### 2. **Worker CI/CD Pipeline** (Deploys background workers separately)
```
Developer updates scanner logic → GitHub Actions
  ├─ Step: Test scanner module (unit tests)
  ├─ Step: Build worker Docker image
  ├─ Step: Push to Docker registry
  ├─ Step: Deploy updated worker instances
  └─ Result: Workers auto-restart and pick up new code
```

#### 3. **User-Triggered Scans** (Not CI/CD, but triggered workflow)
```
User clicks "Scan Repo" button on dashboard
  ├─ Frontend: POST /api/scans { repoUrl: "github.com/user/repo" }
  ├─ Backend: Validate & create Scan record
  ├─ Job Queue: Enqueue scanning job
  ├─ Worker: Clone repo → Run scanner → Score findings → Save to DB
  ├─ WebSocket: Send progress updates to frontend
  └─ Frontend: Show results in real-time
```

---

## CORE IMPLEMENTATION CONCEPTS (Each Module Explained)

### 1. FRONTEND (React SPA)

**Purpose:** User interface for uploading repo links, viewing results, managing scans

**Key Components:**

```
src/pages/
├─ Login.jsx           # GitHub OAuth or email/password login
├─ Dashboard.jsx       # Home page (recent scans, upload form)
├─ ScanPage.jsx        # Live scan status + results
└─ History.jsx         # All past scans, trends

src/components/
├─ UploadForm.jsx      # Input GitHub repo URL
├─ ScanProgress.jsx    # Real-time progress bar (WebSocket)
├─ ResultsGrid.jsx     # Findings display
└─ MetricsPanel.jsx    # Summary stats

src/services/
├─ api.js              # Axios/fetch wrapper for REST calls
├─ websocket.js        # WebSocket connection for live updates
└─ auth.js             # JWT token management
```

**Tech Stack:**
- React 19 + Vite (same as before)
- Axios (HTTP client)
- React Router (multi-page routing)
- Zustand / Redux (state management for user, scans)
- Socket.io-client (WebSocket for live updates)

---

### 2. BACKEND API (Express.js Server)

**Purpose:** REST API that handles user requests, orchestrates scanning

**Key Routes:**

```javascript
// Authentication
POST /auth/login           // Email + password → JWT token
POST /auth/github          // GitHub OAuth callback
POST /auth/logout          // Clear token

// Scan Management
POST /api/scans            // Create new scan (input: repoUrl)
GET /api/scans/:id         // Get scan details + findings
GET /api/scans/:id/status  // Get current scan status
GET /api/user/scans        // List all user's scans (with pagination)
DELETE /api/scans/:id      // Cancel running scan

// Findings
GET /api/scans/:id/findings  // Paginated findings for scan
GET /api/findings/export      // Export as CSV/JSON

// Webhooks
POST /webhooks/github       // GitHub push event → auto-scan
```

**Core Concepts Explained:**

#### A. **Authentication (JWT)**
```javascript
// User logs in
POST /auth/login { email, password }
  ├─ Hash password check
  ├─ Generate JWT token
  └─ Return token to client

// Client stores JWT in localStorage
// Every API request includes: Authorization: Bearer <JWT>
// Backend middleware validates token
```

**Why JWT?** Stateless authentication. No session storage needed. Can scale horizontally.

---

#### B. **Scan Orchestration**
```javascript
POST /api/scans
  ├─ Validate: Is GitHub URL valid?
  ├─ Check: Does user have permission? (rate limits, subscription)
  ├─ Create: INSERT INTO scans (userId, repoUrl, status='QUEUED')
  ├─ Emit: Send event to job queue
  ├─ WebSocket: Notify frontend "scan started"
  └─ Return: { scanId, status: 'QUEUED' }
```

**Why separate?** Immediate response to user. Real scanning happens asynchronously.

---

#### C. **Input Validation & Security**
```javascript
// Validate GitHub URL
if (!repoUrl.match(/^https:\/\/github\.com\/[\w-]+\/[\w-]+$/)) {
  throw new Error("Invalid GitHub URL");
}

// Check rate limits (user can only run X scans per hour)
const recentScans = await Scan.countDocuments({
  userId,
  createdAt: { $gte: Date.now() - 3600000 } // Last hour
});

if (recentScans >= 5) {
  throw new Error("Rate limit exceeded");
}

// Optional: Check subscription tier
if (user.subscription === 'free' && recentScans >= 1) {
  throw new Error("Free tier limited to 1 scan/hour");
}
```

---

### 3. JOB QUEUE & WORKERS (Redis + Bull)

**Purpose:** Handle long-running scans asynchronously without blocking API

**Architecture:**

```
Frontend → API Creates Scan → Job Enqueued in Redis
                                     ↓
                        ┌────────────┴────────────┐
                        ↓                         ↓
                    Worker 1                  Worker 2
              (processes jobs)           (processes jobs)
                    ├─ Clone repo              ├─ Clone repo
                    ├─ Run scanner            ├─ Run scanner
                    ├─ Score findings         ├─ Score findings
                    └─ Save to DB             └─ Save to DB
                        ↓                         ↓
                    Frontend ← WebSocket ← Backend (updates scan status)
```

**Core Concepts:**

#### A. **Job Queue (Redis + Bull.js)**

```javascript
// backend/workers/queue.js
const Queue = require('bull');
const scanQueue = new Queue('audit-scans', {
  redis: {
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  },
  defaultJobOptions: {
    attempts: 3,              // Retry failed jobs 3 times
    backoff: {
      type: 'exponential',
      delay: 2000             // Wait 2s, then 4s, then 8s
    }
  }
});

// Enqueue a job
scanQueue.add({
  scanId: '12345',
  repoUrl: 'github.com/user/repo',
  userId: 'user-123'
});
```

**Why Redis + Bull?** 
- Redis: Fast, in-memory job storage
- Bull: Job retry logic, concurrency control, progress tracking
- Survives worker restarts (jobs persisted in Redis)

---

#### B. **Worker Process**

```javascript
// backend/workers/audit-worker.js
scanQueue.process(10, async (job) => {  // Max 10 concurrent jobs per worker
  const { scanId, repoUrl, userId } = job.data;
  
  try {
    // Step 1: Update scan status
    job.progress(5);
    await Scan.updateOne({ _id: scanId }, { status: 'CLONING' });
    
    // Step 2: Clone repo
    const tempDir = path.join('/tmp', `scan-${scanId}`);
    await execPromise(`git clone --depth 1 ${repoUrl} ${tempDir}`);
    job.progress(20);
    
    // Step 3: Run scanner
    const findings = await runAudit(tempDir);
    job.progress(60);
    
    // Step 4: Score findings (with Gemini API)
    const scoredFindings = await Promise.all(
      findings.map(f => auditComment(f.category, f.comment, f.createdAt))
    );
    job.progress(80);
    
    // Step 5: Save to database
    await Finding.insertMany(
      scoredFindings.map(f => ({
        scanId,
        ...f
      }))
    );
    job.progress(100);
    
    // Step 6: Update scan status
    await Scan.updateOne(
      { _id: scanId },
      { 
        status: 'COMPLETED',
        completedAt: new Date(),
        findingsCount: scoredFindings.length
      }
    );
    
    return { success: true, findingsCount: scoredFindings.length };
    
  } catch (error) {
    await Scan.updateOne(
      { _id: scanId },
      { status: 'FAILED', error: error.message }
    );
    throw error; // Bull will retry this job
  }
});
```

**Key Concepts:**
- `job.progress(%)` - Updates percentage for frontend
- Retry logic - If worker crashes, job retries automatically
- Isolation - Each job gets its own temp directory
- Cleanup - After job completes, delete temp files

---

#### C. **WebSocket Real-Time Updates**

```javascript
// Backend: Send progress to frontend
io.on('connection', (socket) => {
  socket.on('subscribe_scan', (scanId) => {
    socket.join(`scan-${scanId}`);
  });
  
  socket.on('disconnect', () => {
    socket.leave(`scan-${scanId}`);
  });
});

// When job progresses
scanQueue.on('progress', (job) => {
  io.to(`scan-${job.data.scanId}`).emit('progress', {
    scanId: job.data.scanId,
    percentage: job.progress()
  });
});

// Frontend: Listen for updates
const socket = io();
socket.emit('subscribe_scan', scanId);
socket.on('progress', ({ percentage }) => {
  setProgress(percentage);
});
```

---

### 4. DATABASE LAYER (PostgreSQL)

**Purpose:** Persistent storage of users, scans, and findings

**Schema:**

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR NOT NULL,
  github_id VARCHAR UNIQUE,
  github_token VARCHAR,  -- For GitHub API integration
  subscription_tier VARCHAR DEFAULT 'free',  -- 'free', 'pro', 'enterprise'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Scans table (one scan per repo upload)
CREATE TABLE scans (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  repo_url VARCHAR NOT NULL,
  status VARCHAR DEFAULT 'QUEUED',  -- 'QUEUED', 'CLONING', 'SCANNING', 'COMPLETED', 'FAILED'
  error_message TEXT,
  findings_count INTEGER,
  git_hash VARCHAR,  -- Commit hash scanned
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Findings table (one row per tech-debt item found)
CREATE TABLE findings (
  id UUID PRIMARY KEY,
  scan_id UUID REFERENCES scans(id) ON DELETE CASCADE,
  file VARCHAR NOT NULL,
  line_number INTEGER NOT NULL,
  category VARCHAR NOT NULL,  -- 'TODO', 'FIXME', 'HACK', or AI category
  risk_score INTEGER NOT NULL,  -- 1-10
  comment TEXT NOT NULL,
  explanation TEXT NOT NULL,
  author VARCHAR NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (scan_id) REFERENCES scans(id)
);

-- Indices for fast queries
CREATE INDEX idx_scans_user_id ON scans(user_id);
CREATE INDEX idx_findings_scan_id ON findings(scan_id);
CREATE INDEX idx_scans_created_at ON scans(created_at);
```

**Core Concepts:**

#### A. **User Isolation (Multi-Tenancy)**
```javascript
// Every query includes userId check
GET /api/scans/:id
  ├─ Verify: req.user.id matches scan.user_id
  ├─ Query: SELECT * FROM findings WHERE scan_id = :id
  └─ Security: User can only see their own scans
```

**Why?** Each user sees only their data. Prevents data leaks.

---

#### B. **Scan Status Tracking**
```
QUEUED → CLONING → SCANNING → COMPLETED (or FAILED at any step)
```

Frontend polls: `GET /api/scans/:id/status` every 1s
Returns: `{ status: 'SCANNING', progress: 45%, message: 'Scoring findings...' }`

---

### 5. GITHUB INTEGRATION

**Purpose:** Allow users to authenticate with GitHub and auto-scan their repos

**Two Methods:**

#### A. **GitHub OAuth** (Recommended)
```javascript
// User clicks "Login with GitHub"
1. Frontend redirects to: 
   https://github.com/login/oauth/authorize?
   client_id=YOUR_GITHUB_APP_ID&
   redirect_uri=http://localhost:3000/auth/github/callback

2. GitHub redirects back with code

3. Backend exchanges code for access token:
   POST https://github.com/login/oauth/access_token
   { code, client_id, client_secret }
   
4. Backend stores token in users table

5. Now user can scan ANY of their private repos
   (Token has 'repo' scope access)
```

**Security:** 
- Never expose client_secret in frontend
- Only store token on backend
- Use scopes: `repo` (repo access), `read:user` (profile)

---

#### B. **Manual Token (GitHub Personal Access Token)**
```
User generates: Settings → Developer Settings → Personal Access Tokens
Pastes in dashboard: "My GitHub Token"
Backend stores & uses for repo access
```

---

### 6. CI/CD PIPELINE (For the SaaS Platform Itself)

**Where it lives:** `.github/workflows/deploy.yml`

```yaml
name: Deploy SaaS Platform

on:
  push:
    branches: [ main ]
    
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: test
      redis:
        image: redis:7
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      
      # Root package + dashboard
      - run: npm ci
      - run: npm ci -C dashboard
      
      # Tests
      - run: npm run test
      - run: npm run test -C dashboard
      
      # Lint
      - run: npm run lint
      - run: npm run lint -C dashboard
      
      # Build
      - run: npm run build -C dashboard
      
      # Build Docker image
      - name: Build Docker Image
        run: docker build -t tech-debt-auditor:${{ github.sha }} .
      
      # Push to registry (e.g., AWS ECR)
      - name: Push to ECR
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        run: |
          aws ecr get-login-password --region us-east-1 | \
          docker login --username AWS --password-stdin $ECR_REGISTRY
          docker push $ECR_REGISTRY/tech-debt-auditor:${{ github.sha }}
      
      # Deploy to ECS
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster prod \
          --service tech-debt-api \
          --force-new-deployment
```

---

### 7. HOSTING OPTIONS

#### Option A: **AWS** (Recommended for scale)
```
┌──────────────────────────────────────────────┐
│ Frontend: CloudFront + S3 (React build)      │
├──────────────────────────────────────────────┤
│ Backend API: ECS (Fargate containers)        │
├──────────────────────────────────────────────┤
│ Workers: ECS (separate task definition)      │
├──────────────────────────────────────────────┤
│ Database: RDS PostgreSQL                     │
├──────────────────────────────────────────────┤
│ Queue: ElastiCache Redis                     │
├──────────────────────────────────────────────┤
│ DNS: Route53                                 │
└──────────────────────────────────────────────┘
```

Costs: ~$100-300/month (depending on scale)

---

#### Option B: **Heroku** (Simplest, easier to start)
```
- API backend: Heroku Dyno (Node.js)
- Frontend: Vercel (React)
- Database: Heroku PostgreSQL
- Queue: Heroku Redis
```

Costs: ~$50-150/month

---

#### Option C: **Railway / Render** (Modern, middle ground)
```
- All services on one platform
- Auto-deploys from GitHub
- PostgreSQL + Redis built-in
- Simple scaling
```

Costs: ~$70-200/month

---

## FILE STRUCTURE (New SaaS)

```
tech-debt-auditor-saas/
├── frontend/
│  ├── src/
│  │  ├─ pages/
│  │  │  ├─ Login.jsx
│  │  │  ├─ Dashboard.jsx
│  │  │  ├─ ScanPage.jsx
│  │  │  └─ History.jsx
│  │  ├─ components/
│  │  │  ├─ UploadForm.jsx
│  │  │  ├─ ScanProgress.jsx
│  │  │  └─ ResultsGrid.jsx
│  │  ├─ services/
│  │  │  ├─ api.js
│  │  │  ├─ websocket.js
│  │  │  └─ auth.js
│  │  └─ App.jsx
│  ├─ package.json
│  └─ vite.config.js
│
├── backend/
│  ├─ src/
│  │  ├─ api/
│  │  │  ├─ routes/
│  │  │  │  ├─ auth.js
│  │  │  │  ├─ scans.js
│  │  │  │  ├─ findings.js
│  │  │  │  └─ webhooks.js
│  │  │  └─ middleware/
│  │  │     ├─ auth.js
│  │  │     └─ validation.js
│  │  ├─ workers/
│  │  │  ├─ queue.js
│  │  │  └─ audit-worker.js
│  │  ├─ models/
│  │  │  ├─ User.js
│  │  │  ├─ Scan.js
│  │  │  └─ Finding.js
│  │  ├─ services/
│  │  │  └─ github.js
│  │  └─ index.js
│  ├─ package.json
│  └─ Dockerfile
│
├── scanner/
│  ├─ index.js          (existing)
│  ├─ crawler.js        (existing)
│  └─ adapters/         (existing)
│
├── .github/
│  └─ workflows/
│     ├─ deploy.yml     (NEW: Deploy SaaS)
│     └─ worker-deploy.yml (NEW: Deploy workers)
│
└── docker-compose.yml  (Local dev: API + DB + Redis)
```

---

## CORE CONCEPTS SUMMARY TABLE

| Component | Purpose | Tech | Concept |
|-----------|---------|------|---------|
| **Frontend** | User interface | React + Vite | SPA routing, WebSocket updates |
| **API** | Request handling | Express.js | REST endpoints, JWT auth |
| **Queue** | Async jobs | Bull + Redis | Job retry, progress tracking |
| **Workers** | Scanner execution | Node.js | Multi-process, isolated execution |
| **Database** | Data storage | PostgreSQL | Multi-tenancy, relational schema |
| **GitHub Integration** | User auth + repo access | OAuth 2.0 | Secure token management |
| **CI/CD** | Deploy code | GitHub Actions | Docker, test, lint, deploy |
| **Hosting** | Run platform | AWS/Heroku/Railway | Scalable, serverless options |

---

## IMPLEMENTATION PHASES CHECKLIST

### ✅ Phase 0: Planning & Architecture (COMPLETED)
- [x] Design SaaS architecture
- [x] Plan database schema
- [x] Document all core concepts
- [x] Choose hosting platform (Railway)
- [x] Analyze existing scanner code
- [x] Identify migration path from CLI to SaaS

### 🚀 Phase 1: Backend API + Database (STARTING NOW)
**Goal:** Build REST API server and persistent storage layer

- [ ] Initialize Express.js project with middleware (auth, validation, logging)
- [ ] Setup PostgreSQL connection & migrations
- [ ] Create database schema (users, scans, findings, github_integrations tables)
- [ ] Implement JWT authentication (token generation, verification, refresh)
- [ ] Create auth routes (POST /auth/login with email/password)
- [ ] Create scan routes (POST /api/scans, GET /api/scans/:id, GET /api/user/scans)
- [ ] Create findings routes (GET /api/scans/:id/findings with pagination)
- [ ] Implement auth middleware (verify JWT on protected routes)
- [ ] Implement input validation middleware (GitHub URL format, rate limit checks)
- [ ] Setup environment variables (.env for DATABASE_URL, JWT_SECRET, etc.)
- [ ] Write unit tests (Jest) for auth and scan endpoints
- [ ] Deploy API to Railway and test connectivity

**Time estimate:** 2-3 days

---

### Phase 2: Job Queue + Workers
**Goal:** Handle asynchronous scanning with progress tracking and retry logic

- [ ] Setup Redis connection
- [ ] Configure Bull.js job queue with retry options (3 attempts, exponential backoff)
- [ ] Create audit-worker.js process that:
  - [ ] Clones repository (git clone --depth 1)
  - [ ] Runs existing scanner (runAudit function)
  - [ ] Scores findings (Gemini API + local fallback)
  - [ ] Saves to database with scanId
  - [ ] Updates job.progress() percentage every step
- [ ] Implement temp directory management (create, cleanup after scan)
- [ ] Add error handling and job retry logic
- [ ] Test worker with sample repositories
- [ ] Deploy worker to Railway with separate dyno

**Time estimate:** 2-3 days

---

### Phase 3: Frontend SPA
**Goal:** Create user-facing web interface for uploading repos and viewing results

- [ ] Migrate existing dashboard to frontend/ directory with Vite
- [ ] Setup React Router for multi-page routing
- [ ] Create Login.jsx page with GitHub OAuth button
- [ ] Create Dashboard.jsx page with scan history and upload form
- [ ] Create ScanPage.jsx page with progress bar and results
- [ ] Create UploadForm.jsx component (input GitHub repo URL)
- [ ] Create ScanProgress.jsx component (WebSocket real-time updates)
- [ ] Create ResultsGrid.jsx component (findings table with filters)
- [ ] Create MetricsPanel.jsx component (summary stats)
- [ ] Setup Zustand state management (user auth, current scan, all scans)
- [ ] Setup Axios API service (auth headers, baseURL)
- [ ] Setup Socket.io-client for WebSocket connection
- [ ] Test all pages in browser
- [ ] Deploy to Vercel

**Time estimate:** 2-3 days

---

### Phase 4: GitHub Integration
**Goal:** Allow users to authenticate with GitHub and access their repositories

- [ ] Create GitHub OAuth App (Settings → Developer Settings → OAuth Apps)
- [ ] Setup GitHub OAuth callback route (POST /auth/github)
- [ ] Exchange OAuth code for access token
- [ ] Store GitHub access token securely in users table
- [ ] Update Frontend Login.jsx to redirect to GitHub OAuth
- [ ] Optional: Create webhook listener (POST /webhooks/github for auto-scan on push)
- [ ] Test full GitHub OAuth flow
- [ ] Test private repo access with token

**Time estimate:** 1 day

---

### Phase 5: Hosting + CI/CD
**Goal:** Deploy SaaS to cloud and automate deployment pipeline

- [ ] Create Dockerfile for Express backend
- [ ] Create docker-compose.yml for local development (API + PostgreSQL + Redis)
- [ ] Create .github/workflows/deploy.yml (test → build → push Docker → deploy to Railway)
- [ ] Create .github/workflows/worker-deploy.yml (separate worker deployment)
- [ ] Setup Railway PostgreSQL database
- [ ] Setup Railway Redis instance
- [ ] Configure Railway environment variables
- [ ] Deploy backend API to Railway
- [ ] Deploy worker process to Railway
- [ ] Deploy frontend to Vercel
- [ ] Configure custom domain (optional)
- [ ] Test end-to-end: frontend → API → worker → database

**Time estimate:** 1-2 days

---

### Phase 6: Monitoring & Production
**Goal:** Ensure reliability, performance, and scalability

- [ ] Setup Sentry for error tracking (optional)
- [ ] Implement request logging (Morgan middleware)
- [ ] Add rate limiting (max X scans per hour per user)
- [ ] Implement scan quota logic (free tier limits)
- [ ] Add database backups (Railway automatic)
- [ ] Setup monitoring dashboard (Railway built-in or Datadog)
- [ ] Performance testing & optimization
- [ ] Security audit (OWASP, SQL injection, XSS checks)
- [ ] Document API endpoints (OpenAPI/Swagger)
- [ ] Create user documentation

**Time estimate:** 1-2 days (ongoing maintenance)

---

## KEY DIFFERENCES: OLD vs NEW

| Aspect | OLD (CLI) | NEW (SaaS) |
|--------|-----------|------------|
| **Data Source** | Local directory | GitHub repo URL (remote) |
| **Storage** | findings.json (file) | PostgreSQL database |
| **Scaling** | Single machine | Distributed workers |
| **Auth** | None | JWT + GitHub OAuth |
| **Multi-user** | No | Yes (multi-tenant) |
| **Processing** | Synchronous | Asynchronous (queue) |
| **CI/CD** | GitHub Actions only | 3 separate pipelines |
| **Hosting** | GitHub Actions VM | Cloud (AWS/Heroku) |
| **Real-time Updates** | None | WebSocket |
| **Rate Limiting** | None | Per-user quotas |
| **Pricing Model** | N/A | Free/Pro/Enterprise |
