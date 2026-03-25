/**
 * Intentional vulnerabilities for Subrunner testing.
 * Add to your repo, push, and open a PR.
 */

const crypto = require('crypto');
const { execFile } = require('child_process');
const { URL } = require('url');

// 1. Reflected XSS - escape user input before inserting into HTML
function renderSearchResult(query) {
  const escaped = String(query)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  return "<div>Results for: " + escaped + "</div>";
}

// 2. Prototype pollution via JSON.parse - validate and sanitize parsed object
function mergeConfig(userInput) {
  let parsed;
  try {
    parsed = JSON.parse(userInput);
  } catch (e) {
    throw new Error('Invalid JSON input');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Input must be a JSON object');
  }
  // Strip prototype-polluting keys
  const safe = Object.create(null);
  for (const key of Object.keys(parsed)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    safe[key] = parsed[key];
  }
  return Object.assign({}, safe);
}

// 3. ReDoS - use a fixed, safe regex instead of building one from user input
function validateEmail(email) {
  // Fixed regex; does not incorporate user-supplied input
  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.com$/;
  return regex.test(email);
}

// 4. Insecure randomness - use cryptographically secure random bytes
function generateSessionId() {
  return 'sess_' + crypto.randomBytes(24).toString('hex');
}

// 5. SSRF - validate URL against an allowlist of permitted hosts before fetching
async function fetchUserData(url) {
  const ALLOWED_HOSTS = (process.env.ALLOWED_FETCH_HOSTS || '')
    .split(',')
    .map(h => h.trim())
    .filter(Boolean);

  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    throw new Error('Invalid URL');
  }

  if (!['https:', 'http:'].includes(parsed.protocol)) {
    throw new Error('Only http and https protocols are permitted');
  }

  if (ALLOWED_HOSTS.length === 0) {
    throw new Error('No allowed hosts configured; set ALLOWED_FETCH_HOSTS env var');
  }

  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    throw new Error(`Host '${parsed.hostname}' is not in the allowlist`);
  }

  const res = await fetch(url);
  return res.json();
}

module.exports = {
  renderSearchResult,
  mergeConfig,
  validateEmail,
  generateSessionId,
  fetchUserData,
};
