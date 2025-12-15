# Link Dashboard

A web-based curation tool for organizing, searching, and summarizing educational/personal development links. The app is fully client-side with a simple serverless API for content summarization.

## Features

- Link management: add, edit, delete links with titles, URLs, categories, contributors, and tags
- Multiple URL mode: group several related sub-entries under one parent link
- Fast search: filter by title, URL, contributor, and tags
- Category filtering: switch between Study Materials, Development, and Tools and other
- Tag filtering: one active tag at a time with clear toggle behavior
- Summaries: generate concise summaries for links and sub-entries via `/api/summarize`
- Local persistence: all data saved to `localStorage` under the key `study-links`
- Responsive UI: sidebar and mobile layout optimized for quick navigation
- Keyboard shortcuts: speed up common actions (search, add link, close modal)

## How It Works

### Architecture
- Frontend: Vanilla JavaScript SPA (`index.html`, `app.js`, `styles.css`)
- Storage: Browser `localStorage` for all link data
- API: Serverless function `api/summarize.js` using Mozilla Readability + OpenRouter

### Core State
Managed in `app.js` via a single `state` object controlling links, filters, modal/editing status, and URL mode. All UI updates are driven by `renderLinks()` which delegates to `createLinkCard()` and `renderSidebar()`.

```
state = {
  links: [],
  searchQuery: '',
  activeCategory: 'All',
  activeTag: null,
  isModalOpen: false,
  isSidebarOpen: true,
  editingId: null,
  subEntries: [],
  urlMode: 'single'
}
```

### Link Data Model
```
{
  id: string,                   // crypto.randomUUID()
  title: string,                // required
  url: string,                  // required in 'single' mode
  category: string,             // 'Study Materials' | 'Development' | 'Tools and other'
  contributor: string,          // optional
  tags: string[],               // user-defined tags
  createdAt: number,            // timestamp (ms)
  subEntries?: [{ id, title, url, summary? }], // only for 'multiple' mode
  summary?: string              // optional; generated via /api/summarize
}
```

### Rendering & Interactions
- Always mutate `state` and call render functions; don’t manually modify the DOM.
- `getFilteredLinks()` respects search, category, and tag filters together.
- Sidebar counts and filters update via `renderSidebar()`.

### URL Handling
- URLs are normalized to include `https://` if missing (applies to main link and sub-entries).
- Always use normalized `link.url` when rendering and saving.

### Tag System
- Tags are typed manually; added with Enter.
- Only one active tag filter (`state.activeTag`) at a time.
- Clicking a tag toggles filter on/off; Backspace removes the last typed tag.

### Edit vs Add
- `openModal()` controls modal visibility; edit mode if `state.editingId` is set.
- Edit mode pre-populates all fields including ISO datetime.
- New links default to 'single' URL mode and 'Study Materials' category.
- If editing a link with `subEntries.length > 0`, the modal switches to 'multiple' mode.

### Multiple URLs (Sub-Entries)
- Parent link can contain a set of sub-entries `{id, title, url, summary?}`.
- Sub-entries can be summarized independently.
- `renderSubEntryInputs()` binds event handlers for title/url changes and removals.
- Validation: 'multiple' mode requires at least one sub-entry with content.

### Summarization Flow
- Frontend triggers `POST /api/summarize` for both main links and sub-entries.
- Request body: `{ url }`
- Response body: `{ title, excerpt, summary, cached?: boolean }`
- If a summary exists, users are prompted before regenerating.
- Summaries are written to `link.summary` or `subEntry.summary` and saved immediately.

### Keyboard Shortcuts
- `Ctrl+K` / `Cmd+K`: focus search input
- `Ctrl+N` / `Cmd+N`: open add-link modal
- `Escape`: close modal and clear active tag filter
- `Enter` in tags input: add tag
- `Backspace` in empty tags input: remove last tag

### Responsive Layout
- Desktop: sidebar visible (collapsible), main content adjusts width
- Mobile: sidebar hidden; hamburger toggles overlay sidebar via `isMobileMenuOpen`

## Serverless API: `/api/summarize`

### Overview
The summarization API is a serverless function that turns any educational or personal development webpage into a concise, high-signal summary. It uses your `OPENROUTER_API_KEY` to call OpenRouter and automatically rotates through multiple free models to improve reliability and reduce rate-limit interruptions. Before summarizing, the function fetches the source URL and extracts the main readable content using Mozilla Readability and jsdom, falling back to meta descriptions when needed to avoid hallucinated output. Responses are short and precise to keep the dashboard scannable, and results are cached in-memory for up to 24 hours during warm serverless instances to minimize repeat calls.

### Flow
1. Check cache (`{ url }` → summary result)
2. Fetch HTML with retries and custom user-agent
3. Parse main content with Readability; fallback to meta description
4. Generate summary via OpenRouter using free model fallbacks (headline, sentence, and 3 bullets)
5. Cache result and return JSON

### Error Handling
- Returns 400/500 with `{ error: string }` and surfaces errors in the UI via alerts.

### Models Used (Fallback Order)

The summarization function attempts multiple OpenRouter free models, in order, to improve availability and reduce rate-limit issues:

- `mistralai/mistral-7b-instruct:free`
- `meta-llama/llama-3.1-8b-instruct:free`
- `google/gemma-2-9b-it:free`
- `meta-llama/llama-3.2-3b-instruct:free`

If a model is unavailable or rate-limited, the next one is tried automatically.

## Project Structure

```
/                     # Root
├─ index.html         # SPA entry
├─ app.js             # State, rendering, events, summarization helpers
├─ styles.css         # Responsive styles for timeline, cards, modals
├─ api/
│  ├─ summarize.js    # Serverless function to summarize URLs
│  ├─ loadLinks.js    # Optional loader for JSON seed data
│  ├─ saveLinks.js    # Optional saver to JSON (serverless)
│  └─ package.json    # @mozilla/readability, jsdom
├─ data/
│  └─ links.json      # Optional seed data for initial import
└─ server/            # (Reserved for local dev utilities)
```

## Getting Started

### Local (Frontend Only)
You can open the app directly in a browser:
1. Open `index.html` in your browser
2. Add links; data persists automatically in `localStorage`

### Local (API Summarization)
To run `/api/summarize` locally with Vercel:

```bash
npm install -g vercel
cd api
npm install
# Create .env.local and set OPENROUTER_API_KEY
vercel dev
```

- The dev server runs on `localhost:3000` and the function is available at `/api/summarize`.

## Development Notes

- Do not manipulate DOM directly; prefer `state` mutations + render functions.
- Call `saveLinksToStorage()` after state changes to persist data.
- Verify modal state with `closeModal()` and sidebar with `renderSidebar()` when debugging UI behavior.
- Consider replacing the in-memory cache with Redis/DB for production stability.

## Testing Checklist

- Links persist after refresh
- Search works across title, URL, contributor, tags
- Category filter narrows results correctly
- Tag filter toggles and updates counts
- Escape clears tag filter
- Edit mode pre-populates fields and date
- URL normalization adds https:// when missing
- Sub-entry mode toggles URL visibility correctly
- Delete removes link immediately
- Summarize button disables and shows loading state
- Mobile sidebar toggles correctly

## License
This project is intended for personal/educational use.
