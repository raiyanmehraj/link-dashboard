/* Serverless function for Vercel/Netlify: /api/summarize
 * Fetches a URL, extracts main text using readability, and calls OpenRouter (gpt-oss-120b)
 * Expects POST JSON: { url }
 * Requires OPENROUTER_API_KEY in process.env
 *
 * Dev note: In local development, we also attempt to load .env.local via dotenv
 * if the env var is missing and NODE_ENV !== 'production'.
 */

/* eslint-disable no-undef */
// Prefer the built-in fetch available on Node 18+ / v24; if missing, fail with a clear error
const fetch = globalThis.fetch;
if (!fetch) {
  throw new Error('Global fetch is not available in this Node environment. Use Node 18+ or install node-fetch.');
}
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');

// Attempt to load env from .env.local in development if not already present
if (!process.env.OPENROUTER_API_KEY && process.env.NODE_ENV !== 'production') {
  try {
    const dotenv = require('dotenv');
    // Try multiple candidate paths depending on CWD when running in dev
    const candidatePaths = [
      '.env.local',           // project root when CWD is root
      '../.env.local',        // if function CWD is api/
      process.cwd() + '/.env.local'
    ];
    let loaded = false;
    for (const p of candidatePaths) {
      const result = dotenv.config({ path: p });
      if (result && !result.error && process.env.OPENROUTER_API_KEY) {
        console.log('[summarize] OPENROUTER_API_KEY loaded from', p);
        loaded = true;
        break;
      }
    }
    if (!loaded && !process.env.OPENROUTER_API_KEY) {
      console.warn('[summarize] OPENROUTER_API_KEY undefined after attempting dotenv loads. CWD=', process.cwd());
    }
  } catch (e) {
    console.warn('[summarize] dotenv load failed:', e?.message || e);
  }
}

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
// List of precise free models with better limits, ordered by quality
// Using known working free models from OpenRouter
const FREE_MODELS = [
  'mistralai/mistral-7b-instruct:free',
  'meta-llama/llama-3.1-8b-instruct:free',
  'google/gemma-2-9b-it:free',
  'meta-llama/llama-3.2-3b-instruct:free'
];
const RETRY_DELAY_MS = 1500; // Shorter delay since we'll try different models
const CACHE_TTL_SECONDS = 60 * 60 * 24; // 24 hours

// Simple in-memory cache (works for short-lived serverless warm instances; for production use a shared cache)
const cache = new Map();

function getFromCache(key) {
  if (!cache.has(key)) return null;
  const { value, expiresAt } = cache.get(key);
  if (Date.now() > expiresAt) {
    cache.delete(key);
    return null;
  }
  return value;
}

function putInCache(key, value, ttl = CACHE_TTL_SECONDS) {
  cache.set(key, { value, expiresAt: Date.now() + ttl * 1000 });
}

// Load multiple OpenRouter API keys from environment variables.
// Supports flexible numbered vars: OPENROUTER_API_KEY_1, OPENROUTER_API_KEY_2, ...
// Falls back to OPENROUTER_API_KEY if only a single key is provided.
function getApiKeys() {
  const keys = [];
  const env = process.env || {};

  // Debug: log what env vars are available
  console.log('[getApiKeys] Checking environment variables...');
  console.log('[getApiKeys] OPENROUTER_API_KEY_1:', env.OPENROUTER_API_KEY_1 ? 'SET' : 'NOT SET');
  console.log('[getApiKeys] OPENROUTER_API_KEY_2:', env.OPENROUTER_API_KEY_2 ? 'SET' : 'NOT SET');
  console.log('[getApiKeys] OPENROUTER_API_KEY:', env.OPENROUTER_API_KEY ? 'SET' : 'NOT SET');

  // Collect numbered keys (up to 10 for practicality)
  for (let i = 1; i <= 10; i++) {
    const val = env[`OPENROUTER_API_KEY_${i}`];
    if (val && typeof val === 'string' && val.trim().length > 0) {
      keys.push(val.trim());
      console.log(`[getApiKeys] Added key #${i}`);
    }
  }

  // Fallback to single key
  if (env.OPENROUTER_API_KEY && typeof env.OPENROUTER_API_KEY === 'string' && env.OPENROUTER_API_KEY.trim().length > 0) {
    keys.push(env.OPENROUTER_API_KEY.trim());
    console.log('[getApiKeys] Added fallback key');
  }

  // De-duplicate while preserving order
  const seen = new Set();
  const uniqueKeys = keys.filter(k => {
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  
  console.log(`[getApiKeys] Total unique keys loaded: ${uniqueKeys.length}`);
  return uniqueKeys;
}

async function fetchHtml(url) {
  // Basic fetch with retries and UA
  const headers = {
    'User-Agent': 'LinkDashboard/1.0 (https://github.com/your/repo)',
    Accept: 'text/html,application/xhtml+xml',
    'Accept-Language': 'en-US,en;q=0.9',
  };
  // Note: Node's global fetch does not support a `timeout` option; use AbortController if needed.
  const res = await fetch(url, { headers, redirect: 'follow' });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const html = await res.text();
  return html;
}

function extractContent(html, url) {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  if (!article) {
    return null;
  }
  return {
    title: article.title || '',
    excerpt: article.excerpt || '',
    content: article.textContent || article.content || '',
  };
}

function truncateContent(content, maxChars = 20000) {
  if (!content) return '';
  return content.length > maxChars ? content.slice(0, maxChars) : content;
}

async function callOpenRouterSummarize({ title, excerpt, content, url, apiKeys }) {
  const text = `${title ? title + '\n\n' : ''}${excerpt ? excerpt + '\n\n' : ''}${content || ''}`;
  const truncated = truncateContent(text, 20000);

  // Build system + user messages for chat completion
  const system = {
    role: 'system',
    content:
      'You are a precise summarization assistant. Create ultra-concise summaries using minimal sentences while capturing core information.',
  };

  const user = {
    role: 'user',
    content: `Summarize this web page in 2-3 sentences maximum. Be precise and capture only the most essential information.\n\nSource URL: ${url}\n\nContent:\n${truncated}`,
  };

  // Try each free model in sequence until one works
  let lastError;
  const exhaustedKeys = new Set();
  const referer = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : (process.env.SITE_URL || 'http://localhost:3000');

  for (let modelIndex = 0; modelIndex < FREE_MODELS.length; modelIndex++) {
    const currentModel = FREE_MODELS[modelIndex];
    
    if (modelIndex > 0) {
      console.log(`[summarize] Trying fallback model ${modelIndex + 1}/${FREE_MODELS.length}: ${currentModel}`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    } else {
      console.log(`[summarize] Trying primary model: ${currentModel}`);
    }

    const body = {
      model: currentModel,
      messages: [system, user],
      max_tokens: 200,  // Shorter for concise summaries
      temperature: 0.1,  // Lower for more precise/consistent output
    };
    // Try each available key for this model
    for (let k = 0; k < apiKeys.length; k++) {
      const apiKey = apiKeys[k];
      if (exhaustedKeys.has(apiKey)) {
        continue;
      }

      try {
        console.log(`[summarize] Sending request using key #${k + 1} with model ${currentModel}...`);
        const res = await fetch(OPENROUTER_API_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            // Recommended headers for OpenRouter
            'HTTP-Referer': referer,
            'X-Title': 'Link Dashboard',
          },
          body: JSON.stringify(body),
        });
        console.log(`[summarize] OpenRouter responded with status: ${res.status} (key #${k + 1}, model ${currentModel})`);

        // If rate limited or model not found, try next key/model
        if (res.status === 429 || res.status === 404) {
          const errorText = await res.text();
          if (res.status === 429) {
            console.warn(`[summarize] API key rate limited for model ${currentModel}. Switching key...`);
            exhaustedKeys.add(apiKey);
          } else {
            console.warn(`[summarize] Model ${currentModel} not available (404). Trying next model...`);
          }
          lastError = new Error(`${res.status}: ${errorText}`);
          continue; // try next key or model
        }

        if (!res.ok) {
          const txt = await res.text();
          console.error('[summarize] OpenRouter error response:', txt);
          // Treat 401 as an invalid/expired key and try next key
          if (res.status === 401) {
            console.warn('[summarize] 401 Unauthorized – marking key exhausted and trying next key');
            exhaustedKeys.add(apiKey);
            lastError = new Error(`401: ${txt}`);
            continue; // try next key
          }
          throw new Error(`OpenRouter API error: ${res.status} ${txt}`);
        }

        const json = await res.json();
        const message = json?.choices?.[0]?.message?.content || json?.choices?.[0]?.text || null;
        if (!message) {
          throw new Error('No message returned from OpenRouter');
        }
        console.log(`[summarize] ✓ Success with model: ${currentModel} using key #${k + 1}`);
        return message;
      } catch (err) {
        console.error(`[summarize] Error with ${currentModel}:`, err.message);
        lastError = err;
        if (String(err.message).startsWith('429:')) {
          exhaustedKeys.add(apiKey);
        }
        continue; // try next key
      }
    }
  }
  
  throw lastError || new Error('All free models failed or rate-limited. Please try again in a few minutes.');
}

module.exports = async function (req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed, use POST' });
      return;
    }

    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      res.status(400).json({ error: 'Missing or invalid url' });
      return;
    }

    const cacheKey = `summary:${url}`;
    const cached = getFromCache(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const apiKeys = getApiKeys();
    if (!apiKeys || apiKeys.length === 0) {
      // Extra debug info to help diagnose env issues in dev
      console.warn('[summarize] No OpenRouter API keys set. NODE_ENV=', process.env.NODE_ENV, 'cwd=', process.cwd());
      res.status(500).json({ error: 'OpenRouter API key(s) not configured' });
      return;
    }

    // Fetch and extract — if blocked, stop early to avoid hallucinated summaries
    let html = '';
    try {
      html = await fetchHtml(url);
    } catch (err) {
      console.warn('[summarize] fetchHtml failed:', err?.message || err);
      res.status(502).json({
        error: 'Content fetch blocked or unavailable for this URL. Try again later or use a different source.',
        code: 'FETCH_BLOCKED'
      });
      return;
    }

    const extracted = extractContent(html, url) || {};

    // If extraction fails: fallback to meta description
    if (!extracted.content && html) {
      const dom = new JSDOM(html, { url });
      const doc = dom.window.document;
      const metaDescription = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      extracted.content = metaDescription || '';
      extracted.excerpt = metaDescription || '';
      extracted.title = doc.title || '';
    }

    // If still nothing readable, stop early to avoid incorrect summaries
    if (!extracted.content && !extracted.excerpt) {
      res.status(422).json({
        error: 'No readable content extracted from this URL. The site may prevent scraping.',
        code: 'NO_CONTENT'
      });
      return;
    }

    // Call model
    let summaryText;
    try {
      console.log('[summarize] Calling OpenRouter');
      summaryText = await callOpenRouterSummarize({
        title: extracted.title,
        excerpt: extracted.excerpt,
        content: extracted.content,
        url,
        apiKeys,
      });
      console.log('[summarize] OpenRouter call succeeded');
    } catch (err) {
      console.error('[summarize] OpenRouter call failed:', err);
      // Otherwise, return the AI error
      res.status(500).json({ error: `Summarization failed: ${err.message}` });
      return;
    }

    // Save to cache
    const result = { title: extracted.title, excerpt: extracted.excerpt, summary: summaryText };
    putInCache(cacheKey, result);

    res.json(result);
  } catch (err) {
    console.error('Summarize function error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};
