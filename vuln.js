/**
 * Intentional vulnerabilities for Subrunner testing.
 * Add to your repo, push, and open a PR.
 */

const crypto = require('crypto');
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

// 3. ReDoS - use a fixed, safe regex; do not interpolate user input into regex
function validateEmail(email) {
  // Fixed regex, no user input interpolated
  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.com$/;
  return regex.test(email);
}

// 4. Insecure randomness - use crypto.randomBytes for session IDs
function generateSessionId() {
  return "sess_" + crypto.randomBytes(16).toString('hex');
}

// Allowlist of permitted hosts for outbound requests
const ALLOWED_HOSTS = (process.env.ALLOWED_FETCH_HOSTS || '')
  .split(',')
  .map(h => h.trim())
  .filter(Boolean);

// 5. SSRF - validate URL against an allowlist before fetching
async function fetchUserData(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch (e) {
    throw new Error('Invalid URL provided.');
  }

  // Only allow https
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are permitted.');
  }

  // Enforce hostname allowlist
  if (ALLOWED_HOSTS.length === 0) {
    throw new Error('No allowed hosts configured. Set ALLOWED_FETCH_HOSTS env var.');
  }
  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    throw new Error(`Host "${parsed.hostname}" is not in the allowed list.`);
  }

  const res = await fetch(parsed.toString());
  return res.json();
}

module.exports = {
  renderSearchResult,
  mergeConfig,
  validateEmail,
  generateSessionId,
  fetchUserData,
};
