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

// 2. Prototype pollution - use Object.create(null) and validate keys
function mergeConfig(userInput) {
  const parsed = JSON.parse(userInput);
  // Guard against prototype pollution
  if (parsed !== null && typeof parsed === 'object') {
    const safe = Object.create(null);
    for (const key of Object.keys(parsed)) {
      if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
        safe[key] = parsed[key];
      }
    }
    return Object.assign({}, safe);
  }
  return {};
}

// 3. ReDoS - use a fixed, safe regex instead of building one from user input
function validateEmail(email) {
  const safeRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.com$/;
  return safeRegex.test(email);
}

// 4. Insecure randomness - use crypto.randomBytes for session IDs
function generateSessionId() {
  return "sess_" + crypto.randomBytes(16).toString('hex');
}

// 5. SSRF - validate URL scheme and hostname before fetching
async function fetchUserData(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    throw new Error('Invalid URL');
  }
  // Only allow HTTPS and a whitelist of trusted hosts
  const allowedHosts = ['api.example.com', 'data.example.com'];
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed');
  }
  if (!allowedHosts.includes(parsed.hostname)) {
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
