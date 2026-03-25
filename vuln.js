/**
 * Fixed vulnerabilities for Subrunner testing.
 */

const crypto = require('crypto');
const { URL } = require('url');

// Allowed hostnames for SSRF prevention
const ALLOWED_HOSTS = (process.env.ALLOWED_FETCH_HOSTS || '')
  .split(',')
  .map(h => h.trim())
  .filter(Boolean);

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

// 2. Prototype pollution - use Object.create(null) and sanitize keys
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

// 3. ReDoS - use a fixed, safe email regex instead of building from user input
function validateEmail(email) {
  // Fixed regex; does not incorporate user-supplied input
  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.com$/;
  return regex.test(email);
}

// 4. Insecure randomness - use crypto.randomBytes for session IDs
function generateSessionId() {
  return 'sess_' + crypto.randomBytes(24).toString('hex');
}

// 5. SSRF - validate URL against an allowlist of permitted hosts
async function fetchUserData(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    throw new Error('Invalid URL provided.');
  }

  // Only allow https scheme
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are permitted.');
  }

  // Block private/loopback addresses by hostname
  const hostname = parsed.hostname.toLowerCase();
  const blockedPatterns = [
    /^localhost$/,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^::1$/,
    /^0\.0\.0\.0$/,
    /^169\.254\./,
  ];
  for (const pattern of blockedPatterns) {
    if (pattern.test(hostname)) {
      throw new Error('Requests to private/loopback addresses are not allowed.');
    }
  }

  // Enforce allowlist if configured
  if (ALLOWED_HOSTS.length > 0 && !ALLOWED_HOSTS.includes(hostname)) {
    throw new Error(`Host "${hostname}" is not in the allowed list.`);
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
