const bcrypt = require("bcryptjs");
const { pool } = require("../db/pool");
const { httpError } = require("../utils/httpError");

async function listUsers(user) {
  const result = await pool.query(
    `SELECT u.id,
            u.organization_id,
            u.full_name,
            u.email,
            u.role,
            u.created_at
     FROM users u
     WHERE u.organization_id = $1
     ORDER BY u.created_at ASC`,
    [user.organization_id]
  );

  return result.rows;
}

async function createUser(authenticatedUser, payload) {
  const { fullName, email, password, role } = payload;
  const passwordHash = await bcrypt.hash(password, 10);

  try {
    const result = await pool.query(
      `INSERT INTO users (organization_id, full_name, email, password_hash, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, organization_id, full_name, email, role, created_at`,
      [
        authenticatedUser.organization_id,
        fullName,
        email.toLowerCase(),
        passwordHash,
        role
      ]
    );

    return result.rows[0];
  } catch (error) {
    if (error.code === "23505") {
      throw httpError(409, "Email is already registered");
    }
    throw error;
  }
}

module.exports = { createUser, listUsers };
