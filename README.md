# CommitIQ

An AI-powered tool that reviews your GitHub commits from today — per repo, per user — and gives actionable feedback on your commit practices.

**Live Demo:** https://commitiq.vercel.app

---

## How It Works

1. **Add users** — save GitHub usernames with their Personal Access Tokens (stored locally in the browser)
2. **Select a user** — CommitIQ fetches all repos that received commits today
3. **Pick a repo** — choose which repo to review
4. **Get AI feedback** — summary, highlights, stats, and improvement suggestions for today's commits

---

## Prerequisites

- Node.js 18 or higher
- An **OpenRouter API Key** — for AI analysis (free tier available)
- A **GitHub Personal Access Token** per user — added directly in the app UI (not required in `.env`)

---

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/your-username/commitiq.git
cd commitiq
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
OPENROUTER_API_KEY=sk-or-v1-your_openrouter_key_here

# Optional: fallback GitHub PAT if no per-user PAT is provided
GITHUB_PAT=ghp_your_github_token_here
```

**Getting the keys:**

- **OpenRouter API Key** — Sign up at [openrouter.ai](https://openrouter.ai) and get your free API key from the dashboard.
- **GitHub PAT** — Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens). Generate a token with `repo` (read) and `read:user` scope. Each user adds their own PAT directly in the app.

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

### Managing users

1. Click **Manage Users** on the home page
2. Fill in the display name, GitHub username, and Personal Access Token
3. Click **+ Add User**, then **Save**
4. Users are stored in your browser's `localStorage` — PATs never leave your device

### Reviewing commits

1. **Select a user** from the list on the home page
2. CommitIQ automatically fetches all repos with commits pushed **today**
3. **Click a repo** to start the AI review
4. View the results:
   - **Summary** — AI overview of today's activity
   - **Stats** — Total commits, lines changed, commit type breakdown
   - **Highlights** — Key commits identified by the AI
   - **Suggestions** — Actionable tips to improve commit practices

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at `localhost:3000` |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/repos?username=<user>` | GET | List public repositories for a user |
| `/api/repos/today` | POST | List repos with commits today for a given user |
| `/api/review` | POST | Analyze commits and generate AI insights |

---

## Tech Stack

- **Next.js 16** + **React 19** + **TypeScript**
- **Tailwind CSS 4** + **shadcn/ui** for UI components
- **GitHub REST, GraphQL & Search API** for commit data
- **OpenRouter** (Gemma, Kimi, Nemotron — free models) for AI analysis

---

## Deployment

This project is ready to deploy on [Vercel](https://vercel.com). Add `OPENROUTER_API_KEY` (and optionally `GITHUB_PAT`) in the Vercel project settings before deploying. Users manage their own GitHub PATs via the in-app UI.

```bash
npm run build
npm run start
```
