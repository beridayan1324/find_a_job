/**
 * Fixed vulnerabilities.
 */

function renderSearchResult(query) {
  // Fix f11: Use textContent assignment instead of innerHTML string concatenation to prevent DOM XSS
  const div = document.createElement('div');
  div.textContent = 'Results for: ' + query;
  return div.outerHTML;
}

function mergeConfig(userInput) {
  // Fix f10: Sanitize parsed object to prevent prototype pollution
  const config = JSON.parse(userInput);
  const safeConfig = {};
  for (const key of Object.keys(config)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    safeConfig[key] = config[key];
  }
  return Object.assign({}, safeConfig);
}

function validateEmail(email) {
  // Fix f12: Use a fixed regex instead of constructing one from user input to prevent ReDoS/regex injection
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
