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
  const parsed = JSON.parse(userInput);
  const safe = Object.create(null);
  for (const key of Object.keys(parsed)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    safe[key] = parsed[key];
  }
  return Object.assign({}, safe);
}

// 3. ReDoS - do NOT build regex from user input; use a fixed regex
function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.com$/;
  return regex.test(email);
}

// 4. Insecure randomness - use crypto.randomBytes for session IDs
function generateSessionId() {
  return "sess_" + crypto.randomBytes(16).toString('hex');
}

// 5. SSRF - validate URL against an allowlist of permitted hosts
const ALLOWED_HOSTS = ['api.example.com', 'data.example.com'];

async function fetchUserData(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    throw new Error('Invalid URL');
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Disallowed protocol: ' + parsed.protocol);
  }
  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    throw new Error('Disallowed host: ' + parsed.hostname);
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
