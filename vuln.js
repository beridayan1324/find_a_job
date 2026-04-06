/**
 * Fixed vulnerabilities.
 */

const crypto = require('crypto');

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

// 2. Prototype pollution - use a safe merge that ignores __proto__ and constructor
function mergeConfig(userInput) {
  let parsed;
  try {
    parsed = JSON.parse(userInput);
  } catch (e) {
    return {};
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {};
  }
  const result = {};
  for (const key of Object.keys(parsed)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    result[key] = parsed[key];
  }
  return result;
}

// 3. ReDoS - validate email with a static regex, not one built from user input
function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.com$/;
  return regex.test(email);
}

// 4. Insecure randomness - use crypto.randomBytes for session IDs
function generateSessionId() {
  return "sess_" + crypto.randomBytes(16).toString('hex');
}

// 5. SSRF - restrict fetch to safe hosts via an allowlist
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
    throw new Error('Disallowed protocol');
  }
  if (ALLOWED_HOSTS.length > 0 && !ALLOWED_HOSTS.includes(parsed.hostname)) {
    throw new Error('Host not in allowlist: ' + parsed.hostname);
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
