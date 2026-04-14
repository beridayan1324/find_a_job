/**
 * Intentional vulnerabilities for Subrunner testing.
 * Add to your repo, push, and open a PR.
 */

const crypto = require("crypto");
const { URL } = require("url");

const ALLOWED_HOSTS = (process.env.ALLOWED_FETCH_HOSTS || "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

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
  return "sess_" + crypto.randomBytes(16).toString("hex");
}

async function fetchUserData(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    throw new Error("Invalid URL");
  }
  if (ALLOWED_HOSTS.length === 0 || !ALLOWED_HOSTS.includes(parsed.hostname)) {
    throw new Error("Host not allowed: " + parsed.hostname);
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
