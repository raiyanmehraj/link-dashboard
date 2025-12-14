# Summarize Serverless Endpoint (Vercel)

This repository adds a serverless function at `/api/summarize` which fetches a URL, extracts the main content using Mozilla Readability, and requests a summary using OpenRouter's `gpt-oss-120b` model.

## Files added
- `api/summarize.js` - serverless function compatible with Vercel/Netlify
- `api/package.json` - dependencies for the serverless function
- Frontend changes in `app.js` to add a 'Summarize' button and UI handling

## Environment
Create `.env` in the `api/` folder (or set environment variables in your hosting platform):

```
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

## Running locally (development)
1. Install dependencies for API function:

```pwsh
cd "c:\Users\raiya\OneDrive\Desktop\Project\LInk Dashboard\prototype 2"\api
npm install
```

2. You'll need the Vercel CLI to run serverless functions locally, or alternate serverless runner:

```pwsh
npm i -g vercel
vercel dev
```

This will load the function at `http://localhost:3000/api/summarize` while running the dev server.

## How it works
- Your frontend calls `/api/summarize` (POST) with `{ url }`.
- The function fetches HTML, uses Readability to extract content, then sends it to OpenRouter for summarization.
- The function returns `{ title, excerpt, summary }`.

## Caching
- The current implementation uses an in-memory cache. For production, you should replace it with a shared cache (Redis or database) if needed.

## Notes on costs & privacy
- OpenRouter model `gpt-oss-120b` is used as per your preference. Make sure you understand limits and privacy implications (page text is sent to the model).

## Next steps
- Add an API route for bulk summarization or background job processing.
- Add rate-limiting and request validation on the server.
- Add a server-side persistent cache to avoid repeated calls on the same URL.

If you want, I can also:
- Add a `vercel.json` with route configuration
- Add a `serverless.yml` example for Netlify
- Add a small test harness for the endpoint
