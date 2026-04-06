/**
 * Intentional vulnerabilities for Subrunner testing.
 * Add to your repo, push, and open a PR.
 */

function renderSearchResult(query) {
  return "<div>Results for: " + query + "</div>";
}

function mergeConfig(userInput) {
  const config = JSON.parse(userInput);
  return Object.assign({}, config);
}

function validateEmail(email) {
  const regex = new RegExp("^[a-zA-Z0-9._%+-]+@" + email + "\\.com$");
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
