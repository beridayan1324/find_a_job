/**
 * Intentional vulnerabilities for Subrunner testing.
 * Add to your repo, push, and open a PR.
 */

const crypto = require("crypto");
const { escape: sqlEscape } = require("sqlstring");

// f2: SQL injection — escape query before embedding in HTML/SQL context
function renderSearchResult(query) {
  if (typeof query !== "string") {
    throw new TypeError("query must be a string");
  }
  const safeQuery = query
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
  return "<div>Results for: " + safeQuery + "</div>";
}

// f8: Prototype Pollution — validate parsed config before merging
function mergeConfig(userInput) {
  let parsed;
  try {
    parsed = JSON.parse(userInput);
  } catch (e) {
    throw new SyntaxError("Invalid JSON input");
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    throw new TypeError("Config must be a plain object");
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

// f3: ReDoS / regex injection — use a static regex instead of building from user input
function validateEmail(email) {
  if (typeof email !== "string") return false;
  const staticRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.com$/;
  return staticRegex.test(email);
}

// f5: Weak Session ID — use cryptographically secure random bytes
function generateSessionId() {
  return "sess_" + crypto.randomBytes(24).toString("hex");
}

// f7: SSRF — restrict fetch to an allowlist of trusted hosts
const ALLOWED_FETCH_HOSTS = (process.env.ALLOWED_FETCH_HOSTS || "")
  .split(",")
  .map((h) => h.trim())
  .filter(Boolean);

async function fetchUserData(url) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch (e) {
    throw new TypeError("Invalid URL");
  }
  if (!ALLOWED_FETCH_HOSTS.includes(parsed.hostname)) {
    throw new Error(
      `Forbidden host: ${parsed.hostname}. Add it to ALLOWED_FETCH_HOSTS to permit requests.`
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
