/**
 * Intentional vulnerabilities for Subrunner testing.
 * Add to your repo, push, and open a PR.
 */

const crypto = require("crypto");
const { URL } = require("url");

// f0/f2: Escape user input before inserting into HTML to prevent XSS
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

function renderSearchResult(query) {
  return "<div>Results for: " + escapeHtml(query) + "</div>";
}

// f7/f8: Validate and sanitize parsed JSON to prevent prototype pollution
function mergeConfig(userInput) {
  let parsed;
  try {
    parsed = JSON.parse(userInput);
  } catch (e) {
    throw new Error("Invalid JSON input");
  }

  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Config must be a plain object");
  }

  // Strip prototype-polluting keys
  const safe = Object.create(null);
  for (const key of Object.keys(parsed)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }
    safe[key] = parsed[key];
  }

  return Object.assign({}, safe);
}

// f6: Use a fixed, safe regex for email validation instead of injecting user input
function validateEmail(email) {
  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

// f5: Use cryptographically secure random bytes for session ID generation
function generateSessionId() {
  return "sess_" + crypto.randomBytes(16).toString("hex");
}

// f4: Validate URL to prevent SSRF — only allow https and a whitelist of trusted hosts
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
    throw new Error("Only HTTPS URLs are allowed");
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
