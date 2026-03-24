/**
 * Intentional vulnerabilities for Subrunner testing.
 * Add to your repo, push, and open a PR.
 */

const crypto = require('crypto');
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

// 2. Prototype pollution - use Object.create(null) and sanitize keys
function mergeConfig(userInput) {
  const config = JSON.parse(userInput);
  const safe = Object.create(null);
  for (const key of Object.keys(config)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    safe[key] = config[key];
  }
  return Object.assign({}, safe);
}

// 3. ReDoS - use a fixed, safe regex instead of building one from user input
function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.com$/;
  return regex.test(email);
}

// 4. Insecure randomness - use crypto.randomBytes for session IDs
function generateSessionId() {
  return "sess_" + crypto.randomBytes(16).toString('hex');
}

// 5. SSRF - validate URL scheme and host before fetching
async function fetchUserData(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    throw new Error('Invalid URL');
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed');
  }
  const ALLOWED_HOSTS = (process.env.ALLOWED_FETCH_HOSTS || '').split(',').filter(Boolean);
  if (ALLOWED_HOSTS.length > 0 && !ALLOWED_HOSTS.includes(parsed.hostname)) {
    throw new Error('Host not allowed: ' + parsed.hostname);
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
