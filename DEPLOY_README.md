# Deploying Link Dashboard to Vercel

## Prereqs
- GitHub account
- Vercel account
- OpenRouter API key (`OPENROUTER_API_KEY`)

## Steps
1. Push this folder as a GitHub repo.
2. In Vercel: New Project → Import the repo.
3. Environment Variables → add `OPENROUTER_API_KEY` (Production + Preview).
4. Deploy. Frontend (`index.html`, `app.js`, `styles.css`) and serverless function (`api/summarize.js`) are auto-configured.

## Local dev
```bash
npm install -g vercel
cd api && npm install
vercel dev
```

## Notes
- Serverless runtime: set in `vercel.json`.
- Data persistence: localStorage on the client.
- API: `/api/summarize` uses jsdom + Readability + OpenRouter.
