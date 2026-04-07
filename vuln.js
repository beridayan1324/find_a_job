/**
 * Fixed version of vuln.js
 */

const ALLOWED_FETCH_ORIGINS = [
  'https://api.example.com'
];

function renderSearchResult(query) {
  const div = document.createElement('div');
  div.textContent = 'Results for: ' + query;
  return div.outerHTML;
}

function mergeConfig(userInput) {
  let parsed;
  try {
    parsed = JSON.parse(userInput);
  } catch (e) {
    throw new Error('Invalid JSON input');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Config must be a plain object');
  }
  // Guard against prototype pollution
  const safeConfig = Object.create(null);
  for (const key of Object.keys(parsed)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    safeConfig[key] = parsed[key];
  }
  return Object.assign({}, safeConfig);
}

function validateEmail(email) {
  // Use a fixed regex instead of constructing one from user input
  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.com$/;
  return regex.test(email);
}

function generateSessionId() {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return 'sess_' + Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Node.js fallback
  const { randomBytes } = require('crypto');
  return 'sess_' + randomBytes(16).toString('hex');
}

async function fetchUserData(url) {
  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    throw new Error('Invalid URL');
  }
  const origin = parsedUrl.origin;
  if (!ALLOWED_FETCH_ORIGINS.includes(origin)) {
    throw new Error('URL origin not allowed: ' + origin);
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
