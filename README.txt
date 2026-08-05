═══════════════════════════════════════════════════════
KAIZAN CLARITY v11 — VERCEL DEPLOYMENT GUIDE
Kaizan AI Studios
═══════════════════════════════════════════════════════

YOUR API KEY IS SECURE — stored in Vercel's environment
variables, never visible in the browser or source code.

BETA INVITE CODE:   KAIZAN-BETA  (for testers)
OWNER CODE:         KAIZAN-OWNER (for you — unlimited)

THIS FOLDER CONTAINS:
  index.html      The app
  api/chat.js     Serverless function (hides API key)
  vercel.json     Vercel configuration

───────────────────────────────────────────────────────
STEP 1 — CREATE A FREE GITHUB ACCOUNT (2 min)
───────────────────────────────────────────────────────
You need GitHub to connect to Vercel. It's free and
takes 2 minutes.

1. Go to github.com → Sign up
2. Enter email, password, username
3. Verify your email

───────────────────────────────────────────────────────
STEP 2 — CREATE A GITHUB REPOSITORY (2 min)
───────────────────────────────────────────────────────
1. Click the "+" icon top right → "New repository"
2. Name it: kaizan-clarity
3. Leave it Public (or Private — both work)
4. Click "Create repository"
5. Click "uploading an existing file" link
6. Drag ALL files from this folder onto the page:
   - index.html
   - vercel.json
   - api/ folder (drag the whole folder)
7. Click "Commit changes"

───────────────────────────────────────────────────────
STEP 3 — CONNECT VERCEL (3 min)
───────────────────────────────────────────────────────
1. Go to vercel.com → Sign up with GitHub (one click)
2. Click "Add New Project"
3. Find your kaizan-clarity repository → click Import
4. Leave all settings as default
5. Click "Environment Variables" → Add:
   Key:   ANTHROPIC_API_KEY
   Value: your key from console.anthropic.com
6. Click "Deploy"
7. Done — you get a live URL like:
   kaizan-clarity.vercel.app

───────────────────────────────────────────────────────
UPDATING THE APP
───────────────────────────────────────────────────────
1. Go to your GitHub repository
2. Click on the file you want to update
3. Click the pencil icon to edit, OR drag a new file
4. Vercel automatically redeploys in seconds

───────────────────────────────────────────────────────
CLOSING THE BETA
───────────────────────────────────────────────────────
In your GitHub repository, open index.html → edit →
find:  const BETA_OPEN = true;
change to: const BETA_OPEN = false;
Commit → Vercel auto-redeploys → beta is closed

───────────────────────────────────────────────────────
COSTS
───────────────────────────────────────────────────────
GitHub:        Free
Vercel:        Free (Hobby plan)
Anthropic API: ~$0.50 per completed session
10 testers:    ~$10 total maximum

───────────────────────────────────────────────────────
Kaizan AI Studios · kaizanai.com
═══════════════════════════════════════════════════════
