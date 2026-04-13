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
  const parsed = JSON.parse(userInput);
  const config = {};
  for (const key of Object.keys(parsed)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    config[key] = parsed[key];
  }
  return config;
}

function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.com$/;
  return regex.test(email);
}

function generateSessionId() {
  return "sess_" + Math.random().toString(36).slice(2);
}

async function fetchUserData(url) {
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
