const { httpError } = require("../utils/httpError");

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 15;
const attempts = new Map();

function cleanup(now) {
  for (const [key, value] of attempts.entries()) {
    if (value.expiresAt <= now) {
      attempts.delete(key);
    }
  }
}

function buildKey(req) {
  const ip = req.ip || req.connection?.remoteAddress || "unknown";
  const email =
    typeof req.body?.email === "string"
      ? req.body.email.trim().toLowerCase()
      : "anonymous";

  return `${ip}:${email}`;
}

function authRateLimit(req, _res, next) {
  const now = Date.now();
  cleanup(now);

  const key = buildKey(req);
  const entry = attempts.get(key);

  if (!entry || entry.expiresAt <= now) {
    attempts.set(key, {
      count: 1,
      expiresAt: now + WINDOW_MS
    });
    return next();
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return next(
      httpError(
        429,
        "Too many authentication attempts. Please wait 15 minutes and try again."
      )
    );
  }

  entry.count += 1;
  attempts.set(key, entry);
  return next();
}

module.exports = { authRateLimit };
