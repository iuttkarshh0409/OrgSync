const jwt = require("jsonwebtoken");
const { env } = require("../config/env");
const { pool } = require("../db/pool");
const { httpError } = require("../utils/httpError");

async function authenticate(req, _res, next) {
  try {
    const header = req.headers.authorization;

    if (!header || !header.startsWith("Bearer ")) {
      throw httpError(401, "Missing or invalid authorization header");
    }

    const token = header.slice("Bearer ".length);
    const payload = jwt.verify(token, env.jwtSecret);

    const result = await pool.query(
      `SELECT id, organization_id, email, full_name, role
       FROM users
       WHERE id = $1`,
      [payload.sub]
    );

    if (!result.rows[0]) {
      throw httpError(401, "User not found");
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    next(error.statusCode ? error : httpError(401, "Unauthorized"));
  }
}

module.exports = { authenticate };
