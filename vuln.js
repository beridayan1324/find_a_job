/**
 * Intentional vulnerabilities for Subrunner testing.
 * Add to your repo, push, and open a PR.
 */

const { randomBytes } = require('crypto');
const { URL } = require('url');

// 1. Reflected XSS - escape user input before inserting into HTML
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

function renderSearchResult(query) {
  return "<div>Results for: " + escapeHtml(query) + "</div>";
}

// 2. Prototype pollution - use a null-prototype object and validate keys
function mergeConfig(userInput) {
  const parsed = JSON.parse(userInput);
  // Guard against __proto__, constructor, prototype pollution
  const safe = Object.create(null);
  for (const key of Object.keys(parsed)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    safe[key] = parsed[key];
  }
  return Object.assign({}, safe);
}

// 3. ReDoS - validate email with a fixed, safe regex instead of building one from user input
function validateEmail(email) {
  const safeRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.com$/;
  return safeRegex.test(email);
}

// 4. Insecure randomness - use crypto.randomBytes for session IDs
function generateSessionId() {
  return "sess_" + randomBytes(16).toString('hex');
}

// 5. SSRF - validate URL against an allowlist of permitted hosts before fetching
const ALLOWED_HOSTS = (process.env.ALLOWED_FETCH_HOSTS || '')
  .split(',')
  .map(h => h.trim())
  .filter(Boolean);

async function fetchUserData(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    throw new Error('Invalid URL');
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP(S) URLs are permitted');
  }

  if (ALLOWED_HOSTS.length === 0) {
    throw new Error('No allowed hosts configured. Set ALLOWED_FETCH_HOSTS env var.');
  }

  const hostname = parsed.hostname.toLowerCase();
  const isAllowed = ALLOWED_HOSTS.some(
    allowed => hostname === allowed || hostname.endsWith('.' + allowed)
  );

  if (!isAllowed) {
    throw new Error(`Host '${hostname}' is not in the allowed list`);
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
