/**
 * Fixed vulnerabilities.
 */

// 1. Reflected XSS - escape user input before inserting into HTML
function renderSearchResult(query) {
  const div = document.createElement('div');
  div.textContent = 'Results for: ' + query;
  return div.outerHTML;
}

// 2. Prototype pollution via JSON.parse of untrusted input
function mergeConfig(userInput) {
  const config = JSON.parse(userInput);
  // Strip __proto__ and constructor keys to prevent prototype pollution
  const safe = Object.create(null);
  for (const key of Object.keys(config)) {
    if (key !== '__proto__' && key !== 'constructor' && key !== 'prototype') {
      safe[key] = config[key];
    }
  }
  return Object.assign({}, safe);
}

// 3. ReDoS - use a fixed, safe email regex instead of building from user input
function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

// 4. Insecure randomness - use crypto.getRandomValues for security-sensitive values
function generateSessionId() {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return 'sess_' + Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

// 5. SSRF - validate URL against an allowlist before fetching
const ALLOWED_HOSTS = ['api.example.com', 'data.example.com'];
async function fetchUserData(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    throw new Error('Invalid URL');
  }
  if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
    throw new Error('Host not allowed: ' + parsed.hostname);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error('Only HTTPS URLs are allowed');
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
