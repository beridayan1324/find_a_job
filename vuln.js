/**
 * Intentional vulnerabilities for Subrunner testing.
 * Add to your repo, push, and open a PR.
 */

const crypto = require("crypto");
const { URL } = require("url");

// 1. Reflected XSS - escape user input before inserting into HTML
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

// 2. Prototype pollution - use Object.create(null) and sanitize keys
function mergeConfig(userInput) {
  let parsed;
  try {
    parsed = JSON.parse(userInput);
  } catch (e) {
    throw new Error("Invalid JSON input");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Input must be a JSON object");
  }
  const safe = Object.create(null);
  for (const key of Object.keys(parsed)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      continue;
    }
    safe[key] = parsed[key];
  }
  return Object.assign({}, safe);
}

// 3. ReDoS - use a fixed, safe regex; validate email against a static pattern
function validateEmail(email) {
  // Fixed regex, no user input interpolated
  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.com$/;
  return regex.test(email);
}

// 4. Insecure randomness - use crypto.randomBytes for session IDs
function generateSessionId() {
  return "sess_" + crypto.randomBytes(16).toString("hex");
}

// 5. SSRF - validate URL against an allowlist of permitted hosts
const ALLOWED_HOSTS = (process.env.ALLOWED_FETCH_HOSTS || "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

async function fetchUserData(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch (e) {
    throw new Error("Invalid URL");
  }
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only http and https protocols are allowed");
  }
  if (ALLOWED_HOSTS.length > 0 && !ALLOWED_HOSTS.includes(parsed.hostname)) {
    throw new Error("Host not permitted: " + parsed.hostname);
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
