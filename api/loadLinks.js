// API endpoint to load links from GitHub repository
const GITHUB_API_URL = 'https://api.github.com';

module.exports = async function (req, res) {
  try {
    if (req.method !== 'GET') {
      res.status(405).json({ error: 'Method not allowed, use GET' });
      return;
    }

    // Get GitHub credentials from environment
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO || 'raiyanmehraj/link-dashboard';
    const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
    const DATA_PATH = 'data/links.json';

    if (!GITHUB_TOKEN) {
      console.error('[loadLinks] GITHUB_TOKEN not configured');
      res.status(500).json({ error: 'GitHub token not configured' });
      return;
    }

    const [owner, repo] = GITHUB_REPO.split('/');
    if (!owner || !repo) {
      res.status(500).json({ error: 'Invalid GITHUB_REPO format (should be owner/repo)' });
      return;
    }

    console.log(`[loadLinks] Loading links from GitHub: ${owner}/${repo}/${DATA_PATH}`);

    const getFileRes = await fetch(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${DATA_PATH}?ref=${GITHUB_BRANCH}`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      }
    );

    if (!getFileRes.ok) {
      if (getFileRes.status === 404) {
        console.log('[loadLinks] File not found, returning empty array');
        res.json({ links: [], message: 'No saved data found in GitHub' });
        return;
      }
      const errorText = await getFileRes.text();
      console.error('[loadLinks] GitHub API error:', getFileRes.status, errorText);
      res.status(getFileRes.status).json({ 
        error: `GitHub API error: ${getFileRes.status}`,
        details: errorText 
      });
      return;
    }

    const fileData = await getFileRes.json();
    const content = Buffer.from(fileData.content, 'base64').toString('utf-8');
    const links = JSON.parse(content);

    console.log(`[loadLinks] Successfully loaded ${links.length} links from GitHub`);
    res.json({ links, sha: fileData.sha });
  } catch (err) {
    console.error('[loadLinks] Error:', err);
    res.status(500).json({ error: `Failed to load from GitHub: ${err.message}` });
  }
};
