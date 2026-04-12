/**
 * Intentional vulnerabilities for Subrunner testing.
 * Add to your repo, push, and open a PR.
 */

"use strict";

const crypto = require("crypto");

// Allowlist of permitted hostnames for fetchUserData.
// Extend this list as needed for your environment.
const FETCH_ALLOWED_HOSTS = (process.env.FETCH_ALLOWED_HOSTS || "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

/**
 * Escape HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/**
 * f2 fix: Escape query before embedding in HTML to prevent XSS.
 */
function renderSearchResult(query) {
  return "<div>Results for: " + escapeHtml(query) + "</div>";
}

/**
 * f1 fix: Block prototype-polluting keys during JSON parsing.
 * Using a reviver that rejects __proto__, constructor, and prototype keys.
 */
function mergeConfig(userInput) {
  const BLOCKED_KEYS = new Set(["__proto__", "constructor", "prototype"]);
  const config = JSON.parse(userInput, (key, value) => {
    if (BLOCKED_KEYS.has(key)) {
      return undefined; // drop the key entirely
    }
    return value;
  });
  // Object.create(null) ensures no inherited prototype to pollute
  return Object.assign(Object.create(null), config);
}

/**
 * f3 fix: Validate email using a static regex — never build a regex
 * from user-supplied input.
 */
function validateEmail(email) {
  // Static, well-bounded regex; no user input embedded in the pattern.
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  return EMAIL_REGEX.test(email);
}

/**
 * f4 fix: Use cryptographically strong random bytes instead of Math.random().
 */
function generateSessionId() {
  return "sess_" + crypto.randomBytes(16).toString("hex");
}

/**
 * f0 fix: Validate the URL against an allowlist of permitted hosts
 * before performing the fetch, preventing SSRF.
 */
async function fetchUserData(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    throw new Error("Invalid URL provided.");
  }

  // Only allow HTTPS to prevent cleartext leakage.
  if (parsed.protocol !== "https:") {
    throw new Error("Only HTTPS URLs are permitted.");
  }

  // Enforce hostname allowlist.
  if (FETCH_ALLOWED_HOSTS.length === 0) {
    throw new Error(
      "No allowed hosts configured. Set FETCH_ALLOWED_HOSTS environment variable."
    );
  }
  if (!FETCH_ALLOWED_HOSTS.includes(parsed.hostname)) {
    throw new Error(
      `Host '${parsed.hostname}' is not in the permitted allowlist.`
    );
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
