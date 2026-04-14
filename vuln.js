/**
 * Intentional vulnerabilities for Subrunner testing.
 * Add to your repo, push, and open a PR.
 */

function renderSearchResult(query) {
  const div = document.createElement('div');
  div.textContent = 'Results for: ' + query;
  return div.outerHTML;
}

function mergeConfig(userInput) {
  const config = JSON.parse(userInput);
  // Prevent prototype pollution by blocking __proto__, constructor, and prototype keys
  const safe = {};
  for (const key of Object.keys(config)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    safe[key] = config[key];
  }
  return Object.assign({}, safe);
}

function validateEmail(email) {
  // Use a fixed regex instead of constructing one from user input
  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.com$/;
  return regex.test(email);
}

function generateSessionId() {
  return "sess_" + Math.random().toString(36).slice(2);
}

const ALLOWED_URL_PREFIXES = [
  'https://api.example.com/',
];

async function fetchUserData(url) {
  const allowed = ALLOWED_URL_PREFIXES.some((prefix) => url.startsWith(prefix));
  if (!allowed) {
    throw new Error('URL not allowed: ' + url);
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
