// API endpoint to save links to GitHub repository
const GITHUB_API_URL = 'https://api.github.com';

module.exports = async function (req, res) {
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed, use POST' });
      return;
    }

    const { links } = req.body || {};
    if (!links || !Array.isArray(links)) {
      res.status(400).json({ error: 'Missing or invalid links array' });
      return;
    }

    // Get GitHub credentials from environment
    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const GITHUB_REPO = process.env.GITHUB_REPO || 'raiyanmehraj/link-dashboard';
    const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';
    const DATA_PATH = 'data/links.json';

    if (!GITHUB_TOKEN) {
      console.error('[saveLinks] GITHUB_TOKEN not configured');
      res.status(500).json({ error: 'GitHub token not configured' });
      return;
    }

    const [owner, repo] = GITHUB_REPO.split('/');
    if (!owner || !repo) {
      res.status(500).json({ error: 'Invalid GITHUB_REPO format (should be owner/repo)' });
      return;
    }

    console.log(`[saveLinks] Saving ${links.length} links to GitHub: ${owner}/${repo}/${DATA_PATH}`);

    // Step 1: Get current file SHA (if it exists)
    let currentSha = null;
    try {
      const getFileRes = await fetch(
        `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${DATA_PATH}?ref=${GITHUB_BRANCH}`,
        {
          headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: 'application/vnd.github.v3+json',
          },
        }
      );
      if (getFileRes.ok) {
        const fileData = await getFileRes.json();
        currentSha = fileData.sha;
        console.log('[saveLinks] Found existing file, SHA:', currentSha);
      } else {
        console.log('[saveLinks] File does not exist yet, will create new');
      }
    } catch (err) {
      console.warn('[saveLinks] Could not check existing file:', err.message);
    }

    // Step 2: Commit the new content
    const content = JSON.stringify(links, null, 2);
    const base64Content = Buffer.from(content).toString('base64');

    const commitBody = {
      message: `Update links: ${links.length} entries (auto-saved from dashboard)`,
      content: base64Content,
      branch: GITHUB_BRANCH,
    };

    if (currentSha) {
      commitBody.sha = currentSha; // Required for updates
    }

    const commitRes = await fetch(
      `${GITHUB_API_URL}/repos/${owner}/${repo}/contents/${DATA_PATH}`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commitBody),
      }
    );

    if (!commitRes.ok) {
      const errorText = await commitRes.text();
      console.error('[saveLinks] GitHub API error:', commitRes.status, errorText);
      res.status(commitRes.status).json({ 
        error: `GitHub API error: ${commitRes.status}`,
        details: errorText 
      });
      return;
    }

    const commitData = await commitRes.json();
    console.log('[saveLinks] Successfully committed to GitHub:', commitData.commit.sha);

    res.json({ 
      success: true, 
      commit: commitData.commit.sha,
      url: commitData.content.html_url 
    });
  } catch (err) {
    console.error('[saveLinks] Error:', err);
    res.status(500).json({ error: `Failed to save to GitHub: ${err.message}` });
  }
};
