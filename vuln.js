/**
 * Intentional vulnerabilities for Subrunner testing.
 * Add to your repo, push, and open a PR.
 */
const { randomBytes } = require("crypto");
const { URL } = require("url");

function renderSearchResult(query) {
  // Escape HTML special characters to prevent XSS
  const escaped = String(query)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
  return "<div>Results for: " + escaped + "</div>";
}

// Allowed prototype keys to prevent prototype pollution
const FORBIDDEN_KEYS = new Set(["__proto__", "constructor", "prototype"]);

function sanitizeObject(obj) {
  if (typeof obj !== "object" || obj === null) return obj;
  const safe = Array.isArray(obj) ? [] : Object.create(null);
  for (const key of Object.keys(obj)) {
    if (FORBIDDEN_KEYS.has(key)) continue;
    safe[key] = sanitizeObject(obj[key]);
  }
  return safe;
}

function mergeConfig(userInput) {
  let parsed;
  try {
    parsed = JSON.parse(userInput);
  } catch (e) {
    throw new Error("Invalid JSON input");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new Error("Config must be a JSON object");
  }
  // Sanitize to prevent prototype pollution before merging
  const safe = sanitizeObject(parsed);
  return Object.assign(Object.create(null), safe);
}

function validateEmail(email) {
  // Use a fixed regex; do NOT interpolate user input into RegExp
  const regex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return regex.test(email);
}

function generateSessionId() {
  // Use cryptographically secure random bytes instead of Math.random()
  return "sess_" + randomBytes(16).toString("hex");
}

// Allowlist of permitted hosts for outbound fetch requests
const ALLOWED_HOSTS = new Set(process.env.FETCH_ALLOWED_HOSTS
  ? process.env.FETCH_ALLOWED_HOSTS.split(",").map((h) => h.trim())
  : []);

async function fetchUserData(urlString) {
  let parsed;
  try {
    parsed = new URL(urlString);
  } catch (e) {
    throw new Error("Invalid URL");
  }
  if (parsed.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are permitted");
  }
  if (ALLOWED_HOSTS.size > 0 && !ALLOWED_HOSTS.has(parsed.hostname)) {
    throw new Error("Host not in allowlist: " + parsed.hostname);
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
