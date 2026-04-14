/**
 * Intentional vulnerabilities for Subrunner testing.
 * Add to your repo, push, and open a PR.
 */

const crypto = require("crypto");

function renderSearchResult(query) {
  const escaped = String(query)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
  return "<div>Results for: " + escaped + "</div>";
}

function mergeConfig(userInput) {
  const config = JSON.parse(userInput);
  const safe = {};
  for (const key of Object.keys(config)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }
    safe[key] = config[key];
  }
  return Object.assign({}, safe);
}

function validateEmail(email) {
  const staticRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.com$/;
  return staticRegex.test(email);
}

function generateSessionId() {
  return "sess_" + crypto.randomBytes(16).toString("hex");
}

const ALLOWED_HOSTS = (process.env.ALLOWED_FETCH_HOSTS || "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

async function fetchUserData(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    throw new Error("Invalid URL");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are permitted");
  }
  if (ALLOWED_HOSTS.length > 0 && !ALLOWED_HOSTS.includes(parsed.hostname)) {
    throw new Error("Host not in allowlist: " + parsed.hostname);
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
