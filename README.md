# F1 Predict 2026 — Multiplayer Edition

A multiplayer F1 championship prediction game. Predict driver and constructor standings, create groups, and compete with friends.

## Features

- **Drag-and-drop predictions** for drivers and constructors
- **Point-based change tracking** — start with 1000 points, each change after locking costs 10
- **Multiplayer groups** — create or join groups with a 6-character invite code
- **Leaderboard** — compare remaining points and changes with group members
- **View others' predictions** — see how your friends ranked the grid
- **Score calculator** — enter final standings to compute accuracy scores
- **Mobile-friendly** — long-press drag support for touch devices

## Deployment on Vercel

### Prerequisites

- A [Vercel](https://vercel.com) account
- Node.js 18+ installed locally (for testing)

### Step 1: Set Up the Project

```bash
npm install
```

### Step 2: Create a Vercel KV Store

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project (or import this repo)
3. Go to **Storage** tab
4. Click **Create Database** → select **KV (Redis)**
5. Follow the prompts to create the store
6. The environment variables (`KV_REST_API_URL`, `KV_REST_API_TOKEN`, etc.) are automatically added to your project

### Step 3: Deploy

**Option A — Via Git:**
```bash
git init
git add .
git commit -m "Initial commit"
# Push to GitHub/GitLab/Bitbucket, then import in Vercel
```

**Option B — Via Vercel CLI:**
```bash
npx vercel --prod
```

### Step 4: Play!

1. Open your deployed URL
2. Enter your name to register
3. Create a group and share the 6-character code with friends
4. Arrange your predictions and save them
5. Lock your predictions when you're confident
6. View the leaderboard to see how you compare!

## Local Development

```bash
# Install Vercel CLI
npm i -g vercel

# Link to your Vercel project (needed for KV access)
vercel link

# Pull environment variables
vercel env pull .env.development.local

# Run locally
vercel dev
```

## Project Structure

```
├── index.html                   # Frontend (single-page app)
├── package.json                 # Dependencies
├── api/
│   ├── auth.js                  # POST: register, GET: current user
│   ├── groups.js                # POST: create group, GET: list groups
│   ├── groups/
│   │   └── [code].js            # GET: group details, PUT: join group
│   ├── predictions.js           # POST: save, GET: load predictions
│   ├── predictions/
│   │   └── [userId].js          # GET: view another user's predictions
│   └── leaderboard/
│       └── [code].js            # GET: group leaderboard with stats
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth` | Register with a name |
| GET | `/api/auth` | Get current user (requires `X-User-Id` header) |
| POST | `/api/groups` | Create a new group |
| GET | `/api/groups` | List user's groups |
| GET | `/api/groups/:code` | Get group details |
| PUT | `/api/groups/:code` | Join a group |
| POST | `/api/predictions` | Save predictions |
| GET | `/api/predictions` | Load own predictions |
| GET | `/api/predictions/:userId` | View another user's predictions |
| GET | `/api/leaderboard/:code` | Get group leaderboard |

## How It Works

- **Identity**: Players register with a display name. A unique user ID (UUID) is generated and stored in the browser's localStorage. The server also records the player's IP for reference.
- **Groups**: Any player can create a group (generates a 6-character code) or join an existing one. Groups have no member limit.
- **Data**: All predictions are stored server-side in Vercel KV (Redis). LocalStorage is used as a fallback cache.
- **Scoring**: Players start with 1000 points. After locking predictions, each position swap costs 10 points. At season's end, accuracy points are added to remaining points for the final score.
