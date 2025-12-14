# GitHub Sync Setup

This guide will help you set up GitHub sync so your links are automatically saved to your GitHub repository.

## Prerequisites
- A GitHub account
- Your Link Dashboard deployed on Vercel

## Step 1: Create a GitHub Personal Access Token (PAT)

1. Go to GitHub Settings: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a descriptive name like `Link Dashboard Sync`
4. Set expiration (recommend: 90 days or No expiration)
5. Select scopes:
   - ✅ **repo** (Full control of private repositories)
6. Click **"Generate token"**
7. **IMPORTANT**: Copy the token immediately (you won't see it again!)

## Step 2: Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these three variables:

   | Name | Value | Environment |
   |------|-------|-------------|
   | `GITHUB_TOKEN` | Your PAT from Step 1 | Production, Preview, Development |
   | `GITHUB_REPO` | `raiyanmehraj/link-dashboard` | Production, Preview, Development |
   | `GITHUB_BRANCH` | `main` | Production, Preview, Development |

4. Click **Save** for each variable

## Step 3: Redeploy Your Application

1. Go to **Deployments** tab
2. Click the **︙** menu on the latest deployment
3. Select **Redeploy**
4. Wait for deployment to complete

## Step 4: Test GitHub Sync

1. Open your deployed Link Dashboard
2. Add or modify some links
3. Click the **Save to GitHub** button (💾 icon in navbar)
4. You should see: "✅ Successfully saved X links to GitHub!"
5. Check your GitHub repo - you should see a new file: `data/links.json`

## Step 5: Load from GitHub

- Click the **Load from GitHub** button (🔄 icon in navbar)
- Your links will be loaded from `data/links.json` in your repo
- This syncs across all devices using the same GitHub repo

## How It Works

- **Save**: Commits your links to `data/links.json` in your GitHub repo
- **Load**: Fetches links from GitHub and syncs to localStorage
- **Auto-sync**: Every save creates a Git commit with message "Update links: X entries"

## Troubleshooting

### "GitHub token not configured"
- Verify `GITHUB_TOKEN` is set in Vercel environment variables
- Ensure all three environments are checked (Production, Preview, Development)
- Redeploy after adding environment variables

### "Failed to save to GitHub"
- Check token permissions (needs `repo` scope)
- Verify `GITHUB_REPO` format is correct: `owner/repo`
- Check token expiration date

### "No saved data found in GitHub"
- This means `data/links.json` doesn't exist yet
- Click "Save to GitHub" first to create the file

## Security Notes

- ✅ GitHub PAT is stored securely as Vercel environment variable
- ✅ Never exposed to the client/browser
- ✅ All API calls go through serverless functions
- ⚠️ Keep your PAT secret - don't commit it to code
- ⚠️ Regenerate PAT if exposed

## Optional: Disable GitHub Sync

Edit `app.js` line 5:
```javascript
const GITHUB_SYNC_ENABLED = false; // Disable GitHub sync
```

This will hide the sync buttons and keep everything localStorage-only.
